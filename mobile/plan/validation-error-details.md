# Validation Error Details — Implementation Plan

## Goal

When a request fails route validation, return enough safe, structured information to identify the exact body, path-parameter, or query field and the reason it failed. Keep a single reusable backend formatter and make the shared mobile API layer surface those details instead of showing only “Request validation failed.” Preserve the current `{ success: false, error: { code, message, details? } }` envelope and existing `details.fieldErrors` consumers.

## Findings and boundaries

- `backend/middleware/validation.middleware.js` already exports reusable `validate(schema)` and uses Zod `safeParse`, but currently only returns `details.fieldErrors` and a generic top-level message.
- All category, product, inventory, supplier, purchase, payment, login, and signup routes use that middleware where route schemas are present. Inventory summary and auth-me have no request schema to validate.
- `mobile/src/services/apiClient.js` keeps server `details` on `ApiError`, but its `message` is only the generic server message.
- Most inventory, purchase, payment, and auth screens show `error.message`/`errorText(...)`, so the generic text hides the useful payload. The supplier form already maps `details.fieldErrors` to inline inputs, though it retains a generic banner.
- No new package, route, or schema behavior is required. Do not change validation rules or success responses.

## API response contract

For `VALIDATION_ERROR`, continue returning HTTP 400 and the existing error envelope. `error.details` will contain:

```json
{
  "fieldErrors": {
    "supplierName": ["Supplier name is required"],
    "limit": ["Number must be less than or equal to 100"]
  },
  "issues": [
    {
      "field": "supplierName",
      "location": "body",
      "code": "too_small",
      "message": "Supplier name is required"
    }
  ]
}
```

`fieldErrors` keys remain compatible with existing mobile handling (body/params/query prefixes stripped; nested fields are dot paths; request-level issues use `_form`). `issues` preserves each individual Zod failure with its source location, stable Zod issue code, field path, and user-safe message. Unknown keys and malformed values are described by Zod without echoing submitted values. Do not return stack traces or request contents.

## Step-by-step implementation

1. **Confirm behavior and consumers** — inspect root/backend/mobile instructions, shared validation and error middleware, all route validators, API client, and screens that display request errors. Record the response contract above and retain compatibility with `fieldErrors`.
2. **Add reusable backend issue formatting** — implement a focused exported helper that converts Zod issues into `fieldErrors` plus ordered structured `issues`, handling body/params/query roots, nested paths, root-level issues, multiple errors per field, and safe fallback paths. Use it from the existing `validate(schema)` middleware without changing successful parsing behavior.
3. **Add backend regression coverage** — test multi-field, nested-field, query, parameter, and root-level issues; verify codes/messages survive, duplicate field messages accumulate, the old `fieldErrors` shape remains, and no submitted values are included.
4. **Surface details through the mobile API client** — add a reusable formatter for `ApiError` that converts structured issues/fieldErrors to readable `Field: reason` lines, preserves the server message for non-validation errors, handles older servers that only return `fieldErrors`, and falls back safely if details are malformed.
5. **Connect form error display** — use the shared formatter in the purchase-management error utility and affected category/product/stock/auth/purchase/payment form catches. Keep validation feedback visible in the form; keep SupplierFormScreen's inline field mapping and show the detailed summary as well. Avoid dumping validation detail on unrelated list/detail/network errors.
6. **Review and verify** — inspect all changed files and API consumers; run backend tests, backend syntax checks, mobile lint/build checks available in package scripts, and `git diff --check`. Report exactly which commands passed and disclose checks unavailable in the environment.

## Acceptance criteria

- An invalid request response identifies each failing field and reason in both structured `details.issues` and backwards-compatible `details.fieldErrors`.
- The mobile UI presents actionable field-specific feedback rather than only the generic validation banner.
- Validation is formatted by reusable backend and mobile helpers; no route-specific validation duplication is introduced.
- Non-validation errors, successful request behavior, auth, and existing validation rules are unchanged.

## Execution record

- [x] Step 1 — inspected the shared validation middleware, error envelope, category/product/inventory/auth/supplier/purchase/payment route validation, central mobile API client, and form error handlers.
- [x] Step 2 — added `formatValidationIssues()` to the shared backend validation middleware. It returns backward-compatible `fieldErrors` and structured issues with field, location, Zod code, and message; payloads are capped at 50 issues with truncation metadata.
- [x] Step 3 — added backend regression tests for body, nested, query, root, multiple, capped, safe, and middleware-generated errors.
- [x] Step 4 — added shared mobile formatting for structured validation issues and older `fieldErrors`-only responses. `ApiError.message` now carries field-specific feedback.
- [x] Step 5 — supplier form keeps inline field messages while showing the detail summary; login/signup preserve validation details; all backend `VALIDATION_ERROR` catches now also show a localized native alert across auth, inventory, suppliers, purchases, and supplier payments. Existing inline/form error text remains available after dismissing the alert.
- [x] Step 6 — updated inventory and supplier/purchase OpenAPI error schemas and ran verification.

### Verification results

- `npm test` in `backend/`: passed, 8 tests (4 purchase calculator and 4 validation middleware).
- Backend `node --check` over every `backend/**/*.js`: passed.
- `npm run lint` in `mobile/`: passed with 0 errors and 345 warnings across the repository. The focused ESLint run for changed mobile screens and API client also passed with 0 errors (70 existing theme import warnings).
- `git diff --check`: passed; Git emitted only existing Windows LF-to-CRLF working-copy notices.
- No API behavior or validation rules changed; validation failures remain HTTP 400 with the existing error envelope.
- Alert follow-up: focused ESLint over all touched mobile screens, helper, and locales passed with 0 errors (191 theme-import warnings); Android Expo export passed with 2,010 modules; `git diff --check` passed with only existing Windows line-ending notices.
