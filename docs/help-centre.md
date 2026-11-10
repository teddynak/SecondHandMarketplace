# Help centre redesign

The public route stays `/how-it-works`. Every pre-existing article ID remains valid. The page uses a compact search-first header and one consistent content container, with a descriptive desktop topic sidebar and a labelled native mobile selector. Six task categories replace the old thin topic pills. Article counts come from the actual local content array; Start here is an editorial set of shortcuts, not an analytics/popularity claim.

Reference patterns: eBay's prominent task search (https://www.ebay.com/help/home), Depop's topic hierarchy (https://depophelp.zendesk.com/hc/en-gb), and Jiji Uganda's practical questions (https://jiji.ug/faq). Wording, styling and content are original to ReUse. No competitor images, support services or payment guarantees are copied.

## Search and navigation

- Search is local over article titles, introductions, steps, notes, topic labels and curated keywords. Deterministic synonym groups cover photos/pictures/images, messages/chat/inbox, delete/remove/archive, and forgot/recover/reset, among other variants. It does not use an AI or remote support service.
- A newly typed query starts across all topics. Selecting a topic afterward explicitly narrows that query; the current scope, query and computed answer count remain visible. Users can broaden the scope, clear the query or reset help entirely.
- Query and topic state live in `q` and `topic` URL parameters. A typing session creates a history entry and replaces it as the user types; committing, changing scope and clearing are distinct actions. Refresh and Back/Forward restore the URL state. Known legacy topic labels are accepted; invalid values are ignored.
- Existing `#article-id` bookmarks reveal and focus the answer. A conflicting query/topic is adjusted so the linked answer cannot remain hidden. Native accordions retain keyboard operation. Sticky-header offsets and reduced-motion settings are respected.
- Copy article link uses the actual Clipboard API and confirms only a successful write. Denied or unavailable clipboard access shows a labelled, selectable URL for manual copying. Share links are canonical `/how-it-works#article-id` URLs, independent of the current search.

## Content and next actions

The content was checked against the current listing, upload, messaging, moderation and account code. Steps and appropriate working links cover used-only policy, publication/preview, photo formats/ordering/cover and configurable storage quotas, sales/removal approval, favourites/searches, participant-only conversations, blocking/reporting, account access, password recovery, verification, notifications, hidden listings and suspensions.

The page explains that email delivery needs provider configuration; verification confirms email access, not identity; password recovery does not restore suspended accounts; and saved-search delivery remains disabled. It describes prototype MongoDB uploads and public media URLs without suggesting private attachments or automatic deletion. Default quotas are labelled as defaults, since the operator may configure them.

Still need help links to actual password recovery, reporting guidance and safer-meeting advice. No support address, staff, chat, ticket form, delivery/refund service or response-time promise is invented. Payment and pickup remain direct between users. No new environment settings, service, database write, migration or reset is required for this redesign. Existing About/mission, marketplace, CRUD, messaging, moderation and account flows remain unchanged.

## Verification

Unit tests cover synonym ranking, explicit topic filtering, derived counts, URL restoration, malformed/unknown state, conflicting deep links, legacy article IDs and valid internal help references. Browser checks cover six viewport widths, scope changes, empty results, keyboard accordions, URL history/reload, legacy bookmarks and header clearance, successful copy plus denied clipboard fallback, real recovery links and loaded desktop/mobile/search/expanded-answer captures. Existing regression tests continue to cover the rest of the project.

Help is curated static content with client-side search. It does not inspect a user's private account, listing or report automatically, open a general support case, or guarantee that an exchange issue can be resolved. Operators should update the articles when the product's behaviour changes.
