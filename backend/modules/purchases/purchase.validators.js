import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");
const page = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), sortOrder: z.enum(["asc", "desc"]).default("desc"), search: z.string().trim().max(120).optional() }).strict();
const envelope = (body = z.object({}).strict(), params = z.object({}).strict(), query = z.object({}).strict()) => z.object({ body, params, query });
const methods = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"];
const discountAmount = z.number().finite().min(0).optional();
const discountPercent = z.number().finite().min(0).max(100).optional();
const purchaseItem = z.object({ productId: objectId, quantity: z.number().finite().positive(), unitPurchasePrice: z.number().finite().min(0), discountAmount, discountPercent, taxRate: z.number().finite().min(0).max(28).optional().default(0) }).strict().superRefine((item, ctx) => {
  if (item.discountAmount !== undefined && item.discountPercent !== undefined) ctx.addIssue({ code: "custom", path: ["discountPercent"], message: "Choose either a discount amount or percentage" });
});
const initialPayment = z.object({ amount: z.number().finite().positive(), paymentMethod: z.enum(methods), paymentDate: z.coerce.date().optional(), transactionReference: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional() }).strict();
export const purchaseCreateSchema = envelope(z.object({ supplierId: objectId, supplierInvoiceNumber: z.string().trim().max(100).optional(), purchaseDate: z.coerce.date(), dueDate: z.coerce.date().optional(), items: z.array(purchaseItem).min(1).max(200), additionalDiscount: discountAmount, additionalDiscountPercent: discountPercent, additionalCharges: z.number().finite().min(0).optional().default(0), initialPayment: initialPayment.optional(), notes: z.string().trim().max(2000).optional(), idempotencyKey: z.string().trim().min(8).max(100).optional() }).strict().superRefine((data, ctx) => {
  if (data.dueDate && data.dueDate < data.purchaseDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date cannot be before purchase date" });
  if (data.additionalDiscount !== undefined && data.additionalDiscountPercent !== undefined) ctx.addIssue({ code: "custom", path: ["additionalDiscountPercent"], message: "Choose either an additional discount amount or percentage" });
}));
export const purchaseIdSchema = envelope(undefined, z.object({ id: objectId }).strict());
export const purchaseListSchema = envelope(undefined, undefined, page.extend({ supplierId: objectId.optional(), paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]).optional(), status: z.enum(["POSTED", "CANCELLED"]).optional(), from: z.string().datetime().optional(), to: z.string().datetime().optional(), sortBy: z.enum(["purchaseDate", "purchaseReference", "grandTotalMinor", "createdAt"]).optional().default("purchaseDate") }));
export const purchaseCancelSchema = envelope(z.object({ reason: z.string().trim().min(1).max(500) }).strict(), z.object({ id: objectId }).strict());
export const paymentCreateSchema = envelope(z.object({ amount: z.number().finite().positive(), paymentMethod: z.enum(methods), paymentDate: z.coerce.date().optional(), transactionReference: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional(), idempotencyKey: z.string().trim().min(8).max(100).optional() }).strict(), z.object({ id: objectId }).strict());
export const paymentListSchema = envelope(undefined, z.object({ id: objectId }).strict(), page);
export const supplierPaymentListSchema = envelope(undefined, undefined, page.extend({ supplierId: objectId.optional(), paymentMethod: z.enum(methods).optional(), from: z.string().datetime().optional(), to: z.string().datetime().optional() }));
export const paymentIdSchema = envelope(undefined, z.object({ id: objectId }).strict());
export const supplierPurchaseListSchema = envelope(undefined, z.object({ id: objectId }).strict(), page.extend({ status: z.enum(["POSTED", "CANCELLED"]).optional(), paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]).optional() }));
