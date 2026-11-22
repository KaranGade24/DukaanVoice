# Dynamic Inventory Categories and Product Validation Plan

## Goal
Match the supplied inventory category-chip reference while using shop-owned backend categories (including categories created inline during product creation), and ensure product values and stock calculations are validated consistently at save time by backend and mobile.

## Step 1 — Inspect requirements and architecture
- Review the screenshot and existing product/category/stock mobile screens.
- Read root, mobile, and backend AGENTS instructions.
- Trace category list/create routes, category model/service/controller/validators, product create/update routes and schema, inventory math, and API contracts.
- Identify whether category chips currently use hardcoded values and how products are filtered/paginated.

## Step 2 — Define synchronized behavior
- Category chips display **All** plus active categories belonging to the current shop; counts reflect backend product counts where supported.
- Inline-created categories are persisted through the category API, become selectable immediately, and appear in the inventory category filter after refresh.
- Product save validates category ownership/activity and all monetary/quantity constraints on backend; mobile validates for fast feedback but treats backend as authoritative.
- Product calculations use a single documented contract for price, opening stock, minimum-stock threshold, and monetary precision; reject invalid/unsafe values instead of silently coercing.

## Step 3 — Implement backend first
- Add/fix category product-count contract or efficient query if the chip UI needs it.
- Verify shop ownership, active-state checks, duplicate category handling, and inline category creation authorization.
- Inspect product validators and calculation paths; define precise bounds/rounding for prices and quantities, and apply them consistently to create/update.
- Return field-specific validation errors in the established response shape; keep existing API callers backward compatible where practical.
- Update OpenAPI/API documentation and relevant backend tests.

## Step 4 — Integrate mobile
- Replace hardcoded inventory category chips with API-backed shop categories and backend counts.
- Ensure newly created inline categories are returned/selected immediately and update chip data.
- Implement screenshot-inspired horizontally scrollable chips with selected state, count badge, accessibility state, and loading/empty/error/retry behavior.
- Validate product fields on submit (required text/category, finite non-negative price/stock, safe precision, valid SKU/barcode/image URL where appropriate); show field-specific messages and preserve entered values on server failure.
- Ensure create and edit flows use the same validation rules and API data contracts.

## Step 5 — Documentation and verification
- Document category chips, inline category creation, field purposes, and validation rules in the inventory guides.
- Verify category creation -> product save -> category counts/filtering and create/edit error handling end to end as environment permits.
- Run relevant focused backend tests, lint/syntax checks, and mobile build/export checks. Inspect all diffs and report actual results and limitations.

## Acceptance criteria
- No hardcoded category list is used as the source of inventory categories.
- Category chips reflect only this shop’s actual active categories and current product counts.
- Inline-created categories persist and can be selected immediately.
- Backend rejects invalid or foreign/inactive categories and invalid financial/quantity input with actionable errors.
- Mobile validates before submit, displays backend validation details, and does not discard form input on failure.
- Product creation/editing and stock valuation remain consistent with backend calculations.

## Progress
- [x] Detailed plan written before implementation.
- [x] Inspect backend and mobile contracts and current behavior: category list is already shop-scoped and supplies `productCount`; inline create calls the category API; product validator already enforces finite non-negative values and category ownership/activity is checked in service.
- [x] Implement backend validation bounds: monetary values are capped at 1,000,000,000 with two decimal places; quantities/minimum stock are capped at 1,000,000,000 with six decimal places. Product service already enforces active category ownership.
- [x] Integrate category counts in mobile chips: category list is API-backed; All uses the backend summary product count and each category displays `productCount`.
- [x] Update product guide with purpose, required status, and examples for product form fields.
- [ ] Complete mobile save-time parity validation and ensure errors remain actionable with entered values preserved.
- [ ] Refine and visually verify screenshot-inspired chip presentation, including active state, spacing, and count badge treatment.
- [ ] Update API documentation to state precision and maximum bounds.
- [ ] Verify inline category creation → product save → refreshed category counts and filtering; run focused checks.

## Latest source review
- `backend/modules/inventory/inventory.validators.js`: reusable `money` and `quantity` validators are now applied to product create/update monetary and quantity fields.
- `backend/modules/products/product.service.js`: product category is checked for same-shop ownership and active status before create/update.
- `mobile/src/screens/inventory/InventoryScreen.jsx`: category filters are fetched from category API; counts are rendered on chips.
- `mobile/src/screens/inventory/InventoryForms.jsx`: inline category creation calls backend then reloads categories and selects the new category; submit currently checks finite/non-negative values but does not yet mirror the new decimal/max constraints.
- `docs/product-guides/inventory/products.md`: product fields are explained in a field table.
- Verification has not yet been run; do not treat this plan as complete.
