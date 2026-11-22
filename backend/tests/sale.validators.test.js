import test from "node:test";
import assert from "node:assert/strict";
import { saleCreateSchema } from "../modules/sales/sale.validators.js";

const productId = "507f1f77bcf86cd799439011";
const valid = {
  body: { items: [{ productId, quantity: 2 }], discount: 0, amountReceived: 20, paymentMethod: "CASH" },
  params: {}, query: {},
};

test("sale request accepts a valid shop product line and supported tender", () => {
  assert.equal(saleCreateSchema.safeParse(valid).success, true);
});

test("sale request rejects empty lines, unsupported tenders, and unknown fields", () => {
  assert.equal(saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, items: [] } }).success, false);
  assert.equal(saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, paymentMethod: "CREDIT" } }).success, false);
  assert.equal(saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, extra: true } }).success, false);
});

test("sale request rejects non-positive or invalid product quantities", () => {
  assert.equal(saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, items: [{ productId, quantity: 0 }] } }).success, false);
  assert.equal(saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, items: [{ productId, quantity: 0.0000001 }] } }).success, false);
  assert.equal(saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, items: [{ productId: "invalid", quantity: 1 }] } }).success, false);
});
