import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import theme from "../../constants/theme";
import { calculateBillTotals } from "./billCalculations";
import { getCategories, getProducts } from "../../services/inventoryService";
import { createSale } from "../../services/saleService";
import ProductCard from "./ProductCard";
import ProductCatalogHeader from "./ProductCatalogHeader";
import PosBillPanel from "./PosBillPanel";
import PosBottomBar from "./PosBottomBar";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const toMinor = (value) => Math.round(Number(value) * 100);

export default function PosScreen() {
  const { height } = useWindowDimensions();
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
  const receivedIsAutomatic = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextCategories, result] = await Promise.all([
        getCategories(token),
        getProducts(token, { limit: 100, sortBy: "name", sortOrder: "asc" }),
      ]);
      const nextProducts = result.items || [];
      const productsById = new Map(
        nextProducts.map((product) => [product.id, product]),
      );
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
        const matchesCategory =
          !categoryId || product.categoryId === categoryId;
        const searchText =
          `${product.name} ${product.sku} ${product.barcode}`.toLowerCase();
        return (
          matchesCategory && searchText.includes(search.trim().toLowerCase())
        );
      }),
    [products, categoryId, search],
  );
  const lines = useMemo(
    () =>
      Object.values(cart).map((line) => ({
        ...line,
        subtotal:
          Math.round(line.product.sellingPrice * line.quantity * 100) / 100,
      })),
    [cart],
  );
  const subtotal = calculateBillTotals(lines).subtotal;
  const discountNumber = Number(discount);
  const discountValid =
    Number.isFinite(discountNumber) &&
    discountNumber >= 0 &&
    discountNumber <= subtotal;
  const discountValue = discountValid ? discountNumber : 0;
  const total = calculateBillTotals(lines, discountValue).total;
  useEffect(() => {
    if (paymentMethod === "UDHAR") {
      receivedIsAutomatic.current = true;
      setReceived("0");
    } else if (receivedIsAutomatic.current) {
      setReceived(total.toFixed(2));
    }
  }, [paymentMethod, total]);
  const receivedNumber = Number(received);
  const receivedValid =
    paymentMethod === "UDHAR"
      ? Number.isFinite(receivedNumber) && toMinor(receivedNumber) === 0
      : Number.isFinite(receivedNumber) && receivedNumber >= total;
  const tenderValid =
    paymentMethod === "UDHAR"
      ? toMinor(receivedNumber) === 0
      : paymentMethod === "CASH" || toMinor(receivedNumber) === toMinor(total);
  const canComplete =
    lines.length > 0 &&
    discountValid &&
    receivedValid &&
    tenderValid &&
    !saving;
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
    receivedIsAutomatic.current = true;
    setPaymentMethod(method);
    if (method === "UDHAR") setReceived("0");
    else setReceived(total.toFixed(2));
  };

  const completeSale = async () => {
    if (!lines.length) return Alert.alert(t("pos.error"), t("pos.cartEmpty"));
    if (!discountValid)
      return Alert.alert(t("pos.error"), t("pos.invalidDiscount"));
    if (!receivedValid || !tenderValid)
      return Alert.alert(t("pos.error"), t("pos.invalidReceived"));

    const payload = {
      items: lines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      })),
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
      receivedIsAutomatic.current = true;
      setReceived("0.00");
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
    ({ item }) => (
      <ProductCard
        product={item}
        onAdd={(product) => adjust(product, 1)}
        t={t}
      />
    ),
    [t],
  );
  const header = (
    <ProductCatalogHeader
      search={search}
      onSearchChange={setSearch}
      categories={categories}
      productsCount={products.length}
      categoryId={categoryId}
      onCategoryChange={setCategoryId}
      error={error}
      onRetry={load}
      resultCount={filteredProducts.length}
      onBack={() => router.back()}
      t={t}
    />
  );

  const bill = (
    <PosBillPanel
      lines={lines}
      unitCount={unitCount}
      subtotal={subtotal}
      discount={discount}
      discountValid={discountValid}
      total={total}
      paymentMethod={paymentMethod}
      received={received}
      receivedValid={receivedValid}
      receivedNumber={receivedNumber}
      onAdjust={adjust}
      onClear={() => setCart({})}
      onDiscountChange={setDiscount}
      onPaymentChange={selectPaymentMethod}
      onReceivedChange={(value) => {
        receivedIsAutomatic.current = false;
        setReceived(value);
      }}
      disabled={saving}
      t={t}
    />
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F6F8FA" }}
    >
      <KeyboardAvoidingView
        style={{ height: height - 56 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
      >
        <View className="w-full max-w-120 flex-1 self-center">
          <FlatList
            className="flex-1"
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(product) => product.id}
            numColumns={2}
            columnWrapperStyle={{ paddingHorizontal: 12, gap: 10 }}
            contentContainerClassName="pb-3"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={header}
            ListFooterComponent={bill}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator
                  color={theme.colors.primary}
                  className="my-6"
                />
              ) : (
                <Text className="p-5.5 text-center text-text-secondary">
                  {t("pos.noProducts")}
                </Text>
              )
            }
          />
          <PosBottomBar
            total={total}
            saving={saving}
            canComplete={canComplete}
            onComplete={completeSale}
            t={t}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
