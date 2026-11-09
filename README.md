# ReUse Market ♻️

A professional, responsive second-hand community marketplace built with **Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, MongoDB and Mongoose**.

> **Status:** Tested source-code MVP. GitHub Actions passed production build, TypeScript, ESLint, eleven automated unit/architecture checks, live CRUD checks against an isolated MongoDB replica set, and Chromium browser flows at six viewport widths on 9 November 2026. Configure your production database and authentication secret before running with real users.

## Implemented features

- Public homepage and searchable marketplace with category, condition, price and sorting filters.
- Public product details with real listing images, seller name, location, phone, email, WhatsApp contact and share button.
- Account registration, login, logout and secure HTTP-only session cookies.
- All users register as **buyers**; the first successful product listing changes their role to **seller**, without losing buyer capabilities.
- Sellers can create, edit and view their own products and add up to **4 photos total** using HTTPS image links or JPEG/PNG/WebP uploads (2 MB per upload, stored in MongoDB).
- A seller can confirm a **completed sale** (with optional payment received), which immediately removes the item from active public queries; sold items remain in the database and on the seller dashboard.
- Sellers **cannot delete items**. They submit a reasoned deletion request, and only an admin can approve/archive it.
- Admin-only dashboard for deletion review and marketplace statistics.
- Responsive design for desktop and mobile, account profile editing, useful error and empty states.

## Requirements

- Node.js 22 or later recommended (minimum 20.19 for these dependencies)
- npm
- MongoDB Atlas cluster or a local MongoDB replica set (required for atomic admin approvals)

## Setup on Ubuntu

```bash
git clone https://github.com/teddynak/SecondHandMarketplace.git
cd SecondHandMarketplace
npm ci
cp .env.example .env.local
openssl rand -base64 48
```

Paste the random output from `openssl` into `.env.local` as `AUTH_SECRET`, then replace `MONGODB_URI` with your real connection string. **Never share or commit .env.local.**

Example local development config:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/reuse_market?replicaSet=rs0
AUTH_SECRET=PASTE_A_RANDOM_SECRET_32_OR_MORE_CHARACTERS_LONG_HERE
ADMIN_EMAIL=you@example.com
```

Atlas users should instead use their own `mongodb+srv://...` URI and allow their server's IP in Atlas Network Access. Do not grant broad network access unnecessarily.

```bash
npm run dev
```

Open **http://localhost:3000**. Start by visiting `/register`, create an account, then `/sell` to post your first item. Your account will automatically become a seller. Browse at `/marketplace`, and manage listings at `/dashboard`.

## Create your first administrator

1. Register an account via the site (same as a regular buyer).
2. Set `ADMIN_EMAIL` in `.env.local` to the exact account email.
3. In a terminal run:

```bash
npm run make-admin
```

4. Refresh/re-log into the application. The admin dashboard will appear at `/admin`.

**Security:** There is intentionally no public admin-registration endpoint. The admin script runs locally on the project operator's machine with database credentials.

## Verification

```bash
npm run typecheck
npm run build
npm run lint
npm test
```

Once the database is connected, also test this **manual end-to-end checklist**:

1. Browse `/marketplace` while signed out, including category and price filters.
2. Register User A. Confirm the dashboard shows buyer status.
3. Upload a JPEG/PNG/WebP and publish a product. Confirm User A is now a seller, and the listing appears publicly.
4. Register User B; verify they can contact User A from the product details page, but cannot edit User A's listing or create a deletion request for it (verify API permission enforcement too).
5. Sign in as A. Update the price; check the listing reflects it.
6. As A, request deletion of an item. Confirm the item stays active pending admin review.
7. As admin, reject the request and confirm the listing stays active; submit another request and approve it, verifying the listing becomes archived.
8. As A, confirm a sale on a different available item. Verify it disappears from `/marketplace` immediately, while remaining visible as sold in A's dashboard.
9. Confirm seller cannot DELETE via HTTP and a regular user cannot use admin APIs.
10. Review mobile viewport layouts, form validation, and network-error messages.

`npm test` performs architecture guardrails and executable regressions for redirects, validation and request byte limits, not live MongoDB integration tests. Do not treat it as proof of end-to-end correctness.

## Important purchase behavior

