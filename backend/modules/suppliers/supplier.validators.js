import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");
const phone = z.string().trim().min(7).max(24).regex(/^\+?[\d ()-]+$/);
const optionalPhone = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? undefined : value),
  phone.optional(),
);
const address = z.object({ street: z.string().trim().max(200).optional(), city: z.string().trim().max(120).optional(), state: z.string().trim().max(120).optional(), pincode: z.string().trim().max(12).optional(), country: z.string().trim().max(80).optional() }).strict().optional();
const fields = { supplierName: z.string().trim().min(1).max(160), contactPerson: z.string().trim().max(120).optional(), phoneNumber: phone, alternatePhone: optionalPhone, email: z.string().trim().email().max(254).optional().or(z.literal("")), businessName: z.string().trim().max(160).optional(), gstNumber: z.string().trim().max(15).optional(), address, notes: z.string().trim().max(1000).optional() };
const page = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), sortOrder: z.enum(["asc", "desc"]).default("desc"), search: z.string().trim().max(120).optional() }).strict();
const envelope = (body = z.object({}).strict(), params = z.object({}).strict(), query = z.object({}).strict()) => z.object({ body, params, query });
export const supplierCreateSchema = envelope(z.object(fields).strict());
export const supplierUpdateSchema = envelope(z.object({ ...fields, isActive: z.boolean().optional() }).partial().strict().refine((data) => Object.keys(data).length > 0), z.object({ id: objectId }).strict());
export const supplierIdSchema = envelope(undefined, z.object({ id: objectId }).strict());
export const supplierOutstandingSchema = envelope(undefined, z.object({ id: objectId }).strict(), page);
export const supplierListSchema = envelope(undefined, undefined, page.extend({ isActive: z.enum(["true", "false", "all"]).optional().default("true"), sortBy: z.enum(["supplierName", "createdAt", "updatedAt", "purchaseCount", "totalPurchases", "outstandingBalance"]).optional().default("supplierName") }));
