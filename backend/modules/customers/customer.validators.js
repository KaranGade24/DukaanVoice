import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid customer ID");
export const customerListSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: z
    .object({
      search: z.string().trim().max(100).default(""),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict(),
});
export const customerCreateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(120),
      phone: z.string().trim().max(30).optional().default(""),
    })
    .strict(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});
export const customerIdSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({ customerId: id }).strict(),
  query: z.object({}).strict(),
});
