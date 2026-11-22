import theme from "../../constants/theme";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as paymentsApi from "../../services/supplierPaymentService";
import {
  Card,
  Notice,
  Page,
  ScrollPage,
  Status,
  useLoad,
  date,
  money,
  styles,
} from "../purchase-management/PurchaseManagementUI";

export function SupplierPaymentDetailsScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const state = useLoad(
    () => paymentsApi.getSupplierPayment(token, id),
    [token, id],
  );
  const payment = state.data;
  if (state.loading)
    return (
      <Page title={t("supplierPurchase.paymentDetails")}>
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      </Page>
    );
  if (state.error || !payment)
    return (
      <Page title={t("supplierPurchase.paymentDetails")}>
        <Notice text={state.error} retry={() => state.load()} />
      </Page>
    );
  return (
    <ScrollPage title={t("supplierPurchase.paymentDetails")}>
      <Card>
        <Text style={styles.cardTitle}>{money(payment.amount)}</Text>
        <Text style={styles.body}>{payment.supplierName}</Text>
        <Text style={styles.muted}>
          {payment.purchaseReference} · {date(payment.paymentDate)}
        </Text>
        <Text style={styles.muted}>
          {t(`supplierPurchase.methods.${payment.paymentMethod}`)} ·{" "}
          {payment.transactionReference || "—"}
        </Text>
        <Text style={styles.muted}>{payment.notes || "—"}</Text>
        <Status value={payment.entryType} />
      </Card>
    </ScrollPage>
  );
}
