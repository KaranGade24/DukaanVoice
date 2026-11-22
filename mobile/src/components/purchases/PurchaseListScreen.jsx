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
  styles,
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
          placeholder={t("supplierPurchase.searchPurchases")}
          style={styles.search}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {["", ...paymentStatuses].map((v) => (
            <Pressable
              key={v || "all"}
              onPress={() => {
                setPage(1);
                setStatus(v);
              }}
              style={[styles.chip, status === v && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, status === v && styles.chipTextActive]}
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
          contentContainerStyle={styles.chips}
        >
          {supplierRows.map((supplier) => (
            <Pressable
              key={supplier.id}
              onPress={() => {
                setPage(1);
                setSupplierId(supplierId === supplier.id ? "" : supplier.id);
              }}
              style={[
                styles.chip,
                supplierId === supplier.id && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  supplierId === supplier.id && styles.chipTextActive,
                ]}
              >
                {supplier.supplierName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.dateRow}>
          <TextInput
            value={dateInputs.from}
            onChangeText={(v) => setDateInputs((old) => ({ ...old, from: v }))}
            placeholder={t("supplierPurchase.fromDate")}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            style={[styles.search, styles.dateInput]}
          />
          <TextInput
            value={dateInputs.to}
            onChangeText={(v) => setDateInputs((old) => ({ ...old, to: v }))}
            placeholder={t("supplierPurchase.toDate")}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            style={[styles.search, styles.dateInput]}
          />
          <Pressable
            onPress={() => {
              setPage(1);
              setDateFilters(dateInputs);
            }}
            style={styles.apply}
          >
            <Text style={styles.applyText}>
              {t("supplierPurchase.applyFilters")}
            </Text>
          </Pressable>
        </View>
      </View>
      {state.loading ? (
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      ) : state.error ? (
        <Notice text={state.error} retry={() => state.load()} />
      ) : (
        <FlatList
          data={state.data?.items || []}
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
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.purchaseReference}</Text>
                <Status value={item.paymentStatus} />
              </View>
              <Text style={styles.muted}>
                {item.supplier?.supplierName || ""} · {date(item.purchaseDate)}
              </Text>
              <View style={styles.rowBetween}>
                <Text style={styles.body}>{t("supplierPurchase.total")}</Text>
                <Text style={styles.money}>{money(item.grandTotal)}</Text>
              </View>
              <Text style={styles.muted}>
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