**There are no in-app card or mobile money payments yet.** Buyers contact the seller via WhatsApp, phone, or email to arrange payment and pickup **outside the platform**. Only the seller's explicit **Confirm sale** action marks the item as sold and deactivates it. Clicking contact/buy does **not** claim a completed purchase.

## Security notes and next production tasks

Current MVP uses server-side validation, restricted image types, password hashing, HTTP-only JWT cookies, same-origin checks, product ownership validation, and admin checks. Before making the site publicly available at scale, implement rate limiting on login/uploads, abuse reporting, email verification and password recovery, monitoring, image cleanup/quotas, moderation policies, backup and recovery, accessibility auditing, and automated E2E tests. MongoDB image storage is suitable for a small community MVP; for higher traffic, use managed object storage.

## API map

| HTTP method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create buyer account |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET/PATCH` | `/api/me` | Current account / edit profile |
| `GET/POST` | `/api/items` | Browse/filter / publish item |
| `GET/PATCH` | `/api/items/:id` | Product details / owner updates, mark sold, mark paid |
| `GET` | `/api/my/items` | Seller's own listings |
| `POST` | `/api/uploads` | Upload a product photo |
| `GET` | `/api/images/:id` | Serve photo from MongoDB |
| `POST` | `/api/deletion-requests` | Owner requests listing deletion |
| `GET` | `/api/admin/deletion-requests` | Admin request queue and counts |
| `PATCH` | `/api/admin/deletion-requests/:id` | Admin approves/rejects |
| `GET` | `/api/health` | Database health check |

Note: **`DELETE /api/items/:id` is deliberately unsupported**. Approved removals archive records rather than irreversibly destroying them, preserving auditability.

## Project architecture

- `src/app/`: UI pages and API route handlers.
- `src/components/`: reusable interactive UI components.
- `src/models/`: MongoDB/Mongoose collections.
- `src/lib/`: authentication, database connection, input validation, API utilities.
- `src/types/`: product, user and deletion-request shared types.
- `scripts/make-admin.ts`: operator-only role promotion.
- `.env.example`: non-secret environment variable template.

**Owner collaboration:** The repository is meant to be extended phase-by-phase together. Start by running the app locally, then share any errors or screenshots; next we can refine specific UI and business flows before expanding functionality.

## Updated identity and device support

Deep teal (`#07545A`) anchors the brand, violet (`#6D28D9`) highlights primary buttons across all pages, lavender (`#F3EDFF`) distinguishes secondary actions, and coral (`#E66B49`) highlights key details, slate (`#172F3D`) keeps text clear, and cloud (`#F7FAFB`) softens page backgrounds. A custom circular ReUse logo and SVG browser icon replace the generic symbol. Content expands up to 1760px, while forms retain a readable width. Responsive layouts target 320–1920px, including touch targets, keyboard focus and reduced motion.

## Live CRUD and browser verification

After building, run:

```bash
npm run build
npm run test:integration
npx playwright install chromium
npm run test:browser
```

These checks start an isolated temporary MongoDB replica set and production app, then clean up both. They never use your configured application database. The first run downloads a MongoDB test binary. Browser checks cover six viewport widths, mobile navigation and filters, profile editing, listing creation/editing, and admin-approved removal. GitHub Actions runs the same checks and saves responsive screenshots as an artifact.

Admin removal now commits the review and archive in one transaction. Use Atlas or initialize a local replica set before approving removals; standalone MongoDB cannot execute transactions. The dashboard no longer silently caps the seller’s listings at 200. Buyer promotion uses a conditional database update so it cannot overwrite a simultaneous admin promotion.

## Exact environment variables

Create `.env.local` in the project root (beside `package.json`):

```dotenv
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/reuse_market?retryWrites=true&w=majority
AUTH_SECRET=YOUR_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
ADMIN_EMAIL=nakteddy6@gmail.com
ADMIN_PASSWORD=YOUR_PRIVATE_ADMIN_PASSWORD
# SEED_PASSWORD=OPTIONAL_SEPARATE_DEMO_PASSWORD
```

`MONGODB_URI` is the server-only MongoDB connection string. In Atlas, create a database user, allow your application's server IP under Network Access, then copy the Node.js connection string from Connect → Drivers. Replace the database username/password and cluster host. URL-encode special characters in the password. The `/reuse_market` part selects the database; the app or seed script creates collections when it first writes records. Use Atlas or a replica set for transactional admin approvals.

