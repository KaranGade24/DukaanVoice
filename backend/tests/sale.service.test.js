import test from "node:test";
import assert from "node:assert/strict";
import Sale from "../models/Sale.js";
import Shop from "../models/Shop.js";
import { recordCreditPayment } from "../modules/sales/sale.service.js";

test("records a credit payment using legacy total as the missing balance due", async () => {
  const originalFindShop = Shop.findOne;
  const originalFindSale = Sale.findOneAndUpdate;
  const shopId = "shop-id";
  const userId = "user-id";
  let updateArguments;
  Shop.findOne = () => ({
    select: () => ({ lean: async () => ({ _id: shopId }) }),
  });
  Sale.findOneAndUpdate = (...args) => {
    updateArguments = args;
    return {
      lean: async () => ({
        _id: { toString: () => "sale-id" },
        saleNumber: "SAL-1",
        balanceDueMinor: 0,
        creditPayments: [
          {
            amountMinor: 2500,
            receivedAt: new Date("2026-11-23T00:00:00.000Z"),
          },
        ],
      }),
    };
  };

  try {
    const result = await recordCreditPayment(userId, "sale-id", 25);
    const [filter, update, options] = updateArguments;
    assert.deepEqual(filter.$expr, {
      $gte: [{ $ifNull: ["$balanceDueMinor", "$totalMinor"] }, 2500],
    });
    assert.deepEqual(update[0].$set.balanceDueMinor, {
      $subtract: [{ $ifNull: ["$balanceDueMinor", "$totalMinor"] }, 2500],
    });
    assert.deepEqual(update[0].$set.creditPayments.$concatArrays[0], {
      $ifNull: ["$creditPayments", []],
    });
    assert.equal(options.returnDocument, "after");
    assert.equal(options.updatePipeline, true);
    assert.equal(result.balanceDue, 0);
  } finally {
    Shop.findOne = originalFindShop;
    Sale.findOneAndUpdate = originalFindSale;
  }
});
