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
        <ActivityIndicator className="mt-[60px]" color={theme.colors.primary} />
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
        <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{money(payment.amount)}</Text>
        <Text className="text-sm leading-5 text-text-primary">{payment.supplierName}</Text>
        <Text className="text-xs leading-[17px] text-text-secondary">
          {payment.purchaseReference} · {date(payment.paymentDate)}
        </Text>
        <Text className="text-xs leading-[17px] text-text-secondary">
          {t(`supplierPurchase.methods.${payment.paymentMethod}`)} ·{" "}
          {payment.transactionReference || "—"}
        </Text>
        <Text className="text-xs leading-[17px] text-text-secondary">{payment.notes || "—"}</Text>
        <Status value={payment.entryType} />
      </Card>
    </ScrollPage>
  );
}
