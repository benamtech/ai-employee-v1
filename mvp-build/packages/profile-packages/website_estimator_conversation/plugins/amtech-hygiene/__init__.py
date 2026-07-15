"""AMTECH tool-output hygiene — Hermes plugin (CE-2).

Registers two Hermes *plugin* hooks (these are plugin-only, not config.yaml shell
hooks — confirmed against NousResearch/hermes-agent PRs #12972 and #12929):

  - transform_tool_result     rewrites ANY tool's result string before the model
                              sees it.
  - transform_terminal_output rewrites raw terminal stdout/stderr (fires BEFORE
                              Hermes' own 50KB truncation + secret redaction, so
                              ours is additive, never a replacement for it).

Each hook returns a ``str`` to replace the output or ``None`` to leave it
unchanged. The transform is DETERMINISTIC (no model call, no network).

DOCTRINE — add awareness, never nerf. This must NOT get in the way of the Hermes
runtime's power. So:
  - SECRET REDACTION is precise (by key / by pattern) and always on — it removes
    material that should never be in context anyway (tokens, raw rfc822), without
    touching the data the agent actually fetched.
  - SIZE-TRIMMING is a conservative LAST RESORT at a high budget with generous
    head/tail retention. Hermes already truncates terminal output at ~50KB and
    compresses context on its own; we never trim more aggressively than that or
    touch normal-sized results. A deliberate read_file / query result the agent
    asked for passes through UNTOUCHED. The default posture is: leave it alone.

It is NOT a security boundary — the approval gate and egress controls live
Manager-side. All hooks fail open (Hermes catches hook errors); on any internal
error we return None (leave the output untouched).

The forbidden-key vocabulary mirrors ``FORBIDDEN_FACT_KEYS`` in
apps/manager/src/events/ingress.ts / packages/shared (the Manager-side canonical
list); keep the two in sync.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional

# Size budgets (characters). Intentionally HIGH: size-trimming is a last-resort
# guard against pathological bulk, not a routine filter. Normal results (a
# read_file, a query the agent asked for) pass through untouched. Terminal mirrors
# Hermes' own ~50KB truncation so we never pre-empt it more aggressively. When we
# do trim, we keep a generous head + tail so most signal survives.
TOOL_RESULT_BUDGET = 40000
TERMINAL_BUDGET = 50000
HEAD_KEEP = 12000
TAIL_KEEP = 3000

# Key substrings whose VALUES must never survive into context. Matched against
# object keys (lowercased), mirroring the Manager-side FORBIDDEN_FACT_KEYS plus a
# few extra secret-shaped names a raw tool result might carry.
FORBIDDEN_KEY_SUBSTRINGS = (
    "raw",
    "rfc822",
    "payment_intent",
    "client_secret",
    "authorization",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "secret",
    "password",
    "bearer",
    "token",
)

REDACTED = "[redacted]"

# Preserved-signal extraction.
_ID_RE = re.compile(r"\b[a-z][a-z0-9]{1,}_[A-Za-z0-9]{6,}\b")
_POINTER_RE = re.compile(r"amtech://[^\s\"'<>]+")
_ERROR_LINE_RE = re.compile(r"(?i)\b(error|failed|failure|denied|exception|traceback|refused)\b")

# Secret-shaped patterns in free text (not JSON). Order matters: redact the raw
# `Bearer <token>` FIRST so a following "Authorization:" pattern can't consume
# just the word "Bearer" and orphan the token.
_TEXT_SECRET_RES = (
    re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._\-]{8,}"),
    re.compile(r"(?i)\b(authorization)\b\s*[:=]\s*[^\n]+"),
    re.compile(r"(?i)\b(access_token|refresh_token|client_secret|api[_-]?key|password|secret)\b\s*[:=]\s*[^\s,;]+"),
)


def _key_is_forbidden(key: str) -> bool:
    k = key.lower()
    return any(sub in k for sub in FORBIDDEN_KEY_SUBSTRINGS)


def _redact_json(value: Any) -> tuple[Any, bool]:
    """Recursively redact forbidden-key values. Returns (value, redacted_any)."""
    redacted = False
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for k, v in value.items():
            if isinstance(k, str) and _key_is_forbidden(k):
                out[k] = REDACTED
                redacted = True
            else:
                nv, r = _redact_json(v)
                out[k] = nv
                redacted = redacted or r
        return out, redacted
    if isinstance(value, list):
        out_list = []
        for item in value:
            nv, r = _redact_json(item)
            out_list.append(nv)
            redacted = redacted or r
        return out_list, redacted
    return value, redacted


def _collect_ids(text: str, limit: int = 8) -> list[str]:
    ids: list[str] = []
    seen: set[str] = set()
    for match in _POINTER_RE.finditer(text):
        v = match.group(0)
        if v not in seen:
            seen.add(v)
            ids.append(v)
        if len(ids) >= limit:
            return ids
    for match in _ID_RE.finditer(text):
        v = match.group(0)
        if v not in seen:
            seen.add(v)
            ids.append(v)
        if len(ids) >= limit:
            break
    return ids


def _first_error_line(text: str) -> Optional[str]:
    for line in text.splitlines():
        if _ERROR_LINE_RE.search(line):
            return line.strip()[:200]
    return None


def _marker(original_len: int, item_count: Optional[int], ids: list[str], error: Optional[str]) -> str:
    parts = [f"trimmed {original_len} chars"]
    if item_count is not None:
        parts.append(f"{item_count} items")
    if ids:
        parts.append("ids: " + ", ".join(ids))
    if error:
        parts.append(f"error: {error}")
    return "[" + "; ".join(parts) + "]"


def _hygiene_json(parsed: Any, original: str) -> Optional[str]:
    redacted_value, redacted_any = _redact_json(parsed)
    redacted_text = json.dumps(redacted_value, ensure_ascii=False, separators=(",", ":"))
    # Cheap path: nothing sensitive and within budget -> leave unchanged.
    if not redacted_any and len(original) <= TOOL_RESULT_BUDGET:
        return None
    # Redaction and/or compacting brought it under budget -> return that (a
    # redacted structure, or the same data compacted smaller than the original).
    if len(redacted_text) <= TOOL_RESULT_BUDGET:
        return redacted_text
    # Still too big: replace bulk with a signal-preserving marker.
    item_count = len(parsed) if isinstance(parsed, list) else None
    ids = _collect_ids(redacted_text)
    error = None
    if isinstance(redacted_value, dict):
        for key in ("error", "message", "status"):
            if key in redacted_value and isinstance(redacted_value[key], str):
                error = str(redacted_value[key])[:200]
                break
    if error is None:
        error = _first_error_line(redacted_text)
    return _marker(len(original), item_count, ids, error)


def _hygiene_text(text: str) -> Optional[str]:
    def _redact_match(m: "re.Match[str]") -> str:
        label = m.group(1) if m.lastindex else None
        return f"{label} {REDACTED}" if label else REDACTED

    redacted = text
    redacted_any = False
    for pattern in _TEXT_SECRET_RES:
        new = pattern.sub(_redact_match, redacted)
        if new != redacted:
            redacted_any = True
            redacted = new
    if not redacted_any and len(redacted) <= TERMINAL_BUDGET:
        return None
    if len(redacted) <= TERMINAL_BUDGET:
        return redacted if redacted_any else None
    ids = _collect_ids(redacted)
    error = _first_error_line(redacted)
    head = redacted[:HEAD_KEEP]
    tail = redacted[-TAIL_KEEP:]
    marker = _marker(len(text), None, ids, error)
    return f"{head}\n{marker}\n{tail}"


def hygiene_transform(text: Any, kind: str = "tool_result", tool_name: Optional[str] = None) -> Optional[str]:
    """Pure entry point. Returns a replacement string, or None to leave unchanged.

    kind: "tool_result" (try JSON first) or "terminal" (free text)."""
    if not isinstance(text, str) or not text:
        return None
    try:
        if kind != "terminal":
            stripped = text.strip()
            if stripped[:1] in ("{", "["):
                try:
                    parsed = json.loads(stripped)
                    return _hygiene_json(parsed, text)
                except (ValueError, TypeError):
                    pass
        return _hygiene_text(text)
    except Exception:
        # Fail open: never mangle output on an internal error.
        return None


# --- Hermes hook wiring -----------------------------------------------------

def _find_result_text(args: tuple, kwargs: dict, keys: tuple[str, ...]) -> Optional[str]:
    for key in keys:
        v = kwargs.get(key)
        if isinstance(v, str) and v:
            return v
    string_positionals = [a for a in args if isinstance(a, str) and a]
    if string_positionals:
        # The result/output is conventionally the last string argument
        # (e.g. (tool_name, result) or (command, output)).
        return string_positionals[-1]
    return None


def _on_tool_result(*args: Any, **kwargs: Any) -> Optional[str]:
    text = _find_result_text(args, kwargs, ("result", "output", "tool_result", "content"))
    if text is None:
        return None
    return hygiene_transform(text, kind="tool_result", tool_name=kwargs.get("tool_name"))


def _on_terminal_output(*args: Any, **kwargs: Any) -> Optional[str]:
    text = _find_result_text(args, kwargs, ("output", "stdout", "text", "content"))
    if text is None:
        return None
    return hygiene_transform(text, kind="terminal")


def register(ctx: Any) -> None:
    """Hermes plugin entrypoint: register the two transform hooks."""
    ctx.register_hook("transform_tool_result", _on_tool_result)
    ctx.register_hook("transform_terminal_output", _on_terminal_output)
