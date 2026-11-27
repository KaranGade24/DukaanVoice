import {
  errorText,
  Button,
  Card,
  Empty,
  Notice,
  Page,
  Status,
  useLoad,
  money,
} from "../purchase-management/PurchaseManagementUI";
import theme from "../../constants/theme";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";

export function SupplierListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("true");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const load = useCallback(
    () =>
      suppliersApi.listSuppliers(token, {
        page: 1,
        limit: 20,
        search,
        isActive: active,
      }),
    [token, search, active],
  );
  const state = useLoad(load, load);
  const rows = state.data?.items || [];
  const loadMore = async () => {
    if (loadingMore || page >= (state.data?.pagination?.pages || 1)) return;
    setLoadingMore(true);
    try {
      const result = await suppliersApi.listSuppliers(token, {
        page: page + 1,
        limit: 20,
        search,
        isActive: active,
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
      title={t("supplierPurchase.suppliers")}
      right={
        <Pressable
          onPress={() => router.push("/suppliers/new")}
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
          placeholder={t("supplierPurchase.searchSuppliers")}
          className="min-h-11.5 rounded-xl border border-border bg-white px-3.5 text-text-primary"
        />
        <View className="flex-row flex-wrap gap-2">
          {["true", "false", "all"].map((v) => (
            <Pressable
              key={v}
              onPress={() => {
                setPage(1);
                setActive(v);
              }}
              className={
                active === v
                  ? "rounded-full border border-primary bg-primary px-3 py-2"
                  : "rounded-full border border-border bg-white px-3 py-2"
              }
            >
              <Text
                className={
                  active === v
                    ? "text-xs font-semibold text-white"
                    : "text-xs text-text-secondary"
                }
              >
                {t(`supplierPurchase.filter.${v}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {state.loading ? (
        <ActivityIndicator className="mt-15" color={theme.colors.primary} />
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
          ListEmptyComponent={
            <Empty text={t("supplierPurchase.noSuppliers")} />
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
            <Card onPress={() => router.push(`/suppliers/${item.id}`)}>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
                  {item.supplierName}
                </Text>
                <Status value={item.isActive ? "ACTIVE" : "ARCHIVED"} />
              </View>
              <Text className="text-xs leading-4.25 text-text-secondary">
                {item.phoneNumber}
                {item.businessName ? ` · ${item.businessName}` : ""}
              </Text>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-sm leading-5 text-text-primary">
                  {t("supplierPurchase.outstanding")}
                </Text>
                <Text className="text-[15px] leading-5.25 font-semibold text-primary">
                  {money(item.outstandingBalance)}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </Page>
  );
}
