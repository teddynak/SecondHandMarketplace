# Marketplace review and implementation — 9 November 2026

ReUse is a local second-hand prototype for Uganda. The review focuses on finding an item, keeping it for later, evaluating its seller, and arranging a direct exchange. It preserves the existing purple actions and does not copy competitor branding or imply payment protection that ReUse does not provide.

| Reference | Observed pattern | ReUse change |
|---|---|---|
| [Vinted: finding items](https://www.vinted.com/help/143/35-finding-items?access_channel=hc_topics) and [how it works](https://www.vinted.co.uk/how_it_works) | Prominent search and category navigation; favourites; a clear sell action. | Compact search-led hero, seven visible category choices, consistent heart buttons, account-saved collection, explicit free-listing CTA. |
| [Carousell: saved searches](https://support.carousell.com/hc/en-us/articles/360000088208-Saved-searches) | Reuse a search term and its filters. | Canonical saved searches stored in the account, replayed from the collection page. ReUse does not send alerts. |
| [Jiji Uganda](https://jiji.ug/) and [safety guidance](https://jiji.ug/safety-tips.html) | Location near search, clear prices/categories, and inspect-before-paying meetup advice. | Location search, quick UGX budgets, seller storefronts, prominent condition/price, and direct-payment/inspection explanations. |

## Design decisions

- Shorten the opening hero so discovery and real inventory appear sooner.
- Use violet (`#6D28D9`) for the main actions, lavender for secondary actions/surfaces, near-black plum for product text and prices, and warm white for the canvas. Keep teal in the ReUse identity and use muted category colours sparingly.
- Give product photography more importance than decoration. Keep heart buttons separate from item links and display a seller link on each card.
- Use horizontal category scrolling on small screens, a responsive grid on desktop, and sufficient touch targets.
- Keep unavailable items out of the public feed, storefronts, and saved-available collection. Avoid invented sales counts, ratings, verification badges, or purchase-protection promises.

## Implemented functionality

- Favorites: authenticated GET/POST/DELETE `/api/favorites`; up to 200 identifiers per account, idempotent additions, account ownership enforced. Saved available products appear at `/saved` and survive reloads/devices. Sold/archived items are hidden.
- Saved searches: authenticated GET/POST/DELETE `/api/saved-searches`; up to 20 per account, validated normalized filter strings and stable IDs. Replays preserve keyword, category, condition, location, budget, and sort; paging is omitted. Alerts are explicitly unavailable.
- Location filter: case-insensitive literal matching against listing locations, combined with existing filters. It is text matching, not GPS or a distance estimate.
- Public seller storefront: `/sellers/:id` and GET `/api/sellers/:id`; name, location, member date, and current available listings. No password, account email, private saved data, or admin role is exposed in the seller summary.
- Category-based related listings on item details, without an external recommendation service.

## Verification

Unit tests check search normalization and validation. Integration checks cover authentication, duplicate saves, cross-account isolation, unavailable items, seller field privacy, and location filtering. Browser checks exercise save/remove, persistence after reload, replaying saved filters, seller/collection layouts, and existing CRUD flows across six viewport widths.

## Deliberate prototype limits

Payments, pickup and delivery are arranged directly with the seller. There is no checkout, escrow, in-app messaging, notification service, identity verification, GPS radius search or transaction-backed rating system. Those require separate service and product decisions; this update does not simulate them with nonfunctional controls.
