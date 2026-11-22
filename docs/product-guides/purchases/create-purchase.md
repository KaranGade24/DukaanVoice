# Create and post a purchase

[Purchases overview](README.md) · [All tab guides](../README.md)

## Before you start

The supplier must be active, and every product must be active in your shop. If a supplier or product is missing, add it first through [Supplier management](../suppliers/README.md) or [Inventory](../inventory/README.md).

## Enter a purchase

1. Open **More → Purchases** and tap **＋**. You can also start from an active supplier’s details with **New purchase**.
2. Choose the supplier. The purchase form searches supplier name and phone.
3. Optionally enter the supplier’s invoice number. Enter the purchase date; due date is optional and cannot be earlier than the purchase date.
4. Search for a product and tap **＋** to add it. A product can appear only once in the form. The form starts with quantity `1`, the product’s saved purchase price when available, and zero discount/tax; review these values against the supplier invoice.
5. For each line, enter quantity, unit purchase price, choose a discount mode (fixed rupees or percentage), enter the discount, and set tax percentage. Quantity must be positive and supports at most six decimal places. Tax is 0–28% and supports up to two decimal places. A line percentage is applied to that line’s subtotal; the resulting discount cannot exceed the subtotal.
6. Optionally choose a fixed rupee amount or percentage for the additional purchase-level discount, then enter additional charges and notes. This percentage is applied to the pre-tax amount after line discounts. The additional discount cannot exceed that amount.
7. If money is paid now, enter the initial payment amount, method, and date. It must be positive and no greater than the final purchase total.
8. Review the combined estimated discount and estimated total, then tap **Review and post purchase**. The button posts the purchase immediately; the app does not show a separate confirmation dialog.
9. On success, the app opens the purchase details. If saving fails, read the message and retry from the still-open form.

## Understand the total

Prices are treated as tax-exclusive. Line discounts may be rupees or a percentage of each line subtotal. The additional purchase discount may be rupees or a percentage of the pre-tax balance after line discounts. The backend calculates both discounts, allocates the additional discount across taxable lines, then calculates tax, additional charges, the grand total, and the amount outstanding. It stores money in paise and returns rupee amounts. The on-screen discount and total are estimates; the saved purchase detail is the final amount.

### Example

For 10 boxes at ₹100 each, with 5% tax and no discount or extra charge, the estimated total is ₹1,050. If you record ₹500 as an initial payment, the saved balance should be ₹550, subject to the backend-calculated total.

## What posting changes

When the server accepts the request, it creates a purchase reference, stores product name/unit/price snapshots, records any initial payment, and increases stock for the purchased products. These writes are handled together by the backend transaction; do not also use Stock in for the same delivery.

The form sends an idempotency key so retrying the same in-progress submission does not post the same purchase twice. If a request returns an error, check **More → Purchases** before starting a new purchase, especially if you left the original form.

## If posting fails

- **Invalid product/supplier:** verify the supplier is active and all products belong to your shop and are active.
- **Totals or line validation:** check positive quantities, prices, discounts, tax rates, and date order.
- **Duplicate invoice:** check whether this supplier invoice was already recorded for this supplier.
- **Transactions required (503):** the configured database does not support the atomic purchase operation. Ask the administrator to use a transaction-capable MongoDB deployment. The app cannot safely post purchase, stock, and payment records separately.
- **Network error:** keep the form open and retry; verify the purchase list before creating another record.
