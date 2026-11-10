# Phase 4 — Account reliability and notifications

Password change requires the current password and the existing 8-character / 72 UTF-8-byte policy. Password change/reset increments the account's session version, invalidating all previous sessions. Admin password setup also increments that version. Legacy sessions use version zero until the first password change.

Password recovery and email verification use 32 random bytes in emailed links. MongoDB stores only SHA-256 hashes, purpose, account/email binding, explicit expiry and consumption time. Reset links expire after 30 minutes; verification links after 24 hours. Transactions consume tokens once and invalidate sibling tokens. GET links do not consume them: the user explicitly submits the action. Token pages use no-referrer/noindex metadata and clear the token from the browser URL after success. Tokens are never returned by an API or logged.

Email is an optional Resend integration. Configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` on a domain verified in Resend, and the canonical HTTPS `APP_URL`. HTTP localhost is allowed for local development. The operator must supply valid credentials and domain DNS; no delivery has been performed against a real mailbox during development. Missing settings produce a 503. Authenticated verification requests report provider rejection/timeouts as errors and only claim provider acceptance on a valid response. Recovery uses the same generic response for eligible, unknown and provider-failed requests to avoid account enumeration; that response explicitly does not confirm an account or email delivery. Failed provider requests remove their token. This is acceptance checking, not delivery/bounce tracking.

The `EMAIL_API_URL` override is only accepted for a loopback HTTP endpoint when APP_URL is also localhost; the isolated test suite uses it for an actual local mock provider. Public deployments use the official Resend endpoint. There is no logging, fake-email or production test-success mode.

Verification confirms access to email only. It does not create a verified-seller badge or gate existing accounts. Account security is linked from the dashboard; Forgot password is linked from login. Suspended accounts cannot change passwords, request verification or use recovery until restored.

In-app notifications are real per-user records created transactionally with messages and moderation decisions, including removal and report review outcomes. The notification feed is private and paginated, with explicit mark-as-read and a header/mobile unread indicator. Suspended users may still read their own notifications and mark them read; other protected APIs remain blocked. These are not email or push alerts. Saved-search alerts remain disabled because no background worker exists.

Shared rate limits protect reset/verification requests, token submissions and password changes. Trusted hosting proxies must overwrite IP headers; missing IPs share a conservative bucket. Broader abuse controls are expanded in production preparation.

Tests use isolated `.test` accounts and a local HTTP email provider. They exercise successful requests, provider failure, hashed/purpose-bound/expired/reused tokens, unknown-account privacy, session invalidation, recovery through the browser and per-account notification permissions. No real user data is reset or real email sent.
