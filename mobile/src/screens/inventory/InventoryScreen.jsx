import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as inventoryService from "../../services/inventoryService";
import theme from "../../constants/theme";
import KeyboardAwareList from "../../components/keyboard/KeyboardAwareList";

const filters = ["all", "inStock", "lowStock", "outOfStock"];
const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function InventoryScreen() {
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, shop } = useAuth();
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState(String(params.categoryId || ""));
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      setError("");
      try {
        const [overview, list, groups] = await Promise.all([
          inventoryService.getSummary(token),
          inventoryService.getProducts(token, {
            page: nextPage,
            limit: 20,
            search: search.trim(),
            status,
            categoryId,
          }),
          inventoryService.getCategories(token),
        ]);
        setSummary(overview);
        setProducts((current) =>
          append ? [...current, ...list.items] : list.items,
        );
        setCategories(groups);
        setPage(list.page);
        setPages(list.pages);
        setLoading(false);
      } catch (requestError) {
        setError(requestError.message);
        setLoading(false);
      }
    },
    [token, search, status, categoryId],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1);
    }, [load]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      load(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, load]);
  const refresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const quickActions = [
    {
      label: t("inventory.addProduct"),
      icon: "plus-box-outline",
      path: "/products/new",
    },
    {
      label: t("inventory.categories"),
      icon: "shape-outline",
      path: "/categories",
    },
    {
      label: t("inventory.stockIn"),
      icon: "tray-arrow-down",
      path: "/stock/in",
    },
    {
      label: t("inventory.stockOut"),
      icon: "tray-arrow-up",
      path: "/stock/out",
    },
    {
      label: t("inventory.adjust"),
      icon: "tune-variant",
      path: "/stock/adjust",
    },
    { label: t("inventory.history"), icon: "history", path: "/stock/history" },
  ];

  const metrics = [
    [
      t("inventory.totalProducts"),
      summary?.totalProducts ?? "—",
      "cube-outline",
    ],
    [
      t("inventory.totalCategories"),
      summary?.totalCategories ?? "—",
      "shape-outline",
    ],
    [
      t("inventory.stockValue"),
      formatMoney(summary?.totalStockValue),
      "currency-inr",
    ],
    [
      t("inventory.lowStock"),
      summary?.lowStockProducts ?? "—",
      "alert-outline",
    ],
    [
      t("inventory.outOfStock"),
      summary?.outOfStockProducts ?? "—",
      "package-variant-remove",
    ],
  ];

  const categoryName = (id) =>
    categories.find((category) => category.id === id)?.name || "";
  const statusLabel = (value) => t(`inventory.status.${value}`);
  const renderProduct = ({ item }) => {
    const tone =
      item.stockStatus === "outOfStock"
        ? "danger"
        : item.stockStatus === "lowStock"
          ? "warning"
          : "success";
    return (
      <Pressable
        className="min-h-23.5 mb-2.25 flex-row items-center gap-2.5 rounded-card border border-border bg-white p-2.75"
        onPress={() =>
          router.push({ pathname: "/products/[id]", params: { id: item.id } })
        }
        accessibilityRole="button"
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="h-13.5 w-13.5 items-center justify-center rounded-[11px] bg-surface-tint"
          />
        ) : (
          <View className="h-13.5 w-13.5 items-center justify-center rounded-[11px] bg-surface-tint">
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={26}
              color={theme.colors.primary}
            />
          </View>
        )}
        <View className="min-w-0 flex-1">
          <Text
            className="text-[15px] leading-5.25 font-semibold text-text-primary"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
            {item.sku || item.barcode || t("inventory.noSku")} ·{" "}
            {item.categoryName || categoryName(item.categoryId)}
          </Text>
          <View className="mt-1.25 flex-row justify-between">
            <Text className="text-xs leading-4.25 font-semibold text-text-primary">
              {item.quantity} {item.unit}
            </Text>
            <Text className="text-xs leading-4.25 font-bold text-primary">
              {formatMoney(item.sellingPrice)}
            </Text>
          </View>
        </View>
        <View
          className={
            tone === "danger"
              ? "rounded-[7px] bg-error-bg px-1.75 py-1.25"
              : tone === "warning"
                ? "rounded-[7px] bg-warning-bg px-1.75 py-1.25"
                : "rounded-[7px] bg-[#E8F5EC] px-1.75 py-1.25"
          }
        >
          <Text
            className={
              tone === "danger"
                ? "text-[10px] font-bold text-error"
                : tone === "warning"
                  ? "text-[10px] font-bold text-[#B45309]"
                  : "text-[10px] font-bold text-primary"
            }
          >
            {statusLabel(item.stockStatus)}
          </Text>
        </View>
      </Pressable>
    );
  };
  if (loading && !summary)
    return (
      <View className="flex-1 bg-background">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ height: height - 56 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
      >
        <KeyboardAwareList
          className="flex-1"
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerClassName="px-4 pb-5"
          ListHeaderComponent={
            <>
              <View className="flex-row items-center justify-between pt-2.5 pb-3.5">
                <View>
                  <Text className="text-2xl font-bold leading-8 text-text-primary">
                    {t("inventory.title")}
                  </Text>
                  <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
                    {shop?.shopName || t("inventory.shopContext")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/inventory/alerts")}
                  className="h-11.5 w-11.5 items-center justify-center rounded-card border border-border bg-white"
                  accessibilityLabel={t("inventory.alerts")}
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                  {(summary?.lowStockProducts || 0) +
                    (summary?.outOfStockProducts || 0) >
                    0 && (
                    <View className="absolute right-2.75 top-2.5 h-2 w-2 rounded-full bg-error" />
                  )}
                </Pressable>
              </View>
              <FlatList
                horizontal
                data={metrics}
                keyExtractor={(item) => item[0]}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2.5 pb-[7px]"
                renderItem={({ item }) => (
                  <View className="min-h-21 w-38.75 justify-between rounded-card border border-border bg-white p-3">
                    <View className="flex-row items-center gap-1.5">
                      <MaterialCommunityIcons
                        name={item[2]}
                        size={17}
                        color={theme.colors.primary}
                      />
                      <Text className="shrink text-xs leading-4.25 text-text-secondary">
                        {item[0]}
                      </Text>
                    </View>
                    <Text className="mt-1.75 text-lg font-semibold leading-6 text-text-primary">
                      {item[1]}
                    </Text>
                  </View>
                )}
              />
              <Text className="mt-5.75 mb-2.75 text-lg font-semibold leading-6 text-text-primary">
                {t("inventory.quickActions")}
              </Text>
              <View className="flex-row flex-wrap gap-2.25">
                {quickActions.map((action) => (
                  <Pressable
                    key={action.path}
                    onPress={() => router.push(action.path)}
                    className="min-h-20.5 w-[31.5%] items-center justify-center gap-1.5 rounded-[13px] border border-border bg-white p-2.25"
                  >
                    <MaterialCommunityIcons
                      name={action.icon}
                      size={22}
                      color={theme.colors.primary}
                    />
                    <Text className="text-center text-xs leading-4.25 text-text-primary">
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-5.75 mb-2.75 text-lg font-semibold leading-6 text-text-primary">
                {t("inventory.products")}
              </Text>
              <View className="h-12 flex-row items-center gap-2 rounded-[11px] border border-border bg-white px-3">
                <MaterialCommunityIcons
                  name="magnify"
                  size={21}
                  color={theme.colors.muted}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t("inventory.searchPlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  className="min-w-0 flex-1 py-0 text-sm text-text-primary"
                  returnKeyType="search"
                />
              </View>
              <FlatList
                horizontal
                data={filters}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 py-3"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setStatus(item);
                      setPage(1);
                    }}
                    className={
                      status === item
                        ? "min-h-9 justify-center rounded-lg bg-primary px-3.25"
                        : "min-h-9 justify-center rounded-lg bg-surface-subtle px-3.25"
                    }
                  >
                    <Text
                      className={
                        status === item
                          ? "text-xs leading-4.25 text-white"
                          : "text-xs leading-4.25 text-text-secondary"
                      }
                    >
                      {t(`inventory.filter.${item}`)}
                    </Text>
                  </Pressable>
                )}
              />
              {categories.length > 0 ? (
                <FlatList
                  horizontal
                  data={[
                    {
                      id: "",
                      name: t("inventory.allCategories"),
                      productCount: summary?.totalProducts || 0,
                    },
                    ...categories,
                  ]}
                  keyExtractor={(item) => item.id || "all"}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 py-3"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => setCategoryId(item.id)}
                      className={
                        categoryId === item.id
                          ? "min-h-9 justify-center rounded-lg bg-primary px-3.25"
                          : "min-h-9 justify-center rounded-lg bg-surface-subtle px-3.25"
                      }
                    >
                      <Text
                        className={
                          categoryId === item.id
                            ? "text-xs leading-4.25 text-white"
                            : "text-xs leading-4.25 text-text-secondary"
                        }
                      >
                        {item.name}{" "}
                        {item.productCount != null ? item.productCount : ""}
                      </Text>
                    </Pressable>
                  )}
                />
              ) : null}
              {error ? (
                <Pressable
                  onPress={() => load(1)}
                  className="rounded-[10px] bg-error-bg p-3"
                >
                  <Text className="text-xs leading-4.25 text-error">
                    {error} · {t("common.retry")}
                  </Text>
                </Pressable>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View className="items-center gap-2 py-8.75">
                <MaterialCommunityIcons
                  name="package-variant"
                  size={34}
                  color={theme.colors.muted}
                />
                <Text className="text-lg font-semibold leading-6 text-text-primary">
                  {t("inventory.emptyTitle")}
                </Text>
                <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
                  {t("inventory.emptyBody")}
                </Text>
                <Pressable
                  onPress={() => router.push("/products/new")}
                  className="mt-2 min-h-12 justify-center rounded-xl bg-primary px-5"
                >
                  <Text className="font-bold text-white">
                    {t("inventory.addProduct")}
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          ListFooterComponent={
            page < pages ? (
              <Pressable
                className="items-center p-3.75"
                onPress={() => load(page + 1, true)}
              >
                <Text className="font-bold text-primary">
                  {t("inventory.loadMore")}
                </Text>
              </Pressable>
            ) : (
              <View className="h-6" />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}
