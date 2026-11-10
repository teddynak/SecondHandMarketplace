# Phase 5 — Production preparation

## Abuse controls

MongoDB-backed limits work across application processes, with TTL cleanup and explicit `Retry-After` on 429 responses. Limits cover login (100/IP and 10/account per 15 minutes), registration (20/IP/hour), recovery/token requests, messages, reports, listing creation (20/member/hour), editing (60/member/hour), profile updates (30/member/hour), removal requests (10/member/hour), admin moderation (60/admin/minute), uploads (20/member/hour) and browsing (300/IP/minute). Fixed windows permit bursts around boundaries. Hosting proxies must overwrite `x-real-ip` / `x-forwarded-for`; a client-controlled proxy chain cannot provide reliable IP enforcement. Missing IPs share a bucket. Add edge/WAF limits for volumetric traffic; this app does not claim to stop all abuse or provide DDoS protection.

Response headers disallow framing, prevent MIME sniffing, disable referrers and disable unused sensor APIs. Server origin checks, bounded JSON/upload bodies, ownership checks, HTTPS photo validation, private conversations and admin-only permissions remain in place. No speculative payment integration or invented trust indicators were introduced.

## Prototype image storage

JPEG/PNG/WebP uploads retain the 2 MB/file and four-photo/listing limits. Optional `IMAGE_MAX_PER_ACCOUNT` (default 50, range 4–500) and `IMAGE_MAX_TOTAL_MB` (default 64, range 8–1024) cap each account. Existing assets count toward usage, including legacy assets without an explicit byte-size field. Upload accounting serializes on the account record so concurrent uploads cannot overshoot a quota. HTTPS links remain supported without storing their bytes.

`npm run cleanup:images` is a dry-run review of unreferenced images older than seven days. `npm run cleanup:images -- --apply` applies cleanup; `--days=N` may increase the age threshold (minimum seven). Nothing runs automatically. The script checks references across all listings, including sold, hidden and archived records. Recently uploaded or recently attached photos are retained. Publication/editing touch stored assets transactionally, so cleanup racing publication either retains the asset or causes a clear missing-image error, rather than publishing a broken reference. Operators should review dry-run counts and backups before applying to their real database. No cleanup was run against real user data during development.

Uploads are public immutable URLs, not private media. Deleting an unused original cannot revoke a previously cached copy. Magic-byte validation is not malware scanning, full image decoding or decompression-bomb protection. A production media pipeline / object storage remains a future scaling decision; prototype MongoDB storage is preserved as requested.

## SEO

Public available used listings now have server-generated titles, descriptions, canonical URLs, social previews and Product/Offer structured data in UGX with UsedCondition. No ratings, sales or protection claims are fabricated. Hidden, sold, archived and suspended-seller items emit no product structured data and use noindex metadata. A branded default social image is generated locally by Next.js.

Set `APP_URL` to the canonical public HTTPS origin before building/deploying. Listing metadata and sitemap/robots are evaluated dynamically. Private account/admin/inbox/dashboard/auth areas use noindex and are excluded from the sitemap. Robots settings are crawl guidance, not access control. Without a valid APP_URL the sitemap is empty and robots disallows crawling, rather than inventing a production URL. The prototype sitemap includes the 10,000 most recently updated public listings plus their seller URLs; add sitemap pagination before exceeding that catalogue size.

## Validation and limits

The full CI suite uses an isolated MongoDB replica set, local mock email provider, real API requests and Chromium. It retains all earlier auth, permissions, CRUD, photo order/preview, favourites/searches, removal, messaging, moderation, recovery and seed checks. Added checks cover upload count/byte quotas, safe cleanup dry-run/apply, retention of referenced archived/recent/touched images, public-only sitemap/metadata, structured-data escaping, response headers and rate-limit retry information. Responsive checks cover 320, 375, 768, 1024, 1440 and 1920px, with account-specific browser flows at four widths.

These checks do not replace physical-device, Safari/Firefox, load, delivery/bounce or penetration testing. No actual Resend delivery or production MongoDB connectivity is claimed. Messages/notifications use polling, not push; saved-search delivery remains disabled. Configure secrets and the email domain in hosting settings, redeploy, and perform a live smoke test before public rollout. Database backups, monitoring, data retention/erasure policies and an operator support process remain deployment responsibilities.


## Dependency review (2026-11-10)

`npm audit --omit=dev` reported zero production dependency advisories. The full audit reports seven moderate entries in the development-only TypeScript ESLint chain, rooted in minimatch GHSA-g3hv-75wg-m249. The published TypeScript ESLint 8.72.2 release currently requests minimatch ^10.2.2, while the advisory names 11.0.1 as patched. The ordinary non-breaking audit fix did not resolve that chain. A forced major override was not applied; review the next compatible tooling release and rerun the audit. These findings concern lint tooling, not installed production dependencies.
