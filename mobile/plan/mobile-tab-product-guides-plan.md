# Mobile Tab Product Guides — Documentation Plan

## Goal

Create a user-readable, production-quality set of Markdown guides for every tab in the current DukaanVoice mobile app. Explain what the tab does today, how a shop user can use its working flows, what each screen means, and how the app's actions affect saved data. Use examples where they make the workflow easier to understand. Keep the writing grounded in the shipped mobile and backend behavior; label placeholders and unavailable capabilities plainly.

## Repository findings and naming decision

- Expo Router defines five tabs: Home, Inventory, Voice, Reports, and More.
- Home and Inventory are implemented screens; More links to Suppliers, Purchases, Supplier payments, and language selection.
- Voice and Reports currently render a localized “coming soon” message. They must have guides explaining their current availability without claiming that recording, AI actions, charts, or report exports work today.
- Supplier, purchase, and payment flows have separate mobile components and authenticated backend services. Their documentation needs child pages because each flow has distinct tasks and rules.
- The root `features/` directory is empty and too generic for reader-facing documentation. Move this documentation to the established, clearer product location `docs/product-guides/`; remove the now-obsolete empty `features/` directory after verifying it contains no user content.
- The root `plan/` directory is empty. Keep this detailed plan at `plan/mobile-tab-product-guides-plan.md` so it is easy to identify later.

## Documentation structure

```text
docs/product-guides/
  README.md                         Guide index and reading map
  home.md                           Home tab
  inventory/
    README.md                       Inventory tab overview and task map
    products.md                     Find, add, view, edit, and archive products
    categories.md                   Create, edit, deactivate, and delete categories
    stock-control.md                Stock in, stock out, adjustments, alerts, and history
  voice.md                          Current Voice tab state and future-use boundary
  reports.md                        Current Reports tab state and future-use boundary
  more.md                           More tab navigation and language setting
  suppliers/
    README.md                       Supplier workflows overview
    supplier-records.md             Search, add, edit, view, archive suppliers
    supplier-balances.md            Supplier purchase/payment history and outstanding balance
  purchases/
    README.md                       Purchase workflow map and business rules
    create-purchase.md              Build, review, and post a purchase
    purchase-history.md             Search, inspect, cancel, and share a purchase summary
    supplier-payments.md            Record and review supplier payments
```

## Writing and accuracy standards

1. Write for a shop owner or staff member first; define technical terms in plain language when they are necessary.
2. Use the user-visible tab and screen names. Explain prerequisites, steps, result, and recovery path for each task.
3. Give concrete examples with clearly marked illustrative values. Never present examples as real account data.
4. Distinguish saved backend data from temporary form values and client-side estimates.
5. Explain validation, loading/empty/error states, duplicate warnings, authorization boundaries, and transaction limitations only where they affect user actions.
6. Never promise unsupported Voice, Reports, PDF, refund, or editing behavior. State current availability and link to related working areas when appropriate.
7. Use relative Markdown links that work within the guide tree. Avoid duplicating long explanations; link to the detailed guide.
8. Make every page scannable with purpose, when to use, steps, example, important behavior, and troubleshooting sections appropriate to that feature.

## Sequential implementation steps

### Step 1 — Prepare the documentation location

- Reconfirm `features/` and `plan/` are empty, as found in the initial inspection.
- Create `docs/product-guides/` and its planned child folders.
- Remove only the empty root `features/` directory; do not move or remove source, backend API documentation, or other user content.
- Acceptance: the guide tree is present under `docs/product-guides/`, and the vague empty directory is gone.

### Step 2 — Document Home and Inventory

- Read the current Home and Inventory screens, their navigation routes, forms, services, validators, and backend behavior.
- Write `home.md`, `inventory/README.md`, `inventory/products.md`, `inventory/categories.md`, and `inventory/stock-control.md`.
- Cover search/filter/pagination and inventory summary; product/category create/edit/archive rules; stock in/out/adjustment, reasons, alerts, and movement history.
- Acceptance: examples and directions match implemented labels, fields, endpoints, validation, and available actions.

### Step 3 — Document Voice and Reports

- Confirm screen behavior and search for any actual voice/report routes, services, backend modules, permissions, and working related flows.
- Write `voice.md` and `reports.md` as honest current-state guides; identify the visible placeholder and avoid instructions for controls that do not exist.
- Acceptance: user can tell what is currently usable and where related working tasks live.

### Step 4 — Document More and Supplier management

- Read More navigation and supplier list/form/detail/summary routes, APIs, authorization, and backend rules.
- Write `more.md`, `suppliers/README.md`, `suppliers/supplier-records.md`, and `suppliers/supplier-balances.md`.
- Explain active versus archived suppliers, duplicate warnings, field validation, retained purchase history, and balance definitions.
- Acceptance: supplier paths and limitations match the actual app/backend contract.

### Step 5 — Document Purchases and Supplier payments

- Read purchase list/create/detail/invoice/payment screens, service methods, validators, calculator, persistence rules, and transaction behavior.
- Write `purchases/README.md`, `purchases/create-purchase.md`, `purchases/purchase-history.md`, and `purchases/supplier-payments.md`.
- Cover backend-calculated totals, stock posting, idempotent retries, payment limits, immutable payment history, safe cancellation limits, and the distinction between a DukaanVoice summary and a supplier tax invoice.
- Acceptance: a user can complete the supported purchase/payment workflows from the written instructions without being promised unsupported edits, refunds, or exports.

### Step 6 — Review, cross-link, and finish the plan

- Read every guide and compare each named route, field, and action against source code.
- Check all relative links, spelling, heading consistency, and user-facing clarity. Ensure no screen is omitted and no planned feature is described as live.
- Update the checklist and record checks actually executed; do not claim a live database or device flow was tested.
- Acceptance: guide index links to every tab guide, deep guides link back to their parent, all relative links resolve, and plan progress reflects delivered files.

## Progress checklist

- [x] Initial repository and app-tab discovery; empty `features/` and `plan/` confirmed.
- [x] Detailed plan created before guide authoring.
- [x] Step 1 — Prepare documentation location; created `docs/product-guides/` child folders and removed the verified empty root `features/` directory.
- [x] Step 2 — Home and Inventory guides (`home.md` and four Inventory pages) written against current mobile routes, backend validation, and data behavior.
- [x] Step 3 — Voice and Reports guides; both pages clearly state the current placeholder behavior and link to available related workflows.
- [x] Step 4 — More and Supplier guides written against actual menu links, supplier list/form/detail screens, payment filters, and shop-scoped service rules.
- [x] Step 5 — Purchase and Supplier-payment guides written against the screens, API validators, calculators, persistence rules, and cancellation/payment constraints.
- [x] Step 6 — Cross-link and final review; all guide links were checked against the created Markdown tree and all five tab guides are indexed.

## Verification record

Record exact read-only/documentation checks after implementation. No app code, backend code, database data, or runtime configuration should change as part of this documentation task.

- Read and compared the tab router, Home/Inventory screens, inventory forms/routes/services, supplier/purchase/payment screens/services, backend validators/services, and the voice/report routes before documenting workflows.
- `Get-ChildItem -LiteralPath 'docs/product-guides' -Recurse -File -Filter '*.md'` plus a PowerShell relative-link check: 16 Markdown files and 55 relative links checked; every linked target exists.
- `git diff --check`: no whitespace errors; Git printed existing LF-to-CRLF conversion notices for modified working-tree files.
- No app build, database request, device flow, or runtime behavior was changed or claimed as verified; this task only adds/organizes Markdown documentation and the plan.
