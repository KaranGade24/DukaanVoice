import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");
const money = z.number().finite().min(0).max(1_000_000_000).refine((value) => Number.isInteger(value * 100), "Amount supports at most two decimal places");
const quantity = z.number().finite().min(0).max(1_000_000_000).refine((value) => Number.isInteger(value * 1_000_000), "Quantity supports at most six decimal places");
const optionalText = (max) => z.string().trim().max(max).optional().default("");

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().trim().max(40).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().trim().max(120).optional().default(""),
});

const envelope = (
  body = z.object({}).strict(),
  params = z.object({}).strict(),
  query = z.object({}).strict(),
) => z.object({ body, params, query });

export const categoryCreateSchema = envelope(
  z
    .object({
      name: z.string().trim().min(1).max(80),
      description: optionalText(300),
      image: optionalText(2048),
      icon: optionalText(80),
    })
    .strict(),
);

export const categoryListSchema = envelope(
  undefined,
  undefined,
  pageQuery.extend({
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z
      .enum(["name", "createdAt", "updatedAt", "productCount"])
      .optional()
      .default("createdAt"),
  }),
);

export const categoryIdSchema = envelope(
  undefined,
  z.object({ id: objectId }).strict(),
);

export const categoryUpdateSchema = envelope(
  z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      description: z.string().trim().max(300).optional(),
      image: z.string().trim().max(2048).optional(),
      icon: z.string().trim().max(80).optional(),
    })
    .strict()
    .refine(
      (value) => Object.keys(value).length > 0,
      "At least one field is required",
    ),
  z.object({ id: objectId }).strict(),
);

export const statusSchema = envelope(
  z.object({ isActive: z.boolean() }).strict(),
  z.object({ id: objectId }).strict(),
);

export const productCreateSchema = envelope(
  z
    .object({
      categoryId: objectId,
      name: z.string().trim().min(1).max(160),
      description: optionalText(1000),
      sku: optionalText(64),
      barcode: optionalText(80),
      purchasePrice: money.optional(),
      sellingPrice: money,
      quantity: quantity.default(0),
      unit: z.string().trim().min(1).max(24),
      minimumStock: quantity.default(5),
      image: z.string().trim().max(2048).optional(),
      imageUrl: z.string().trim().max(2048).optional(),
    })
    .strict()
    .refine(
      (data) => !(data.image && data.imageUrl),
      "Use either image or imageUrl",
    ),
);

export const productUpdateSchema = envelope(
  z
    .object({
      categoryId: objectId.optional(),
      name: z.string().trim().min(1).max(160).optional(),
      description: z.string().trim().max(1000).optional(),
      sku: z.string().trim().max(64).optional(),
      barcode: z.string().trim().max(80).optional(),
      purchasePrice: money.optional(),
      sellingPrice: money.optional(),
      unit: z.string().trim().min(1).max(24).optional(),
      minimumStock: quantity.optional(),
      image: z.string().trim().max(2048).optional(),
      imageUrl: z.string().trim().max(2048).optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required",
    )
    .refine(
      (data) => !(data.image && data.imageUrl),
      "Use either image or imageUrl",
    ),
  z.object({ id: objectId }).strict(),
);

export const productListSchema = envelope(
  undefined,
  undefined,
  pageQuery.extend({
    categoryId: objectId.optional(),
    stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
    sortBy: z
      .enum([
        "name",
        "sku",
        "quantity",
        "sellingPrice",
        "purchasePrice",
        "createdAt",
        "updatedAt",
      ])
      .optional()
      .default("createdAt"),
    isActive: z.enum(["true", "false"]).optional(),
  }),
);

export const productIdSchema = envelope(
  undefined,
  z.object({ id: objectId }).strict(),
);

const stockBase = {
  productId: objectId,
  reason: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
};

export const stockInSchema = envelope(
  z
    .object({
      ...stockBase,
      quantity: z.number().finite().positive(),
      purchaseCost: z.number().finite().min(0).optional(),
    })
    .strict(),
);

export const stockOutSchema = envelope(
  z
    .object({
      ...stockBase,
      quantity: z.number().finite().positive(),
      reason: z.string().trim().min(1).max(120),
    })
    .strict(),
);

export const stockAdjustSchema = envelope(
  z
    .object({
      ...stockBase,
      newQuantity: z.number().finite().min(0),
      reason: z.string().trim().min(1).max(120),
    })
    .strict(),
);

export const historyListSchema = envelope(
  undefined,
  undefined,
  pageQuery.extend({
    productId: objectId.optional(),
    type: z
      .enum([
        "OPENING_STOCK",
        "STOCK_IN",
        "STOCK_OUT",
        "STOCK_ADJUSTMENT",
        "PURCHASE",
        "SALE",
        "RETURN",
        "DAMAGE",
        "EXPIRED",
      ])
      .optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
);

export const historyProductSchema = envelope(
  undefined,
  z.object({ productId: objectId }).strict(),
  pageQuery.extend({
    type: z
      .enum([
        "OPENING_STOCK",
        "STOCK_IN",
        "STOCK_OUT",
        "STOCK_ADJUSTMENT",
        "PURCHASE",
        "SALE",
        "RETURN",
        "DAMAGE",
        "EXPIRED",
      ])
      .optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
);

export const alertsSchema = envelope(
  undefined,
  undefined,
  z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict(),
);
