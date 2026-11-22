import {
  Card,
  Button,
  Field,
  MethodSelector,
  Notice,
  ScrollPage,
  errorText,
  money,
  toMinorUnits,
  styles,
} from "../purchase-management/PurchaseManagementUI";
import { View, Pressable, Text } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";
import * as purchasesApi from "../../services/purchaseService";
import { getProducts } from "../../services/productService";

export function PurchaseCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams();
  const [supplierRows, setSupplierRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState(params.supplierId || "");
  const [lines, setLines] = useState([]);
  const [form, setForm] = useState({
    supplierInvoiceNumber: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    additionalDiscount: "0",
    additionalDiscountPercent: "0",
    additionalDiscountMode: "AMOUNT",
    additionalCharges: "0",
    notes: "",
    initialAmount: "",
    initialMethod: "CASH",
    initialPaymentDate: new Date().toISOString().slice(0, 10),
  });
  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(null);
  useEffect(() => {
    Promise.all([
      suppliersApi.listSuppliers(token, {
        page: 1,
        limit: 100,
        isActive: "true",
      }),
      getProducts(token, { page: 1, limit: 100 }),
    ])
      .then(([s, p]) => {
        setSupplierRows(s.items || []);
        setProducts(p.items || []);
      })
      .catch((e) => setError(errorText(e, t("supplierPurchase.loadFailed"))));
  }, [token, t]);
  const discountPreview = useMemo(() => {
    const calculated = lines.map((line) => {
        const quantityScaled = Math.round(
          (Number(line.quantity) || 0) * 1_000_000,
        );
        const grossMinor = Math.round(
          (quantityScaled * toMinorUnits(line.unitPurchasePrice)) / 1_000_000,
        );
        const rawDiscount = line.discountMode === "PERCENTAGE"
          ? Math.round(grossMinor * Math.min(100, Math.max(0, Number(line.discountPercent) || 0)) / 100)
          : toMinorUnits(line.discountAmount || 0);
        const discountMinor = Math.min(grossMinor, rawDiscount);
        return { grossMinor, discountMinor, taxableMinor: grossMinor - discountMinor, rate: Math.round((Number(line.taxRate) || 0) * 100) };
      });
    const preTaxAmount = calculated.reduce((sum, line) => sum + line.taxableMinor, 0);
    const requestedDiscount = form.additionalDiscountMode === "PERCENTAGE"
      ? Math.round(preTaxAmount * Math.min(100, Math.max(0, Number(form.additionalDiscountPercent) || 0)) / 100)
      : toMinorUnits(form.additionalDiscount || 0);
    const overallDiscountMinor = Math.min(preTaxAmount, requestedDiscount);
    let allocatedDiscountMinor = 0;
    const taxMinor = calculated.reduce((sum, line, index) => {
      const share = index === calculated.length - 1
        ? overallDiscountMinor - allocatedDiscountMinor
        : preTaxAmount > 0 ? Math.floor(line.taxableMinor * overallDiscountMinor / preTaxAmount) : 0;
      allocatedDiscountMinor += share;
      return sum + Math.round((Math.max(0, line.taxableMinor - share) * line.rate) / 10_000);
    }, 0);
    return {
      discountMinor: calculated.reduce((sum, line) => sum + line.discountMinor, 0) + overallDiscountMinor,
      totalMinor: Math.max(0, preTaxAmount - overallDiscountMinor + taxMinor + toMinorUnits(form.additionalCharges || 0)),
    };
  }, [lines, form.additionalDiscount, form.additionalDiscountPercent, form.additionalDiscountMode, form.additionalCharges]);
  const patchLine = (index, patch) =>
    setLines((old) =>
      old.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  const addProduct = (productId) => {
    if (!productId || lines.some((line) => line.productId === productId))
      return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLines((old) => [
      ...old,
      {
        productId,
        name: product.name,
        unit: product.unit,
        quantity: "1",
        unitPurchasePrice: String(product.purchasePrice || "0"),
        discountAmount: "0",
        discountPercent: "0",
        discountMode: "AMOUNT",
        taxRate: "0",
      },
    ]);
  };
  const submit = async () => {
    setError("");
    if (!supplierId || lines.length === 0)
      return setError(t("supplierPurchase.purchaseRequired"));
    const parsed = lines.map(({ name, unit, discountMode, discountAmount, discountPercent, ...line }) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      unitPurchasePrice: Number(line.unitPurchasePrice),
      [discountMode === "PERCENTAGE" ? "discountPercent" : "discountAmount"]: Number(discountMode === "PERCENTAGE" ? discountPercent || 0 : discountAmount || 0),
      taxRate: Number(line.taxRate || 0),
    }));
    if (
      parsed.some(
        (line) =>
          !Number.isFinite(line.quantity) ||
          line.quantity <= 0 ||
          !Number.isFinite(line.unitPurchasePrice) ||
          line.unitPurchasePrice < 0 ||
          !Number.isFinite(line.discountAmount ?? line.discountPercent) ||
          (line.discountAmount ?? line.discountPercent) < 0 ||
          (line.discountPercent !== undefined && line.discountPercent > 100) ||
          !Number.isFinite(line.taxRate) ||
          line.taxRate < 0 ||
          line.taxRate > 28,
      )
    )
      return setError(t("supplierPurchase.invalidPurchaseLine"));
    if (!idempotencyKey.current)
      idempotencyKey.current = `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setBusy(true);
    try {
      const payload = {
        supplierId,
        purchaseDate: new Date(`${form.purchaseDate}T12:00:00`).toISOString(),
        items: parsed,
        additionalCharges: Number(form.additionalCharges || 0),
        notes: form.notes,
      };
      payload[form.additionalDiscountMode === "PERCENTAGE" ? "additionalDiscountPercent" : "additionalDiscount"] = Number(form.additionalDiscountMode === "PERCENTAGE" ? form.additionalDiscountPercent || 0 : form.additionalDiscount || 0);
      if (form.supplierInvoiceNumber.trim())
        payload.supplierInvoiceNumber = form.supplierInvoiceNumber.trim();
      if (form.dueDate)
        payload.dueDate = new Date(`${form.dueDate}T12:00:00`).toISOString();
      if (Number(form.initialAmount) > 0)
        payload.initialPayment = {
          amount: Number(form.initialAmount),
          paymentMethod: form.initialMethod,
          paymentDate: new Date(
            `${form.initialPaymentDate}T12:00:00`,
          ).toISOString(),
        };
      const purchase = await purchasesApi.createPurchase(
        token,
        payload,
        idempotencyKey.current,
      );
      router.replace(`/purchases/${purchase.id}`);
    } catch (e) {
      setError(errorText(e, t("supplierPurchase.saveFailed")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollPage title={t("supplierPurchase.newPurchase")}>
      {error ? <Notice text={error} /> : null}
      <Text style={styles.sectionTitle}>
        {t("supplierPurchase.chooseSupplier")}
      </Text>
      <Field
        label={t("supplierPurchase.searchSuppliers")}
        value={supplierSearch}
        onChangeText={setSupplierSearch}
      />
      {supplierRows
        .filter((item) =>
          `${item.supplierName} ${item.phoneNumber}`
            .toLowerCase()
            .includes(supplierSearch.toLowerCase()),
        )
        .map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setSupplierId(item.id)}
            style={[
              styles.selectRow,
              supplierId === item.id && styles.selectSelected,
            ]}
          >
            <Text style={styles.body}>
              {item.supplierName} · {item.phoneNumber}
            </Text>
            <Text style={styles.selectMark}>
              {supplierId === item.id ? "●" : "○"}
            </Text>
          </Pressable>
        ))}
      <Field
        label={t("supplierPurchase.invoiceNumber")}
        value={form.supplierInvoiceNumber}
        onChangeText={(v) => setForm({ ...form, supplierInvoiceNumber: v })}
      />
      <Field
        label={t("supplierPurchase.purchaseDate")}
        value={form.purchaseDate}
        onChangeText={(v) => setForm({ ...form, purchaseDate: v })}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={10}
      />
      <Field
        label={t("supplierPurchase.dueDate")}
        value={form.dueDate}
        onChangeText={(v) => setForm({ ...form, dueDate: v })}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={10}
      />
      <Text style={styles.sectionTitle}>{t("supplierPurchase.addItems")}</Text>
      <Field
        label={t("supplierPurchase.searchProducts")}
        value={productSearch}
        onChangeText={setProductSearch}
      />
      {products
        .filter((product) =>
          `${product.name} ${product.sku || ""}`
            .toLowerCase()
            .includes(productSearch.toLowerCase()),
        )
        .map((product) => (
          <Pressable
            key={product.id}
            onPress={() => addProduct(product.id)}
            style={styles.selectRow}
          >
            <Text style={styles.body}>
              {product.name} · {product.unit}
            </Text>
            <Text style={styles.addText}>＋</Text>
          </Pressable>
        ))}
      {lines.map((line, index) => (
        <Card key={line.productId}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{line.name}</Text>
            <Pressable
              onPress={() =>
                setLines((old) => old.filter((_, i) => i !== index))
              }
            >
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.muted}>
            {t("supplierPurchase.unit")}: {line.unit}
          </Text>
          <Field
            label={t("supplierPurchase.quantity")}
            value={line.quantity}
            onChangeText={(v) => patchLine(index, { quantity: v })}
            keyboardType="decimal-pad"
          />
          <Field
            label={t("supplierPurchase.unitPrice")}
            value={line.unitPurchasePrice}
            onChangeText={(v) => patchLine(index, { unitPurchasePrice: v })}
            keyboardType="decimal-pad"
          />
          <DiscountModeSelector value={line.discountMode} onChange={(v) => patchLine(index, { discountMode: v })} t={t} />
          <Field
            label={`${t("supplierPurchase.discount")} (${line.discountMode === "PERCENTAGE" ? "%" : "₹"})`}
            value={line.discountMode === "PERCENTAGE" ? line.discountPercent : line.discountAmount}
            onChangeText={(v) => patchLine(index, line.discountMode === "PERCENTAGE" ? { discountPercent: v } : { discountAmount: v })}
            keyboardType="decimal-pad"
          />
          <Field
            label={t("supplierPurchase.taxPercent")}
            value={line.taxRate}
            onChangeText={(v) => patchLine(index, { taxRate: v })}
            keyboardType="decimal-pad"
          />
        </Card>
      ))}
      <DiscountModeSelector value={form.additionalDiscountMode} onChange={(v) => setForm({ ...form, additionalDiscountMode: v })} t={t} />
      <Field
        label={`${t("supplierPurchase.additionalDiscount")} (${form.additionalDiscountMode === "PERCENTAGE" ? "%" : "₹"})`}
        value={form.additionalDiscountMode === "PERCENTAGE" ? form.additionalDiscountPercent : form.additionalDiscount}
        onChangeText={(v) => setForm(form.additionalDiscountMode === "PERCENTAGE" ? { ...form, additionalDiscountPercent: v } : { ...form, additionalDiscount: v })}
        keyboardType="decimal-pad"
      />
      <Field
        label={t("supplierPurchase.additionalCharges")}
        value={form.additionalCharges}
        onChangeText={(v) => setForm({ ...form, additionalCharges: v })}
        keyboardType="decimal-pad"
      />
      <Field
        label={t("supplierPurchase.notes")}
        value={form.notes}
        onChangeText={(v) => setForm({ ...form, notes: v })}
        multiline
      />
      <Text style={styles.body}>{t("supplierPurchase.totalDiscount")}: −{money(discountPreview.discountMinor / 100)}</Text>
      <Text style={styles.preview}>
        {t("supplierPurchase.previewTotal")}:{" "}
        {money(discountPreview.totalMinor / 100)}
      </Text>
      <Text style={styles.muted}>{t("supplierPurchase.serverTotalHint")}</Text>
      <Text style={styles.sectionTitle}>
        {t("supplierPurchase.initialPayment")}
      </Text>
      <Field
        label={t("supplierPurchase.amount")}
        value={form.initialAmount}
        onChangeText={(v) => setForm({ ...form, initialAmount: v })}
        keyboardType="decimal-pad"
      />
      <MethodSelector
        value={form.initialMethod}
        onChange={(v) => setForm({ ...form, initialMethod: v })}
      />
      <Field
        label={t("supplierPurchase.paymentDate")}
        value={form.initialPaymentDate}
        onChangeText={(v) => setForm({ ...form, initialPaymentDate: v })}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={10}
      />
      <Button
        title={
          busy
            ? t("supplierPurchase.saving")
            : t("supplierPurchase.postPurchase")
        }
        disabled={busy}
        onPress={submit}
      />
    </ScrollPage>
  );
}

function DiscountModeSelector({ value, onChange, t }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 4 }}>
      {["AMOUNT", "PERCENTAGE"].map((mode) => (
        <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: value === mode }} onPress={() => onChange(mode)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: value === mode ? "#E5F3EC" : "#F1F3F5", borderWidth: 1, borderColor: value === mode ? "#23804A" : "#D9DEE3" }}>
          <Text style={{ color: value === mode ? "#17663A" : "#444", fontWeight: "600" }}>{mode === "AMOUNT" ? `₹ ${t("supplierPurchase.amountMode")}` : `% ${t("supplierPurchase.percentageMode")}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}
