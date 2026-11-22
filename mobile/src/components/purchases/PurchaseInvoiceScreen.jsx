import theme from "../../constants/theme";
import { View, ActivityIndicator, Alert, Share, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as purchasesApi from "../../services/purchaseService";
import {
  Button,
  Card,
  Divider,
  Notice,
  Page,
  ScrollPage,
  SummaryLine,
  useLoad,
  date,
  errorText,
  money,
  styles,
} from "../purchase-management/PurchaseManagementUI";

export function PurchaseInvoiceScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const state = useLoad(
    () => purchasesApi.getPurchaseInvoice(token, id),
    [token, id],
  );
  const doc = state.data;
  const share = async () => {
    if (!doc) return;
    const { purchase: p, supplier, shop } = doc;
    const lines = p.items
      .map(
        (item) =>
          `${item.productNameSnapshot}: ${item.quantity} ${item.unit} × ${money(item.unitPurchasePrice)} = ${money(item.lineTotal)}`,
      )
      .join("\n");
    const message = `${shop.shopName}\n${t("supplierPurchase.invoice")} ${p.purchaseReference}\n${supplier?.supplierName || ""}\n${date(p.purchaseDate)}\n\n${lines}\n\n${t("supplierPurchase.totalDiscount")}: −${money(p.totalDiscount ?? p.itemDiscountTotal + p.additionalDiscount)}\n${t("supplierPurchase.total")}: ${money(p.grandTotal)}\n${t("supplierPurchase.paid")}: ${money(p.totalPaid)}\n${t("supplierPurchase.outstanding")}: ${money(p.outstandingAmount)}`;
    try {
      await Share.share({ title: p.purchaseReference, message });
    } catch (e) {
      Alert.alert(
        t("supplierPurchase.error"),
        errorText(e, t("supplierPurchase.shareFailed")),
      );
    }
  };
  if (state.loading)
    return (
      <Page title={t("supplierPurchase.invoice")}>
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      </Page>
    );
  if (state.error || !doc)
    return (
      <Page title={t("supplierPurchase.invoice")}>
        <Notice text={state.error} retry={() => state.load()} />
      </Page>
    );
  const p = doc.purchase;
  return (
    <ScrollPage title={t("supplierPurchase.invoice")}>
      <Card>
        <Text style={styles.cardTitle}>{doc.shop.shopName}</Text>
        <Text style={styles.sectionTitle}>
          {t("supplierPurchase.purchaseInvoice")}
        </Text>
        <Text style={styles.body}>
          {p.purchaseReference}
          {p.supplierInvoiceNumber ? ` · ${p.supplierInvoiceNumber}` : ""}
        </Text>
        <Text style={styles.muted}>
          {doc.supplier?.supplierName} · {date(p.purchaseDate)}
        </Text>
        <Divider />
        {p.items.map((line, index) => (
          <View style={styles.lineItem} key={`${line.productId}-${index}`}>
            <Text style={styles.body}>{line.productNameSnapshot}</Text>
            <Text style={styles.muted}>
              {line.quantity} {line.unit} · {money(line.lineTotal)}
            </Text>
          </View>
        ))}
        <Divider />
        <SummaryLine
          label={t("supplierPurchase.totalDiscount")}
          value={`−${money(p.totalDiscount ?? p.itemDiscountTotal + p.additionalDiscount)}`}
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
        />
      </Card>
      <Text style={styles.muted}>
        {t("supplierPurchase.invoiceDisclaimer")}
      </Text>
      <Button title={t("supplierPurchase.shareInvoice")} onPress={share} />
    </ScrollPage>
  );
}
