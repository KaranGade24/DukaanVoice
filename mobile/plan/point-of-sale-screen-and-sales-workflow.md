# Point of Sale Screen and Sales Workflow Plan

## Goal
Build the screenshot-referenced point-of-sale (POS) experience as a real, production-ready mobile workflow. Category chips and product data must come from the signed-in shop’s backend. Product selection, cart math, payment, inventory decrement, validation, and persistence must be backed by authoritative server logic.

## Step 1 — Inspect before designing implementation
- Read root/mobile/backend `AGENTS.md` and inspect the supplied Stitch UI source and screenshot.
- Confirm current navigation, theme, product/category APIs and schemas, stock movement patterns, authentication/ownership rules, and existing invoice/payment conventions.
- Search for sales/order/cart models/routes/services/tests and determine whether any POS backend already exists.
- Record existing architecture and gaps in this plan before coding.

## Step 2 — Define the POS contract and workflow
- POS tab/screen with searchable active products, horizontally scrollable category chips, backend product counts, and selected category state.
- Product cards show useful product identity, price, unit, and availability; prevent adding unavailable/out-of-stock items.
- Cart supports quantity changes/removal, line subtotals, discounts/tax only where supported, totals, customer optionality as supported, and explicit review/payment.
- Backend calculates all money in integer minor units, validates cart products/prices/quantities/discounts/payment, enforces shop ownership and stock availability, and atomically records sale + stock movements + payment where MongoDB transactions are available.
- Mobile displays loading/empty/error states, preserves recoverable cart input on failures, prevents duplicate submission, and shows backend field-specific validation.
- Define whether supported payment methods are cash-only or the project’s existing methods by examining current app requirements and APIs; never invent unsupported payment behavior.

## Step 3 — Implement backend first
- Add or extend sale/order/payment models only if no existing suitable models exist.
- Add validators, service, controller, authenticated routes, idempotency, stock concurrency protection, transaction handling, response shaping, pagination/list/detail as needed.
- Update OpenAPI and add focused calculation/validation/service tests.
- Verify exact request/response/error contract and security constraints.

## Step 4 — Implement mobile POS
- Add POS route/tab and modular components following existing architecture and theme.
- Add a simple POS launch button on the Home screen and a POS navigation row in the More tab. Both open the same POS route; do not add a bottom-tab item unless separately requested.
- Fetch actual shop categories/products; render screenshot-inspired chips with product counts and active selection.
- Implement search, product selection, cart quantity controls, total preview, review, and payment flow against the new backend API.
- Add localized English/Hindi/Marathi user copy, accessible controls, save-time client validation, backend validation alerts, success receipt/detail, and robust error/loading/empty states.

## Step 5 — Docs and verification
- Add POS guide with field meanings, discount/tax/payment rules, stock impact, examples, and recovery guidance; link it from product guide index.
- Run focused backend tests, static checks, mobile lint/build/export, and full flow verification as available.
- Inspect diffs and report exact API, database, security, verification, and remaining deployment requirements.

## Acceptance criteria
- POS can be opened from both Home (button) and More (list entry), using the same screen/route.
- POS UI uses actual shop-owned category and product APIs; no hardcoded demo data.
- User can find products, filter by category, build a cart, review exact payable total, and submit a sale.
- Backend independently validates and calculates all sale values and prevents overselling/duplicate submissions.
- A successful sale and associated stock changes are persisted consistently; failure does not leave partial state.
- Mobile handles all main states and keeps user input recoverable on request failure.
- API docs, user guide, locales, and tests reflect the implemented behavior.

## Progress
- [x] Corrected task understanding: supplied chips are part of the requested POS screen, not an Inventory category enhancement.
- [x] Confirmed current mobile has no POS route or sale flow; Voice tab is a placeholder.
- [x] Inspect Stitch source and backend product/stock conventions; confirm whether sale backend exists. The provided source is `D:/movie/stitch_dukaanvoice_retail_app_ui/code.html` with design tokens/notes in `DESIGN.md`; current backend has Product/Category and stock movement types including `SALE`, but no sales route, model, or service was found.
- [x] Inspect navigation entry points: Home is `mobile/src/screens/HomeScreen.jsx`; More links are in `mobile/src/app/(app)/(tabs)/more.jsx`; tab route files are Expo Router based.
- [x] Finalize contract and implement backend.
- [x] Implement mobile POS screen and API integration.
- [x] Add guide/locales and verify backend tests, changed-file lint, and web export.

### Implementation notes
- Backend contract: authenticated `POST /api/sales`, `Idempotency-Key` header, server-owned product price/stock, fixed rupee discount, and CASH/UPI/CARD tender. Sale snapshots plus stock decrements and `SALE` movements are written in a MongoDB transaction; unsupported standalone MongoDB deployments return `503 TRANSACTIONS_REQUIRED`.
- POS intentionally excludes customer/khata, tax, receipt printing/WhatsApp delivery, and actual UPI/card processor integration because the inspected backend has no matching customer, tax, receipt, or payment-provider contract. Tender mode records the shopkeeper's selected method only.
- Backend tests: 11 passing, including new sale request validation coverage. Changed mobile files lint with 0 errors (existing theme import warnings remain). Full mobile lint still has two errors in existing purchase and supplier-payment screens outside this POS change.
- `npx expo export --platform web` completed successfully after the sandbox initially denied writing `mobile/dist`; the authorized rerun exported the app.
- End-to-end database posting was not run because no transaction-capable MongoDB test deployment or signed-in shop session was available in this environment.
