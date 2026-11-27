import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import theme from "../../constants/theme";
import { getSalesSummary } from "../../services/saleService";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const getPeriod = (period) => {
  const today = new Date();
  const to = dateKey(today);
  if (period === "today") return { from: to, to };
  if (period === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { from: dateKey(start), to };
  }
  if (period === "custom") return null;
  return {
    from: dateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
    to,
  };
};

export default function ReportsScreen() {
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const { token, shop } = useAuth();
  const router = useRouter();
  const [periodType, setPeriodType] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const range = useMemo(
    () =>
      getPeriod(periodType) ||
      (customFrom && customTo ? { from: customFrom, to: customTo } : null),
    [periodType, customFrom, customTo],
  );
  const load = useCallback(
    async (refresh = false) => {
      const current = ++requestId.current;
      if (!token || !range) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const result = await getSalesSummary(token, range);
        if (current === requestId.current) setSummary(result);
      } catch (_requestError) {
        if (current === requestId.current) setError(true);
      } finally {
        if (current === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [range, token],
  );
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const periodLabels = {
    today: t("reports.today"),
    week: t("reports.week"),
    month: t("reports.month"),
    custom: t("reports.custom"),
  };
  return (
    <KeyboardAvoidingView
      className="bg-background"
      style={{ height: height - 56 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <ScrollView
        contentContainerClassName="gap-3.5 px-4 pt-4 pb-[30px]"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1">
            <Text className="text-2xl font-bold leading-8 text-text-primary">
              {t("reports.title")}
            </Text>
            <Text
              className="mt-0.5 text-xs leading-4.25 text-text-secondary"
              numberOfLines={1}
            >
              {shop?.name || shop?.shopName || t("reports.shopSubtitle")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("reports.refresh")}
            onPress={() => load(true)}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <MaterialCommunityIcons
              name="refresh"
              size={23}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        <View className="flex-row gap-1.5">
          {["today", "week", "month", "custom"].map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: periodType === key }}
              onPress={() => {
                setPeriodType(key);
                if (key === "custom") setSummary(null);
              }}
              className={
                periodType === key
                  ? "min-h-9.5 flex-1 items-center justify-center rounded-full bg-primary px-1.25"
                  : "min-h-9.5 flex-1 items-center justify-center rounded-full bg-[#E4F1E7] px-1.25"
              }
            >
              <Text
                className={
                  periodType === key
                    ? "text-[11px] font-semibold text-white"
                    : "text-[11px] font-semibold text-text-secondary"
                }
              >
                {periodLabels[key]}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row items-center gap-2 rounded-[10px] bg-white p-2.5">
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text className="min-w-0 flex-1 text-[13px] font-medium text-text-primary">
            {summary?.period
              ? `${summary.period.from} – ${summary.period.to}`
              : range
                ? `${range.from} – ${range.to}`
                : t("reports.selectDates")}
          </Text>
        </View>

        {loading && !summary ? (
          <View className="items-center justify-center gap-3 p-7">
            <ActivityIndicator color={theme.colors.primary} />
            <Text className="text-center text-sm leading-5 text-text-secondary">
              {t("common.loading")}
            </Text>
          </View>
        ) : null}
        {error && !summary ? (
          <View className="items-center justify-center gap-3 p-7">
            <Text className="text-center text-sm leading-5 text-text-secondary">
              {t("reports.loadFailed")}
            </Text>
            <Pressable
              onPress={() => load()}
              className="rounded-[10px] bg-surface-mint px-4 py-2.5"
            >
              <Text className="font-bold text-primary">
                {t("common.retry")}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {error && summary ? (
          <View className="flex-row items-center justify-between rounded-xl bg-error-bg p-3">
            <Text className="text-center text-sm leading-5 text-text-secondary">
              {t("reports.loadFailed")}
            </Text>
            <Pressable onPress={() => load(true)}>
              <Text className="font-bold text-primary">
                {t("common.retry")}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {periodType === "custom" ? (
          <View className="gap-2.5 rounded-xl bg-white p-3">
            <Text className="text-xs leading-4.25 text-text-secondary">
              {t("reports.customHint")}
            </Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={customFrom}
                onChangeText={setCustomFrom}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                className="h-10 min-w-0 flex-1 rounded-[10px] border border-border px-2.25 text-text-primary"
              />
              <Text className="text-xs leading-4.25 text-text-secondary">
                –
              </Text>
              <TextInput
                value={customTo}
                onChangeText={setCustomTo}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                className="h-10 min-w-0 flex-1 rounded-[10px] border border-border px-2.25 text-text-primary"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (customFrom && customTo) load();
              }}
              className="self-end rounded-[10px] bg-surface-mint px-3.5 py-2.25"
            >
              <Text className="font-bold text-primary">
                {t("salesHistory.applyDates")}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {summary ? (
          <>
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-lg font-semibold leading-6 text-text-primary">
                {t("reports.overview")}
              </Text>
              <Text className="text-xs leading-4.25 text-text-secondary">
                {t("reports.completedBills")}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2.5">
              <Metric
                icon="cash-multiple"
                label={t("reports.sales")}
                value={money(summary.salesTotal)}
                detail={t("reports.billCount", { count: summary.billCount })}
              />
              <Metric
                icon="wallet-outline"
                label={t("reports.amountCollected")}
                value={money(summary.amountCollected)}
                detail={t("reports.receivedOnly")}
              />
              <Metric
                icon="chart-line"
                label={t("reports.grossProfit")}
                value={money(summary.grossProfit.amount)}
                detail={t("reports.profitCoverage", {
                  count: summary.grossProfit.fullyCostedBills,
                  missing: summary.grossProfit.billsMissingCost,
                })}
              />
              <Metric
                icon="receipt-text-outline"
                label={t("reports.bills")}
                value={String(summary.billCount)}
                detail={t("reports.averageBill", {
                  amount: money(summary.averageBill),
                })}
              />
              <Metric
                icon="archive-outline"
                label={t("reports.stockValue")}
                value={money(summary.inventory.stockValue)}
                detail={t("reports.productCount", {
                  count: summary.inventory.activeProductCount,
                })}
              />
              <Metric
                icon="tag-outline"
                label={t("reports.costCoverage")}
                value={String(
                  Math.max(
                    0,
                    summary.inventory.activeProductCount -
                      summary.inventory.productsMissingPurchasePrice,
                  ),
                )}
                detail={t("reports.costCoverageHint", {
                  count: summary.inventory.productsMissingPurchasePrice,
                })}
              />
            </View>

            <View className="gap-3.5 rounded-card bg-white p-4">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={21}
                  color={theme.colors.primary}
                />
                <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
                  {t("reports.paymentSplit")}
                </Text>
              </View>
              {summary.payments.length ? (
                summary.payments.map((payment) => (
                  <View
                    key={payment.method}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            payment.method === "CASH"
                              ? theme.colors.primary
                              : payment.method === "UPI"
                                ? "#2563EB"
                                : "#D97706",
                        }}
                      />
                      <Text className="text-sm leading-5 text-text-primary">
                        {t(`pos.methods.${payment.method}`)}
                      </Text>
                      <Text className="text-xs leading-4.25 text-text-secondary">
                        {payment.billCount}
                      </Text>
                    </View>
                    <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
                      {money(payment.amount)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm leading-5 text-text-secondary">
                  {t("reports.noSales")}
                </Text>
              )}
              {summary.creditSales?.billCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/sales/history",
                      params: { paymentMethod: "UDHAR" },
                    })
                  }
                  className="flex-row items-start gap-2.5 rounded-card bg-surface-mint p-3.5"
                >
                  <MaterialCommunityIcons
                    name="book-outline"
                    size={21}
                    color="#B45309"
                  />
                  <Text className="min-w-0 flex-1 text-xs leading-4.75 text-text-secondary">
                    {t("reports.unpaidCredit", {
                      amount: money(summary.creditSales.amount),
                      count: summary.creditSales.billCount,
                    })}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#B45309"
                  />
                </Pressable>
              ) : null}
            </View>
            <View className="flex-row items-start gap-2.5 rounded-card bg-surface-mint p-3.5">
              <MaterialCommunityIcons
                name="information-outline"
                size={21}
                color={theme.colors.primary}
              />
              <Text className="min-w-0 flex-1 text-xs leading-4.75 text-text-secondary">
                {t("reports.accountingUnavailable")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/sales/history")}
              className="min-h-12.5 flex-row items-center justify-between rounded-xl bg-primary px-4"
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={20}
                color="#fff"
              />
              <Text className="mx-2 flex-1 text-[15px] font-bold text-white">
                {t("reports.viewBills")}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color="#fff"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/sales")}
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-white"
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text className="text-sm font-bold text-primary">
                {t("reports.newSale")}
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Metric({ icon, label, value, detail }) {
  return (
    <View className="min-h-30 w-[48%] grow justify-between rounded-card bg-white p-3.5">
      <View className="flex-row items-center justify-between gap-1.5">
        <Text className="min-w-0 flex-1 text-xs leading-4.25 text-text-secondary">
          {label}
        </Text>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={theme.colors.primary}
        />
      </View>
      <Text
        className="mt-2 text-lg font-semibold leading-6 text-text-primary"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        className="mt-0.75 text-xs leading-4.25 text-text-secondary"
        numberOfLines={1}
      >
        {detail}
      </Text>
    </View>
  );
}
