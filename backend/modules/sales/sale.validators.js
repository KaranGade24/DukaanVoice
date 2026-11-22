import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");
export const saleCreateSchema = z.object({
  body: z.object({
    items: z.array(z.object({ productId: id, quantity: z.number().finite().positive().max(1_000_000_000).refine((value) => Number.isInteger(value * 1_000_000), "Quantity supports at most six decimal places") }).strict()).min(1).max(100),
    discount: z.number().finite().min(0).max(1_000_000_000).default(0),
    amountReceived: z.number().finite().min(0).max(1_000_000_000),
    paymentMethod: z.enum(["CASH", "UPI", "CARD"]),
  }).strict(),
  params: z.object({}).strict(), query: z.object({}).strict(),
});
