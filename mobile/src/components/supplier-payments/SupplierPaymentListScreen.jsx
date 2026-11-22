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
  styles,
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
          style={styles.add}
        >
          <Text style={styles.addText}>＋</Text>
        </Pressable>
      }
    >
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {["", ...paymentMethods].map((v) => (
            <Pressable
              key={v || "all"}
              onPress={() => {
                setPage(1);
                setMethod(v);
              }}
              style={[styles.chip, paymentMethod === v && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  paymentMethod === v && styles.chipTextActive,
                ]}
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
          contentContainerStyle={styles.chips}
        >
          {suppliers.map((supplier) => (
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
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{money(item.amount)}</Text>
                <Status value={item.entryType} />
              </View>
              <Text style={styles.muted}>
                {item.supplierName} · {item.purchaseReference}
              </Text>
              <Text style={styles.muted}>
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
