# Supplier Payment Transaction Reference Help Plan

1. Inspect the supplier payment form, its translations, and the purchase/payment feature documentation structure.
2. Add localized, concise helper text and an example placeholder explaining that the transaction reference is an optional identifier from the payment provider or receipt (for example, UPI UTR or bank reference).
3. Document what the field is for, common examples, and that it is optional unless the shop needs it for reconciliation, in the supplier payment feature guide.
4. Ensure field remains optional and is sent through the existing backend `transactionReference` property unchanged.
5. Review changed files and report the result.
