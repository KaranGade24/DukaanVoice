import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { useTranslation } from "react-i18next";
import theme from "../../constants/theme";
import { showValidationAlert } from "../../utils/validationAlert";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const date = (value) => (value ? new Date(value).toLocaleDateString() : "—");

const dateBound = (value, endOfDay = false) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(
        `${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`,
      ).toISOString()
    : undefined;

const errorText = (error, fallback) => {
  showValidationAlert(error);
  return error?.message || fallback;
};

const toMinorUnits = (value) => {
  const match = String(value || "0")
    .trim()
    .match(/^(\d+)(?:\.(\d*))?$/);
  if (!match) return Number.NaN;
  const fraction = match[2] || "";
  return (
    Number(match[1]) * 100 +
    Number((fraction + "00").slice(0, 2)) +
    (Number((fraction + "000").slice(2, 3)) >= 5 ? 1 : 0)
  );
};

const paymentMethods = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
];

const paymentStatuses = ["UNPAID", "PARTIALLY_PAID", "PAID"];

function Page({ title, children, onBack, right }) {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack || (() => router.back())}
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        {right || <View style={styles.headerSpace} />}
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

function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  danger = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonSecondaryText,
          danger && styles.buttonDangerText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  inputMode,
  autoCapitalize = "sentences",
  autoCorrect = false,
  autoComplete,
  textContentType,
  returnKeyType,
  maxLength,
  multiline = false,
  numberOfLines,
  secureTextEntry = false,
  editable = true,
  error,
  onSubmitEditing,
  ...textInputProps
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label} accessibilityLabel={label}>{label}</Text>
      <TextInput
        {...textInputProps}
        value={value == null ? "" : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={keyboardType}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        editable={editable}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        aria-invalid={Boolean(error)}
        style={[styles.input, multiline && styles.multiline, error && styles.inputError]}
      />
      {error ? <Text style={styles.fieldErrorText} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

function Notice({ text, retry }) {
  const { t } = useTranslation();
  return (
    <View style={styles.notice}>
      <Text style={styles.errorText}>{text}</Text>
      {retry ? (
        <Button title={t("common.retry")} secondary onPress={retry} />
      ) : null}
    </View>
  );
}

function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{text}</Text>
    </View>
  );
}

function Card({ children, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={styles.card}>
      {children}
    </Wrapper>
  );
}

function Status({ value }) {
  const { t } = useTranslation();
  const color =
    value === "PAID" || value === "POSTED" || value === "PAYMENT"
      ? theme.colors.success
      : value === "CANCELLED" || value === "UNPAID"
        ? theme.colors.error
        : "#A66A00";
  const label = ["UNPAID", "PARTIALLY_PAID", "PAID"].includes(value)
    ? t(`supplierPurchase.status.${value}`)
    : t(`supplierPurchase.recordStatus.${value}`, value || "—");
  return (
    <View style={[styles.status, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

function useLoad(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);
  const dependencyKey = Array.isArray(dependencies)
    ? JSON.stringify(dependencies)
    : dependencies;
  const load = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setData(await loaderRef.current());
    } catch (e) {
      setError(errorText(e, "Unable to load data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (dependencyKey !== undefined) load();
    }, [load, dependencyKey]),
  );
  return { data, loading, refreshing, error, load, setData, setError };
}

function ScrollPage({ title, children }) {
  return (
    <Page title={title}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>
    </Page>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function MethodSelector({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <View style={styles.chips}>
      {paymentMethods.map((method) => (
        <Pressable
          key={method}
          onPress={() => onChange(method)}
          style={[styles.chip, value === method && styles.chipActive]}
        >
          <Text
            style={[styles.chipText, value === method && styles.chipTextActive]}
          >
            {t(`supplierPurchase.methods.${method}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function SummaryLine({ label, value, strong }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.body, strong && styles.cardTitle]}>{label}</Text>
      <Text style={[styles.body, strong && styles.money]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  backText: { fontSize: 30, color: theme.colors.primary, marginTop: -4 },
  headerTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  headerSpace: { width: 40 },
  add: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceTint,
    borderRadius: 20,
  },
  addText: { color: theme.colors.primary, fontSize: 24, fontWeight: "600" },
  toolbar: { paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  search: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    color: theme.colors.textPrimary,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateInput: { flex: 1, paddingHorizontal: 8, fontSize: 11 },
  apply: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceTint,
    borderRadius: 10,
  },
  applyText: { color: theme.colors.primary, fontWeight: "700", fontSize: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: { color: theme.colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  list: { paddingHorizontal: 18, paddingBottom: 40 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: { ...theme.typography.label, color: theme.colors.textPrimary },
  muted: { ...theme.typography.small, color: theme.colors.textSecondary },
  body: { ...theme.typography.body, color: theme.colors.textPrimary },
  money: { ...theme.typography.label, color: theme.colors.primary },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  status: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  statusText: { fontSize: 10, fontWeight: "700" },
  center: { marginTop: 60 },
  empty: { padding: 32, alignItems: "center" },
  emptyTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  notice: {
    margin: 20,
    padding: 16,
    backgroundColor: theme.colors.errorBackground,
    borderRadius: 12,
    gap: 12,
  },
  errorText: { ...theme.typography.body, color: theme.colors.error },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    marginVertical: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimary,
  },
  buttonSecondaryText: { color: theme.colors.primary },
  buttonDanger: { borderColor: theme.colors.error },
  buttonDangerText: { color: theme.colors.error },
  disabled: { opacity: 0.5 },
  fieldWrap: { gap: 6, marginBottom: 8 },
  label: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  inputError: { borderColor: theme.colors.error },
  fieldErrorText: { ...theme.typography.small, color: theme.colors.error },
  multiline: { minHeight: 84, textAlignVertical: "top", paddingTop: 12 },
  sectionTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  actions: { gap: 8, marginBottom: 10 },
  stats: { flexDirection: "row", gap: 8, marginTop: 12 },
  stat: { flex: 1, gap: 4 },
  statValue: { ...theme.typography.label, color: theme.colors.primary },
  selectRow: {
    minHeight: 46,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceTint,
  },
  selectMark: { color: theme.colors.primary },
  selectionIndicator: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.borderPrimary, alignItems: "center", justifyContent: "center" },
  selectionIndicatorSelected: { borderColor: "#23804A" },
  selectionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#23804A" },
  removeText: { fontSize: 24, color: theme.colors.error },
  preview: {
    ...theme.typography.title,
    color: theme.colors.primary,
    textAlign: "right",
    marginTop: 8,
  },
  lineItem: { paddingVertical: 7, gap: 3 },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
});

export {
  money,
  date,
  dateBound,
  errorText,
  toMinorUnits,
  paymentMethods,
  paymentStatuses,
  Page,
  Button,
  Field,
  Notice,
  Empty,
  Card,
  Status,
  useLoad,
  ScrollPage,
  Stat,
  MethodSelector,
  Divider,
  SummaryLine,
  styles,
};
