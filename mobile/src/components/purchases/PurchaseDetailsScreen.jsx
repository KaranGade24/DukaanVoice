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
  styles,
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
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
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
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>
            {p.supplier?.supplierName || t("supplierPurchase.supplier")}
          </Text>
          <Status value={p.status} />
        </View>
        <Text style={styles.muted}>
          {date(p.purchaseDate)} ·{" "}
          {p.supplierInvoiceNumber || t("supplierPurchase.noInvoice")}
        </Text>
        {p.items.map((line, i) => (
          <View style={styles.lineItem} key={`${line.productId}-${i}`}>
            <Text style={styles.body}>{line.productNameSnapshot}</Text>
            <Text style={styles.muted}>
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
      <View style={styles.actions}>
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
      <Text style={styles.sectionTitle}>
        {t("supplierPurchase.paymentHistory")}
      </Text>
      {payments.map((payment) => (
        <Card key={payment.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{money(payment.amount)}</Text>
            <Status value={payment.entryType} />
          </View>
          <Text style={styles.muted}>
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
