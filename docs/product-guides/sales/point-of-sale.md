# Point of sale

The POS creates a completed sale for the signed-in shop. Open it from the Home shortcut or More → Point of sale.

## Build the bill

Products and categories are loaded from the shop inventory. Search accepts product name, SKU, or barcode; category chips filter the list. A product with no available stock cannot be added. Use the plus/minus controls to set quantities or the trash control to remove a line. The server checks availability again when you complete the sale.

The bill shows each line using the current catalogue selling price. The subtotal is the sum of line amounts. Enter an optional fixed bill discount in rupees; it cannot exceed the subtotal. Tax is not added because the current product and sales contract has no tax configuration. Customer selection and credit/khata are also not part of this POS flow.

## Take payment

Choose Cash, UPI QR, or Card/POS. This records the selected tender method; it does not initiate a UPI payment or contact a card terminal. Cash received must cover the bill total and any excess is shown as change. UPI and card amounts must equal the total. There is no partial payment or credit sale in this workflow.

Select **Complete sale** once payment is received. The backend recalculates prices and totals from current shop products, validates the discount and tender, saves a sale snapshot, reduces inventory, and records a `SALE` stock movement in one MongoDB transaction. A conflict or insufficient stock returns an error and does not post a partial sale. Complete sale requires MongoDB transaction support (replica set or sharded cluster).

## If a request fails

The cart stays on screen so you can review it and retry. Reloaded product stock may differ after a stock conflict; confirm quantities before retrying. Repeated submission of the same attempt uses an idempotency key to avoid recording it twice.

The completion confirmation shows the sale reference, final total, and cash change. Printed receipts, WhatsApp delivery, customer accounts, tax, returns, and sale history are not available in the current POS release.
