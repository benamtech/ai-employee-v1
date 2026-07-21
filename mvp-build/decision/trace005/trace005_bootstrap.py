#!/usr/bin/env python3
from pathlib import Path
import base64, hashlib, json, zlib

ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'trace005_upload_manifest.json').read_text())
payload=''.join(json.loads((ROOT/name).read_text()) if (ROOT/name).read_text().startswith(chr(34)) else (ROOT/name).read_text() for name in manifest['parts'])
if hashlib.sha256(payload.encode()).hexdigest()!=manifest['payload_sha256']:
    raise SystemExit('trace005 payload hash mismatch')
raw=zlib.decompress(base64.b64decode(payload))
if hashlib.sha256(raw).hexdigest()!=manifest['raw_sha256']:
    raise SystemExit('trace005 raw hash mismatch')
files=json.loads(raw)
for name,content in files.items():
    expected=manifest['files'][name]
    if hashlib.sha256(content.encode()).hexdigest()!=expected:
        raise SystemExit(f'trace005 file hash mismatch:{name}')
    (ROOT/name).write_text(content)
print(json.dumps({'generated':sorted(files),'raw_sha256':manifest['raw_sha256']},indent=2))
