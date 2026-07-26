# Security

## Threat model

AldeaFit is a **fully client-side application**. There is no backend, no
account system, no database, no analytics and no third-party script. All user
data lives in `localStorage` on the user's own device.

That removes most of the usual web attack surface — there are no server
endpoints to attack, no sessions to hijack, no credentials to steal, and no
central store to breach. What remains is:

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | XSS via crafted input or a poisoned `localStorage` key | Strict CSP (no inline scripts), no HTML sinks anywhere in the codebase, every stored value structurally validated on read |
| 2 | Malicious backup file supplied to the JSON importer | Size cap before parsing, envelope check, per-record validation, string-length and record-count caps |
| 3 | Supply-chain compromise via a dependency | Two runtime dependencies (`react`, `react-dom`); `npm audit` runs in CI; Dependabot enabled |
| 4 | Data exfiltration | `connect-src 'self'` plus zero external assets — the app makes no network requests at all after load |
| 5 | Clickjacking | `frame-ancestors 'none'` / `X-Frame-Options: DENY` (see the hosting caveat below) |
| 6 | Cache poisoning via the service worker | Same-origin GET only; non-`basic` responses are never cached; caches are versioned and old ones purged on activate |

## Controls

### Content Security Policy

Delivered two ways: a `<meta http-equiv>` in `index.html` (works on every host,
including GitHub Pages) and real headers in `public/_headers` (Netlify /
Cloudflare Pages).

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self';
manifest-src 'self'; worker-src 'self'; base-uri 'none';
form-action 'none'; object-src 'none'; frame-ancestors 'none'
```

`default-src 'none'` denies every fetch type by default; each directive
re-opens only what is actually used.

**The one relaxation is `style-src 'unsafe-inline'.`** The design system themes
components through inline `style` attributes bound to CSS custom properties.
This is bounded and does not create an XSS path: inline *scripts* remain
forbidden, so the usual escalation from injected markup to code execution stays
closed. Every value written into a `style` attribute is either a hard-coded
token from the source or — in the one case where it comes from stored data
(plate colours) — validated against `/^#[0-9a-fA-F]{6}$/` before use.

Enforcement is verified against a real browser, not just asserted: inline
script injection, cross-origin `fetch`, and remote image loads are all
confirmed blocked.

### Input validation

Every number entered by a user passes through `src/lib/validation.ts` before
reaching any calculation. Values are parsed with an explicit
`/^-?\d*\.?\d+$/` test rather than `parseFloat`, which rejects `Infinity`,
`1e999`, `0x10`, `NaN` and trailing garbage — all of which `parseFloat` accepts
and turns into confident nonsense. Bounds are then enforced per field.

### Stored data

`src/lib/storage.ts` treats every read as untrusted:

- `JSON.parse` is always wrapped — a corrupted key degrades to defaults instead
  of white-screening the app.
- Parsed objects are validated field by field. Nothing is cast with `as`.
- Unknown enum values (unit, theme, locale, lift) fall back to a safe default
  rather than being trusted.
- Record ids are regenerated unless they match `/^[a-zA-Z0-9_-]{1,40}$/`.
- Strings are capped at 120 characters and history at 500 records, so a
  hand-edited file cannot exhaust memory.

### Import

Imports are the only path where genuinely foreign data enters the app. Order of
operations is deliberate: **size is checked before parsing**, the envelope is
checked before the contents, and each record then goes through the same
validator used on normal reads. Invalid records are dropped and counted rather
than rejecting the whole file.

### Service worker

- Handles **same-origin GET only**; everything else passes through untouched.
- Caches only `response.ok && response.type === 'basic'` — an opaque
  cross-origin response can never be served back as first-party content.
- Cache name is versioned; `activate` deletes every other cache.
- Navigations are network-first, so a bad deploy is not permanent.

## Hosting caveat

**GitHub Pages does not support custom response headers.** It ignores
`public/_headers`, so on Pages the app runs with the `<meta>` CSP only. Every
directive is still enforced except `frame-ancestors`, which cannot be expressed
in a `<meta>` tag by specification — meaning **clickjacking protection is
absent on GitHub Pages**.

For a deployment where framing matters, host on a platform that honours
`_headers` (Netlify, Cloudflare Pages) or put the site behind a proxy/CDN that
adds them. `public/_headers` is already written and needs no changes.

The app holds no credentials and performs no state-changing server actions, so
the practical impact of framing is limited to UI redress. It is called out here
rather than quietly ignored.

## Deliberately absent

- **No analytics, telemetry or error reporting.** The error boundary logs to
  the console and nowhere else.
- **No cookies.** Nothing to leak, nothing to consent to.
- **No external fonts or CDNs.** Fonts are self-hosted; that is what allows
  `default-src 'none'` and full offline operation.

## Reporting

Open an issue at
<https://github.com/StraycoderX/AldeaFit/issues>. Since the app stores no
data off-device, there is no user data at risk to disclose responsibly.
