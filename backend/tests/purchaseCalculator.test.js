import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePurchase,
  toMinorUnits,
  toQuantityMicros,
  minorToAmount,
} from "../utils/purchaseCalculator.js";

const id = (digit) => digit.repeat(24);

test("calculates the Phase 4 example using paise totals", () => {
  const result = calculatePurchase({
    items: [
      {
        productId: id("1"),
        quantity: 50,
        unitPurchasePrice: 80,
        discountAmount: 200,
        taxRate: 0,
      },
      {
        productId: id("2"),
        quantity: 30,
        unitPurchasePrice: 40,
        discountAmount: 0,
        taxRate: 0,
      },
      {
        productId: id("3"),
        quantity: 20,
        unitPurchasePrice: 150,
        discountAmount: 0,
        taxRate: 0,
      },
    ],
    additionalCharges: 100,
  });
  assert.equal(result.subtotalMinor, 820000);
  assert.equal(result.itemDiscountTotalMinor, 20000);
  assert.equal(result.grandTotalMinor, 810000);
  assert.equal(minorToAmount(result.grandTotalMinor), 8100);
});

test("allocates purchase discount before exclusive tax and rounds in paise", () => {
  const result = calculatePurchase({
    items: [
      {
        productId: id("1"),
        quantity: 1,
        unitPurchasePrice: 10,
        discountAmount: 1,
        taxRate: 18,
      },
    ],
    additionalDiscount: 1,
  });
  assert.equal(result.taxableAmountMinor, 800);
  assert.equal(result.taxAmountMinor, 144);
  assert.equal(result.grandTotalMinor, 944);
});

test("consolidates duplicate product lines when prices and tax match", () => {
  const result = calculatePurchase({
    items: [
      { productId: id("1"), quantity: 1.25, unitPurchasePrice: 2, taxRate: 5 },
      { productId: id("1"), quantity: 0.75, unitPurchasePrice: 2, taxRate: 5 },
    ],
  });
  assert.equal(result.lines.length, 1);
  assert.equal(result.lines[0].quantity, 2);
  assert.equal(result.subtotalMinor, 400);
});

test("rejects excess discounts, incompatible duplicate lines, and excess quantity precision", () => {
  assert.throws(
    () =>
      calculatePurchase({
        items: [
          {
            productId: id("1"),
            quantity: 1,
            unitPurchasePrice: 1,
            discountAmount: 2,
          },
        ],
      }),
    /discount cannot exceed/,
  );
  assert.throws(
    () =>
      calculatePurchase({
        items: [
          { productId: id("1"), quantity: 1, unitPurchasePrice: 1 },
          { productId: id("1"), quantity: 1, unitPurchasePrice: 2 },
        ],
      }),
    /same unit price and tax rate/,
  );
  assert.throws(() => toQuantityMicros(0.0000001), /six decimal places/);
  assert.equal(toMinorUnits(1.005), 101);
});
