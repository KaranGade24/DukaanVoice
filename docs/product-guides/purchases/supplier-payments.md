# Supplier payments

[Purchases overview](README.md) · [All tab guides](../README.md)

## Record a payment

1. Open **More → Supplier payments** and tap **＋**, or open supplier/purchase details and choose **Record payment**.
2. Choose the supplier if it is not already selected.
3. Choose one of that supplier’s purchases with an outstanding balance. The form fills the amount with the remaining balance; you can replace it to record a partial payment.
4. Enter an amount greater than zero and no greater than the purchase’s current outstanding balance.
5. Choose the method: Cash, UPI, Bank transfer, Card, Cheque, or Other.
6. Enter the payment date. Add a transaction reference or note if useful.
7. Tap **Confirm payment**. On success, the app returns to that purchase’s details so you can review its updated balance and payment history.

### Example

If a purchase has ₹2,000 outstanding, enter ₹750 to record a partial payment. The backend updates the purchase balance to ₹1,250 and marks it **Part paid**. A payment equal to the remaining balance marks it **Paid**.

## What is a transaction reference?

A transaction reference is an identifier supplied by the payment method or printed on a receipt. It helps you match a saved payment with your bank or payment-provider records later. Examples include a UPI UTR, bank transfer reference, cheque number, or receipt ID. Enter it when available; it is optional, and it does not initiate or verify the transfer itself. Cash payments can be left blank unless you use an internal receipt number.

## Review payment history

The Supplier payments list shows amount, supplier, purchase reference, method, and date. Filter by payment method, supplier, and date range. Date fields use `YYYY-MM-DD`; apply the range after entering both dates. Results load 20 at a time. Tap a payment to see its transaction reference and notes.

Purchase details also show payments for that purchase. An initial payment made while posting the purchase appears in the same saved payment history.

## Important payment rules

- The server rechecks the balance and rejects an overpayment, even if the amount looked valid when the form opened. If another user has changed the balance, reload the purchase and try again.
- Payments are saved history and cannot be edited or deleted in the app. Check supplier, purchase, method, and amount before confirming.
- The mobile form sends an idempotency key for safe retry of the same in-progress payment. After a network failure, check the purchase/payment history before starting a separate payment.
- Payment recording requires a transaction-capable MongoDB deployment. If the app reports **Transactions required**, contact the administrator. Do not record a second payment to compensate for that error.
