import { Text, View } from "react-native";
import {
  EmptyResult,
  quantity,
  ResultRow,
  ToolResultCard,
} from "./ToolResultCard";

const typeNames = {
  SALE: "Sale",
  PURCHASE: "Purchase",
  STOCK_IN: "Stock in",
  STOCK_OUT: "Stock out",
  STOCK_ADJUSTMENT: "Adjustment",
  OPENING_STOCK: "Opening stock",
};

export default function InventoryToolResult({ name, data }) {
  if (name === "get_stock_movement_history") {
    const entries = Array.isArray(data) ? data : [];
    const grouped = entries.reduce((result, item) => {
      const key = item.product || "Product";
      (result[key] ||= []).push(item);
      return result;
    }, {});
    if (!entries.length)
      return (
        <ToolResultCard title="Stock movement history" icon="history">
          <EmptyResult label="No stock movements found." />
        </ToolResultCard>
      );
    return Object.entries(grouped).map(([product, items]) => (
      <ToolResultCard
        key={product}
        title={product}
        subtitle={`${items.length} recent movements`}
        icon="history"
      >
        <View className="overflow-hidden rounded-xl border border-border">
          {items.map((item, index) => {
            const change = Number(item.changedQuantity || 0);
            return (
              <View
                key={`${item.date}-${index}`}
                className={`flex-row items-center gap-2.5 px-3 py-2.5 ${index < items.length - 1 ? "border-b border-border" : ""}`}
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${change >= 0 ? "bg-surface-mint" : "bg-[#FFF1F0]"}`}
                >
                  <Text
                    className={`text-sm font-bold ${change >= 0 ? "text-primary" : "text-[#DC2626]"}`}
                  >
                    {change > 0 ? "+" : ""}
                    {quantity(change)}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-xs font-semibold text-text-primary">
                    {typeNames[item.type] ||
                      String(item.type || "Movement").replaceAll("_", " ")}
                  </Text>
                  <Text className="text-[10px] text-text-secondary">
                    {new Date(item.date).toLocaleString()}
                  </Text>
                </View>
                <View className="items-end border-l border-border pl-2.5">
                  <Text className="text-[10px] text-text-secondary">
                    In stock
                  </Text>
                  <Text className="text-xs font-semibold text-text-primary">
                    {quantity(item.newQuantity)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ToolResultCard>
    ));
  }

  const products = Array.isArray(data) ? data : [];
  const lowStock = name === "get_low_stock_products";
  return (
    <ToolResultCard
      title={lowStock ? "Low stock" : "Current stock"}
      subtitle={`${products.length} ${products.length === 1 ? "product" : "products"}`}
      icon={lowStock ? "alert-outline" : "package-variant-closed-check"}
    >
      {products.length ? (
        products.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            className="border-b border-border last:border-b-0"
          >
            <ResultRow
              label={item.name}
              value={quantity(item.quantity, item.unit)}
              emphasis={lowStock}
            />
            {lowStock ? (
              <Text className="-mt-1 pb-2 text-[10px] text-text-secondary">
                Minimum: {quantity(item.minimumStock, item.unit)}
              </Text>
            ) : null}
          </View>
        ))
      ) : (
        <EmptyResult
          label={
            lowStock ? "No low-stock products." : "No matching products found."
          }
        />
      )}
    </ToolResultCard>
  );
}
