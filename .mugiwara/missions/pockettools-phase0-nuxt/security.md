# Security — pockettools-phase0-nuxt

## Verdict: PASS for PR

- `bun audit`: no vulnerabilities found.
- Secret scan: no private keys, GitHub tokens, OpenAI-style keys, AWS keys, or `.env` files.
- No authentication, session, token, payment, or external API surface exists in Phase 0.
- User favorites, recent tools, and theme stay in browser storage; no user data leaves the browser.
- PWA caching is same-origin static/runtime caching with bounded entries and expiration; no analytics or remote submission.
- Production service worker is enabled; development service-worker registration is disabled and dev requests are short-circuited.
- CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are configured and tested.
- PrimeIcons/PrimeUI licensing risk was removed with the dependency.

## Limitations

- `bun pm scan` is unavailable because no optional scanner is configured; `bun audit` is the supported dependency check.
- HSTS is deployment-scoped and should be enabled only once HTTPS is confirmed at the hosting edge.
- Full Git-history secret scanning is deferred to the repository's protected-branch process because the initial history contains only the known baseline and healing commits.
