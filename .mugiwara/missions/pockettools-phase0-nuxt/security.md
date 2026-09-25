# Security — pockettools-phase0-nuxt

## Verdict: PASS

- `bun audit`: no vulnerabilities found.
- Secret scan across the repository: no private-key, GitHub token, OpenAI-style key, or AWS access-key patterns found.
- No `.env` or license secret is committed.
- Tool data is local metadata; no user content leaves the browser in Phase 0.
- PWA service worker uses static/runtime browser caching only; no analytics or remote data submission.
- Production service worker is enabled; development service-worker glob warnings are disabled via `devOptions.enabled: false`.

## Limitation

Bun's optional `bun pm scan` requires a configured package scanner and was not available. The supported `bun audit` dependency check passed; no third-party scanner was added without a measured requirement.
