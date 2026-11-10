# Phase 2 — Buyer and seller communication

## What works

- **Message on ReUse** on an available used listing opens or reuses one conversation per buyer/listing/seller. Owners see **View buyer messages**. Login is required. WhatsApp, phone and email links remain available.
- `/inbox` lists the current member's conversations, message previews, listing status and unread counts. Header and mobile navigation include an inbox link. Conversation lists and messages are paginated.
- `/inbox/[id]` stores plain-text messages in MongoDB. The server checks participants on every read, send and read receipt. Admin status alone does not permit access to conversations. Public conversation responses exclude email, phone, password hashes and other account fields.
- Sending uses a MongoDB transaction to allocate a per-conversation sequence and insert a message together. A client UUID makes an ambiguous failed send safe to retry. Read receipts only cover received messages through the supplied sequence; newer messages stay unread.
- Users can confirm a block or unblock in an accessible modal. Blocking stops new in-app conversations and messages in both directions across existing conversations. It does not block WhatsApp, calls or email. History remains readable. Inbox contains the member's own block list; one person cannot remove the other's block.
- Sold, archived, missing and legacy-new listings are read-only in existing conversations. Existing histories remain available; a new conversation cannot start on an unavailable listing.
- Reports require details and share the latest 20 messages at the time of submission with administrators. An admin-only queue shows that submitted evidence, with a required recorded outcome and confirmation. One pending report per reporter/conversation prevents duplicates. Report review does not automatically suspend users, archive items or send email.
- Shared MongoDB rate buckets limit authenticated message sends (30/minute), conversation starts (10/minute) and reports (5/hour). Messages are capped at 2,000 characters, reports at 1,000, and a member's block list at 200. Fixed windows can permit bursts around a boundary; broader abuse controls belong to production preparation.

## Configuration and rollout

No new environment variables. Keep `MONGODB_URI` and `AUTH_SECRET`. MongoDB Atlas or a replica set is required for transactional sending, as already required for admin-approved removal. New collections and indexes are additive; there is no migration, data reset, seed requirement or new paid service.

The application initializes unique conversation, message, block and pending-report indexes before their relevant writes. Ensure the database account can create collections/indexes. MongoDB TTL expiry on rate buckets is cleanup only; the actual window is checked using the application clock and fixed bucket key.

## Delivery and privacy limits

Messages refresh every 5 seconds while the conversation tab is visible; the inbox refreshes every 10 seconds and header unread count every 30 seconds. This is persisted messaging with polling, not WebSocket delivery. No browser push, email message alerts, attachments, typing indicator, delivery guarantees or read badges are simulated. Already in-flight requests may finish while a member blocks or a seller changes listing status. Closing the page stops polling. Messages are not end-to-end encrypted; normal database access controls apply. Admin report evidence is an explicit copy of up to 20 messages, disclosed before reporting. Future retention/erasure policies need a separate product decision.

## Validation

Unit checks validate message IDs/text, reports and read cursors. Isolated MongoDB integration checks cover access control, conversation uniqueness, retry deduplication, unread/read receipt semantics, sequence pagination, two-way blocking, private block lists, report evidence/review permissions, rate limiting and sold/archived history. Chromium checks exercise opening from a listing, reload persistence, retrying a failed send without duplication, seller reply, accessible block confirmation, inbox unblock, conversation reporting/admin review, safe text rendering and six screen widths. Existing listing CRUD, uploads, favourites, saved searches, photo previews, admin removal and seed checks remain in place.

Next phase: broader user/listing/report administration, suspension/restoration, audit history and listing/user report entry points. Account recovery, email verification and broader production preparation remain subsequent phases.
