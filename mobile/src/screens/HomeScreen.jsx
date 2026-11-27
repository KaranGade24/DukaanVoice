import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getSummary, getAlerts } from "../services/inventoryService";
import { getSales, getSalesSummary } from "../services/saleService";
import theme from "../constants/theme";
import LanguageSelector from "../components/auth/LanguageSelector";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, shop, token, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getSummary(token),
        getAlerts(token, { page: 1, limit: 6 }),
        getSalesSummary(token, { from: today(), to: today() }),
        getSales(token, { from: today(), to: today(), page: 1, limit: 5 }),
      ])
        .then(([inventory, alerts, sales, recent]) => {
          if (active) {
            setData({
              inventory,
              alerts: alerts.items || [],
              sales,
              recent: recent.items || [],
            });
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [token, refreshKey]),
  );
  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };
  const go = (path) => router.push(path);
  const inv = data?.inventory;
  const sales = data?.sales;
  const hours = Array.from({ length: 13 }, (_, index) => {
    const hour = index + 8;
    const current = sales?.hourlySales?.find((entry) => entry.hour === hour);
    return { hour, amount: current?.sales || 0 };
  });
  const peak = Math.max(0, ...hours.map((item) => item.amount));
  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-[18px] px-4 pt-4 pb-7">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <MaterialCommunityIcons
              name="storefront-outline"
              size={28}
              color={theme.colors.primary}
            />
            <View>
              <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">
                {shop?.shopName || t("home.title")}
              </Text>
              <Text className="text-xs leading-[17px] text-text-secondary">
                {shop?.city || user?.fullName || ""}
              </Text>
            </View>
          </View>
          <LanguageSelector />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("auth.logout")}
            onPress={handleLogout}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <MaterialCommunityIcons
              name="logout"
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold leading-6 text-text-primary">
              {t("home.greeting", {
                name: user?.fullName?.split(" ")[0] || "",
              })}
            </Text>
            <Text className="text-xs leading-[17px] text-text-secondary">{t("home.todayCounter")}</Text>
          </View>
          <Pressable onPress={() => go("/sales")} className="flex-row items-center gap-[5px] rounded-full bg-surface-mint p-[9px]">
            <MaterialCommunityIcons
              name="store-check-outline"
              size={17}
              color={theme.colors.primary}
            />
            <Text className="font-semibold text-primary">{t("home.activePos")}</Text>
          </Pressable>
        </View>
        {loading && !data ? (
          <ActivityIndicator
            color={theme.colors.primary}
            className="m-7"
          />
        ) : null}
        {error && !data ? (
          <Pressable
            onPress={() => {
              setLoading(true);
              setRefreshKey((value) => value + 1);
            }}
          >
            <Text className="text-center text-error">{t("home.loadFailed")}</Text>
          </Pressable>
        ) : null}
        {data ? (
          <>
            <View className="flex-row flex-wrap gap-2.5">
              <Metric
                icon="cash-multiple"
                label={t("home.todaySales")}
                value={money(sales?.salesTotal)}
                detail={t("home.bills", { count: sales?.billCount || 0 })}
              />
              <Metric
                icon="piggy-bank-outline"
                label={t("home.netMargin")}
                value={money(sales?.grossProfit?.amount)}
                detail={`${sales?.grossProfit?.fullyCostedBills || 0} ${t("home.costedBills")}`}
              />
              <Metric
                icon="package-variant"
                label={t("home.inventory")}
                value={`${inv?.totalActiveProducts || 0} ${t("home.items")}`}
                detail={`${inv?.lowStockProductCount || 0} ${t("home.lowStock")}`}
              />
              <Metric
                icon="wallet-outline"
                label={t("home.stockValue")}
                value={money(inv?.totalStockValuation)}
                detail={t("home.wholesaleCost")}
              />
            </View>
            <View className="flex-row justify-between rounded-2xl bg-surface-mint p-3">
              {[
                ["point-of-sale", "home.newSale", "/sales"],
                ["plus-box-outline", "home.addItem", "/products/new"],
                ["truck-outline", "home.stockIn", "/stock/in"],
                ["microphone-outline", "home.voiceAction", "/(tabs)/voice"],
              ].map(([icon, label, path], i) => (
                <Pressable
                  key={path}
                  onPress={() => go(path)}
                  className="flex-1 items-center gap-[5px]"
                >
                  <View
                    className={
                      i === 0
                        ? "h-[50px] w-[50px] items-center justify-center rounded-full bg-primary"
                        : "h-[50px] w-[50px] items-center justify-center rounded-full bg-white"
                    }
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={24}
                      color={i === 0 ? "#fff" : theme.colors.primary}
                    />
                  </View>
                  <Text className="text-center text-xs leading-[17px] text-text-secondary">{t(label)}</Text>
                </Pressable>
              ))}
            </View>
            <View className="gap-3 rounded-2xl border border-border bg-white p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold leading-6 text-text-primary">{t("home.storeRhythm")}</Text>
                <Text className="text-xs leading-[17px] text-text-secondary">{t("home.today")}</Text>
              </View>
              <View className="h-28 flex-row items-end justify-between gap-1">
                {hours.map((item) => (
                  <View key={item.hour} className="h-full flex-1 items-center justify-end">
                    <Text className="h-[15px] text-[8px] text-primary">
                      {item.amount > 0 ? money(item.amount) : ""}
                    </Text>
                    <View className="h-[68px] w-full items-center justify-end">
                      <View
                        className={
                          item.amount === peak && peak > 0
                            ? "w-3/4 rounded-[3px] bg-primary"
                            : "w-3/4 rounded-[3px] bg-[#DDEBE1]"
                        }
                        style={{
                          height: peak
                            ? Math.max(4, (item.amount / peak) * 62)
                            : 0,
                        }}
                      />
                    </View>
                    <Text
                      className={
                        item.amount === peak && peak > 0
                          ? "mt-[3px] text-[9px] font-bold text-primary"
                          : "mt-[3px] text-[9px] text-text-secondary"
                      }
                    >
                      {item.hour === 12
                        ? "12p"
                        : item.hour > 12
                          ? `${item.hour - 12}p`
                          : `${item.hour}a`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {data.alerts.length ? (
              <View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold leading-6 text-text-primary">
                    {t("home.stockAlerts")}
                  </Text>
                  <Pressable onPress={() => go("/inventory/alerts")}>
                    <Text className="font-semibold text-primary">
                      {t("home.viewAll", {
                        count: inv?.lowStockProductCount || 0,
                      })}
                    </Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2.5"
                >
                  {data.alerts.map((p) => (
                    <View key={p.id} className="w-[230px] gap-2 rounded-2xl border border-border bg-white p-3.5">
                      <Text className="self-start rounded-[10px] bg-[#FFF5E5] p-[5px] text-xs text-[#B45309]">
                        {t("home.left", { quantity: p.quantity, unit: p.unit })}
                      </Text>
                      <Text numberOfLines={1} className="text-[15px] leading-[21px] font-semibold text-text-primary">
                        {p.name}
                      </Text>
                      <Text className="text-xs leading-[17px] text-text-secondary">
                        {t("home.minimum", { quantity: p.minimumStock })}
                      </Text>
                      <Pressable onPress={() => go("/stock/in")}>
                        <Text className="font-semibold text-primary">{t("home.reorder")}</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold leading-6 text-text-primary">
                {t("home.recentInvoices")}
              </Text>
              <Pressable onPress={() => go("/sales/history")}>
                <Text className="font-semibold text-primary">{t("home.allBills")}</Text>
              </Pressable>
            </View>
            <View className="rounded-2xl border border-border bg-white p-3.5">
              {data.recent.length ? (
                data.recent.map((bill) => (
                  <View key={bill.id} className="flex-row items-center gap-2.5 border-b border-border py-2.5">
                    <MaterialCommunityIcons
                      name="receipt-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                    <View className="flex-1">
                      <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{bill.saleNumber}</Text>
                      <Text className="text-xs leading-[17px] text-text-secondary" numberOfLines={1}>
                        {(bill.itemNames || []).join(", ")}
                      </Text>
                    </View>
                    <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{money(bill.total)}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs leading-[17px] text-text-secondary">{t("home.noInvoices")}</Text>
              )}
            </View>
          </>
        ) : null}
        <Pressable onPress={() => go("/(tabs)/voice")} className="flex-row items-center gap-3 rounded-2xl bg-surface-mint p-4">
          <MaterialCommunityIcons
            name="microphone"
            size={27}
            color={theme.colors.primary}
          />
          <View className="flex-1">
            <Text className="text-[15px] leading-[21px] font-semibold text-primary">{t("home.voiceShortcut")}</Text>
            <Text className="text-xs leading-[17px] text-text-secondary">{t("home.voiceHint")}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
function Metric({ icon, label, value, detail }) {
  return (
    <View className="min-h-[108px] w-[48%] grow justify-between rounded-2xl border border-border bg-white p-3.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs leading-[17px] text-text-secondary">{label}</Text>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={theme.colors.primary}
        />
      </View>
      <Text className="text-lg font-semibold leading-6 text-text-primary" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-xs leading-[17px] text-text-secondary" numberOfLines={1}>
        {detail}
      </Text>
    </View>
  );
}
