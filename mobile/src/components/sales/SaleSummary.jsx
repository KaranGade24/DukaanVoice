import { Text, View } from "react-native";

const money = (value) => `\u20B9${Number(value || 0).toFixed(2)}`;

export default function SaleSummary({
  sale,
  t,
  showStatus = false,
  showCreditPayments = false,
}) {
  if (!sale) return null;

  return (
    <View className="gap-2 py-1">
      {sale.shop?.name ? (
        <Text className="text-lg font-semibold leading-6 text-text-primary">
          {sale.shop.name}
        </Text>
      ) : null}
      {sale.shop?.city ? (
        <Text className="text-xs leading-4.25 text-text-secondary">
          {sale.shop.city}
        </Text>
      ) : null}
      <Text className="text-[15px] font-semibold leading-5.25 text-primary">
        {sale.saleNumber}
      </Text>
      {sale.createdAt ? (
        <Text className="text-xs leading-4.25 text-text-secondary">
          {new Date(sale.createdAt).toLocaleString()}
        </Text>
      ) : null}
      <Text className="text-xs leading-4.25 text-text-secondary">
        {sale.customer?.name
          ? `${t("pos.customer")}: ${sale.customer.name}${sale.customer.phone ? ` · ${sale.customer.phone}` : ""}`
          : t("pos.walkIn")}
      </Text>
      {showStatus ? (
        <Text className="text-xs leading-4.25 text-text-secondary">
          {t("salesHistory.status")}:{" "}
          {sale.status === "COMPLETED" || !sale.status
            ? t("salesHistory.completed")
            : sale.status}
        </Text>
      ) : null}
      {(sale.items || []).map((item, index) => {
        const unitPrice =
          item.unitPriceMinor != null
            ? Number(item.unitPriceMinor) / 100
            : item.unitPrice;
        const lineTotal =
          item.lineTotalMinor != null
            ? Number(item.lineTotalMinor) / 100
            : item.lineTotal;
        return (
          <View
            key={`${item.productId}-${index}`}
            className="flex-row items-center justify-between gap-2.5 py-1.25"
          >
            <View className="flex-1 gap-0.75">
              <Text className="text-sm leading-5 text-text-primary">
                {item.productName || item.name}
              </Text>
              <Text className="text-xs leading-4.25 text-text-secondary">
                {item.quantity} {item.unit} × {money(unitPrice)}
              </Text>
            </View>
            <Text className="text-[15px] font-semibold leading-5.25 text-text-primary">
              {money(lineTotal)}
            </Text>
          </View>
        );
      })}
      <View className="flex-row items-center justify-between gap-2.5 py-1.25">
        <Text className="text-xs leading-4.25 text-text-secondary">
          {t("pos.subtotal")}
        </Text>
        <Text className="text-xs leading-4.25 text-text-secondary">
          {money(sale.subtotal)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between gap-2.5 py-1.25">
        <Text className="text-xs leading-4.25 text-text-secondary">
          {t("pos.discount")}
        </Text>
        <Text className="text-xs leading-4.25 text-text-secondary">
          −{money(sale.discount)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between gap-2.5 py-1.25">
        <Text className="text-[15px] font-semibold leading-5.25 text-text-primary">
          {t("pos.total")}
        </Text>
        <Text className="text-lg font-semibold leading-6 text-primary">
          {money(sale.total)}
        </Text>
      </View>
      <Text className="text-xs leading-4.25 text-text-secondary">
        {t("pos.paymentMethod")}: {t(`pos.methods.${sale.paymentMethod}`)}
      </Text>
      <Text className="text-xs leading-4.25 text-text-secondary">
        {t("pos.amountReceived")}: {money(sale.amountReceived)}
      </Text>
      <Text className="text-xs leading-4.25 text-text-secondary">
        {Number(sale.balanceDue || 0) > 0
          ? t("pos.balanceDue")
          : t("pos.change")}
        :{" "}
        {money(
          Number(sale.balanceDue || 0) > 0 ? sale.balanceDue : sale.change,
        )}
      </Text>
      {showCreditPayments
        ? sale.creditPayments?.map((payment, index) => (
            <Text
              key={`payment-${index}`}
              className="text-xs leading-4.25 text-text-secondary"
            >
              {t("salesHistory.recordPayment")}: {money(payment.amount)} ·{" "}
              {new Date(payment.receivedAt).toLocaleString()}
            </Text>
          ))
        : null}
    </View>
  );
}
