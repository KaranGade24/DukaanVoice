import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);

const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

const unicodeName = z.string().trim().min(2).max(160);

export const signupSchema = z.object({
  body: z
    .object({
      fullName: unicodeName.max(120),
      email,
      password,
      shopName: unicodeName,
      businessType: z.enum([
        "grocery",
        "dairy_bakery",
        "pharmacy",
        "wholesale",
      ]),
      city: unicodeName.max(120),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1).max(128) }).strict(),
  params: z.object({}),
  query: z.object({}),
});
