import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid conversation ID");

const draftSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: id,
            quantity: z.number().finite().positive().max(1_000_000_000),
          })
          .strict(),
      )
      .max(100),
    discount: z.number().finite().min(0).max(1_000_000_000),
    paymentMethod: z.enum(["CASH", "UPI", "CARD", "UDHAR"]),
    amountReceived: z.number().finite().min(0).max(1_000_000_000),
    customerId: id.optional(),
  })
  .strict();

export const chatSchema = z.object({
  body: z
    .object({
      conversationId: id.optional(),
      message: z.string().trim().min(1).max(4000),
      responseLanguage: z.enum(["en", "hi", "mr"]).optional(),
      draft: draftSchema.optional(),
    })
    .strict(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const conversationSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({ id }).strict(),
  query: z.object({}).strict(),
});

export const confirmSchema = z.object({
  body: z
    .object({
      conversationId: id,
      confirmationToken: z.string().min(32).max(128),
    })
    .strict(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateDraftSchema = z.object({
  body: z.object({ draft: draftSchema }).strict(),
  params: z.object({ id }).strict(),
  query: z.object({}).strict(),
});

export const cancelSchema = z.object({
  body: z.object({ conversationId: id }).strict(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});
