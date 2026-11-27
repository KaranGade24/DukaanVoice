import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getCustomerDetails,
  listCustomers,
} from "../../customers/customer.service.js";

export const createCustomerTools = ({ userId }) => [
  tool(
    async ({ query }) => {
      const result = await listCustomers(userId, {
        search: query,
        page: 1,
        limit: 8,
      });
      return JSON.stringify(
        result.items.map(({ id, name, phone, outstandingBalance }) => ({
          id,
          name,
          phone,
          outstandingBalance,
        })),
      );
    },
    {
      name: "search_customers",
      description:
        "Search this shop's customer directory by name or phone. Use only returned records.",
      schema: z.object({ query: z.string().trim().min(1).max(100) }),
    },
  ),
  tool(
    async ({ customerId }) => {
      const customer = await getCustomerDetails(userId, customerId);
      return JSON.stringify({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        outstandingBalance: customer.outstandingBalance,
      });
    },
    {
      name: "get_customer_details",
      description:
        "Get details for one customer belonging to the authenticated shop.",
      schema: z.object({ customerId: z.string().regex(/^[a-f\d]{24}$/i) }),
    },
  ),
  tool(
    async ({ customerId }) => {
      const customer = await getCustomerDetails(userId, customerId);
      return JSON.stringify({
        name: customer.name,
        outstandingBalance: customer.outstandingBalance,
      });
    },
    {
      name: "get_customer_outstanding",
      description:
        "Get the current outstanding credit balance for a shop customer.",
      schema: z.object({ customerId: z.string().regex(/^[a-f\d]{24}$/i) }),
    },
  ),
  tool(
    async ({ customerId }) => {
      const customer = await getCustomerDetails(userId, customerId);
      return JSON.stringify({
        name: customer.name,
        recentPurchases: customer.recentPurchases,
      });
    },
    {
      name: "get_customer_purchase_history",
      description:
        "Get up to ten recent purchase summaries for a shop customer.",
      schema: z.object({ customerId: z.string().regex(/^[a-f\d]{24}$/i) }),
    },
  ),
];
