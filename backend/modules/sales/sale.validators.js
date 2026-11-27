import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Enter a valid calendar date");

const dateRange = {
  from: date.optional(),
  to: date.optional(),
};

const validateRange = (value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({
      code: "custom",
      path: ["from"],
      message: "From date must be on or before to date",
    });
  }
  if (
    value.from &&
    value.to &&
    (new Date(`${value.to}T00:00:00.000Z`) -
      new Date(`${value.from}T00:00:00.000Z`)) /
      86_400_000 >
      366
  ) {
    context.addIssue({
      code: "custom",
      path: ["to"],
      message: "Date range cannot exceed 367 days",
    });
  }
};

export const saleListSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: z
    .object({
      ...dateRange,
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().trim().max(100).default(""),
      paymentMethod: z.enum(["CASH", "UPI", "CARD", "UDHAR"]).optional(),
    })
    .strict()
    .superRefine(validateRange),
});

export const saleSummarySchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: z.object(dateRange).strict().superRefine(validateRange),
});

export const frequentlySoldSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({}).strict(),
  query: z
    .object({
      periodDays: z.coerce.number().int().min(1).max(365).default(30),
      limit: z.coerce.number().int().min(1).max(50).default(8),
    })
    .strict(),
});

export const saleCreateSchema = z.object({
  body: z
    .object({
      items: z
        .array(
          z
            .object({
              productId: id,
              quantity: z
                .number()
                .finite()
                .positive()
                .max(1_000_000_000)
                .refine(
                  (value) => Number.isInteger(value * 1_000_000),
                  "Quantity supports at most six decimal places",
                ),
            })
            .strict(),
        )
        .min(1)
        .max(100),
      discount: z.number().finite().min(0).max(1_000_000_000).default(0),
      amountReceived: z.number().finite().min(0).max(1_000_000_000),
      paymentMethod: z.enum(["CASH", "UPI", "CARD", "UDHAR"]),
      customerId: id.optional(),
    })
    .strict(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const creditPaymentSchema = z.object({
  body: z
    .object({
      amount: z
        .number()
        .finite()
        .positive()
        .max(1_000_000_000)
        .refine(
          (value) => Number.isInteger(value * 100),
          "Amount supports at most two decimal places",
        ),
    })
    .strict(),
  params: z.object({ saleId: id }).strict(),
  query: z.object({}).strict(),
});

export const saleIdSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({ saleId: id }).strict(),
  query: z.object({}).strict(),
});
