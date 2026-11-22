# Inventory tab

[All tab guides](../README.md)

## What Inventory does

Inventory is the working area for your shop’s product catalogue and stock. It shows a server-loaded summary, lets you find products, and links to product, category, stock, alert, and movement-history tasks.

## Start here

1. Open **Inventory** from the bottom tab bar.
2. Review the product and category counts, estimated stock value, and low-stock and out-of-stock counts.
3. Use **Search** and the stock/category filters to narrow the product list.
4. Tap a product to open its details. Use the quick actions to add products, manage categories, receive or remove stock, adjust a count, or view stock history.
5. Pull down to refresh, or choose **Load more** at the bottom when another product page is available.

The list loads 20 products at a time. Search waits briefly after typing before refreshing the results. Filters and the category shortcut from the Categories screen apply to the product list.

## Understand the stock summary

- **Products** and **Categories** count active records for the shop.
- **Stock value** is an estimate based on each active product’s quantity and saved purchase price. A product without a purchase price does not add a value to this total.
- **Low stock** means a positive quantity at or below that product’s minimum-stock level.
- **Out of stock** means quantity is zero or lower; normal stock operations prevent a stock-out from taking quantity below zero.
- The bell opens **Stock alerts**, which includes products at or below their minimum-stock level, including products with no stock.

An **In stock** filter means quantity is above the minimum-stock level. A product can have some units left and still appear as low stock.

## Choose a task

- Add or update product information: [Products](products.md)
- Group products and choose their category: [Categories](categories.md)
- Receive, remove, or count stock: [Stock control](stock-control.md)

## Data and recovery

Inventory is loaded from authenticated, shop-scoped APIs. The app does not save inventory changes only on the phone. If a request fails, read the message, check the connection and selected shop, then retry. A failed stock operation should be checked in Stock history before you submit it again.
