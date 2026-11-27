import { Text, View } from "react-native";
import {
  EmptyResult,
  money,
  quantity,
  ResultRow,
  ToolResultCard,
} from "./ToolResultCard";

export default function SalesToolResult({ name, data }) {
  if (name === "get_today_sales_summary") {
    const summary = data || {};
    return (
      <ToolResultCard
        title="Today's sales"
        subtitle={summary.period}
        icon="chart-box-outline"
      >
        <View className="flex-row flex-wrap gap-2">
          {[
            ["Sales", money(summary.sales)],
            ["Collected", money(summary.amountCollected)],
            ["Bills", quantity(summary.bills)],
            ["Average bill", money(summary.averageBill)],
            ["Credit sales", money(summary.creditSales)],
          ].map(([label, value]) => (
            <View
              key={label}
              className="min-w-[29%] flex-1 rounded-xl bg-background p-2.5"
            >
              <Text className="text-[10px] text-text-secondary">{label}</Text>
              <Text className="mt-1 text-sm font-bold text-text-primary">
                {value}
              </Text>
            </View>
          ))}
        </View>
      </ToolResultCard>
    );
  }

  if (
    name === "get_top_selling_products" ||
    name === "get_frequently_sold_products"
  ) {
    const products = Array.isArray(data) ? data : data?.items || [];
    return (
      <ToolResultCard
        title="Best-selling products"
        subtitle={
          data?.periodDays ? `Last ${data.periodDays} days` : "By quantity sold"
        }
        icon="trending-up"
      >
        {products.length ? (
          products.map((item, index) => (
            <View
              key={`${item.product || item.name}-${index}`}
              className="flex-row items-center gap-3 border-b border-border py-2 last:border-b-0"
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-surface-mint">
                <Text className="text-xs font-bold text-primary">
                  {index + 1}
                </Text>
              </View>
              <Text className="min-w-0 flex-1 text-xs font-semibold text-text-primary">
                {item.product || item.name}
              </Text>
              <View className="items-end">
                <Text className="text-xs font-bold text-text-primary">
                  {quantity(item.quantity ?? item.soldQuantity, item.unit)}
                </Text>
                {item.sales !== undefined ? (
                  <Text className="text-[10px] text-text-secondary">
                    {money(item.sales)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <EmptyResult label="No sales in this period." />
        )}
      </ToolResultCard>
    );
  }

  const sales = Array.isArray(data) ? data : [];
  return (
    <ToolResultCard
      title="Recent sales"
      subtitle={`${sales.length} bills`}
      icon="receipt-text-outline"
    >
      {sales.length ? (
        sales.map((sale, index) => (
          <View
            key={`${sale.saleNumber}-${index}`}
            className="border-b border-border last:border-b-0"
          >
            <ResultRow
              label={`${sale.saleNumber}${sale.customerName ? ` · ${sale.customerName}` : ""}`}
              value={money(sale.total)}
              emphasis
            />
            <View className="flex-row justify-between pb-2">
              <Text className="text-[10px] text-text-secondary">
                {sale.paymentMethod || ""} ·{" "}
                {sale.createdAt
                  ? new Date(sale.createdAt).toLocaleString()
                  : ""}
              </Text>
              {sale.balanceDue > 0 ? (
                <Text className="text-[10px] font-semibold text-[#B45309]">
                  Due {money(sale.balanceDue)}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <EmptyResult label="No recent sales found." />
      )}
    </ToolResultCard>
  );
}
