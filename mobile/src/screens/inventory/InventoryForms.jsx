import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  useSegments,
} from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/inventoryService";
import { showValidationAlert } from "../../utils/validationAlert";
import theme from "../../constants/theme";

const units = [
  "piece",
  "kg",
  "gram",
  "litre",
  "millilitre",
  "packet",
  "box",
  "dozen",
  "meter",
];
const inputValue = (value) => (value == null ? "" : String(value));
const MAX_PRODUCT_VALUE = 1_000_000_000;
const hasPrecision = (value, places) => {
  const fraction = String(value).split(".")[1] || "";
  return fraction.length <= places;
};

function Page({ title, children }) {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

function Button({ label, onPress, disabled = false, secondary = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary && styles.secondaryButton,
        disabled && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProductFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [values, setValues] = useState({
    name: "",
    categoryId: "",
    sku: "",
    barcode: "",
    sellingPrice: "",
    purchasePrice: "",
    openingStock: "",
    minimumStock: "5",
    unit: "piece",
    description: "",
    imageUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) =>
    setValues((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const groups = await api.getCategories(token);
      setCategories(groups);
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  }, [token]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useEffect(() => {
    if (!id) return;
    api
      .getProduct(token, id)
      .then((p) => {
        setValues({
          name: p.name,
          categoryId: p.categoryId || "",
          sku: p.sku || "",
          barcode: p.barcode || "",
          sellingPrice: inputValue(p.sellingPrice),
          purchasePrice: inputValue(p.purchasePrice),
          openingStock: inputValue(p.quantity),
          minimumStock: inputValue(p.minimumStock),
          unit: units.includes(p.unit) ? p.unit : "piece",
          description: p.description || "",
          imageUrl: p.imageUrl || "",
        });
        if (!units.includes(p.unit)) setCustomUnit(p.unit);
      })
      .catch((e) => setError(e.message));
  }, [id, token]);
  const createCategoryInline = async () => {
    if (!newCategoryName.trim()) {
      setError(t("inventory.categoryRequired"));
      return;
    }
    try {
      const created = await api.createCategory(token, {
        name: newCategoryName.trim(),
      });
      await load();
      set("categoryId", created.id);
      setCategoryModal(false);
      setNewCategoryName("");
      setError("");
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  };
  const save = async () => {
    const sellingPrice = Number(values.sellingPrice);
    const openingStock = Number(values.openingStock);
    const purchasePrice =
      values.purchasePrice === "" ? undefined : Number(values.purchasePrice);
    const minimumStock = Number(values.minimumStock || 0);
    if (
      !values.name.trim() ||
      !values.categoryId ||
      values.sellingPrice === "" ||
      values.openingStock === "" ||
      !values.unit
    ) {
      setError(t("inventory.requiredFields"));
      return;
    }
    if (
      [sellingPrice, purchasePrice].some(
        (value) =>
          value !== undefined &&
          (value > MAX_PRODUCT_VALUE || !hasPrecision(value, 2)),
      ) ||
      [openingStock, minimumStock].some(
        (value) => value > MAX_PRODUCT_VALUE || !hasPrecision(value, 6),
      )
    ) {
      setError(t("inventory.invalidPrecision"));
      return;
    }
    if (
      ![
        sellingPrice,
        openingStock,
        minimumStock,
        ...(purchasePrice === undefined ? [] : [purchasePrice]),
      ].every(Number.isFinite) ||
      [sellingPrice, openingStock, minimumStock, purchasePrice].some(
        (v) => v !== undefined && v < 0,
      )
    ) {
      setError(t("inventory.invalidNumbers"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: values.name.trim(),
        categoryId: values.categoryId,
        sku: values.sku.trim(),
        barcode: values.barcode.trim(),
        sellingPrice,
        purchasePrice,
        minimumStock,
        unit: customUnit.trim() || values.unit,
        description: values.description.trim(),
        imageUrl: values.imageUrl.trim(),
      };
      if (id) {
        if (Number(values.openingStock) !== Number(values.openingStock))
          throw new Error(t("inventory.invalidNumbers"));
        await api.updateProduct(token, id, payload);
      } else await api.createProduct(token, { ...payload, openingStock });
      router.back();
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title={t(id ? "inventory.editProduct" : "inventory.addProduct")}>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
          <Field
            label={t("inventory.productName")}
            value={values.name}
            onChangeText={(v) => set("name", v)}
          />
          <Text style={styles.label}>{t("inventory.category")}</Text>
          <Pressable
            style={styles.select}
            onPress={() => setCategoryModal(true)}
          >
            <Text
              style={values.categoryId ? styles.selectText : styles.placeholder}
            >
              {categories.find((c) => c.id === values.categoryId)?.name ||
                t("inventory.selectCategory")}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label={t("inventory.sellingPrice")}
                value={values.sellingPrice}
                onChangeText={(v) => set("sellingPrice", v)}
                keyboardType="decimal-pad"
                placeholder="₹0.00"
              />
            </View>
            <View style={styles.half}>
              <Field
                label={t("inventory.purchasePrice")}
                value={values.purchasePrice}
                onChangeText={(v) => set("purchasePrice", v)}
                keyboardType="decimal-pad"
                placeholder="₹0.00"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label={t(
                  id ? "inventory.currentStock" : "inventory.openingStock",
                )}
                value={values.openingStock}
                onChangeText={(v) => set("openingStock", v)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.half}>
              <Field
                label={t("inventory.minimumStock")}
                value={values.minimumStock}
                onChangeText={(v) => set("minimumStock", v)}
                keyboardType="decimal-pad"
                placeholder="5"
              />
            </View>
          </View>
          <Text style={styles.label}>{t("inventory.unit")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitRail}
          >
            {units.map((unit) => (
              <Pressable
                key={unit}
                onPress={() => {
                  set("unit", unit);
                  setCustomUnit("");
                }}
                style={[
                  styles.unitChip,
                  values.unit === unit && !customUnit && styles.unitActive,
                ]}
              >
                <Text
                  style={[
                    styles.unitText,
                    values.unit === unit && !customUnit && { color: "#fff" },
                  ]}
                >
                  {t(`inventory.units.${unit}`)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Field
            label={t("inventory.customUnit")}
            value={customUnit}
            onChangeText={setCustomUnit}
            placeholder={t("inventory.customUnitPlaceholder")}
          />
          <Field
            label={t("inventory.sku")}
            value={values.sku}
            onChangeText={(v) => set("sku", v)}
          />
          <Field
            label={t("inventory.barcode")}
            value={values.barcode}
            onChangeText={(v) => set("barcode", v)}
          />
          <Field
            label={t("inventory.description")}
            value={values.description}
            onChangeText={(v) => set("description", v)}
            multiline
          />
          <Field
            label={t("inventory.imageUrl")}
            value={values.imageUrl}
            onChangeText={(v) => set("imageUrl", v)}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={busy ? t("common.loading") : t("inventory.saveProduct")}
            onPress={save}
            disabled={busy}
          />
      </ScrollView>
      <Modal
        visible={categoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("inventory.category")}</Text>
            <TextInput
              value={categorySearch}
              onChangeText={setCategorySearch}
              placeholder={t("inventory.searchCategories")}
              style={styles.input}
            />
            <View style={styles.inlineCreate}>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder={t("inventory.categoryName")}
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable onPress={createCategoryInline} style={styles.addMini}>
                <MaterialCommunityIcons name="plus" size={23} color="#fff" />
              </Pressable>
            </View>
            <FlatList
              data={categories.filter((c) =>
                c.name.toLowerCase().includes(categorySearch.toLowerCase()),
              )}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.categoryRow}
                  onPress={() => {
                    set("categoryId", item.id);
                    setCategoryModal(false);
                  }}
                >
                  <Text style={styles.body}>{item.name}</Text>
                  <Text style={styles.muted}>{item.productCount}</Text>
                </Pressable>
              )}
            />
            <Button
              label={t("common.back")}
              secondary
              onPress={() => setCategoryModal(false)}
            />
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </Page>
  );
}

export function CategoryListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setError("");
      setItems(
        await api.getCategories(token, { search, includeInactive: true }),
      );
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  }, [token, search]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const remove = (item) =>
    Alert.alert(
      t("inventory.deleteCategory"),
      t("inventory.deleteCategoryConfirm", { name: item.name }),
      [
        { text: t("common.back"), style: "cancel" },
        {
          text: t("inventory.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteCategory(token, item.id);
              await load();
            } catch (e) {
              showValidationAlert(e, t("validation.alertTitle"));
              setError(e.message);
            }
          },
        },
      ],
    );
  const deactivate = async (item) => {
    try {
      await api.updateCategory(token, item.id, { isActive: !item.isActive });
      await load();
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  };
  return (
    <Page title={t("inventory.categories")}>
      <View style={styles.form}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("inventory.searchCategories")}
          style={styles.input}
        />
        <Button
          label={`＋ ${t("inventory.addCategory")}`}
          onPress={() => router.push("/categories/new")}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(tabs)/inventory",
                  params: { categoryId: item.id },
                })
              }
            >
              <Text style={styles.body}>{item.name}</Text>
              <Text style={styles.muted}>
                {t("inventory.productCount", { count: item.productCount })}
                {!item.isActive ? ` · ${t("inventory.inactive")}` : ""}
              </Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                router.push({
                  pathname: "/categories/[id]",
                  params: { id: item.id },
                })
              }
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => deactivate(item)}
            >
              <MaterialCommunityIcons
                name={item.isActive ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => remove(item)}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color={theme.colors.error}
              />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("inventory.noCategories")}</Text>
        }
      />
    </Page>
  );
}

