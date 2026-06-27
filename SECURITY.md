# Security Policy

## Supported versions

The extension is developed as a single rolling release. Security fixes are
applied to the latest version only.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅        |
| < 1.0   | ❌        |

## Security & privacy posture

LinkedIn Feed Blocker is designed to minimize attack surface:

- **No data collection.** No analytics, telemetry, or tracking of any kind.
- **No remote code.** All code ships in the package; nothing is fetched or
  `eval`'d at runtime.
- **No network requests.** The extension makes no outbound connections.
- **Local storage only.** Settings live in `browser.storage.local` and never
  leave the device.
- **Minimum permissions.** Only `storage` plus host access scoped to
  `*://*.linkedin.com/*`. No `tabs`, no `scripting`, no broad host permissions.
- **Content Security Policy.** The default MV3 CSP is used; no inline scripts and
  no relaxed CSP directives. UI is built with DOM APIs, not `innerHTML` of
  untrusted data.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, report privately to:

- **Email:** suriyaasundararuban@gmail.com
- **Website:** https://www.suriyaasundararuban.com/

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (proof-of-concept where possible).
- The browser and version, the extension version, and any relevant LinkedIn URL
  patterns.
- Any suggested remediation, if you have one.

### What to expect

- **Acknowledgement** within 5 business days.
- **An initial assessment** (severity + planned action) within 10 business days.
- **A fix or mitigation** for confirmed, valid reports as soon as practical,
  prioritized by severity.
- **Credit** in the release notes if you'd like to be acknowledged (optional).

## Scope

In scope:

- The extension code in this repository (content scripts, background, popup,
  options, libraries, manifests, build scripts).

Out of scope:

- Vulnerabilities in LinkedIn itself or any third-party website.
- Vulnerabilities in browsers or the WebExtensions platform.
- Issues requiring a already-compromised device or a malicious extension already
  installed alongside this one.
- Social-engineering or physical-access attacks.

## Disclosure

We follow coordinated disclosure: please give us a reasonable window to release a
fix before any public disclosure. We're happy to coordinate timing with you.
