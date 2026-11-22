import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import * as inventoryService from "../../services/inventoryService";
import theme from "../../constants/theme";

const filters = ["all", "inStock", "lowStock", "outOfStock"];
const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function InventoryScreen() {
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
        style={styles.productCard}
        onPress={() =>
          router.push({ pathname: "/products/[id]", params: { id: item.id } })
        }
        accessibilityRole="button"
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productIcon} />
        ) : (
          <View style={styles.productIcon}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={26}
              color={theme.colors.primary}
            />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.muted}>
            {item.sku || item.barcode || t("inventory.noSku")} ·{" "}
            {item.categoryName || categoryName(item.categoryId)}
          </Text>
          <View style={styles.productMeta}>
            <Text style={styles.quantity}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.price}>{formatMoney(item.sellingPrice)}</Text>
          </View>
        </View>
        <View style={[styles.badge, styles[tone + "Badge"]]}>
          <Text style={[styles.badgeText, styles[tone + "Text"]]}>
            {statusLabel(item.stockStatus)}
          </Text>
        </View>
      </Pressable>
    );
  };
  if (loading && !summary)
    return (
      <SafeAreaView style={styles.page}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
      >
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t("inventory.title")}</Text>
                <Text style={styles.muted}>
                  {shop?.shopName || t("inventory.shopContext")}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/inventory/alerts")}
                style={styles.alertButton}
                accessibilityLabel={t("inventory.alerts")}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                {(summary?.lowStockProducts || 0) +
                  (summary?.outOfStockProducts || 0) >
                  0 && <View style={styles.alertDot} />}
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={metrics}
              keyExtractor={(item) => item[0]}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.metricRail}
              renderItem={({ item }) => (
                <View style={styles.metricCard}>
                  <View style={styles.metricLabelRow}>
                    <MaterialCommunityIcons
                      name={item[2]}
                      size={17}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.metricLabel}>{item[0]}</Text>
                  </View>
                  <Text style={styles.metricValue}>{item[1]}</Text>
                </View>
              )}
            />
            <Text style={styles.sectionTitle}>
              {t("inventory.quickActions")}
            </Text>
            <View style={styles.actions}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.path}
                  onPress={() => router.push(action.path)}
                  style={styles.actionCard}
                >
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={22}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.actionText}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sectionTitle}>{t("inventory.products")}</Text>
            <View style={styles.searchBox}>
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
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
            <FlatList
              horizontal
              data={filters}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRail}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setStatus(item);
                    setPage(1);
                  }}
                  style={[
                    styles.filterChip,
                    status === item && styles.filterSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      status === item && styles.filterTextSelected,
                    ]}
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
                contentContainerStyle={styles.filterRail}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setCategoryId(item.id)}
                    style={[
                      styles.filterChip,
                      categoryId === item.id && styles.filterSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        categoryId === item.id && styles.filterTextSelected,
                      ]}
                    >
                      {item.name}{" "}
                      {item.productCount != null ? item.productCount : ""}
                    </Text>
                  </Pressable>
                )}
              />
            ) : null}
            {error ? (
              <Pressable onPress={() => load(1)} style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error} · {t("common.retry")}
                </Text>
              </Pressable>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="package-variant"
                size={34}
                color={theme.colors.muted}
              />
              <Text style={styles.emptyTitle}>{t("inventory.emptyTitle")}</Text>
              <Text style={styles.muted}>{t("inventory.emptyBody")}</Text>
              <Pressable
                onPress={() => router.push("/products/new")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>
                  {t("inventory.addProduct")}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        ListFooterComponent={
          page < pages ? (
            <Pressable
              style={styles.loadMore}
              onPress={() => load(page + 1, true)}
            >
              <Text style={styles.link}>{t("inventory.loadMore")}</Text>
            </Pressable>
          ) : (
            <View style={{ height: 24 }} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  header: {
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { ...theme.typography.headline, color: theme.colors.textPrimary },
  muted: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  alertButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  metricRail: { gap: 10, paddingBottom: 7 },
  metricCard: {
    width: 155,
    minHeight: 84,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "space-between",
  },
  metricLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metricLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  metricValue: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginTop: 7,
  },
  sectionTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginTop: 23,
    marginBottom: 11,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  actionCard: {
    width: "31.5%",
    minHeight: 82,
    padding: 9,
    borderRadius: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: {
    ...theme.typography.small,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  searchBox: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  filterRail: { gap: 8, paddingVertical: 12 },
  filterChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  filterSelected: { backgroundColor: theme.colors.primary },
  filterText: { ...theme.typography.small, color: theme.colors.textSecondary },
  filterTextSelected: { color: "#fff" },
  productCard: {
    minHeight: 94,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 9,
  },
  productIcon: {
    width: 54,
    height: 54,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { ...theme.typography.label, color: theme.colors.textPrimary },
  productMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  quantity: {
    ...theme.typography.small,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  price: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  badge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  successBadge: { backgroundColor: "#E8F5EC" },
  successText: { color: theme.colors.primary },
  warningBadge: { backgroundColor: "#FFF5E5" },
  warningText: { color: "#B45309" },
  dangerBadge: { backgroundColor: "#FEECEC" },
  dangerText: { color: theme.colors.error },
  empty: { alignItems: "center", paddingVertical: 35, gap: 8 },
  emptyTitle: { ...theme.typography.title, color: theme.colors.textPrimary },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.errorBackground,
  },
  errorText: { color: theme.colors.error, ...theme.typography.small },
  loadMore: { alignItems: "center", padding: 15 },
  link: { color: theme.colors.primary, fontWeight: "700" },
});
