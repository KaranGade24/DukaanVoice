import test from "node:test";
import assert from "node:assert/strict";
import {
  saleCreateSchema,
  saleListSchema,
  saleSummarySchema,
} from "../modules/sales/sale.validators.js";

const productId = "507f1f77bcf86cd799439011";
const valid = {
  body: {
    items: [{ productId, quantity: 2 }],
    discount: 0,
    amountReceived: 20,
    paymentMethod: "CASH",
  },
  params: {},
  query: {},
};

test("sale request accepts a valid shop product line and supported tender", () => {
  assert.equal(saleCreateSchema.safeParse(valid).success, true);
  assert.equal(
    saleCreateSchema.safeParse({
      ...valid,
      body: { ...valid.body, amountReceived: 0, paymentMethod: "UDHAR" },
    }).success,
    true,
  );
});

test("sale request rejects empty lines, unsupported tenders, and unknown fields", () => {
  assert.equal(
    saleCreateSchema.safeParse({ ...valid, body: { ...valid.body, items: [] } })
      .success,
    false,
  );
  assert.equal(
    saleCreateSchema.safeParse({
      ...valid,
      body: { ...valid.body, paymentMethod: "CREDIT" },
    }).success,
    false,
  );
  assert.equal(
    saleCreateSchema.safeParse({
      ...valid,
      body: { ...valid.body, extra: true },
    }).success,
    false,
  );
});

test("sale request rejects non-positive or invalid product quantities", () => {
  assert.equal(
    saleCreateSchema.safeParse({
      ...valid,
      body: { ...valid.body, items: [{ productId, quantity: 0 }] },
    }).success,
    false,
  );
  assert.equal(
    saleCreateSchema.safeParse({
      ...valid,
      body: { ...valid.body, items: [{ productId, quantity: 0.0000001 }] },
    }).success,
    false,
  );
  assert.equal(
    saleCreateSchema.safeParse({
      ...valid,
      body: { ...valid.body, items: [{ productId: "invalid", quantity: 1 }] },
    }).success,
    false,
  );
});

test("sales history query validates filters and applies pagination defaults", () => {
  const parsed = saleListSchema.safeParse({
    body: {},
    params: {},
    query: {
      from: "2026-01-01",
      to: "2026-01-31",
      page: "2",
      paymentMethod: "UPI",
      search: "  rice  ",
    },
  });
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data.query, {
    from: "2026-01-01",
    to: "2026-01-31",
    page: 2,
    limit: 20,
    search: "rice",
    paymentMethod: "UPI",
  });
  assert.equal(
    saleListSchema.safeParse({
      body: {},
      params: {},
      query: { paymentMethod: "CREDIT" },
    }).success,
    false,
  );
  assert.equal(
    saleListSchema.safeParse({ body: {}, params: {}, query: { limit: "101" } })
      .success,
    false,
  );
});

test("sales report and history reject malformed or excessively wide date ranges", () => {
  for (const schema of [saleListSchema, saleSummarySchema]) {
    assert.equal(
      schema.safeParse({ body: {}, params: {}, query: { from: "2026-02-30" } })
        .success,
      false,
    );
    assert.equal(
      schema.safeParse({
        body: {},
        params: {},
        query: { from: "2026-02-02", to: "2026-02-01" },
      }).success,
      false,
    );
    assert.equal(
      schema.safeParse({
        body: {},
        params: {},
        query: { from: "2025-01-01", to: "2026-01-03" },
      }).success,
      false,
    );
  }
});
