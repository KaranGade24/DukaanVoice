import { Pressable, Text, View } from "react-native";
import { clsx } from "clsx";
import { Card, Field } from "../purchase-management/PurchaseManagementUI";

export default function PurchaseLineEditor({ line, t, onPatch, onRemove }) {
  const discountValue = line.discountMode === "PERCENTAGE" ? line.discountPercent : line.discountAmount;
  return (
    <Card>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[15px] font-semibold text-text-primary">{line.name}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t("supplierPurchase.remove")} ${line.name}`} onPress={onRemove}>
          <Text className="text-2xl text-error">×</Text>
        </Pressable>
      </View>
      <Text className="text-xs text-text-secondary">{t("supplierPurchase.unit")}: {line.unit}</Text>
      <Field label={t("supplierPurchase.quantity")} value={line.quantity} onChangeText={(value) => onPatch({ quantity: value })} keyboardType="decimal-pad" />
      <Field label={t("supplierPurchase.unitPrice")} value={line.unitPurchasePrice} onChangeText={(value) => onPatch({ unitPurchasePrice: value })} keyboardType="decimal-pad" />
      <DiscountModeSelector value={line.discountMode} onChange={(discountMode) => onPatch({ discountMode })} t={t} />
      <Field label={`${t("supplierPurchase.discount")} (${line.discountMode === "PERCENTAGE" ? "%" : "₹"})`} value={discountValue} onChangeText={(value) => onPatch(line.discountMode === "PERCENTAGE" ? { discountPercent: value } : { discountAmount: value })} keyboardType="decimal-pad" />
      <Field label={t("supplierPurchase.taxPercent")} value={line.taxRate} onChangeText={(value) => onPatch({ taxRate: value })} keyboardType="decimal-pad" />
    </Card>
  );
}

export function DiscountModeSelector({ value, onChange, t }) {
  return (
    <View className="mt-2 mb-1 flex-row gap-2">
      {["AMOUNT", "PERCENTAGE"].map((mode) => (
        <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: value === mode }} onPress={() => onChange(mode)} className={clsx("rounded-full border px-3 py-2", value === mode ? "border-[#23804A] bg-[#E5F3EC]" : "border-[#D9DEE3] bg-[#F1F3F5]")}>
          <Text className={clsx("font-semibold", value === mode ? "text-[#17663A]" : "text-[#444]")}>{mode === "AMOUNT" ? `₹ ${t("supplierPurchase.amountMode")}` : `% ${t("supplierPurchase.percentageMode")}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}
