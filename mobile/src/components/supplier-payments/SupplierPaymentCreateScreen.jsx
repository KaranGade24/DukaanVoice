import { Pressable, Text, View } from "react-native";
import {
  money,
  Button,
  Field,
  MethodSelector,
  Notice,
  ScrollPage,
  errorText,
  styles,
} from "../purchase-management/PurchaseManagementUI";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";
import * as purchasesApi from "../../services/purchaseService";

export function SupplierPaymentCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(params.supplierId || "");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierHasMore, setSupplierHasMore] = useState(true);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [outstanding, setOutstanding] = useState([]);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseHasMore, setPurchaseHasMore] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseId, setPurchaseId] = useState(params.purchaseId || "");
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().slice(0, 10),
    transactionReference: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(null);
  const loadSuppliers = useCallback(async (page, search, append = false) => {
    if (supplierLoading) return;
    setSupplierLoading(true);
    try {
      const data = await suppliersApi.listSuppliers(token, { page, limit: 20, isActive: "all", search });
      setSuppliers((old) => append ? [...old, ...(data.items || [])] : data.items || []);
      setSupplierPage(page);
      setSupplierHasMore(page < (data.pagination?.totalPages || 1));
    } catch (e) { setError(errorText(e, t("supplierPurchase.loadFailed"))); }
    finally { setSupplierLoading(false); }
  }, [token, t, supplierLoading]);
  useEffect(() => { const timer = setTimeout(() => loadSuppliers(1, supplierSearch), 300); return () => clearTimeout(timer); }, [supplierSearch, token]);
  const loadOutstanding = useCallback(async (page, append = false) => {
    if (!supplierId || purchaseLoading) return;
    setPurchaseLoading(true);
    try {
      const data = await suppliersApi.getSupplierOutstanding(token, supplierId, { page, limit: 20 });
      setOutstanding((old) => append ? [...old, ...(data.purchases || [])] : data.purchases || []);
      setPurchasePage(page);
      setPurchaseHasMore(page < (data.pagination?.totalPages || 1));
    } catch (e) { setError(errorText(e, t("supplierPurchase.loadFailed"))); }
    finally { setPurchaseLoading(false); }
  }, [token, supplierId, t, purchaseLoading]);
  useEffect(() => { if (supplierId) loadOutstanding(1); }, [supplierId, token]);
  const visiblePurchases = outstanding.filter((item) => `${item.purchaseReference} ${item.supplierInvoiceNumber || ""}`.toLowerCase().includes(purchaseSearch.trim().toLowerCase()));
  const selected = outstanding.find((item) => item.id === purchaseId);
  const submit = async () => {
    const amount = Number(form.amount);
    if (
      !supplierId ||
      !selected ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > selected.outstandingBalance
    )
      return setError(t("supplierPurchase.paymentAmountInvalid"));
    if (!idempotencyKey.current)
      idempotencyKey.current = `payment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setBusy(true);
    setError("");
    try {
      await purchasesApi.recordPurchasePayment(
        token,
        purchaseId,
        {
          amount,
          paymentMethod: form.paymentMethod,
          paymentDate: new Date(`${form.paymentDate}T12:00:00`).toISOString(),
          transactionReference: form.transactionReference,
          notes: form.notes,
        },
        idempotencyKey.current,
      );
      router.replace(`/purchases/${purchaseId}`);
    } catch (e) {
      setError(errorText(e, t("supplierPurchase.saveFailed")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollPage title={t("supplierPurchase.recordPayment")}>
      {error ? <Notice text={error} /> : null}
      <Text style={styles.sectionTitle}>
        {t("supplierPurchase.chooseSupplier")}
      </Text>
      <Field label={t("supplierPurchase.searchSuppliers")} value={supplierSearch} onChangeText={setSupplierSearch} autoCapitalize="none" />
      {suppliers.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            const nextSupplierId = supplierId === item.id ? "" : item.id;
            setSupplierId(nextSupplierId);
            setPurchaseId("");
            setOutstanding([]);
            setPurchaseSearch("");
            setForm((old) => ({ ...old, amount: "" }));
            idempotencyKey.current = null;
          }}
          style={[
            styles.selectRow,
            supplierId === item.id && styles.selectSelected,
          ]}
        >
          <Text style={styles.body}>{item.supplierName}</Text>
          <View accessibilityRole="radio" accessibilityState={{ checked: supplierId === item.id }} style={[styles.selectionIndicator, supplierId === item.id && styles.selectionIndicatorSelected]}>
            {supplierId === item.id ? <View style={styles.selectionDot} /> : null}
          </View>
        </Pressable>
      ))}
      {supplierHasMore ? <Button title={supplierLoading ? t("common.loading") : t("supplierPurchase.loadMore")} secondary disabled={supplierLoading} onPress={() => loadSuppliers(supplierPage + 1, supplierSearch, true)} /> : null}
      {supplierId ? <>
      <Text style={styles.sectionTitle}>
        {t("supplierPurchase.choosePurchase")}
      </Text>
      <Field label={t("supplierPurchase.searchPurchases")} value={purchaseSearch} onChangeText={setPurchaseSearch} autoCapitalize="none" />
      {visiblePurchases.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            const nextPurchaseId = purchaseId === item.id ? "" : item.id;
            setPurchaseId(nextPurchaseId);
            setForm((old) => ({
              ...old,
              amount: nextPurchaseId ? String(item.outstandingBalance) : "",
            }));
            idempotencyKey.current = null;
          }}
          style={[
            styles.selectRow,
            purchaseId === item.id && styles.selectSelected,
          ]}
        >
          <View>
            <Text style={styles.body}>{item.purchaseReference}</Text>
            <Text style={styles.muted}>
              {t("supplierPurchase.remaining")}:{" "}
              {money(item.outstandingBalance)}
            </Text>
          </View>
          <View accessibilityRole="radio" accessibilityState={{ checked: purchaseId === item.id }} style={[styles.selectionIndicator, purchaseId === item.id && styles.selectionIndicatorSelected]}>
            {purchaseId === item.id ? <View style={styles.selectionDot} /> : null}
          </View>
        </Pressable>
      ))}
      {purchaseHasMore ? <Button title={purchaseLoading ? t("common.loading") : t("supplierPurchase.loadMore")} secondary disabled={purchaseLoading} onPress={() => loadOutstanding(purchasePage + 1, true)} /> : null}
      </> : null}
      {selected ? (
        <>
          <Field
            label={t("supplierPurchase.amountToPaySupplier")}
            value={form.amount}
            onChangeText={(v) => setForm({ ...form, amount: v })}
            keyboardType="decimal-pad"
          />
          <Text style={styles.muted}>
            {t("supplierPurchase.remaining")}:{" "}
            {money(selected.outstandingBalance)}
          </Text>
          <MethodSelector
            value={form.paymentMethod}
            onChange={(v) => setForm({ ...form, paymentMethod: v })}
          />
          <Field
            label={t("supplierPurchase.paymentDate")}
            value={form.paymentDate}
            onChangeText={(v) => setForm({ ...form, paymentDate: v })}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
          />
          <Field
            label={t("supplierPurchase.reference")}
            value={form.transactionReference}
            onChangeText={(v) => setForm({ ...form, transactionReference: v })}
            placeholder={t("supplierPurchase.transactionReferencePlaceholder")}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.muted}>{t("supplierPurchase.transactionReferenceHelp")}</Text>
          <Field
            label={t("supplierPurchase.notes")}
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            multiline
          />
          <Button
            title={
              busy
                ? t("supplierPurchase.saving")
                : t("supplierPurchase.confirmPayment")
            }
            disabled={busy}
            onPress={submit}
          />
        </>
      ) : null}
    </ScrollPage>
  );
}
