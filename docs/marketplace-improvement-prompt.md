# ReUse Market improvement prompt

Continue our project at https://github.com/teddynak/SecondHandMarketplace. Inspect the latest main branch and existing tests before editing. Use Jiji Uganda, Vinted and eBay as references for category discovery, clear listing photos, search, saved items and helpful guidance. Review their current public pages, explain which patterns suit ReUse, and create our own design without copying their assets, branding or layout.

For this iteration:
- Improve the seven existing category cards with relevant, licensed editorial photos, compact labels and purple/lavender accents. Keep category links functional, reserve image dimensions, lazy load images and retain a useful icon fallback. Record image sources and licensing.
- Keep product cards compact: two columns on phones and more on larger screens. Show price in UGX and familiar Uganda locations clearly.
- Show only the seller’s actual photos on product cards and listing pages. Never replace missing item photos with stock imagery. Keep HTTPS image links and MongoDB uploads.
- Accept used items only; keep condition dropdowns, filters and badges removed. Ask sellers to describe wear, faults and repairs. Preserve existing records and permissions.
- Keep the searchable Help centre and the single combined About us & mission page.
- Preserve authentication, listings CRUD, favourites, saved searches, seller pages, photo ordering, cover selection, preview and admin-approved removal.
- Make meaningful improvements to loading, errors, empty results, keyboard access, touch targets and mobile filters.
- Do not add fake ratings, sales, verified badges, payment protection or successful delivery messages. Payments and pickup remain direct between users.

Work in manageable changes. Explain the chosen changes, implement them, run lint, unit tests, build, typecheck and the relevant MongoDB/browser checks. Test small phones through large desktop widths and failed image delivery. Do not reset data or commit secrets. Push the completed changes to GitHub and report what passed, any remaining limitations and required configuration. Stop after this iteration; do not start messaging or payments without agreeing the next scope.
