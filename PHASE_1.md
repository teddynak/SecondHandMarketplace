# Phase 1 — Existing experience

This phase preserves authentication, MongoDB storage, existing listing permissions, favorites, saved searches, seller pages and admin-approved removal. Messaging, expanded moderation, account recovery and production integrations belong to later phases.

## Seller flow

- Use **Move earlier**, **Move later** or **Make cover** on photos. The first photo is the cover, and its position is persisted in the existing images array. Both image links and database uploads remain supported.
- **Review listing** validates the form and opens a draft preview. **Publish listing** is the explicit write action. Editing uses **Review changes → Save changes**.
- The preview shows the photos in order, price, category, location, seller contact and description. Reviewing or closing the preview does not create or update a listing. Editing fields remains in the current form; drafts are not persisted across reloads.
- Publication locks repeated clicks, keeps the reviewed payload stable, and displays API failures in the preview without erasing form data. This is not a guarantee of server-side idempotency after an ambiguous network interruption.

## Navigation, filters and feedback

- A single filter form applies category, location and price together. On mobile it opens in a native modal; closing/cancelling preserves the current URL and results.
- City shortcuts, labelled price inputs, range validation, active-filter chips and individual removal make applied filters visible.
- Browsing errors have a retry action. Out-of-range page requests return the final available page rather than an incorrect empty feed.
- Dashboard and item details explain available, sold, archived and pending-removal states. Sold/archived items retain their existing API visibility rules.
- Session loading failures are distinguished from an ordinary logged-out state with a retry banner. Saved collection failures also offer recovery.

## Accessibility and visual consistency

- Native dialogs contain focus, make background content inert, support Escape, lock background scrolling and restore focus on close. Escape/backdrop dismissal is disabled while a write is pending.
- A skip link, labelled filter inputs, live result counts, photo-order announcements, field-error associations and keyboard menu dismissal improve navigation.
- Violet/lavender controls and visible focus styles are retained. Touch targets and modal layouts adapt from 320px upwards.

## Validation

Unit checks cover photo movement without mutation and listing-state explanations. Integration/browser checks exercise persisted photo order, no database writes during preview, explicit create/edit confirmation, a recoverable publish error, focus containment/restoration, cancelled mobile filter drafts, combined filter application, invalid price ranges, retrying search and pagination bounds. Existing CRUD, authorization, saved-item/search, seeding and six-viewport checks remain in the suite.

## Limits

Browser automation runs in Chromium, not every physical phone or browser. Drafts remain in component memory until navigation/reload. Third-party image availability is outside ReUse's control. Uploaded images and accounts continue to need a correctly configured MongoDB connection. No new environment variables or data reset is required for this phase.
