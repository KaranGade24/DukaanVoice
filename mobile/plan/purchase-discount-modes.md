# Purchase Discount Modes Implementation Plan

## Goal

Allow users to enter purchase line discounts and an additional purchase-wide discount as either a fixed rupee amount or a percentage. The backend remains authoritative for monetary calculations. Show the combined discount amount in the purchase preview and saved purchase details.

## Decisions and compatibility

- Preserve `discountAmount` and `additionalDiscount` as the existing fixed-amount request fields.
- Add `discountPercent` per item and `additionalDiscountPercent` for the purchase-wide discount. A request may use only one mode for each discount.
- Percentages are limited to 0–100, support up to two decimal places, and are calculated against the line subtotal or the pre-tax taxable amount respectively.
- Persist the selected mode and entered value as purchase snapshots, alongside the calculated paise amounts.
- Keep historical records readable with safe defaults when the new snapshot fields are absent.

## Steps

1. **Inspect contracts and calculation.** Review backend validation, integer-paise purchase calculator, purchase persistence/response shape, mobile purchase create/details screens, locale strings, OpenAPI, and user guide. Confirm affected callers and existing amount semantics.
2. **Implement backend validation and arithmetic.** Add mutually exclusive optional amount/percentage fields with strict percentage bounds. Calculate percentage discounts using integer basis points and paise rounding, then pass only calculated amounts through the established allocation/tax flow. Reject discounts above their applicable base.
3. **Persist and return discount snapshots.** Save selected type/value for each line and purchase-wide discount; return them in shaped API responses while retaining existing calculated amount fields. Keep old amount-only requests valid.
4. **Update API documentation.** Document the new fields, exclusive choice, bases, limits, compatibility, and response snapshot fields.
5. **Update mobile entry flow.** Add accessible amount/percentage mode controls for each line and the purchase-wide discount; send only the selected API field. Validate values, compute an explicitly estimated combined discount for preview, and display it separately from the estimated total.
6. **Update saved purchase display and guidance.** Show the total combined discount clearly in purchase details and update the purchase guide and English/Hindi/Marathi labels.
7. **Review and verify.** Inspect all changed files, check callers and response compatibility, run focused backend calculator tests and relevant lint/build checks, and report concrete results and limitations.

## Completion checklist

- Existing amount-only mobile/API calls still work.
- Percentage discounts use correct pre-tax bases and currency rounding.
- Backend validation rejects conflicting modes, out-of-range rates, and discount totals above their bases.
- Purchase snapshots retain mode/value and saved totals remain paise-accurate.
- Mobile shows mode selection, total estimated discount, final total estimate, and saved total discount.
- OpenAPI and user documentation match actual implementation.
