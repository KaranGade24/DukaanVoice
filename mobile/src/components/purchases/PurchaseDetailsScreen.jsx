import theme from "../../constants/theme";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as purchasesApi from "../../services/purchaseService";
import {
  Button,
  Card,
  Divider,
  Empty,
  Notice,
  Page,
  ScrollPage,
  Status,
  SummaryLine,
  useLoad,
  date,
  errorText,
  money,
} from "../purchase-management/PurchaseManagementUI";

export function PurchaseDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const [payments, setPayments] = useState([]);
  const state = useLoad(async () => {
    const [purchase, paymentData] = await Promise.all([
      purchasesApi.getPurchase(token, id),
      purchasesApi.listPurchasePayments(token, id),
    ]);
    setPayments(paymentData.items || []);
    return purchase;
  }, [token, id]);
  const p = state.data;
  const cancel = () =>
    Alert.alert(
      t("supplierPurchase.cancelPurchase"),
      t("supplierPurchase.cancelConfirm"),
      [
        { text: t("common.back"), style: "cancel" },
        {
          text: t("supplierPurchase.cancelPurchase"),
          style: "destructive",
          onPress: async () => {
            try {
              await purchasesApi.cancelPurchase(
                token,
                id,
                t("supplierPurchase.cancelReason"),
              );
              await state.load();
            } catch (e) {
              const message = errorText(e, t("supplierPurchase.cancelFailed"));
              if (e.code !== "VALIDATION_ERROR")
                Alert.alert(t("supplierPurchase.error"), message);
            }
          },
        },
      ],
    );
  if (state.loading)
    return (
      <Page title={t("supplierPurchase.purchaseDetails")}>
        <ActivityIndicator className="mt-[60px]" color={theme.colors.primary} />
      </Page>
    );
  if (state.error || !p)
    return (
      <Page title={t("supplierPurchase.purchaseDetails")}>
        <Notice text={state.error} retry={() => state.load()} />
      </Page>
    );
  return (
    <ScrollPage title={p.purchaseReference}>
      <Card>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">
            {p.supplier?.supplierName || t("supplierPurchase.supplier")}
          </Text>
          <Status value={p.status} />
        </View>
        <Text className="text-xs leading-[17px] text-text-secondary">
          {date(p.purchaseDate)} ·{" "}
          {p.supplierInvoiceNumber || t("supplierPurchase.noInvoice")}
        </Text>
        {p.items.map((line, i) => (
          <View className="gap-[3px] py-[7px]" key={`${line.productId}-${i}`}>
            <Text className="text-sm leading-5 text-text-primary">{line.productNameSnapshot}</Text>
            <Text className="text-xs leading-[17px] text-text-secondary">
              {line.quantity} {line.unit} × {money(line.unitPurchasePrice)} ={" "}
              {money(line.lineTotal)}
            </Text>
          </View>
        ))}
        <Divider />
        <SummaryLine
          label={t("supplierPurchase.subtotal")}
          value={money(p.subtotal)}
        />
        <SummaryLine
          label={t("supplierPurchase.tax")}
          value={money(p.taxAmount)}
        />
        <SummaryLine
          label={t("supplierPurchase.discount")}
          value={`−${money(p.itemDiscountTotal + p.additionalDiscount)}`}
        />
        <SummaryLine
          label={t("supplierPurchase.total")}
          value={money(p.grandTotal)}
          strong
        />
        <SummaryLine
          label={t("supplierPurchase.paid")}
          value={money(p.totalPaid)}
        />
        <SummaryLine
          label={t("supplierPurchase.outstanding")}
          value={money(p.outstandingAmount)}
          strong
        />
      </Card>
      <View className="gap-2 mb-2.5">
        <Button
          title={t("supplierPurchase.invoice")}
          secondary
          onPress={() => router.push(`/purchases/${id}/invoice`)}
        />
        {p.status === "POSTED" && p.outstandingAmount > 0 ? (
          <Button
            title={t("supplierPurchase.recordPayment")}
            onPress={() =>
              router.push({
                pathname: "/supplier-payments/new",
                params: { purchaseId: id, supplierId: p.supplierId },
              })
            }
          />
        ) : null}
      </View>
      {p.status === "POSTED" && p.totalPaid === 0 ? (
        <Button
          title={t("supplierPurchase.cancelPurchase")}
          secondary
          danger
          onPress={cancel}
        />
      ) : null}
      <Text className="mt-2 mb-1 text-lg leading-6 font-semibold text-text-primary">
        {t("supplierPurchase.paymentHistory")}
      </Text>
      {payments.map((payment) => (
        <Card key={payment.id}>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{money(payment.amount)}</Text>
            <Status value={payment.entryType} />
          </View>
          <Text className="text-xs leading-[17px] text-text-secondary">
            {t(`supplierPurchase.methods.${payment.paymentMethod}`)} ·{" "}
            {date(payment.paymentDate)}
          </Text>
        </Card>
      ))}
      {!payments.length ? (
        <Empty text={t("supplierPurchase.noPayments")} />
      ) : null}
    </ScrollPage>
  );
}