`AUTH_SECRET` signs login cookies. Generate it with `openssl rand -base64 48`; keep the same value across app instances. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are read by `npm run setup-admin`, which creates the account or updates its role and password. `SEED_PASSWORD` optionally overrides the demo accounts’ password; otherwise they use `ADMIN_PASSWORD`. Passwords must be at least 8 characters and no more than 72 UTF-8 bytes. None of these variables should use the `NEXT_PUBLIC_` prefix. Restart the development server after changing them. On a hosting service, add them to its server environment settings instead of uploading `.env.local`.

## Load useful prototype data

```bash
npm ci
cp .env.example .env.local
# Edit .env.local with your own values first.
npm run seed
npm run dev
```

`npm run seed` creates four fictional accounts and 13 UGX listings: 12 available items across all seven categories and one sold example for dashboard history. It uses external image links and needs no photo downloads. Demo names, phone numbers and products are fictional; photo subjects are illustrative. The demo login emails are:

| Role | Email |
|---|---|
| Seller | `demo.amina@example.test` |
| Seller | `demo.daniel@example.test` |
| Seller | `demo.sarah@example.test` |
| Buyer | `demo.buyer@example.test` |

They use `SEED_PASSWORD`, falling back to `ADMIN_PASSWORD`, on their first creation. Re-running does not reset passwords, overwrite listing edits, or delete user data. It refuses to adopt an unrelated account with a matching demo email. Keep these prototype accounts out of a live public marketplace.

To also save catalog photo bytes in MongoDB:

```bash
npm run seed:images
```

That command downloads the fixed sample catalog's photos (maximum 2 MB each), stores them as binary data in `imageassets`, and serves them from `/api/images/:id`. Existing unchanged demo photo links are upgraded to database photos. Custom listing images are preserved. If a photo cannot be downloaded, the script prints a warning and retains its external link; running it again retries missing photos.

## User photo options

On Create/Edit listing, choose **Add photos** to upload to MongoDB or paste a public `https://` image link and click **Add image link**. You can mix both, with four unique images total. Links should point to image content, not a web page. The browser displays linked photos directly; the app does not download arbitrary user URLs to its server. Uploaded image bytes remain in MongoDB for retrieval. Broken links show an image-unavailable placeholder. No Cloudinary, S3 or image-storage API key is needed for this prototype.

## Set up the configured administrator

Set `ADMIN_EMAIL=nakteddy6@gmail.com` and your chosen `ADMIN_PASSWORD` in private `.env.local` or server environment settings, then run:

```bash
npm run setup-admin
```

This command creates that administrator directly; registration is not required. If the email already exists, it promotes that account and resets its password to `ADMIN_PASSWORD`, preserving its profile and listings. Run it again only when you intend to apply the configured password. Passwords are stored as bcrypt hashes. The script never prints them. Remove `ADMIN_PASSWORD` from a long-running public app's environment after setup if you no longer need the operator command; the login password remains in its database hash.

## Discovery and saved collections

The marketplace now supports location filtering and quick UGX budgets. Hearts save available listings to your account; `/saved` holds items and reusable searches. Saved searches keep your keyword and filters, but do not send notifications. Accounts can hold up to 200 saved item IDs and 20 saved searches. Sold/archived items disappear from the available collection. A seller name opens `/sellers/:id` with the seller’s public profile and available items. Product details include other available listings in the same category.

See [MARKETPLACE_REVIEW.md](MARKETPLACE_REVIEW.md) for the comparison with Vinted, Carousell and Jiji Uganda and the resulting design decisions. These additions use MongoDB and the existing server environment variables; no new API keys are needed.

## Phase 1: review-first listings and accessible filters

Use the photo arrow controls or **Make cover** to choose the image order. **Review listing** opens a draft; **Publish listing** makes it live only after confirmation. Existing listings use **Review changes → Save changes**. Closing a preview keeps the form values, but drafts do not survive page reloads.

Mobile filters now apply together in an accessible modal, with location shortcuts and visible active filters. Escape/cancel preserves the current results. Native dashboard dialogs support focus containment and restoration. Available, sold, archived and pending-removal explanations clarify which actions are possible. Load errors offer retry controls.

See [PHASE_1.md](PHASE_1.md) for implementation, validation and limitations. No new server environment variables are required. Phases 2–5 have not been implemented by this update.
