import { Text, View } from "react-native";
import {
  EmptyResult,
  money,
  ResultRow,
  ToolResultCard,
} from "./ToolResultCard";

export default function CustomerToolResult({ name, data }) {
  const customers = Array.isArray(data) ? data : data ? [data] : [];
  const title =
    name === "search_customers"
      ? "Customer matches"
      : name === "get_customer_purchase_history"
        ? "Customer purchase history"
        : name === "get_customer_outstanding"
          ? "Outstanding balance"
          : "Customer details";
  return (
    <ToolResultCard
      title={title}
      subtitle={`${customers.length} ${customers.length === 1 ? "record" : "records"}`}
      icon="account-outline"
    >
      {customers.length ? (
        customers.map((customer, index) => (
          <View
            key={`${customer.id || customer.name}-${index}`}
            className="border-b border-border last:border-b-0"
          >
            <ResultRow
              label={customer.name || "Customer"}
              value={money(customer.outstandingBalance)}
              emphasis
            />
            {customer.phone ? (
              <Text className="pb-2 text-[10px] text-text-secondary">
                {customer.phone}
              </Text>
            ) : null}
            {Array.isArray(customer.recentPurchases)
              ? customer.recentPurchases.map((purchase, rowIndex) => (
                  <View
                    key={`${purchase.saleNumber}-${rowIndex}`}
                    className="flex-row justify-between border-t border-border py-2"
                  >
                    <View>
                      <Text className="text-xs font-semibold text-text-primary">
                        {purchase.saleNumber}
                      </Text>
                      <Text className="text-[10px] text-text-secondary">
                        {purchase.paymentMethod} ·{" "}
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-semibold text-text-primary">
                        {money(purchase.total)}
                      </Text>
                      {purchase.balanceDue > 0 ? (
                        <Text className="text-[10px] text-[#B45309]">
                          Due {money(purchase.balanceDue)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              : null}
          </View>
        ))
      ) : (
        <EmptyResult label="No matching customer records." />
      )}
    </ToolResultCard>
  );
}
