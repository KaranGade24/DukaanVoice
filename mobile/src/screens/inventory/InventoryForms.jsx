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
  Text,
  TextInput,
  useWindowDimensions,
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
import { clsx } from "clsx";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/inventoryService";
import { showValidationAlert } from "../../utils/validationAlert";
import theme from "../../constants/theme";
import KeyboardAwareScroll from "../../components/keyboard/KeyboardAwareScroll";

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
  const { height } = useWindowDimensions();

  return (
    <View className="flex-1 bg-background">
      <View className="min-h-14 flex-row items-center gap-2.5 border-b border-border bg-white px-4">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text className="text-lg font-semibold leading-6 text-text-primary">
          {title}
        </Text>
      </View>
      <KeyboardAvoidingView
        style={{ height: height - 56 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 40}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
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
    <View className="gap-1.5">
      <Text className="text-xs leading-4.25 font-semibold text-text-primary">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        className={clsx(
          "min-h-12 rounded-[10px] border border-border bg-white px-3 text-[15px] text-text-primary",
          multiline && "min-h-20.5 pt-3",
        )}
        style={multiline ? { textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

function Button({ label, onPress, disabled = false, secondary = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={clsx(
        "mt-1 min-h-12.5 items-center justify-center rounded-[11px] bg-primary px-3.5",
        secondary && "border border-primary bg-white",
        disabled && "opacity-[0.55]",
      )}
    >
      <Text
        className={clsx(
          "text-[15px] font-bold text-white",
          secondary && "text-primary",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ProductFormScreen() {
  const { height } = useWindowDimensions();
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
      <KeyboardAwareScroll
        className="flex-1"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={16}
        contentContainerClassName="gap-3 p-4 pb-[30px]"
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label={t("inventory.productName")}
          value={values.name}
          onChangeText={(v) => set("name", v)}
        />
        <Text className="text-xs leading-4.25 font-semibold text-text-primary">
          {t("inventory.category")}
        </Text>
        <Pressable
          className="min-h-12 flex-row items-center justify-between rounded-[10px] border border-border bg-white px-3"
          onPress={() => setCategoryModal(true)}
        >
          <Text
            className={
              values.categoryId
                ? "text-sm leading-5 text-text-primary"
                : "text-sm leading-5 text-muted"
            }
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
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Field
              label={t("inventory.sellingPrice")}
              value={values.sellingPrice}
              onChangeText={(v) => set("sellingPrice", v)}
              keyboardType="decimal-pad"
              placeholder="₹0.00"
            />
          </View>
          <View className="flex-1">
            <Field
              label={t("inventory.purchasePrice")}
              value={values.purchasePrice}
              onChangeText={(v) => set("purchasePrice", v)}
              keyboardType="decimal-pad"
              placeholder="₹0.00"
            />
          </View>
        </View>
        <View className="flex-row gap-2.5">
          <View className="flex-1">
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
          <View className="flex-1">
            <Field
              label={t("inventory.minimumStock")}
              value={values.minimumStock}
              onChangeText={(v) => set("minimumStock", v)}
              keyboardType="decimal-pad"
              placeholder="5"
            />
          </View>
        </View>
        <Text className="text-xs leading-4.25 font-semibold text-text-primary">
          {t("inventory.unit")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-[7px] py-[3px]"
        >
          {units.map((unit) => (
            <Pressable
              key={unit}
              onPress={() => {
                set("unit", unit);
                setCustomUnit("");
              }}
              className={clsx(
                "min-h-8.5 justify-center rounded-lg bg-surface-subtle px-2.75",
                values.unit === unit && !customUnit && "bg-primary",
              )}
            >
              <Text
                className={clsx(
                  "text-xs font-semibold text-text-secondary",
                  values.unit === unit && !customUnit && "text-white",
                )}
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
        {error ? (
          <Text className="text-xs leading-4.25 text-error">{error}</Text>
        ) : null}
        <Button
          label={busy ? t("common.loading") : t("inventory.saveProduct")}
          onPress={save}
          disabled={busy}
        />
      </KeyboardAwareScroll>
      <Modal
        visible={categoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModal(false)}
      >
        <KeyboardAvoidingView
          className="justify-end"
          style={{ height: height - 56 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
          <View className="flex-1 justify-end bg-black/40">
            <View className="min-h-[40%] max-h-[75%] gap-2.5 rounded-t-sheet bg-white p-4.5">
              <Text className="text-lg font-semibold leading-6 text-text-primary">
                {t("inventory.category")}
              </Text>
              <TextInput
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder={t("inventory.searchCategories")}
                className="min-h-12 rounded-[10px] border border-border bg-white px-3 text-[15px] text-text-primary"
              />
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder={t("inventory.categoryName")}
                  className="min-h-12 flex-1 rounded-[10px] border border-border bg-white px-3 text-[15px] text-text-primary"
                />
                <Pressable
                  onPress={createCategoryInline}
                  className="h-12 w-12 items-center justify-center rounded-[10px] bg-primary"
                >
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
                    className="min-h-12.5 flex-row items-center justify-between border-b border-border"
                    onPress={() => {
                      set("categoryId", item.id);
                      setCategoryModal(false);
                    }}
                  >
                    <Text className="text-sm leading-5 text-text-primary">
                      {item.name}
                    </Text>
                    <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
                      {item.productCount}
                    </Text>
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
      <View className="gap-3 p-4 pb-7.5">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("inventory.searchCategories")}
          className="min-h-12 rounded-[10px] border border-border bg-white px-3 text-[15px] text-text-primary"
        />
        <Button
          label={`＋ ${t("inventory.addCategory")}`}
          onPress={() => router.push("/categories/new")}
        />
        {error ? (
          <Text className="text-xs leading-4.25 text-error">{error}</Text>
        ) : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-[9px] p-4"
        renderItem={({ item }) => (
          <View className="min-h-bottom-nav flex-row items-center gap-0.75 rounded-xl border border-border bg-white p-3">
            <Pressable
              className="flex-1"
              onPress={() =>
                router.push({
                  pathname: "/(app)/(tabs)/inventory",
                  params: { categoryId: item.id },
                })
              }
            >
              <Text className="text-sm leading-5 text-text-primary">
                {item.name}
              </Text>
              <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
                {t("inventory.productCount", { count: item.productCount })}
                {!item.isActive ? ` · ${t("inventory.inactive")}` : ""}
              </Text>
            </Pressable>
            <Pressable
              className="h-11 w-10.5 items-center justify-center"
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
              className="h-11 w-10.5 items-center justify-center"
              onPress={() => deactivate(item)}
            >
              <MaterialCommunityIcons
                name={item.isActive ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            <Pressable
              className="h-11 w-10.5 items-center justify-center"
              onPress={() => remove(item)}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color={theme.colors.error}
              />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="p-6 text-center text-sm leading-5 text-text-secondary">
            {t("inventory.noCategories")}
          </Text>
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
      <KeyboardAwareScroll
        className="flex-1"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={16}
        contentContainerClassName="gap-3 p-4 pb-[30px]"
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
        {error ? (
          <Text className="text-xs leading-4.25 text-error">{error}</Text>
        ) : null}
        <Button
          label={busy ? t("common.loading") : t("inventory.saveCategory")}
          onPress={save}
          disabled={busy}
        />
      </KeyboardAwareScroll>
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
      <KeyboardAwareScroll
        className="flex-1"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={16}
        contentContainerClassName="gap-3 p-4 pb-[30px]"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xs leading-4.25 font-semibold text-text-primary">
          {t("inventory.product")}
        </Text>
        <Pressable
          className="min-h-12 flex-row items-center justify-between rounded-[10px] border border-border bg-white px-3"
          onPress={() => setPicker(true)}
        >
          <Text
            className={
              selected
                ? "text-sm leading-5 text-text-primary"
                : "text-sm leading-5 text-muted"
            }
          >
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
          <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
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
          <View className="flex-row flex-wrap gap-2">
            {["damaged", "expired", "manual"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setReason(item)}
                className={clsx(
                  "min-h-8.5 justify-center rounded-lg bg-surface-subtle px-2.75",
                  reason === item && "bg-primary",
                )}
              >
                <Text
                  className={clsx(
                    "text-xs font-semibold text-text-secondary",
                    reason === item && "text-white",
                  )}
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
        {error ? (
          <Text className="text-xs leading-4.25 text-error">{error}</Text>
        ) : null}
        <Button
          label={busy ? t("common.loading") : t("inventory.confirm")}
          onPress={save}
          disabled={busy}
        />
      </KeyboardAwareScroll>
      <Modal
        visible={picker}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="min-h-[40%] max-h-[75%] gap-2.5 rounded-t-sheet bg-white p-4.5">
            <Text className="text-lg font-semibold leading-6 text-text-primary">
              {t("inventory.selectProduct")}
            </Text>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  className="min-h-12.5 flex-row items-center justify-between border-b border-border"
                  onPress={() => {
                    setSelected(item);
                    setPicker(false);
                  }}
                >
                  <Text className="text-sm leading-5 text-text-primary">
                    {item.name}
                  </Text>
                  <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
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
        <View className="flex-1 items-center justify-center">
          {error ? (
            <Text className="text-xs leading-4.25 text-error">{error}</Text>
          ) : (
            <ActivityIndicator color={theme.colors.primary} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-4 pb-[30px]">
          <View className="h-19 w-19 self-center items-center justify-center rounded-sheet bg-surface-tint">
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <Text className="text-center text-2xl font-bold leading-8 text-text-primary">
            {item.name}
          </Text>
          <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
            {item.sku || item.barcode || t("inventory.noSku")} ·{" "}
            {item.categoryName}
          </Text>
          <View className="flex-row flex-wrap rounded-card border border-border bg-white p-2">
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
            <Text className="text-sm leading-5 text-text-primary">
              {item.description}
            </Text>
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
    <View className="w-1/2 p-2.5">
      <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
        {label}
      </Text>
      <Text className="mt-0.75 text-[15px] leading-5.25 font-semibold text-text-primary">
        {value}
      </Text>
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
        contentContainerClassName="gap-[9px] p-4"
        renderItem={({ item }) => (
          <View className="gap-1 rounded-xl border border-border bg-white p-3.25">
            <View className="flex-row justify-between gap-2.5">
              <Text className="text-sm leading-5 text-text-primary">
                {item.productName}
              </Text>
              <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
              {t(
                `inventory.movement.${{ OPENING_STOCK: "opening", STOCK_IN: "in", STOCK_OUT: "out", STOCK_ADJUSTMENT: "adjustment" }[item.type] || "adjustment"}`,
              )}{" "}
              · {item.previousQuantity} → {item.newQuantity} {item.unit}
            </Text>
            <Text className="text-sm leading-5 text-text-primary">
              {item.reason} {item.notes ? `· ${item.notes}` : ""}
            </Text>
            <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
              {item.performedByName}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="p-6 text-center text-sm leading-5 text-text-secondary">
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
        contentContainerClassName="gap-[9px] p-4"
        renderItem={({ item }) => (
          <View className="min-h-bottom-nav flex-row items-center gap-0.75 rounded-xl border border-border bg-white p-3">
            <View className="flex-1">
              <Text className="text-sm leading-5 text-text-primary">
                {item.name}
              </Text>
              <Text className="mt-0.75 text-xs leading-4.25 text-text-secondary">
                {item.quantity} {item.unit} ·{" "}
                {t(`inventory.status.${item.stockStatus}`)}
              </Text>
            </View>
            <Pressable
              className="min-h-10.5 justify-center rounded-[9px] bg-surface-tint px-3.25"
              onPress={() =>
                router.push({
                  pathname: "/stock/in",
                  params: { productId: item.id },
                })
              }
            >
              <Text className="font-bold text-primary">
                {t("inventory.stockIn")}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="p-6 text-center text-sm leading-5 text-text-secondary">
            {error || t("inventory.noAlerts")}
          </Text>
        }
      />
    </Page>
  );
}
