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
  styles,
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
          style={styles.add}
        >
          <Text style={styles.addText}>＋</Text>
        </Pressable>
      }
    >
      <View style={styles.toolbar}>
        <TextInput
          value={search}
          onChangeText={(v) => {
            setPage(1);
            setSearch(v);
          }}
          placeholder={t("supplierPurchase.searchSuppliers")}
          style={styles.search}
        />
        <View style={styles.chips}>
          {["true", "false", "all"].map((v) => (
            <Pressable
              key={v}
              onPress={() => {
                setPage(1);
                setActive(v);
              }}
              style={[styles.chip, active === v && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, active === v && styles.chipTextActive]}
              >
                {t(`supplierPurchase.filter.${v}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {state.loading ? (
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      ) : state.error ? (
        <Notice text={state.error} retry={() => state.load()} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.supplierName}</Text>
                <Status value={item.isActive ? "ACTIVE" : "ARCHIVED"} />
              </View>
              <Text style={styles.muted}>
                {item.phoneNumber}
                {item.businessName ? ` · ${item.businessName}` : ""}
              </Text>
              <View style={styles.rowBetween}>
                <Text style={styles.body}>
                  {t("supplierPurchase.outstanding")}
                </Text>
                <Text style={styles.money}>
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
