# Purchase history and details

[Purchases overview](README.md) · [All tab guides](../README.md)

## Find a purchase

Open **More → Purchases**. Search by DukaanVoice purchase reference or supplier invoice number. Filter by payment status, supplier, or date range. Date fields use `YYYY-MM-DD`; tap **Apply** after entering a range. The list loads 20 records per page; use **Load more** or pull down to refresh.

Each row shows the purchase reference, supplier, date, payment status, total, and outstanding amount. Tap it to open the details.

## Review purchase details

The detail page shows the supplier and purchase date, supplier invoice number when present, each saved product snapshot and quantity, and the backend-calculated subtotal, tax, discounts, total, paid amount, and outstanding amount. It also shows recorded payment history.

The record is read-only after posting. The app has no purchase edit action. Use the separate payment action when money is paid later.

## Cancel an eligible purchase

The app shows **Cancel purchase** only for a posted purchase with no payment recorded. Tap it and confirm. The backend also checks that enough current stock exists to reverse every purchased quantity. If a product’s current quantity is below the amount that must be removed—for example, because stock was sold or consumed—cancellation is rejected so inventory cannot become negative.

Purchases with any payment cannot be cancelled in this workflow. The app does not provide refunds or supplier-credit corrections. Contact the shop administrator for an approved accounting correction rather than trying to erase the payment or purchase history.

## Share a purchase summary

1. Open the purchase and tap **Invoice preview**.
2. Review the shop, purchase reference, supplier, date, item lines, total, paid amount, and outstanding amount.
3. Tap **Share invoice summary** to open the phone’s share sheet.

This is a **DukaanVoice purchase summary**, built from saved backend data. It is not the supplier’s original tax invoice. The app currently shares text; it does not create a PDF or provide print/download actions.
