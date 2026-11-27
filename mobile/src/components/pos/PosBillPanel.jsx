import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { clsx } from "clsx";
import BillLineItem from "./BillLineItem";
import PaymentMethodSelector from "./PaymentMethodSelector";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function PosBillPanel({
  lines,
  unitCount,
  subtotal,
  discount,
  discountValid,
  total,
  paymentMethod,
  received,
  receivedValid,
  receivedNumber,
  onAdjust,
  onClear,
  onDiscountChange,
  onPaymentChange,
  onReceivedChange,
  disabled,
  t,
}) {
  return (
    <View className="pos-bill-panel">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <MaterialCommunityIcons
            name="basket-outline"
            size={20}
            color="#168447"
          />
          <Text className="text-[15px] font-semibold text-text-primary">
            {t("pos.currentBill")}
          </Text>
          <Text className="rounded-[7px] bg-surface-mint px-1.75 py-0.75 text-[11px] font-semibold text-primary">
            {lines.length} · {unitCount} {t("pos.units")}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onClear}
        >
          <Text
            className={clsx(
              "text-xs font-semibold text-[#DC2626]",
              disabled && "opacity-50",
            )}
          >
            {t("pos.clear")}
          </Text>
        </Pressable>
      </View>
      {lines.length ? (
        lines.map((line) => (
          <BillLineItem
            key={line.product.id}
            product={line.product}
            quantity={line.quantity}
            subtotal={line.subtotal}
            onAdjust={onAdjust}
            t={t}
          />
        ))
      ) : (
        <Text className="py-3 text-text-secondary">{t("pos.cartEmpty")}</Text>
      )}
      <View className="my-2 h-px bg-border" />
      <View className="flex-row items-center justify-between gap-2.5 py-1.25">
        <Text className="text-xs font-medium text-[#66736B]">
          {t("pos.subtotal")}
        </Text>
        <Text className="text-[#202B25]">{money(subtotal)}</Text>
      </View>
      <View className="flex-row items-center justify-between gap-2.5 py-1.25">
        <Text className="text-xs font-medium text-[#66736B]">
          {t("pos.discount")}
        </Text>
        <TextInput
          value={discount}
          onChangeText={onDiscountChange}
          selectTextOnFocus
          keyboardType="decimal-pad"
          accessibilityLabel={t("pos.discount")}
          editable={!disabled}
          className={clsx(
            "min-h-9.5 min-w-22 rounded-lg border border-border px-2.25 text-right text-[#202B25]",
            !discountValid && "border-error bg-error-bg",
            disabled && "opacity-50",
          )}
        />
      </View>
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-[15px] font-semibold text-[#202B25]">
          {t("pos.total")}
        </Text>
        <Text className="text-lg font-bold text-[#168447]">{money(total)}</Text>
      </View>
      <Text className="mb-1.5 text-xs font-medium text-[#66736B]">
        {t("pos.paymentMethod")}
      </Text>
      <PaymentMethodSelector
        value={paymentMethod}
        onChange={onPaymentChange}
        t={t}
        disabled={disabled}
      />
      <View
        className="flex-row items-center justify-between gap-2.5 p
      y-1.25"
      >
        <Text className="text-xs font-medium text-[#66736B]">
          {paymentMethod === "UDHAR"
            ? t("pos.creditSaleHint")
            : paymentMethod === "CASH"
              ? t("pos.amountReceived")
              : t("pos.amountPaid")}
        </Text>
        <TextInput
          value={received}
          onChangeText={onReceivedChange}
          selectTextOnFocus
          keyboardType="decimal-pad"
          editable={!disabled && paymentMethod !== "UDHAR"}
          placeholder={total.toFixed(2)}
          accessibilityLabel={
            paymentMethod === "CASH"
              ? t("pos.amountReceived")
              : t("pos.amountPaid")
          }
          className={clsx(
            "min-h-9.5 min-w-22 rounded-lg border border-border px-2.25 text-right text-[#202B25]",
            !receivedValid && "border-error bg-error-bg",
            (disabled || paymentMethod === "UDHAR") && "opacity-60",
          )}
        />
      </View>
      {paymentMethod === "CASH" && receivedValid && receivedNumber > total ? (
        <View className="flex-row items-center justify-between gap-2.5 py-1.25">
          <Text className="text-xs font-medium text-[#66736B]">
            {t("pos.change")}
          </Text>
          <Text className="font-bold text-[#168447]">
            {money(receivedNumber - total)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
