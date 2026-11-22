# Products

[Inventory overview](README.md) · [All tab guides](../README.md)

## Find a product

In **Inventory**, search by product name, SKU, or barcode. Use the stock-status chips or category chips to narrow the list. Product results are paginated; tap **Load more** to fetch the next page. Pull down to refresh the current list.

The status labels use the product’s saved minimum-stock level:

- **In stock:** quantity is greater than the minimum-stock level.
- **Low stock:** quantity is above zero and at or below the minimum-stock level.
- **Out of stock:** quantity is zero or lower.

Tap a result to see its category, SKU/barcode, quantity and unit, selling and purchase prices, minimum-stock level, and description when one exists.

## Add a product

1. In Inventory, tap **Add product**.
2. Enter the product name and select an active category belonging to your shop. You can search categories or create one by name from the selector.
3. Enter the selling price. Purchase price is optional; it is used in the stock-value estimate.
4. Enter the opening stock and minimum-stock alert level. The opening quantity becomes the product’s initial stock and is recorded in stock history.
5. Choose a unit, or type a custom unit. SKU, barcode, description, and image URL are optional.
6. Tap **Save product**. If the request is rejected, correct the message shown on the form and retry.

### Product form fields

| Field | Purpose and example | Required |
| --- | --- | --- |
| Product name | Name staff recognize, such as `Basmati rice 1 kg`. | Yes |
| Category | Groups the product for browsing and filtering; choose an active shop category. | Yes |
| Selling price | Customer sale price per selected unit, in rupees; for example `120`. | Yes |
| Purchase price | What the shop pays per unit; used for cost and stock-value context. Example: `95`. | Optional |
| Opening stock | Physical quantity currently on hand when the product is first created; for example `12` packets. | Yes |
| Minimum-stock alert | Threshold that marks the product low-stock and triggers an alert. Example: `5` packets. | Optional; defaults to 5 |
| Unit | How quantity is counted, such as piece, kg, packet, or a custom unit like `crate`. | Yes |
| SKU | Your shop’s internal stock-keeping code used to identify the product. Example: `RICE-BAS-1K`. | Optional |
| Barcode | Number encoded in the product’s barcode, useful for scanning or lookup. | Optional |
| Description | Extra identifying details such as brand, size, or variant. | Optional |
| Image URL | Web address of an image used to identify the product. | Optional |

Prices are limited to ₹1,000,000,000 with at most two decimal places. Stock and minimum-stock quantities are limited to 1,000,000,000 with at most six decimal places. The app checks these values before saving, and the server validates them again. If saving fails, the form stays open so you can correct the values without re-entering the rest.

### Example

For a new product called **Basmati rice 1 kg**, choose Grocery, set its selling price and (if known) purchase price, enter the number of bags on hand as opening stock, and choose `packet` or a suitable custom unit.

## Edit product information

Open the product and tap **Edit product**. You can change its name, category, prices, minimum-stock level, unit, description, and product identifiers. The quantity shown in this form is informational: editing product details does not change stock. To change the physical count, use [Stock control](stock-control.md).

## Archive a product

From product details, tap **Archive product** and confirm. Archived products are hidden from the active Inventory list and are not available for new stock operations. Their historical records are retained. Archiving is the supported mobile action for retiring a product.

## Important rules

- The server validates the data and confirms that the category belongs to your shop and is active.
- Prices and quantities must be finite, non-negative numbers. Name, category, selling price, opening quantity, and unit are required when creating a product.
- Opening stock is applied once during creation. Do not add it again with Stock in unless you are receiving additional stock.
- Stock changes belong in the dedicated stock workflow so the quantity and movement history stay together.
