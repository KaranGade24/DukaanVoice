import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import theme from "../../constants/theme";
import { getCategories, getProducts } from "../../services/inventoryService";
import { createSale } from "../../services/saleService";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const toMinor = (value) => Math.round(Number(value) * 100);

function ProductCard({ product, onAdd, t }) {
  const outOfStock = product.quantity <= 0;
  return (
    <View style={styles.productCard}>
      <View style={styles.productImage}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImageContent}
          />
        ) : (
          <MaterialCommunityIcons
            name="package-variant"
            size={28}
            color={theme.colors.primary}
          />
        )}
      </View>
      <Text numberOfLines={2} style={styles.productName}>
        {product.name}
      </Text>
      <Text numberOfLines={1} style={styles.muted}>
        {outOfStock ? t("pos.outOfStock") : `${product.quantity} ${product.unit}`}
      </Text>
      <View style={styles.productBottom}>
        <Text style={styles.price}>{money(product.sellingPrice)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("pos.add")} ${product.name}`}
          accessibilityState={{ disabled: outOfStock }}
          disabled={outOfStock}
          onPress={() => onAdd(product)}
          style={[styles.addButton, outOfStock && styles.disabled]}
        >
          <Text style={styles.addText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BillLine({ line, onAdjust, t }) {
  const { product, quantity, subtotal } = line;
  return (
    <View style={styles.cartLine}>
      <View style={styles.lineDetails}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.muted}>
          {money(product.sellingPrice)} / {product.unit} · {t("pos.stock")}: {product.quantity}
        </Text>
        <Text style={styles.price}>{money(subtotal)}</Text>
      </View>
      <View style={styles.quantity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("pos.decrease")} ${product.name}`}
          onPress={() => onAdjust(product, -1)}
          style={styles.qtyButton}
        >
          <Text style={styles.qtyButtonText}>−</Text>
        </Pressable>
        <Text style={styles.qtyText}>{quantity}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("pos.increase")} ${product.name}`}
          accessibilityState={{ disabled: quantity >= product.quantity }}
          disabled={quantity >= product.quantity}
          onPress={() => onAdjust(product, 1)}
          style={[styles.qtyButton, quantity >= product.quantity && styles.disabled]}
        >
          <Text style={styles.qtyButtonText}>＋</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("pos.remove")} ${product.name}`}
        onPress={() => onAdjust(product, -quantity)}
        style={styles.removeButton}
      >
        <MaterialCommunityIcons
          name="delete-outline"
          size={21}
          color={theme.colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

function PaymentMethods({ value, onChange, t }) {
  return (
    <View style={styles.methods}>
      {["CASH", "UPI", "CARD"].map((method) => (
        <Pressable
          key={method}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === method }}
          onPress={() => onChange(method)}
          style={[styles.method, value === method && styles.methodActive]}
        >
          <Text
            numberOfLines={2}
            style={[styles.methodText, value === method && styles.methodActiveText]}
          >
            {t(`pos.methods.${method}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function PosScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [received, setReceived] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextCategories, result] = await Promise.all([
        getCategories(token),
        getProducts(token, { limit: 100, sortBy: "name", sortOrder: "asc" }),
      ]);
      const nextProducts = result.items || [];
      const productsById = new Map(nextProducts.map((product) => [product.id, product]));
      setCategories(nextCategories);
      setProducts(nextProducts);
      setCart((current) =>
        Object.fromEntries(
          Object.entries(current).map(([id, line]) => [
            id,
            { ...line, product: productsById.get(id) || line.product },
          ]),
        ),
      );
    } catch (requestError) {
      setError(requestError.message || t("pos.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = !categoryId || product.categoryId === categoryId;
        const searchText = `${product.name} ${product.sku} ${product.barcode}`.toLowerCase();
        return matchesCategory && searchText.includes(search.trim().toLowerCase());
      }),
    [products, categoryId, search],
  );
  const lines = useMemo(
    () =>
      Object.values(cart).map((line) => ({
        ...line,
        subtotal: Math.round(line.product.sellingPrice * line.quantity * 100) / 100,
      })),
    [cart],
  );
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const discountNumber = Number(discount);
  const discountValid =
    Number.isFinite(discountNumber) && discountNumber >= 0 && discountNumber <= subtotal;
  const discountValue = discountValid ? discountNumber : 0;
  const total = Math.max(0, Math.round((subtotal - discountValue) * 100) / 100);
  const receivedNumber = Number(received);
  const receivedValid = Number.isFinite(receivedNumber) && receivedNumber >= total;
  const tenderValid = paymentMethod === "CASH" || toMinor(receivedNumber) === toMinor(total);
  const canComplete = lines.length > 0 && discountValid && receivedValid && tenderValid && !saving;
  const unitCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const adjust = (product, delta) => {
    setCart((current) => {
      const existing = current[product.id];
      const quantity = (existing?.quantity || 0) + delta;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      if (quantity > product.quantity) return current;
      return { ...current, [product.id]: { product, quantity } };
    });
  };

  const selectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method !== "CASH") setReceived(total.toFixed(2));
  };

  const completeSale = async () => {
    if (!lines.length) return Alert.alert(t("pos.error"), t("pos.cartEmpty"));
    if (!discountValid) return Alert.alert(t("pos.error"), t("pos.invalidDiscount"));
    if (!receivedValid || !tenderValid)
      return Alert.alert(t("pos.error"), t("pos.invalidReceived"));

    const payload = {
      items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      discount: discountValue,
      amountReceived: receivedNumber,
      paymentMethod,
    };
    const fingerprint = JSON.stringify(payload);
    if (idempotencyKey.current?.fingerprint !== fingerprint) {
      idempotencyKey.current = {
        fingerprint,
        key: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      };
    }

    setSaving(true);
    try {
      const sale = await createSale(token, payload, idempotencyKey.current.key);
      idempotencyKey.current = null;
      setCart({});
      setDiscount("0");
      setReceived("");
      await load();
      Alert.alert(
        t("pos.saleComplete"),
        `${sale.saleNumber}\n${t("pos.total")}: ${money(sale.total)}\n${t("pos.change")}: ${money(sale.change)}`,
      );
    } catch (requestError) {
      Alert.alert(t("pos.error"), requestError.message || t("pos.saveFailed"));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const renderProduct = useCallback(
    ({ item }) => <ProductCard product={item} onAdd={(product) => adjust(product, 1)} t={t} />,
    [t],
  );
  const header = (
    <View style={styles.listHeader}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          style={styles.back}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t("pos.title")}</Text>
          <Text style={styles.muted}>{t("pos.subtitle")}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>POS</Text></View>
      </View>

      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("pos.search")}
          placeholderTextColor={theme.colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("pos.clearSearch")} onPress={() => setSearch("")}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => setCategoryId("")} style={[styles.chip, !categoryId && styles.chipActive]}>
          <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>
            {t("pos.all", { count: products.length })}
          </Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[styles.chip, categoryId === category.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>
              {category.name} · {category.productCount ?? 0}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.notice}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}><Text style={styles.link}>{t("common.retry")}</Text></Pressable>
        </View>
      ) : null}

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{t("pos.products")}</Text>
        <Text style={styles.muted}>{filteredProducts.length}</Text>
      </View>
    </View>
  );

  const bill = (
    <View style={styles.cartPanel}>
      <View style={styles.cartHeading}>
        <View style={styles.cartHeadingCopy}>
          <MaterialCommunityIcons name="basket-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t("pos.currentBill")}</Text>
          <Text style={styles.countBadge}>{lines.length} · {unitCount} {t("pos.units")}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setCart({})}>
          <Text style={styles.clear}>{t("pos.clear")}</Text>
        </Pressable>
      </View>

      {lines.length ? (
        lines.map((line) => (
          <BillLine key={line.product.id} line={line} onAdjust={adjust} t={t} />
        ))
      ) : (
        <Text style={styles.emptyCart}>{t("pos.cartEmpty")}</Text>
      )}

      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.muted}>{t("pos.subtotal")}</Text>
        <Text style={styles.summaryValue}>{money(subtotal)}</Text>
      </View>
      <View style={styles.inputRow}>
        <Text style={styles.muted}>{t("pos.discount")}</Text>
        <TextInput
          value={discount}
          onChangeText={setDiscount}
          selectTextOnFocus
          keyboardType="decimal-pad"
          accessibilityLabel={t("pos.discount")}
          style={[styles.smallInput, !discountValid && styles.inputError]}
        />
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.sectionTitle}>{t("pos.total")}</Text>
        <Text style={styles.total}>{money(total)}</Text>
      </View>

      <Text style={styles.paymentTitle}>{t("pos.paymentMethod")}</Text>
      <PaymentMethods value={paymentMethod} onChange={selectPaymentMethod} t={t} />
      <View style={styles.inputRow}>
        <Text style={styles.muted}>
          {paymentMethod === "CASH" ? t("pos.amountReceived") : t("pos.amountPaid")}
        </Text>
        <TextInput
          value={received}
          onChangeText={setReceived}
          selectTextOnFocus
          keyboardType="decimal-pad"
          placeholder={total.toFixed(2)}
          accessibilityLabel={paymentMethod === "CASH" ? t("pos.amountReceived") : t("pos.amountPaid")}
          style={[styles.smallInput, !receivedValid && styles.inputError]}
        />
      </View>
      {paymentMethod === "CASH" && receivedValid && receivedNumber > total ? (
        <View style={styles.changeRow}>
          <Text style={styles.muted}>{t("pos.change")}</Text>
          <Text style={styles.change}>{money(receivedNumber - total)}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.page} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
      >
        <View style={styles.frame}>
          <FlatList
            style={styles.catalog}
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(product) => product.id}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.catalogContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={header}
            ListFooterComponent={bill}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
              ) : (
                <Text style={styles.empty}>{t("pos.noProducts")}</Text>
              )
            }
          />
          <View style={styles.bottomBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canComplete }}
              disabled={!canComplete}
              onPress={completeSale}
              style={[styles.submit, !canComplete && styles.submitDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="receipt-text-outline" size={22} color="#fff" />
                  <Text numberOfLines={1} style={styles.submitText}>{t("pos.completeSale")}</Text>
                  <Text style={styles.submitTotal}>{money(total)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F8FA" },
  keyboardArea: { flex: 1 },
  frame: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center" },
  catalog: { flex: 1 },
  catalogContent: { paddingBottom: 12 },
  listHeader: { paddingBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, lineHeight: 25, fontWeight: "700", color: theme.colors.textPrimary },
  muted: { ...theme.typography.small, color: theme.colors.textSecondary },
  badge: { backgroundColor: "#D9FBE8", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: theme.colors.primary, fontWeight: "700", fontSize: 12 },
  search: { marginHorizontal: 16, marginTop: 8, marginBottom: 6, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, minHeight: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 10, color: theme.colors.textPrimary },
  chips: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  chip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 13, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "#fff" },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 2 },
  sectionTitle: { ...theme.typography.label, color: theme.colors.textPrimary },
  notice: { marginHorizontal: 16, padding: 10, borderRadius: 10, backgroundColor: theme.colors.errorBackground },
  errorText: { color: theme.colors.error, ...theme.typography.small },
  link: { color: theme.colors.primary, fontWeight: "700", paddingTop: 4 },
  productRow: { paddingHorizontal: 12, gap: 10 },
  productCard: { flex: 1, minWidth: 0, margin: 4, padding: 9, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: theme.colors.border },
  productImage: { height: 72, borderRadius: 9, backgroundColor: theme.colors.surfaceTint, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  productImageContent: { width: "100%", height: "100%" },
  productName: { color: theme.colors.textPrimary, fontWeight: "600", marginTop: 6 },
  productBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 },
  price: { color: theme.colors.textPrimary, fontWeight: "700" },
  addButton: { width: 36, height: 36, borderRadius: 9, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  addText: { color: "white", fontSize: 23, lineHeight: 27 },
  disabled: { opacity: 0.45 },
  loading: { marginVertical: 24 },
  empty: { textAlign: "center", padding: 22, color: theme.colors.textSecondary },
  cartPanel: { marginHorizontal: 12, marginTop: 8, marginBottom: 8, padding: 14, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: theme.colors.border },
  cartHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottomWidth: 1, borderColor: theme.colors.border },
  cartHeadingCopy: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  countBadge: { color: theme.colors.primary, backgroundColor: theme.colors.surfaceMint, borderColor: theme.colors.borderPrimary, borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, flexShrink: 1 },
  clear: { color: theme.colors.error, fontSize: 12, fontWeight: "600" },
  cartLine: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: "#EEF1EF" },
  lineDetails: { flex: 1, minWidth: 0 },
  quantity: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, overflow: "hidden" },
  qtyButton: { minWidth: 34, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F9F7" },
  qtyButtonText: { color: theme.colors.textPrimary, fontSize: 18 },
  qtyText: { minWidth: 26, textAlign: "center", color: theme.colors.textPrimary, fontWeight: "600" },
  removeButton: { width: 34, height: 40, alignItems: "center", justifyContent: "center" },
  emptyCart: { color: theme.colors.textSecondary, paddingVertical: 12 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  summaryValue: { color: theme.colors.textPrimary },
  inputRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 5 },
  smallInput: { width: 120, minHeight: 38, textAlign: "right", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6, color: theme.colors.textPrimary, backgroundColor: "#fff" },
  inputError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBackground },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 10 },
  total: { color: theme.colors.primary, fontSize: 24, lineHeight: 29, fontWeight: "800" },
  paymentTitle: { ...theme.typography.label, color: theme.colors.textPrimary, marginTop: 4, marginBottom: 6 },
  methods: { flexDirection: "row", gap: 8, marginBottom: 8 },
  method: { flex: 1, minWidth: 0, minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 4, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "#fff" },
  methodActive: { borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceMint },
  methodText: { fontSize: 12, textAlign: "center", color: theme.colors.textSecondary },
  methodActiveText: { color: theme.colors.primary, fontWeight: "700" },
  changeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, padding: 10, borderRadius: 10, backgroundColor: theme.colors.surfaceMint },
  change: { color: theme.colors.primary, fontWeight: "700" },
  bottomBar: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: "#fff" },
  submit: { minHeight: 50, borderRadius: 12, backgroundColor: "#07966E", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingHorizontal: 14 },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "700", flex: 1, minWidth: 0, marginLeft: 2 },
  submitTotal: { color: "#fff", fontWeight: "700" },
});
