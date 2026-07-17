# Cloudflare asset-first distribution reference

Canonical page requests bypass Worker execution and are served directly from Workers Static Assets. Only `__resolve` and `__experiment` routes run Worker code.

```bash
npm exec wrangler -- --config worker/wrangler.jsonc dev
```

The resolver accepts only a finite precompiled manifest and returns a finite variant ID or canonical baseline. It does not generate prose, routes, components, or visitor identifiers.
