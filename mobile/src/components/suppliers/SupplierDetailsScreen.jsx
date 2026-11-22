import theme from "../../constants/theme";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";
import {
  Button,
  Card,
  Empty,
  Notice,
  Page,
  ScrollPage,
  Stat,
  Status,
  useLoad,
  date,
  errorText,
  money,
  styles,
} from "../purchase-management/PurchaseManagementUI";

export function SupplierDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const state = useLoad(() => suppliersApi.getSupplier(token, id), [token, id]);
  const supplier = state.data;
  const archive = () =>
    Alert.alert(
      t("supplierPurchase.archiveSupplier"),
      t("supplierPurchase.archiveConfirm"),
      [
        { text: t("common.back"), style: "cancel" },
        {
          text: t("supplierPurchase.archive"),
          style: "destructive",
          onPress: async () => {
            try {
              await suppliersApi.archiveSupplier(token, id);
              await state.load();
            } catch (e) {
              const message = errorText(e, t("supplierPurchase.saveFailed"));
              if (e.code !== "VALIDATION_ERROR")
                Alert.alert(t("supplierPurchase.error"), message);
            }
          },
        },
      ],
    );
  if (state.loading)
    return (
      <Page title={t("supplierPurchase.supplierDetails")}>
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      </Page>
    );
  if (state.error || !supplier)
    return (
      <Page title={t("supplierPurchase.supplierDetails")}>
        <Notice text={state.error} retry={() => state.load()} />
      </Page>
    );
  return (
    <ScrollPage title={supplier.supplierName}>
      <Card>
        <Text style={styles.cardTitle}>
          {supplier.businessName || supplier.supplierName}
        </Text>
        <Text style={styles.muted}>
          {supplier.phoneNumber}
          {supplier.email ? ` · ${supplier.email}` : ""}
        </Text>
        <View style={styles.stats}>
          <Stat
            label={t("supplierPurchase.purchasesTotal")}
            value={money(supplier.totalPurchases)}
          />
          <Stat
            label={t("supplierPurchase.paid")}
            value={money(supplier.totalPaid)}
          />
          <Stat
            label={t("supplierPurchase.outstanding")}
            value={money(supplier.outstandingBalance)}
          />
        </View>
      </Card>
      <View style={styles.actions}>
        <Button
          title={t("supplierPurchase.newPurchase")}
          onPress={() =>
            router.push({
              pathname: "/purchases/new",
              params: { supplierId: id },
            })
          }
        />
        <Button
          title={t("supplierPurchase.editSupplier")}
          secondary
          onPress={() => router.push(`/suppliers/${id}/edit`)}
        />
        {supplier.outstandingBalance > 0 ? (
          <Button
            title={t("supplierPurchase.recordPayment")}
            secondary
            onPress={() =>
              router.push({
                pathname: "/supplier-payments/new",
                params: { supplierId: id },
              })
            }
          />
        ) : null}
      </View>
      {!supplier.isActive ? (
        <Notice text={t("supplierPurchase.archivedInfo")} />
      ) : (
        <Button
          title={t("supplierPurchase.archiveSupplier")}
          secondary
          danger
          onPress={archive}
        />
      )}
      <Text style={styles.sectionTitle}>
        {t("supplierPurchase.recentPurchases")}
      </Text>
      {(supplier.recentPurchases || []).map((purchase) => (
        <Card
          key={purchase.id}
          onPress={() => router.push(`/purchases/${purchase.id}`)}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{purchase.purchaseReference}</Text>
            <Status value={purchase.paymentStatus} />
          </View>
          <Text style={styles.muted}>
            {date(purchase.purchaseDate)} · {money(purchase.grandTotal)}
          </Text>
        </Card>
      ))}
      {!supplier.recentPurchases?.length ? (
        <Empty text={t("supplierPurchase.noPurchases")} />
      ) : null}
    </ScrollPage>
  );
}
