import {
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import theme from "../../constants/theme";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";
import * as paymentsApi from "../../services/supplierPaymentService";
import {
  Button,
  Card,
  Empty,
  Notice,
  Page,
  Status,
  useLoad,
  date,
  dateBound,
  errorText,
  money,
  paymentMethods,
} from "../purchase-management/PurchaseManagementUI";

export function SupplierPaymentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [paymentMethod, setMethod] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [dateInputs, setDateInputs] = useState({ from: "", to: "" });
  const [dateFilters, setDateFilters] = useState({});
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    suppliersApi
      .listSuppliers(token, { page: 1, limit: 100, isActive: "all" })
      .then((data) => setSuppliers(data.items || []))
      .catch((e) => {
        const message = errorText(e, t("supplierPurchase.loadFailed"));
        if (e.code !== "VALIDATION_ERROR")
          Alert.alert(t("supplierPurchase.error"), message);
      });
  }, [token, t]);
  const state = useLoad(
    () =>
      paymentsApi.listSupplierPayments(token, {
        page: 1,
        limit: 20,
        paymentMethod: paymentMethod || undefined,
        supplierId: supplierId || undefined,
        from: dateBound(dateFilters.from),
        to: dateBound(dateFilters.to, true),
      }),
    [token, paymentMethod, supplierId, dateFilters],
  );
  const rows = state.data?.items || [];
  const loadMore = async () => {
    if (loadingMore || page >= (state.data?.pagination?.pages || 1)) return;
    setLoadingMore(true);
    try {
      const result = await paymentsApi.listSupplierPayments(token, {
        page: page + 1,
        limit: 20,
        paymentMethod: paymentMethod || undefined,
        supplierId: supplierId || undefined,
        from: dateBound(dateFilters.from),
        to: dateBound(dateFilters.to, true),
      });
      state.setData((old) => ({
        ...result,
        items: [...(old?.items || []), ...(result.items || [])],
      }));
      setPage(page + 1);
    } catch (e) {
      state.setError(errorText(e, t("supplierPurchase.loadFailed")));
    } finally {
      setLoadingMore(false);
    }
  };
  return (
    <Page
      title={t("supplierPurchase.supplierPayments")}
      right={
        <Pressable
          onPress={() => router.push("/supplier-payments/new")}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-tint"
        >
          <Text className="text-2xl font-semibold text-primary">＋</Text>
        </Pressable>
      }
    >
      <View className="gap-2.5 px-5 py-2.5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {["", ...paymentMethods].map((v) => (
            <Pressable
              key={v || "all"}
              onPress={() => {
                setPage(1);
                setMethod(v);
              }}
              className={
                paymentMethod === v
                  ? "rounded-full border border-primary bg-primary px-3 py-2"
                  : "rounded-full border border-border bg-white px-3 py-2"
              }
            >
              <Text
                className={
                  paymentMethod === v
                    ? "text-xs font-semibold text-white"
                    : "text-xs text-text-secondary"
                }
              >
                {v
                  ? t(`supplierPurchase.methods.${v}`)
                  : t("supplierPurchase.filter.all")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {suppliers.map((supplier) => (
            <Pressable
              key={supplier.id}
              onPress={() => {
                setPage(1);
                setSupplierId(supplierId === supplier.id ? "" : supplier.id);
              }}
              className={
                supplierId === supplier.id
                  ? "rounded-full border border-primary bg-primary px-3 py-2"
                  : "rounded-full border border-border bg-white px-3 py-2"
              }
            >
              <Text
                className={
                  supplierId === supplier.id
                    ? "text-xs font-semibold text-white"
                    : "text-xs text-text-secondary"
                }
              >
                {supplier.supplierName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View className="flex-row items-center gap-1.5">
          <TextInput
            value={dateInputs.from}
            onChangeText={(v) => setDateInputs((old) => ({ ...old, from: v }))}
            placeholder={t("supplierPurchase.fromDate")}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            className="min-h-[46px] flex-1 rounded-xl border border-border bg-white px-3.5 text-[11px] text-text-primary"
          />
          <TextInput
            value={dateInputs.to}
            onChangeText={(v) => setDateInputs((old) => ({ ...old, to: v }))}
            placeholder={t("supplierPurchase.toDate")}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            className="min-h-[46px] flex-1 rounded-xl border border-border bg-white px-3.5 text-[11px] text-text-primary"
          />
          <Pressable
            onPress={() => {
              setPage(1);
              setDateFilters(dateInputs);
            }}
            className="rounded-lg bg-surface-tint px-2.5 py-3"
          >
            <Text className="text-xs font-bold text-primary">
              {t("supplierPurchase.applyFilters")}
            </Text>
          </Pressable>
        </View>
      </View>
      {state.loading ? (
        <ActivityIndicator className="mt-[60px]" color={theme.colors.primary} />
      ) : state.error ? (
        <Notice text={state.error} retry={() => state.load()} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-[18px] pb-10"
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={() => {
                setPage(1);
                state.load(true);
              }}
            />
          }
          ListEmptyComponent={<Empty text={t("supplierPurchase.noPayments")} />}
          ListFooterComponent={
            page < (state.data?.pagination?.pages || 1) ? (
              <Button
                title={
                  loadingMore
                    ? t("common.loading")
                    : t("supplierPurchase.loadMore")
                }
                secondary
                disabled={loadingMore}
                onPress={loadMore}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/supplier-payments/${item.id}`)}>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{money(item.amount)}</Text>
                <Status value={item.entryType} />
              </View>
              <Text className="text-xs leading-[17px] text-text-secondary">
                {item.supplierName} · {item.purchaseReference}
              </Text>
              <Text className="text-xs leading-[17px] text-text-secondary">
                {t(`supplierPurchase.methods.${item.paymentMethod}`)} ·{" "}
                {date(item.paymentDate)}
              </Text>
            </Card>
          )}
        />
      )}
    </Page>
  );
}
