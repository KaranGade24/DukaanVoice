# Supplier balances and history

[Supplier management overview](README.md) · [All tab guides](../README.md)

## Read the supplier totals

Open a supplier to see three amounts:

- **Purchases:** total value of that supplier’s posted, non-cancelled purchases.
- **Paid:** payments recorded against those posted purchases.
- **Outstanding:** the amount still owed across those purchases.

The backend calculates these totals across the supplier’s records, not only the 20 rows on the supplier list page. They are shop-scoped and come from saved purchase/payment records.

### Example

If posted purchases total ₹12,500 and saved payments total ₹7,500, the outstanding balance is ₹5,000. Use the purchase and payment records to confirm how the total was reached.

## Review recent purchases

Supplier details show up to the 10 most recent purchases, with the purchase reference, date, total, and payment status. Tap a purchase to open its detail screen. The broader **More → Purchases** list is paginated; search by its purchase reference or supplier invoice number to find a record.

## Review payment entries

Open **More → Supplier payments** to view recorded entries. You can filter by payment method, supplier, and a date range, then tap an entry to see its amount, supplier, purchase reference, method, date, and transaction reference. Results load 20 at a time.

To apply a date filter, enter dates in `YYYY-MM-DD` format and tap **Apply**. The end date includes the full day. If the range is invalid, correct the dates and apply again.

## Record a payment

Use **Record payment** from supplier details when a balance is outstanding, or use the **＋** button on Supplier payments. Choose the supplier and an outstanding purchase, enter an amount no greater than that purchase’s remaining balance, select a payment method, and confirm. See [Supplier payments](../purchases/supplier-payments.md) for the complete steps and payment rules.

Payment entries are saved history; the mobile app does not provide an edit or delete action. If an entry is wrong, contact the shop administrator/support for the approved correction process rather than recording a second entry to hide it.
