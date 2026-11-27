import { View } from "react-native";
import CustomerToolResult from "./CustomerToolResult";
import InventoryToolResult from "./InventoryToolResult";
import ProductToolResult from "./ProductToolResult";
import SalesToolResult from "./SalesToolResult";
import { ResultRow, ToolResultCard } from "./ToolResultCard";

const inventoryTools = new Set([
  "get_current_stock",
  "get_low_stock_products",
  "get_stock_movement_history",
]);
const productTools = new Set(["search_products", "get_product_details"]);
const customerTools = new Set([
  "search_customers",
  "get_customer_details",
  "get_customer_outstanding",
  "get_customer_purchase_history",
]);
const salesTools = new Set([
  "get_today_sales_summary",
  "get_recent_sales",
  "get_top_selling_products",
  "get_frequently_sold_products",
]);
const billingTools = new Set([
  "create_billing_draft",
  "add_product_to_cart",
  "update_cart_quantity",
  "remove_product_from_cart",
  "clear_cart",
  "apply_cart_discount",
  "select_billing_customer",
  "calculate_billing_preview",
  "set_billing_payment_details",
  "get_billing_draft",
  "complete_sale",
]);

const titleFor = (name) =>
  name.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());

function GenericToolResult({ name, data }) {
  const entries = Object.entries(
    data && typeof data === "object" ? data : { result: data },
  ).filter(
    ([key, value]) =>
      key !== "id" && value !== null && typeof value !== "object",
  );
  return (
    <ToolResultCard title={titleFor(name)} icon="information-outline">
      {entries.map(([key, value]) => (
        <ResultRow key={key} label={titleFor(key)} value={String(value)} />
      ))}
    </ToolResultCard>
  );
}

export default function ToolResultRenderer({ results = [] }) {
  if (!Array.isArray(results) || !results.length) return null;
  return (
    <View className="w-full">
      {results.map(({ name, data }, index) => {
        if (inventoryTools.has(name))
          return (
            <InventoryToolResult
              key={`${name}-${index}`}
              name={name}
              data={data}
            />
          );
        if (productTools.has(name))
          return (
            <ProductToolResult
              key={`${name}-${index}`}
              name={name}
              data={data}
            />
          );
        if (customerTools.has(name))
          return (
            <CustomerToolResult
              key={`${name}-${index}`}
              name={name}
              data={data}
            />
          );
        if (salesTools.has(name))
          return (
            <SalesToolResult key={`${name}-${index}`} name={name} data={data} />
          );
        // Billing tools are represented by the existing editable bill component.
        if (billingTools.has(name)) return null;
        return (
          <GenericToolResult key={`${name}-${index}`} name={name} data={data} />
        );
      })}
    </View>
  );
}
