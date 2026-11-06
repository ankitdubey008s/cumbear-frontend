# CumBear Frontend — Deploy

## Layout
```
cumbear-FINAL/
  wrangler.toml
  public/          <-- all site files
```

## Cloudflare
```bash
cd cumbear-FINAL
npx wrangler deploy
```

`wrangler.toml` uses:
```
not_found_handling = "single-page-application"
```
This enables /video/:id, /watch/:id, /shorts, and in-app 404 without looping `_redirects`.

## GitHub
Put `wrangler.toml` at repo root and `public/` as assets directory.

