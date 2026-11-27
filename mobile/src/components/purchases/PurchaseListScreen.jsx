import {
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import theme from "../../constants/theme";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";
import * as purchasesApi from "../../services/purchaseService";
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
  paymentStatuses,
} from "../purchase-management/PurchaseManagementUI";

export function PurchaseListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [dateInputs, setDateInputs] = useState({ from: "", to: "" });
  const [dateFilters, setDateFilters] = useState({});
  const [supplierRows, setSupplierRows] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    suppliersApi
      .listSuppliers(token, { page: 1, limit: 100, isActive: "all" })
      .then((data) => setSupplierRows(data.items || []))
      .catch((e) => {
        const message = errorText(e, t("supplierPurchase.loadFailed"));
        if (e.code !== "VALIDATION_ERROR")
          Alert.alert(t("supplierPurchase.error"), message);
      });
  }, [token, t]);
  const load = useCallback(
    () =>
      purchasesApi.listPurchases(token, {
        page: 1,
        limit: 20,
        search,
        paymentStatus: status || undefined,
        supplierId: supplierId || undefined,
        from: dateBound(dateFilters.from),
        to: dateBound(dateFilters.to, true),
      }),
    [token, search, status, supplierId, dateFilters],
  );
  const state = useLoad(load, load);
  const loadMore = async () => {
    if (loadingMore || page >= (state.data?.pagination?.pages || 1)) return;
    setLoadingMore(true);
    try {
      const result = await purchasesApi.listPurchases(token, {
        page: page + 1,
        limit: 20,
        search,
        paymentStatus: status || undefined,
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
      title={t("supplierPurchase.purchases")}
      right={
        <Pressable
          onPress={() => router.push("/purchases/new")}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-tint"
        >
          <Text className="text-2xl font-semibold text-primary">＋</Text>
        </Pressable>
      }
    >
      <View className="gap-2.5 px-5 py-2.5">
        <TextInput
          value={search}
          onChangeText={(v) => {
            setPage(1);
            setSearch(v);
          }}
          placeholder={t("supplierPurchase.searchPurchases")}
          className="min-h-[46px] rounded-xl border border-border bg-white px-3.5 text-text-primary"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {["", ...paymentStatuses].map((v) => (
            <Pressable
              key={v || "all"}
              onPress={() => {
                setPage(1);
                setStatus(v);
              }}
              className={
                status === v
                  ? "rounded-full border border-primary bg-primary px-3 py-2"
                  : "rounded-full border border-border bg-white px-3 py-2"
              }
            >
              <Text
                className={
                  status === v
                    ? "text-xs font-semibold text-white"
                    : "text-xs text-text-secondary"
                }
              >
                {v
                  ? t(`supplierPurchase.status.${v}`)
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
          {supplierRows.map((supplier) => (
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
          data={state.data?.items || []}
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
          ListEmptyComponent={
            <Empty text={t("supplierPurchase.noPurchases")} />
          }
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
            <Card onPress={() => router.push(`/purchases/${item.id}`)}>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{item.purchaseReference}</Text>
                <Status value={item.paymentStatus} />
              </View>
              <Text className="text-xs leading-[17px] text-text-secondary">
                {item.supplier?.supplierName || ""} · {date(item.purchaseDate)}
              </Text>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-sm leading-5 text-text-primary">{t("supplierPurchase.total")}</Text>
                <Text className="text-[15px] leading-[21px] font-semibold text-primary">{money(item.grandTotal)}</Text>
              </View>
              <Text className="text-xs leading-[17px] text-text-secondary">
                {t("supplierPurchase.outstanding")}:{" "}
                {money(item.outstandingAmount)}
              </Text>
            </Card>
          )}
        />
      )}
    </Page>
  );
}
