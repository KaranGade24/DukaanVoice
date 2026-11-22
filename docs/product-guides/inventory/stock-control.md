# Stock control

[Inventory overview](README.md) · [All tab guides](../README.md)

Use the stock actions to record receipts, removals, and physical-count corrections. Each successful operation changes the product quantity on the backend and adds a stock-movement record with the previous and resulting quantities.

## Receive stock (Stock in)

1. Choose **Stock in** from Inventory, a product’s details, or a stock alert.
2. Select the product if it was not already selected.
3. Enter the quantity received. It must be greater than zero.
4. Optionally enter **Purchase cost**, a supplier/reference, and notes. Supplying a purchase cost also updates that product’s saved purchase price.
5. Tap **Confirm stock update**.

Example: if 12 cartons arrive, enter `12` and the product’s unit. If the supplier gives you an updated unit cost, enter that purchase cost as well.

## Record stock out

1. Choose **Stock out** and select the product.
2. Enter the quantity removed. It must be greater than zero and cannot exceed the current quantity.
3. Select a reason: **Damaged**, **Expired**, or **Manual removal**.
4. Add an optional reference or note, then confirm.

The backend prevents the result from going below zero. If there is not enough stock, refresh the product and enter the actual quantity removed.

## Correct a physical count

1. Choose **Adjust stock** and select the product.
2. Check the displayed current quantity and difference.
3. Enter the **Corrected quantity** you physically counted. This is the new total, not the amount to add or subtract.
4. Enter a reason and confirm.

Example: current stock is 20 and your count is 17. Enter `17`; the recorded change is minus 3. A correction must change the quantity, and the new quantity cannot be negative.

## Review alerts and movement history

- Tap the bell on Inventory to see products at or below their minimum-stock level. Tap **Stock in** on an alert to open a receipt for that product.
- Choose **History** for shop-wide movement history, or open a product and choose **History** for that product alone.
- Each history entry shows the movement kind, time, old and new quantities, reason/notes, and the staff member recorded as performing the operation.
- Use history to confirm whether a previous request succeeded before retrying it.

## What gets recorded

Stock in, stock out, and adjustments are authenticated server operations scoped to the signed-in shop. The backend validates the product, quantity, reason, and shop ownership. A conflict can occur if another user changes the same product at the same time; refresh the product and retry with the current count. Stock history is retained so quantity changes can be traced.
