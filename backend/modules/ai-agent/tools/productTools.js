import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Category from "../../../models/Category.js";
import Product from "../../../models/Product.js";
import { getFrequentlySoldProducts } from "../../sales/sale.service.js";
import { escapeRegex } from "../../inventory/inventory.shared.js";

const productSummary = (product) => ({
  id: product._id.toString(),
  name: product.name,
  sku: product.sku || "",
  barcode: product.barcode || "",
  unit: product.unit,
  sellingPrice: product.sellingPrice,
  quantity: product.quantity,
  minimumStock: product.minimumStock,
});

const normalize = (value) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const editDistance = (left, right) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
};

const fuzzyProductMatches = (query, products) => {
  const queryWords = normalize(query).split(/\s+/).filter(Boolean);
  return products.map((product) => {
    const words = normalize(`${product.name} ${product.sku || ""} ${product.barcode || ""}`).split(/\s+/);
    const score = queryWords.reduce((sum, queryWord) => {
      const best = Math.min(...words.map((word) => editDistance(queryWord, word) / Math.max(queryWord.length, word.length, 1)));
      return sum + best;
    }, 0) / Math.max(queryWords.length, 1);
    return { product, score };
  }).filter(({ score }) => score <= 0.35).sort((a, b) => a.score - b.score).slice(0, 3);
};

export const createProductTools = ({ userId, shopId }) => [
  tool(
    async ({ query }) => {
      const regex = new RegExp(escapeRegex(query), "i");
      const categories = await Category.find({
        shopId,
        isActive: true,
        name: regex,
      })
        .select("_id")
        .limit(20)
        .lean();
      const categoryIds = categories.map((category) => category._id);
      const found = await Product.find({
        shopId,
        isArchived: false,
        $or: [
          { name: regex },
          { sku: regex },
          { barcode: regex },
          ...(categoryIds.length ? [{ categoryId: { $in: categoryIds } }] : []),
        ],
      })
        .select("name sku barcode unit sellingPrice quantity minimumStock")
        .sort({ name: 1 })
        .limit(8)
        .lean();
      if (found.length) return JSON.stringify(found.map(productSummary));
      const queryWords = normalize(query).split(/\s+/).filter((word) => word.length >= 2);
      const fallbackRegex = new RegExp(escapeRegex(queryWords.sort((a, b) => b.length - a.length)[0] || query), "i");
      const candidates = await Product.find({ shopId, isArchived: false, $or: [{ name: fallbackRegex }, { sku: fallbackRegex }, { barcode: fallbackRegex }] })
        .select("name sku barcode unit sellingPrice quantity minimumStock")
        .limit(100)
        .lean();
      return JSON.stringify(fuzzyProductMatches(query, candidates).map(({ product }) => productSummary(product)));
    },
    {
      name: "search_products",
      description:
        "Search this shop's active product catalog by name, SKU, barcode, or category. Use only returned IDs when editing a bill.",
      schema: z.object({ query: z.string().trim().min(1).max(100) }),
    },
  ),
  tool(
    async ({ productId }) => {
      const product = await Product.findOne({
        _id: productId,
        shopId,
        isArchived: false,
      })
        .select(
          "name sku barcode description unit sellingPrice purchasePrice quantity minimumStock categoryId",
        )
        .populate("categoryId", "name")
        .lean();
      if (!product) return "Product not found in this shop.";
      return JSON.stringify({
        ...productSummary(product),
        description: product.description || "",
        purchasePrice: product.purchasePrice ?? null,
        category: product.categoryId?.name || "",
      });
    },
    {
      name: "get_product_details",
      description:
        "Get current details for one active product belonging to this shop.",
      schema: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }),
    },
  ),
  tool(
    async ({ periodDays, limit }) =>
      JSON.stringify(
        await getFrequentlySoldProducts(userId, { periodDays, limit }),
      ),
    {
      name: "get_frequently_sold_products",
      description:
        "Return products sold most often in this shop during a recent period.",
      schema: z.object({
        periodDays: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(20).default(8),
      }),
    },
  ),
];
