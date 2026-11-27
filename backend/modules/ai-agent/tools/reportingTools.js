import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Sale from "../../../models/Sale.js";
import { getSalesSummary, listSales } from "../../sales/sale.service.js";

const utcDate = (date) => date.toISOString().slice(0, 10);

export const createReportingTools = ({ userId, shopId }) => [
  tool(
    async () => {
      const today = utcDate(new Date());
      const summary = await getSalesSummary(userId, { from: today, to: today });
      return JSON.stringify({
        period: summary.period,
        sales: summary.salesTotal,
        amountCollected: summary.amountCollected,
        bills: summary.billCount,
        averageBill: summary.averageBill,
        creditSales: summary.creditSales,
      });
    },
    {
      name: "get_today_sales_summary",
      description:
        "Get a server-calculated summary of today's persisted sales for this shop.",
      schema: z.object({}),
    },
  ),
  tool(
    async ({ limit }) => {
      const result = await listSales(userId, {
        page: 1,
        limit,
        from: "2000-01-01",
        to: utcDate(new Date()),
      });
      return JSON.stringify(
        result.items.map((item) => ({
          saleNumber: item.saleNumber,
          total: item.total,
          paymentMethod: item.paymentMethod,
          createdAt: item.createdAt,
          customerName: item.customerName,
        })),
      );
    },
    {
      name: "get_recent_sales",
      description: "Get recent persisted sale summaries for this shop.",
      schema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
    },
  ),
  tool(
    async ({ periodDays, limit }) => {
      const since = new Date(Date.now() - periodDays * 86_400_000);
      const items = await Sale.aggregate([
        { $match: { shopId, createdAt: { $gte: since } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            product: { $first: "$items.productName" },
            quantity: { $sum: "$items.quantity" },
            salesMinor: { $sum: "$items.lineTotalMinor" },
          },
        },
        { $sort: { quantity: -1, salesMinor: -1, _id: 1 } },
        { $limit: limit },
      ]);
      return JSON.stringify(
        items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          sales: item.salesMinor / 100,
        })),
      );
    },
    {
      name: "get_top_selling_products",
      description:
        "Get top-selling products from complete persisted sale line items over a recent period.",
      schema: z.object({
        periodDays: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(20).default(5),
      }),
    },
  ),
];
