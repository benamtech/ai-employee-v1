#!/usr/bin/env python3
"""Read-only stdio MCP server for bounded SDRT-v2 resources."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import quote, unquote

from sdrt_validator import SDRTError, load, query

MAX_REQUEST_BYTES = 65_536
PROTOCOL_VERSION = "2025-06-18"


def resource_uri(marker: str, identifier: str) -> str:
    return f"sdrt://document/{quote(marker, safe='')}/{quote(identifier, safe='')}"


def response(request_id, result=None, error=None):
    payload = {"jsonrpc": "2.0", "id": request_id}
    if error is not None:
        payload["error"] = error
    else:
        payload["result"] = result
    return payload


def node_json(node):
    return {
        "marker": node.marker,
        "identifier": node.identifier,
        "version": node.version,
        "fields": dict(node.fields),
        "line": node.line,
        "canonical": node.canonical(),
    }


def handle(document, request):
    if request.get("jsonrpc") != "2.0":
        return response(request.get("id"), error={"code": -32600, "message": "invalid JSON-RPC version"})
    method = request.get("method")
    request_id = request.get("id")
    params = request.get("params") or {}
    if method == "initialize":
        return response(request_id, {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {"resources": {"listChanged": False}, "tools": {"listChanged": False}},
            "serverInfo": {"name": "amtech-sdrt-v2-readonly", "version": "1.0.0"},
            "instructions": "Read-only SDRT-v2 graph resources. No mutation methods exist.",
        })
    if method in {"notifications/initialized", "notifications/cancelled"}:
        return None
    if method == "ping":
        return response(request_id, {})
    if method == "resources/list":
        resources = [{
            "uri": resource_uri(node.marker, node.identifier),
            "name": f"@{node.marker}|{node.identifier}",
            "description": node.canonical(),
            "mimeType": "application/vnd.amtech.sdrt+json",
        } for node in document.nodes]
        return response(request_id, {"resources": resources})
    if method == "resources/read":
        uri = str(params.get("uri") or "")
        prefix = "sdrt://document/"
        if not uri.startswith(prefix):
            return response(request_id, error={"code": -32602, "message": "unsupported resource URI"})
        parts = uri[len(prefix):].split("/", 1)
        if len(parts) != 2:
            return response(request_id, error={"code": -32602, "message": "malformed resource URI"})
        marker, identifier = map(unquote, parts)
        node = next((candidate for candidate in document.nodes if candidate.marker == marker and candidate.identifier == identifier), None)
        if node is None:
            return response(request_id, error={"code": -32004, "message": "resource not found"})
        return response(request_id, {"contents": [{
            "uri": uri,
            "mimeType": "application/vnd.amtech.sdrt+json",
            "text": json.dumps(node_json(node), separators=(",", ":")),
        }]})
    if method == "tools/list":
        return response(request_id, {"tools": [{
            "name": "query_sdrt",
            "description": "Read-only Query QL over the pinned SDRT-v2 document.",
            "inputSchema": {
                "type": "object",
                "additionalProperties": False,
                "required": ["query"],
                "properties": {"query": {"type": "string", "minLength": 1, "maxLength": 512}},
            },
        }]})
    if method == "tools/call":
        if params.get("name") != "query_sdrt":
            return response(request_id, error={"code": -32602, "message": "unknown or write-capable tool denied"})
        arguments = params.get("arguments") or {}
        expression = arguments.get("query")
        if not isinstance(expression, str) or not expression or len(expression.encode("utf-8")) > 512:
            return response(request_id, error={"code": -32602, "message": "query must be 1-512 bytes"})
        try:
            selected = query(document, expression)
        except SDRTError as error:
            return response(request_id, error={"code": -32602, "message": str(error)})
        return response(request_id, {
            "content": [{"type": "text", "text": json.dumps([node_json(node) for node in selected], separators=(",", ":"))}],
            "isError": False,
        })
    return response(request_id, error={"code": -32601, "message": "method not found; server is read-only"})


def main() -> int:
    parser = argparse.ArgumentParser(description="Expose a pinned SDRT-v2 document as read-only MCP resources and a query tool.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and enumerate resources without starting stdio MCP.")
    parser.add_argument("--open", action="store_true", help="Use open-schema parsing instead of closed mode.")
    parser.add_argument("document", type=Path)
    args = parser.parse_args()
    try:
        document = load(args.document, closed=not args.open)
    except (OSError, UnicodeError, SDRTError) as error:
        print(json.dumps({"status": "fail", "error": str(error)}), file=sys.stderr)
        return 1
    if args.dry_run:
        print(json.dumps({
            "status": "pass",
            "mode": "dry_run",
            "read_only": True,
            "protocol_version": PROTOCOL_VERSION,
            "resources": len(document.nodes),
            "tools": ["query_sdrt"],
        }))
        return 0
    for raw in sys.stdin.buffer:
        if len(raw) > MAX_REQUEST_BYTES:
            print(json.dumps(response(None, error={"code": -32600, "message": "request too large"})), flush=True)
            continue
        try:
            request = json.loads(raw.decode("utf-8"))
            result = handle(document, request)
            if result is not None:
                print(json.dumps(result, separators=(",", ":")), flush=True)
        except (UnicodeError, json.JSONDecodeError) as error:
            print(json.dumps(response(None, error={"code": -32700, "message": f"parse error: {error}"})), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
