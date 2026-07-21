#!/usr/bin/env python3
import json
from generate import build
report = build(False)
print(json.dumps(report, indent=2))
if report.get("status") != "pass":
    raise SystemExit(1)
