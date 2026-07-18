#!/usr/bin/env python3
"""Bounded SDRT-v2 parser, type validator, canonical emitter, and query QL.

The implementation is intentionally dependency-free and read-only. It accepts the
@S/@E/@R/@M/@C projection used by local-production reports and rejects oversized,
ambiguous, or malformed documents before building an in-memory graph.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

MAX_DOCUMENT_BYTES = 1_000_000
MAX_LINES = 10_000
MAX_LINE_BYTES = 16_384
MAX_FIELDS = 64
MAX_VALUE_BYTES = 8_192
MARKERS = {"S", "E", "R", "M", "C", "D", "T"}
ID_RE = re.compile(r"^[A-Za-z0-9_.:/-]{1,160}$")
KEY_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_.-]{0,79}$")
VERSION_RE = re.compile(r"^v([0-9]+)$")

CLOSED_REQUIRED = {
    "S": set(),
    "E": {"type"},
    "R": {"src", "dst"},
    "M": {"src", "dst"},
    "C": {"scope"},
    "D": set(),
    "T": set(),
}
CLOSED_KEYS = {
    "type", "scope", "src", "dst", "severity", "vector", "mitigation",
    "test_case_id", "perf_impact", "active", "projection", "state", "state_vec",
    "resolves", "enables", "blocks", "validates", "audits", "verifies",
    "D0", "D1", "D2", "D3", "D4", "mode", "status", "gate", "version",
    "criticality", "effort", "gate_number", "perf_baseline", "relation", "schema",
}


class SDRTError(ValueError):
    pass


@dataclass(frozen=True)
class Node:
    marker: str
    identifier: str
    version: str | None
    fields: tuple[tuple[str, str], ...]
    line: int

    def field_map(self) -> dict[str, str]:
        return dict(self.fields)

    def canonical(self) -> str:
        parts = [f"@{self.marker}", escape(self.identifier)]
        if self.version:
            parts.append(self.version)
        parts.extend(f"{escape(key)}:{escape(value)}" for key, value in self.fields)
        return "|".join(parts)


@dataclass(frozen=True)
class Document:
    version: str
    nodes: tuple[Node, ...]

    def canonical(self) -> str:
        return "\n".join(node.canonical() for node in self.nodes) + "\n"

    def identity(self) -> tuple:
        return (self.version, tuple((n.marker, n.identifier, n.version, n.fields) for n in self.nodes))


def escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("|", "\\|").replace(":", "\\:")


def split_escaped(value: str, delimiter: str) -> list[str]:
    out: list[str] = []
    current: list[str] = []
    escaped = False
    for char in value:
        if escaped:
            current.append(char)
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == delimiter:
            out.append("".join(current))
            current = []
        else:
            current.append(char)
    if escaped:
        raise SDRTError("dangling escape")
    out.append("".join(current))
    return out


def split_field(token: str) -> tuple[str, str]:
    escaped = False
    for index, char in enumerate(token):
        if escaped:
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == ":":
            return token[:index], token[index + 1 :]
    raise SDRTError(f"field lacks ':' delimiter: {token!r}")


def parse_text(text: str, *, closed: bool = False) -> Document:
    raw_bytes = text.encode("utf-8")
    if len(raw_bytes) > MAX_DOCUMENT_BYTES:
        raise SDRTError(f"document exceeds {MAX_DOCUMENT_BYTES} bytes")
    raw_lines = text.splitlines()
    if len(raw_lines) > MAX_LINES:
        raise SDRTError(f"document exceeds {MAX_LINES} lines")
    nodes: list[Node] = []
    document_version: str | None = None
    seen_ids: set[tuple[str, str]] = set()
    for line_number, raw in enumerate(raw_lines, 1):
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or stripped == "---":
            continue
        if len(stripped.encode("utf-8")) > MAX_LINE_BYTES:
            raise SDRTError(f"line {line_number} exceeds {MAX_LINE_BYTES} bytes")
        if not stripped.startswith("@"):
            raise SDRTError(f"line {line_number}: expected @ marker")
        tokens = split_escaped(stripped, "|")
        marker_token = tokens.pop(0)
        marker = marker_token[1:]
        if marker not in MARKERS:
            raise SDRTError(f"line {line_number}: unknown marker @{marker}")
        if not tokens:
            raise SDRTError(f"line {line_number}: missing identifier")
        identifier = tokens.pop(0)
        if not ID_RE.fullmatch(identifier):
            raise SDRTError(f"line {line_number}: invalid identifier {identifier!r}")
        version: str | None = None
        if tokens and VERSION_RE.fullmatch(tokens[0]):
            version = tokens.pop(0)
            major = int(VERSION_RE.fullmatch(version).group(1))
            if major != 2:
                raise SDRTError(f"line {line_number}: unsupported SDRT major {major}")
            document_version = document_version or version
            if document_version != version:
                raise SDRTError(f"line {line_number}: mixed schema versions")
        if len(tokens) > MAX_FIELDS:
            raise SDRTError(f"line {line_number}: exceeds {MAX_FIELDS} fields")
        fields: list[tuple[str, str]] = []
        keys: set[str] = set()
        for token in tokens:
            key, value = split_field(token)
            if not KEY_RE.fullmatch(key):
                raise SDRTError(f"line {line_number}: invalid key {key!r}")
            if key in keys:
                raise SDRTError(f"line {line_number}: duplicate key {key!r}")
            if len(value.encode("utf-8")) > MAX_VALUE_BYTES:
                raise SDRTError(f"line {line_number}: value for {key} is too large")
            if "\x00" in value:
                raise SDRTError(f"line {line_number}: NUL is not allowed")
            keys.add(key)
            fields.append((key, value))
        required = CLOSED_REQUIRED[marker]
        missing = required - keys
        if missing:
            raise SDRTError(f"line {line_number}: @{marker} missing {sorted(missing)}")
        if closed:
            unknown = {key for key in keys if key not in CLOSED_KEYS and not re.fullmatch(r"D[0-9]+", key)}
            if unknown:
                raise SDRTError(f"line {line_number}: closed schema rejects {sorted(unknown)}")
        identity = (marker, identifier)
        if identity in seen_ids and marker in {"S", "E", "C", "D", "T"}:
            raise SDRTError(f"line {line_number}: duplicate node identity @{marker}|{identifier}")
        seen_ids.add(identity)
        nodes.append(Node(marker, identifier, version, tuple(fields), line_number))
    if not nodes:
        raise SDRTError("empty SDRT document")
    version = document_version or "v2"
    validate_graph(nodes)
    return Document(version, tuple(nodes))


def validate_graph(nodes: Iterable[Node]) -> None:
    entity_ids = {node.identifier for node in nodes if node.marker in {"S", "E", "C", "D", "T"}}
    for node in nodes:
        fields = node.field_map()
        if node.marker in {"R", "M"}:
            for key in ("src", "dst"):
                target = fields[key]
                if not ID_RE.fullmatch(target):
                    raise SDRTError(f"line {node.line}: invalid {key} reference {target!r}")
                # External targets such as s9_readiness are valid in open graph mode.
        if node.marker == "C" and not fields.get("scope", "").strip():
            raise SDRTError(f"line {node.line}: empty constraint scope")
    if len(entity_ids) > MAX_LINES:
        raise SDRTError("entity limit exceeded")


def query(document: Document, expression: str) -> list[Node]:
    terms = [term.strip() for term in re.split(r"\s+(?:AND|and)\s+", expression) if term.strip()]
    if not terms:
        raise SDRTError("query is empty")
    parsed: list[tuple[str, str]] = []
    for term in terms:
        if ":" not in term:
            raise SDRTError(f"query term lacks ':': {term!r}")
        key, value = term.split(":", 1)
        if key not in {"marker", "kind", "id", "version"} and not KEY_RE.fullmatch(key):
            raise SDRTError(f"invalid query key {key!r}")
        parsed.append((key, value))
    result = []
    for node in document.nodes:
        fields = node.field_map()
        matches = True
        for key, expected in parsed:
            actual = node.marker if key in {"marker", "kind"} else node.identifier if key == "id" else node.version if key == "version" else fields.get(key)
            if actual != expected:
                matches = False
                break
        if matches:
            result.append(node)
    return result


def load(path: Path, *, closed: bool) -> Document:
    data = path.read_bytes()
    if len(data) > MAX_DOCUMENT_BYTES:
        raise SDRTError(f"document exceeds {MAX_DOCUMENT_BYTES} bytes")
    return parse_text(data.decode("utf-8"), closed=closed)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate, round-trip, emit, or query bounded SDRT-v2 documents.")
    parser.add_argument("document", type=Path)
    parser.add_argument("--closed", action="store_true", help="Reject keys outside the pinned SDRT-v2 schema.")
    parser.add_argument("--round-trip", action="store_true", help="Parse, canonicalize, parse, and compare document identity.")
    parser.add_argument("--emit", action="store_true", help="Print canonical SDRT-v2.")
    parser.add_argument("--query", help="Query QL, for example: type:gap AND severity:critical")
    parser.add_argument("--json", action="store_true", help="Print JSON rather than compact status output.")
    args = parser.parse_args()
    try:
        document = load(args.document, closed=args.closed)
        if args.round_trip:
            reparsed = parse_text(document.canonical(), closed=args.closed)
            if document.identity() != reparsed.identity():
                raise SDRTError("round-trip identity mismatch")
        selected = query(document, args.query) if args.query else list(document.nodes)
        if args.emit:
            sys.stdout.write(document.canonical())
        elif args.json:
            print(json.dumps({"version": document.version, "nodes": [asdict(node) for node in selected]}, indent=2))
        else:
            print(json.dumps({
                "status": "pass",
                "version": document.version,
                "nodes": len(document.nodes),
                "selected": len(selected),
                "round_trip": bool(args.round_trip),
                "closed": bool(args.closed),
            }))
        return 0
    except (OSError, UnicodeError, SDRTError) as error:
        print(json.dumps({"status": "fail", "error": str(error)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
