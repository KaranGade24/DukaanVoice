import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Product from "../../../models/Product.js";
import StockMovement from "../../../models/StockMovement.js";
import { escapeRegex } from "../../inventory/inventory.shared.js";

export const createInventoryTools = ({ shopId }) => [
  tool(
    async ({ query }) => {
      const regex = new RegExp(escapeRegex(query), "i");
      const products = await Product.find({
        shopId,
        isArchived: false,
        $or: [{ name: regex }, { sku: regex }, { barcode: regex }],
      })
        .select("name sku unit quantity minimumStock")
        .sort({ name: 1 })
        .limit(8)
        .lean();
      return JSON.stringify(
        products.map((item) => ({
          name: item.name,
          sku: item.sku || "",
          unit: item.unit,
          quantity: item.quantity,
          minimumStock: item.minimumStock,
        })),
      );
    },
    {
      name: "get_current_stock",
      description:
        "Look up actual on-hand stock for matching products in this shop.",
      schema: z.object({ query: z.string().trim().min(1).max(100) }),
    },
  ),
  tool(
    async () => {
      const products = await Product.find({
        shopId,
        isArchived: false,
        $expr: { $lte: ["$quantity", "$minimumStock"] },
      })
        .sort({ quantity: 1, name: 1 })
        .select("name sku unit quantity minimumStock")
        .limit(20)
        .lean();
      return JSON.stringify(
        products.map((item) => ({
          name: item.name,
          sku: item.sku || "",
          unit: item.unit,
          quantity: item.quantity,
          minimumStock: item.minimumStock,
        })),
      );
    },
    {
      name: "get_low_stock_products",
      description:
        "List active products at or below their configured minimum stock.",
      schema: z.object({}),
    },
  ),
  tool(
    async ({ query, limit }) => {
      const regex = new RegExp(escapeRegex(query), "i");
      const products = await Product.find({
        shopId,
        isArchived: false,
        $or: [{ name: regex }, { sku: regex }, { barcode: regex }],
      })
        .select("_id name")
        .limit(5)
        .lean();
      if (!products.length) return JSON.stringify([]);
      const records = await StockMovement.find({
        shopId,
        productId: { $in: products.map((product) => product._id) },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("productId", "name unit")
        .lean();
      return JSON.stringify(
        records.map((item) => ({
          product: item.productId?.name || "",
          type: item.type,
          changedQuantity: item.changedQuantity,
          newQuantity: item.newQuantity,
          date: item.createdAt,
        })),
      );
    },
    {
      name: "get_stock_movement_history",
      description:
        "Show recent stock movements for products matching a name, SKU, or barcode.",
      schema: z.object({
        query: z.string().trim().min(1).max(100),
        limit: z.number().int().min(1).max(20).default(10),
      }),
    },
  ),
];
