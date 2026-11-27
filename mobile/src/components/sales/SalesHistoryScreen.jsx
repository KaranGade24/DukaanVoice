import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import theme from "../../constants/theme";
import SaleSummary from "./SaleSummary";
import {
  getSaleDetails,
  getSales,
  recordCreditPayment,
} from "../../services/saleService";
import { printReceipt, shareReceiptPdf } from "../../utils/receipt";

const money = (value) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const dateKey = (date) =>
  String(date.getFullYear()) +
  "-" +
  String(date.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(date.getDate()).padStart(2, "0");
const todayKey = () => dateKey(new Date());
const monthStart = () =>
  dateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

export default function SalesHistoryScreen() {
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayKey());
  const [appliedRange, setAppliedRange] = useState({
    from: monthStart(),
    to: todayKey(),
  });
  const [method, setMethod] = useState(
    routeParams.paymentMethod === "UDHAR" ? "UDHAR" : "",
  );
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [payingBill, setPayingBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (refresh = false) => {
      if (!token) return;
      const current = ++requestId.current;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const result = await getSales(token, {
          ...appliedRange,
          search: appliedSearch,
          paymentMethod: method || undefined,
          page: 1,
          limit: 20,
        });
        if (current !== requestId.current) return;
        setItems(result.items || []);
        setPagination(result.pagination || null);
      } catch (_requestError) {
        if (current === requestId.current) setError(true);
      } finally {
        if (current === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [appliedRange, appliedSearch, method, token],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const applyRange = () =>
    setAppliedRange({ from: from.trim(), to: to.trim() });
  const submitCreditPayment = async () => {
    const amount = Number(paymentAmount);
    if (
      !payingBill ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > payingBill.balanceDue
    )
      return;
    setSavingPayment(true);
    try {
      await recordCreditPayment(token, payingBill.id, amount);
      setPayingBill(null);
      setPaymentAmount("");
      await load(true);
    } catch (requestError) {
      setError(true);
      Alert.alert(
        t("salesHistory.recordPayment"),
        requestError.message || t("common.retry"),
      );
    } finally {
      setSavingPayment(false);
    }
  };
  const loadMore = async () => {
    if (
      !token ||
      loading ||
      loadingMore ||
      !pagination ||
      pagination.page >= pagination.pages
    )
      return;
    const currentRequest = requestId.current;
    setLoadingMore(true);
    try {
      const next = await getSales(token, {
        ...appliedRange,
        search: appliedSearch,
        paymentMethod: method || undefined,
        page: pagination.page + 1,
        limit: pagination.limit || 20,
      });
      if (currentRequest !== requestId.current) return;
      setItems((current) => [...current, ...(next.items || [])]);
      setPagination(next.pagination || pagination);
    } catch (_requestError) {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };
  const openDetails = async (saleId) => {
    setSelectedSale(null);
    setDetailsLoading(true);
    try {
      setSelectedSale(await getSaleDetails(token, saleId));
    } catch (requestError) {
      Alert.alert(
        t("salesHistory.loadFailed"),
        requestError.message || t("salesHistory.loadFailed"),
      );
    } finally {
      setDetailsLoading(false);
    }
  };
  const shareSelectedReceipt = async () => {
    try {
      await shareReceiptPdf(selectedSale, t);
    } catch (_error) {
      Alert.alert(t("pos.error"), t("pos.shareFailed"));
    }
  };
  const printSelectedReceipt = async () => {
    try {
      await printReceipt(selectedSale, t);
    } catch (_error) {
      Alert.alert(t("pos.error"), t("pos.printFailed"));
    }
  };

  const methods = ["", "CASH", "UPI", "CARD", "UDHAR"];
  const methodLabels = {
    "": t("salesHistory.all"),
    CASH: t("pos.methods.CASH"),
    UPI: t("pos.methods.UPI"),
    CARD: t("pos.methods.CARD"),
    UDHAR: t("pos.methods.UDHAR"),
  };
  const renderItem = ({ item }) => (
    <View className="rounded-2xl bg-white p-3.5">
      <Pressable
        accessibilityRole="button"
        onPress={() => openDetails(item.id)}
        className="flex-row items-start justify-between gap-2.5"
      >
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
            {item.saleNumber}
          </Text>
          <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          {item.customerName ? (
            <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
              {t("pos.customer")}: {item.customerName}
            </Text>
          ) : null}
        </View>
        <Text className="text-lg font-semibold leading-6 text-primary">
          {money(item.total)}
        </Text>
      </Pressable>
      <View className="mt-2.75 rounded-[10px] bg-surface-subtle p-2.25">
        <Text
          numberOfLines={2}
          className="text-xs leading-4.25 text-text-secondary"
        >
          {t("salesHistory.itemPreview", {
            count: item.itemCount,
            items: (item.itemNames || []).join(", "),
          })}
        </Text>
      </View>
      <View className="mt-2.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.25 rounded-card bg-surface-mint px-2.25 py-1.25">
          <MaterialCommunityIcons
            name={
              item.paymentMethod === "CASH"
                ? "cash"
                : item.paymentMethod === "UPI"
                  ? "cellphone-check"
                  : item.paymentMethod === "UDHAR"
                    ? "book-outline"
                    : "credit-card-outline"
            }
            size={15}
            color={
              item.paymentMethod === "UDHAR" ? "#B45309" : theme.colors.primary
            }
          />
          <Text
            className={
              item.paymentMethod === "UDHAR"
                ? "text-[11px] font-bold text-[#B45309]"
                : "text-[11px] font-bold text-primary"
            }
          >
            {methodLabels[item.paymentMethod] || item.paymentMethod}
          </Text>
        </View>
        <Text
          className={
            item.paymentMethod === "UDHAR"
              ? "text-xs leading-4.25 text-[#B45309]"
              : "text-xs leading-4.25 text-success"
          }
        >
          {item.paymentMethod === "UDHAR"
            ? `${t("salesHistory.balanceDue")}: ${money(item.balanceDue)}`
            : t("salesHistory.completed")}
        </Text>
      </View>
      {item.paymentMethod === "UDHAR" && item.balanceDue > 0 ? (
        <Pressable
          onPress={() => {
            setPayingBill(item);
            setPaymentAmount(String(item.balanceDue));
          }}
          className="mt-2.5 self-start rounded-[10px] bg-warning-bg px-3.5 py-2.5"
        >
          <Text className="font-bold text-[#B45309]">
            {t("salesHistory.recordPayment")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="bg-background"
      style={{ height: height - 56 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <View className="flex-row items-center gap-2.5 px-4 pt-1 pb-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          className="h-10.5 w-10.5 items-center justify-center rounded-full bg-white"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={23}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-semibold leading-6 text-text-primary">
            {t("salesHistory.title")}
          </Text>
          <Text className="mt-0.5 text-xs leading-4.25 text-text-secondary">
            {pagination
              ? t("salesHistory.billCount", { count: pagination.total })
              : t("salesHistory.subtitle")}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("salesHistory.newSale")}
          onPress={() => router.push("/sales")}
          className="h-10.5 w-10.5 items-center justify-center rounded-full bg-primary"
        >
          <MaterialCommunityIcons name="plus" size={23} color="#FFFFFF" />
        </Pressable>
      </View>
      <View className="mx-4 h-11.5 flex-row items-center gap-2 rounded-xl border border-border bg-white px-3">
        <MaterialCommunityIcons
          name="magnify"
          size={21}
          color={theme.colors.textSecondary}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("salesHistory.searchPlaceholder")}
          placeholderTextColor={theme.colors.muted}
          returnKeyType="search"
          className="min-w-0 flex-1 text-sm text-text-primary"
          accessibilityLabel={t("salesHistory.searchPlaceholder")}
        />
      </View>
      <View className="mx-4 mt-2.5 flex-row items-center gap-2">
        <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="YYYY-MM-DD"
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-border bg-white px-2.25 text-xs text-text-primary"
          autoCapitalize="none"
          maxLength={10}
          keyboardType="numbers-and-punctuation"
        />
        <Text className="text-text-secondary">–</Text>
        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="YYYY-MM-DD"
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-border bg-white px-2.25 text-xs text-text-primary"
          autoCapitalize="none"
          maxLength={10}
          keyboardType="numbers-and-punctuation"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("salesHistory.applyDates")}
          onPress={applyRange}
          className="h-10 w-10 items-center justify-center rounded-[10px] bg-primary"
        >
          <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      <View className="flex-row gap-1.75 px-4 py-3">
        {methods.map((key) => (
          <Pressable
            key={key || "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: method === key }}
            onPress={() => setMethod(key)}
            className={
              method === key
                ? "rounded-[18px] bg-primary px-3.25 py-2"
                : "rounded-[18px] bg-[#E4F1E7] px-3.25 py-2"
            }
          >
            <Text
              className={
                method === key
                  ? "text-xs font-semibold text-white"
                  : "text-xs font-semibold text-text-secondary"
              }
            >
              {methodLabels[key]}
            </Text>
          </Pressable>
        ))}
      </View>
      {error && !items.length ? (
        <View className="items-center justify-center gap-2.5 p-6">
          <Text className="text-center text-sm leading-5 text-text-secondary">
            {t("salesHistory.loadFailed")}
          </Text>
          <Pressable
            onPress={() => load()}
            className="rounded-[10px] bg-surface-mint px-4 py-2.5"
          >
            <Text className="font-bold text-primary">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName={
          items.length
            ? "gap-2.5 px-4 pb-6"
            : "flex-grow justify-center gap-2.5 px-4 pb-6"
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <View className="items-center justify-center gap-2.5 p-6">
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={34}
                color={theme.colors.muted}
              />
              <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
                {t("salesHistory.emptyTitle")}
              </Text>
              <Text className="text-center text-sm leading-5 text-text-secondary">
                {t("salesHistory.emptyBody")}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator className="p-4.5" color={theme.colors.primary} />
          ) : error && items.length ? (
            <Text className="p-3.5 text-center text-xs leading-4.25 text-error">
              {t("salesHistory.loadMoreFailed")}
            </Text>
          ) : null
        }
      />
      <Modal
        visible={Boolean(payingBill)}
        transparent
        animationType="fade"
        onRequestClose={() => setPayingBill(null)}
      >
        <KeyboardAvoidingView
          className="justify-center bg-black/40 p-6"
          style={{ height: height - 56 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
          <View className="gap-3.5 rounded-[18px] bg-white p-5">
            <Text className="text-lg font-semibold leading-6 text-text-primary">
              {t("salesHistory.recordPayment")}
            </Text>
            <Text className="text-center text-sm leading-5 text-text-secondary">
              {payingBill?.saleNumber} · {t("salesHistory.balanceDue")}:{" "}
              {money(payingBill?.balanceDue)}
            </Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              className="min-h-12 rounded-[10px] border border-border px-3 text-text-primary"
              placeholder="0.00"
            />
            <View className="flex-row items-center justify-end gap-2.5">
              <Pressable onPress={() => setPayingBill(null)} className="p-3">
                <Text>{t("common.back")}</Text>
              </Pressable>
              <Pressable
                disabled={savingPayment}
                onPress={submitCreditPayment}
                className="mt-2.5 self-start rounded-[10px] bg-warning-bg px-3.5 py-2.5"
              >
                <Text className="font-bold text-[#B45309]">
                  {savingPayment
                    ? t("common.loading")
                    : t("salesHistory.recordPayment")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={detailsLoading || Boolean(selectedSale)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSale(null)}
      >
        <View className="flex-1 justify-center bg-black/40 p-6">
          <View className="gap-3.5 rounded-[18px] bg-white p-5">
            {detailsLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : selectedSale ? (
              <>
                <SaleSummary
                  sale={selectedSale}
                  t={t}
                  showStatus
                  showCreditPayments
                />
                <View className="flex-row items-center justify-end gap-2.5">
                  <Pressable
                    onPress={() => setSelectedSale(null)}
                    className="p-3"
                  >
                    <Text>{t("common.back")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={printSelectedReceipt}
                    className="mt-2.5 self-start rounded-[10px] bg-warning-bg px-3.5 py-2.5"
                  >
                    <Text className="font-bold text-[#B45309]">
                      {t("pos.printReceipt")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={shareSelectedReceipt}
                    className="mt-2.5 self-start rounded-[10px] bg-warning-bg px-3.5 py-2.5"
                  >
                    <Text className="font-bold text-[#B45309]">
                      {t("pos.shareReceipt")}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
