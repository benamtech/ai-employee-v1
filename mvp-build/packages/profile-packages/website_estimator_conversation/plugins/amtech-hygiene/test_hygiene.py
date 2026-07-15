"""Stdlib-only self-test for the hygiene transform. Run: python3 test_hygiene.py

Kept dependency-free (no pytest) so it can run anywhere python3 exists, outside
the TS `npm run test:unit` suite. Wired as `npm run plugins:test`."""

import json
import unittest

from __init__ import hygiene_transform, _on_tool_result, _on_terminal_output, REDACTED


class HygieneTransform(unittest.TestCase):
    def test_small_clean_json_unchanged(self):
        text = json.dumps({"id": "est_abc123def", "total": 1200, "status": "ok"})
        self.assertIsNone(hygiene_transform(text, kind="tool_result"))

    def test_non_string_unchanged(self):
        self.assertIsNone(hygiene_transform(None))
        self.assertIsNone(hygiene_transform(123))
        self.assertIsNone(hygiene_transform(""))

    def test_secret_key_redacted_in_json(self):
        text = json.dumps({"id": "conn_gmail01x", "access_token": "ya29.SECRETVALUE", "refresh_token": "1//zzz"})
        out = hygiene_transform(text, kind="tool_result")
        self.assertIsNotNone(out)
        self.assertNotIn("ya29.SECRETVALUE", out)
        self.assertNotIn("1//zzz", out)
        self.assertIn(REDACTED, out)
        # Non-secret id survives.
        self.assertIn("conn_gmail01x", out)

    def test_normal_sized_result_passes_untouched(self):
        # ~15KB of legitimate data the agent asked for: under budget, no secrets ->
        # left ALONE (never nerf the runtime).
        items = [{"id": f"msg_{i:06d}aa", "n": i} for i in range(600)]
        text = json.dumps(items)
        self.assertGreater(len(text), 12000)
        self.assertLess(len(text), 40000)
        self.assertIsNone(hygiene_transform(text, kind="tool_result"))

    def test_pathological_json_array_becomes_marker_with_counts_and_ids(self):
        items = [{"id": f"msg_{i:06d}aa", "body": "x" * 50} for i in range(2000)]
        text = json.dumps(items)
        self.assertGreater(len(text), 40000)
        out = hygiene_transform(text, kind="tool_result")
        self.assertIsNotNone(out)
        self.assertLessEqual(len(out), len(text))
        self.assertIn("2000 items", out)
        self.assertIn("trimmed", out)
        # At least one id preserved as signal.
        self.assertIn("msg_000000aa", out)

    def test_amtech_pointer_preserved_when_trimmed(self):
        payload = {"pointer": "amtech://manager/work-queue", "blob": "y" * 50000, "error": "denied by gate"}
        text = json.dumps(payload)
        out = hygiene_transform(text, kind="tool_result")
        self.assertIsNotNone(out)
        self.assertIn("amtech://manager/work-queue", out)
        self.assertIn("error", out)

    def test_rfc822_raw_key_redacted(self):
        text = json.dumps({"id": "gmail_thread01", "rfc822": "From: a@b.com\n" + "Q" * 9000})
        out = hygiene_transform(text, kind="tool_result")
        self.assertIsNotNone(out)
        self.assertNotIn("Q" * 100, out)
        self.assertIn(REDACTED, out)

    def test_terminal_spew_trimmed_and_bearer_redacted(self):
        spew = "line one\nAuthorization: Bearer abcdef0123456789TOKEN\n" + ("noise\n" * 3000) + "ERROR: build failed\n"
        out = hygiene_transform(spew, kind="terminal")
        self.assertIsNotNone(out)
        self.assertNotIn("abcdef0123456789TOKEN", out)
        self.assertLess(len(out), len(spew))
        self.assertIn("build failed", out)

    def test_small_clean_terminal_unchanged(self):
        self.assertIsNone(hygiene_transform("done in 2s\n", kind="terminal"))

    def test_hook_wrappers_positional_and_kw(self):
        # A result carrying a secret is redacted regardless of size.
        payload = json.dumps({"id": "conn_x0000001", "access_token": "SECRETTOK"})
        # positional (tool_name, result)
        out_pos = _on_tool_result("query_quickbooks", payload)
        self.assertIsNotNone(out_pos)
        self.assertNotIn("SECRETTOK", out_pos)
        # keyword
        out_kw = _on_tool_result(tool_name="q", result=payload)
        self.assertIsNotNone(out_kw)
        self.assertNotIn("SECRETTOK", out_kw)
        # terminal keyword, clean + small -> untouched
        self.assertIsNone(_on_terminal_output(output="ok\n"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
