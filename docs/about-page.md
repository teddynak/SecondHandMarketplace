# About us & mission page

The redesign keeps one `/about` page with `#about-us`, `#our-mission`, and `#what-belongs` anchors. Content and CSS are scoped to About. Authentication, listings, uploads, messaging, moderation, account security and database records are unchanged.

The desktop hero pairs original copy with editorial photography. The story, mission commitments, used-only policy and practical exchange guidance follow in one sequence. Mobile places the main message/actions first, then the image composition, with stacked sections and 44px+ links. Body text uses darker purple-grey, with a consistent content container. Anchor destinations account for the sticky header. Existing Help centre, marketplace and selling routes remain the destinations for real actions.

Reference patterns reviewed: Vinted's mission and story (https://www.vinted.com/about), Depop's community positioning (https://news.depop.com/who-we-are/about/), Back Market's purpose and commitments (https://www.backmarket.com/en-us/about-us), and Jiji Uganda's practical exchange guidance (https://jiji.ug/about.html). ReUse's layout and copy are original. No competitor assets, environmental figures, team stories, identity-verification claims or payment guarantees are copied.

## Editorial image sources

Existing curated Unsplash sources, under https://unsplash.com/license (reviewed 2026-11-10):
- Books on shelves: https://images.unsplash.com/photo-1507842217343-583bb7270b66
- Wooden stool: https://images.unsplash.com/photo-1503602642458-232111445657
- Headphones: https://images.unsplash.com/photo-1505740420928-5e560c06d30e

These illustrate everyday objects; they do not depict ReUse users, stock, transactions, staff or premises. Captions explicitly identify illustrative photography. The hero's primary image is eager/high priority at width 900, with secondary photos lazy loaded at width 600 and quality 80. Dimensions/aspect ratios reserve space. Failed image requests leave a labelled, styled icon panel. Linked images depend on Unsplash availability. Seller photos and MongoDB uploads retain their separate existing flow.

Browser checks cover link destinations, all three anchors, sticky-header clearance, keyboard focus, contrast, image fallback, reduced motion and overflow at 320/375/768/1024/1440/1920px. Desktop/mobile screenshots are saved for review. No new environment variables, data migration or reset is required.
