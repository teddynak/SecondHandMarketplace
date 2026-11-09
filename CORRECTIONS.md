# Corrections — 9 November 2026

- Added a dependency lockfile for reproducible npm ci installs.
- Fixed ESLint failures and JSX punctuation.
- Validated login/register redirects against a fixed origin, rejecting backslashes and control characters.
- Normalized email whitespace and case before validation.
- Rejected passwords exceeding bcrypt’s 72-byte limit to avoid silent truncation.
- Required whole-shilling prices of at least UGX 1, matching database and form rules.
- Rejected reversed price ranges; added stable sorting for equal prices/dates.
- Applied streaming byte limits to JSON and multipart requests, including requests without Content-Length.
- Preserved successful photo uploads if a subsequent photo fails.
- Reset detail state when navigating between items; remounted edit forms per item.
- Preserved database errors during session resolution instead of disguising outages as logged-out sessions.
- Enabled optimistic concurrency on products and deletion requests; stale writes return HTTP 409.
- Added executable regression tests and updated setup instructions.

## Validation

Passed: npm run build, npm run lint, npm test (9 checks), npm run typecheck.

## Remaining verification and limits

No database credentials were provided. Registration, login, image persistence, sales, and admin approval still need the README’s live integration checklist. Browser interaction and mobile appearance have not been verified in this environment. This is an MVP with off-platform payments; production tasks remain listed in README. Admin approval updates two documents without a database transaction, so approval and archive are not guaranteed atomic on database failure.
