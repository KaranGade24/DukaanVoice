# Supplier Payment Search and Pagination Plan

## Goal
Make recording supplier payments manageable with searchable suppliers, paginated supplier results, and a searchable, paginated list of only purchases with a remaining balance.

## Implementation steps
1. Inspect the backend supplier listing, supplier outstanding route, validation, response pagination shape, and the mobile payment screen/service contracts.
2. Ensure the outstanding-purchases endpoint validates page/limit and returns only posted purchases whose outstanding balance is greater than zero, with pagination metadata.
3. Update mobile services to pass search and page parameters through the existing APIs.
4. Start the payment form with no supplier selected unless navigation explicitly provides one. Add a supplier search input and server-side paginated loading, including load-more at list end.
5. After supplier selection, show a purchase search input and only that supplier’s unpaid/partially paid purchases. Filter searchable purchase reference/invoice text and load subsequent pages at list end.
6. Clear dependent selection, purchase results, and payment input when supplier changes; preserve existing payment validation and idempotency behavior.
7. Inspect API compatibility and run focused lint/build or syntax checks; report actual results.

## Acceptance criteria
- Both supplier and purchase lists have visible search fields.
- Neither list is fetched unbounded; each requests the next page as the user reaches the end.
- No supplier is preselected on a normal entry; route-provided supplier context remains supported.
- Purchase list excludes paid and cancelled purchases.
- Changing supplier clears stale purchase/payment state.