export function CategoryFormScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (id)
      api
        .getCategories(token, { includeInactive: true })
        .then((items) => {
          const item = items.find((c) => c.id === id);
          if (item) {
            setName(item.name);
            setDescription(item.description || "");
            setIcon(item.icon || "");
            setImage(item.image || "");
          }
        })
        .catch((e) => setError(e.message));
  }, [id, token]);
  const save = async () => {
    if (!name.trim()) {
      setError(t("inventory.categoryRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
        image: image.trim(),
      };
      if (id) await api.updateCategory(token, id, payload);
      else await api.createCategory(token, payload);
      router.back();
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title={t(id ? "inventory.editCategory" : "inventory.addCategory")}>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label={t("inventory.categoryName")}
          value={name}
          onChangeText={setName}
        />
        <Field
          label={t("inventory.description")}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label={t("inventory.categoryIcon")}
          value={icon}
          onChangeText={setIcon}
        />
        <Field
          label={t("inventory.categoryImage")}
          value={image}
          onChangeText={setImage}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={busy ? t("common.loading") : t("inventory.saveCategory")}
          onPress={save}
          disabled={busy}
        />
      </ScrollView>
    </Page>
  );
}

export function StockOperationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { token } = useAuth();
  const params = useLocalSearchParams();
  const operation = String(
    params.type || segments[segments.length - 1] || "in",
  );
  const id = params.productId ? String(params.productId) : "";
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [picker, setPicker] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const data = await api.getProducts(token, { limit: 100 });
      setProducts(data.items);
      if (id) setSelected(data.items.find((item) => item.id === id) || null);
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  }, [token, id]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const titles = { in: "stockIn", out: "stockOut", adjust: "adjust" };
  const save = async () => {
    const qty = Number(quantity);
    if (
      !selected ||
      !Number.isFinite(qty) ||
      qty < 0 ||
      (operation !== "adjust" && qty <= 0) ||
      ((operation === "adjust" || operation === "out") && !reason.trim()) ||
      (cost && (!Number.isFinite(Number(cost)) || Number(cost) < 0))
    ) {
      setError(
        t(
          operation === "adjust"
            ? "inventory.reasonRequired"
            : "inventory.stockFieldsRequired",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        productId: selected.id,
        ...(operation === "adjust"
          ? { correctedQuantity: qty }
          : { quantity: qty }),
        reason: reason.trim(),
        notes: notes.trim(),
        reference: reference.trim(),
        ...(cost ? { purchaseCost: Number(cost) } : {}),
      };
      if (operation === "in") await api.stockIn(token, payload);
      else if (operation === "out") await api.stockOut(token, payload);
      else await api.adjustStock(token, payload);
      router.back();
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title={t(`inventory.${titles[operation]}`)}>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t("inventory.product")}</Text>
        <Pressable style={styles.select} onPress={() => setPicker(true)}>
          <Text style={selected ? styles.selectText : styles.placeholder}>
            {selected
              ? `${selected.name} · ${selected.quantity} ${selected.unit}`
              : t("inventory.selectProduct")}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Pressable>
        {operation === "adjust" && selected ? (
          <Text style={styles.muted}>
            {t("inventory.currentStock")}: {selected.quantity} {selected.unit} ·{" "}
            {t("inventory.difference")}:{" "}
            {Number(quantity || 0) - selected.quantity}
          </Text>
        ) : null}
        <Field
          label={t(
            operation === "adjust"
              ? "inventory.correctedQuantity"
              : "inventory.quantity",
          )}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        {operation === "out" ? (
          <View style={styles.reasonRow}>
            {["damaged", "expired", "manual"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setReason(item)}
                style={[styles.unitChip, reason === item && styles.unitActive]}
              >
                <Text
                  style={[
                    styles.unitText,
                    reason === item && { color: "#fff" },
                  ]}
                >
                  {t(`inventory.reasons.${item}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {operation === "adjust" ? (
          <Field
            label={t("inventory.reasonRequired")}
            value={reason}
            onChangeText={setReason}
          />
        ) : null}
        {operation === "in" ? (
          <Field
            label={t("inventory.purchaseCost")}
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />
        ) : null}
        <Field
          label={t("inventory.reference")}
          value={reference}
          onChangeText={setReference}
        />
        <Field
          label={t("inventory.notes")}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={busy ? t("common.loading") : t("inventory.confirm")}
          onPress={save}
          disabled={busy}
        />
      </ScrollView>
      <Modal
        visible={picker}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(false)}
      >
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {t("inventory.selectProduct")}
            </Text>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.categoryRow}
                  onPress={() => {
                    setSelected(item);
                    setPicker(false);
                  }}
                >
                  <Text style={styles.body}>{item.name}</Text>
                  <Text style={styles.muted}>
                    {item.quantity} {item.unit}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </Page>
  );
}

export function ProductDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setItem(await api.getProduct(token, id));
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  }, [token, id]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const archive = () =>
    Alert.alert(t("inventory.archiveProduct"), t("inventory.archiveConfirm"), [
      { text: t("common.back"), style: "cancel" },
      {
        text: t("inventory.archive"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.archiveProduct(token, id);
            router.back();
          } catch (e) {
            showValidationAlert(e, t("validation.alertTitle"));
            setError(e.message);
          }
        },
      },
    ]);
  return (
    <Page title={t("inventory.productDetails")}>
      {!item ? (
        <View style={styles.center}>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <ActivityIndicator color={theme.colors.primary} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.detailName}>{item.name}</Text>
          <Text style={styles.muted}>
            {item.sku || item.barcode || t("inventory.noSku")} ·{" "}
            {item.categoryName}
          </Text>
          <View style={styles.detailGrid}>
            <Detail
              label={t("inventory.currentStock")}
              value={`${item.quantity} ${item.unit}`}
            />
            <Detail
              label={t("inventory.sellingPrice")}
              value={`₹${item.sellingPrice}`}
            />
            <Detail
              label={t("inventory.purchasePrice")}
              value={`₹${item.purchasePrice}`}
            />
            <Detail
              label={t("inventory.minimumStock")}
              value={item.minimumStock}
            />
            <Detail
              label={t("inventory.statusLabel")}
              value={t(`inventory.status.${item.stockStatus}`)}
            />
          </View>
          {item.description ? (
            <Text style={styles.body}>{item.description}</Text>
          ) : null}
          <Button
            label={t("inventory.editProduct")}
            onPress={() =>
              router.push({ pathname: "/products/[id]/edit", params: { id } })
            }
          />
          <Button
            secondary
            label={t("inventory.stockIn")}
            onPress={() =>
              router.push({ pathname: "/stock/in", params: { productId: id } })
            }
          />
          <Button
            secondary
            label={t("inventory.history")}
            onPress={() =>
              router.push({
                pathname: "/stock/history",
                params: { productId: id },
              })
            }
          />
          <Button
            secondary
            label={t("inventory.archiveProduct")}
            onPress={archive}
          />
        </ScrollView>
      )}
    </Page>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function HistoryScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const params = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const data = await api.getStockHistory(token, {
        limit: 100,
        ...(params.productId ? { productId: String(params.productId) } : {}),
      });
      setItems(data.items);
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      setError(e.message);
    }
  }, [token, params.productId]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  return (
    <Page title={t("inventory.history")}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.body}>{item.productName}</Text>
              <Text style={styles.muted}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.muted}>
              {t(
                `inventory.movement.${{ OPENING_STOCK: "opening", STOCK_IN: "in", STOCK_OUT: "out", STOCK_ADJUSTMENT: "adjustment" }[item.type] || "adjustment"}`,
              )}{" "}
              · {item.previousQuantity} → {item.newQuantity} {item.unit}
            </Text>
            <Text style={styles.body}>
              {item.reason} {item.notes ? `· ${item.notes}` : ""}
            </Text>
            <Text style={styles.muted}>{item.performedByName}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error || t("inventory.noHistory")}
          </Text>
        }
      />
    </Page>
  );
}

export function AlertsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      api
        .getAlerts(token, { limit: 100 })
        .then((data) => setItems(data.items || []))
        .catch((e) => setError(e.message));
    }, [token]),
  );
  return (
    <Page title={t("inventory.alerts")}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>{item.name}</Text>
              <Text style={styles.muted}>
                {item.quantity} {item.unit} ·{" "}
                {t(`inventory.status.${item.stockStatus}`)}
              </Text>
            </View>
            <Pressable
              style={styles.stockInButton}
              onPress={() =>
                router.push({
                  pathname: "/stock/in",
                  params: { productId: item.id },
                })
              }
            >
              <Text style={styles.stockInText}>{t("inventory.stockIn")}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error || t("inventory.noAlerts")}
          </Text>
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...theme.typography.title, color: theme.colors.textPrimary },
  form: { padding: 16, gap: 12, paddingBottom: 30 },
  field: { gap: 6 },
  label: {
    ...theme.typography.small,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  multiline: { minHeight: 82, paddingTop: 12, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  select: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { ...theme.typography.body, color: theme.colors.textPrimary },
  placeholder: { ...theme.typography.body, color: theme.colors.muted },
  button: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryText: { color: theme.colors.primary },
  error: { color: theme.colors.error, ...theme.typography.small },
  unitRail: { gap: 7, paddingVertical: 3 },
  unitChip: {
    paddingHorizontal: 11,
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: "#F7F9F7",
    justifyContent: "center",
  },
  unitActive: { backgroundColor: theme.colors.primary },
  unitText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  reasonRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  list: { padding: 16, gap: 9 },
  categoryCard: {
    minHeight: 68,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  body: { ...theme.typography.body, color: theme.colors.textPrimary },
  muted: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  iconButton: {
    width: 42,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    padding: 24,
  },
  link: { color: theme.colors.primary, fontWeight: "700" },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(32,43,37,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "75%",
    minHeight: "40%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    gap: 10,
  },
  sheetTitle: { ...theme.typography.title, color: theme.colors.textPrimary },
  createInline: { minHeight: 42, justifyContent: "center" },
  inlineCreate: { flexDirection: "row", gap: 8, alignItems: "center" },
  addMini: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRow: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  detailIcon: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  detailName: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
  },
  detailCell: { width: "50%", padding: 10 },
  detailValue: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    marginTop: 3,
  },
  historyCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  stockInButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: theme.colors.surfaceTint,
    justifyContent: "center",
  },
  stockInText: { color: theme.colors.primary, fontWeight: "700" },
});
