import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
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
  const { height } = useWindowDimensions();
  return (
    <View className="flex-1 bg-background">
      <View className="min-h-13.5 flex-row items-center gap-3 px-4">
        <Pressable
          accessibilityRole="button"
          onPress={onBack || (() => router.back())}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Text className="mt-[-4px] text-[30px] text-primary">{"\u2039"}</Text>
        </Pressable>
        <Text
          numberOfLines={1}
          className="min-w-0 flex-1 text-lg font-semibold leading-6 text-text-primary"
        >
          {title}
        </Text>
        {right || <View className="w-10" />}
      </View>
      <KeyboardAvoidingView
        style={{ height: height - 56 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
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
      className={clsx(
        "my-1 min-h-12 items-center justify-center rounded-xl bg-primary px-4",
        secondary && "border border-border-primary bg-white",
        danger && "border border-error",
        disabled && "opacity-50",
      )}
    >
      <Text
        className={clsx(
          "font-bold text-white",
          secondary && "text-primary",
          danger && "text-error",
        )}
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
    <View className="mb-2 gap-1.5">
      <Text
        className="text-xs font-semibold text-text-secondary"
        accessibilityLabel={label}
      >
        {label}
      </Text>
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
        className={clsx(
          "min-h-11.5 rounded-xl border border-border bg-white px-3 text-text-primary",
          multiline && "min-h-21 pt-3",
          error && "border-error",
        )}
        style={multiline ? { textAlignVertical: "top" } : undefined}
      />
      {error ? (
        <Text className="text-xs text-error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function Notice({ text, retry }) {
  const { t } = useTranslation();
  return (
    <View className="m-5 gap-3 rounded-xl bg-error-bg p-4">
      <Text className="text-sm leading-5 text-error">{text}</Text>
      {retry ? (
        <Button title={t("common.retry")} secondary onPress={retry} />
      ) : null}
    </View>
  );
}

function Empty({ text }) {
  return (
    <View className="items-center p-8">
      <Text className="text-center text-sm leading-5 text-text-secondary">
        {text}
      </Text>
    </View>
  );
}

function Card({ children, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      className="mb-2.5 gap-2 rounded-2xl border border-border bg-white p-4"
    >
      {children}
    </Wrapper>
  );
}

function Status({ value }) {
  const { t } = useTranslation();
  const statusClass =
    value === "PAID" || value === "POSTED" || value === "PAYMENT"
      ? "bg-success-bg text-success"
      : value === "CANCELLED" || value === "UNPAID"
        ? "bg-error-bg text-error"
        : "bg-[#FFF5E5] text-[#A66A00]";
  const label = ["UNPAID", "PARTIALLY_PAID", "PAID"].includes(value)
    ? t(`supplierPurchase.status.${value}`)
    : t(`supplierPurchase.recordStatus.${value}`, value || "—");
  return (
    <View className={clsx("self-start rounded-2xl px-2.5 py-1.25", statusClass.split(" ")[0])}>
      <Text className={clsx("text-[10px] font-bold", statusClass.split(" ")[1])}>
        {label}
      </Text>
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
        contentContainerClassName="gap-3 p-5 pb-10"
      >
        {children}
      </ScrollView>
    </Page>
  );
}

function Stat({ label, value }) {
  return (
    <View className="flex-1 gap-1">
      <Text className="text-[15px] font-semibold text-primary">{value}</Text>
      <Text className="text-xs text-text-secondary">{label}</Text>
    </View>
  );
}

function MethodSelector({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-2">
      {paymentMethods.map((method) => (
        <Pressable
          key={method}
          onPress={() => onChange(method)}
          className={clsx(
            "rounded-full border px-3 py-2",
            value === method
              ? "border-primary bg-primary"
              : "border-border bg-white",
          )}
        >
          <Text
            className={clsx(
              "text-xs",
              value === method
                ? "font-semibold text-white"
                : "text-text-secondary",
            )}
          >
            {t(`supplierPurchase.methods.${method}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Divider() {
  return <View className="my-2 h-px bg-border" />;
}

function SummaryLine({ label, value, strong }) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text
        className={clsx(
          "text-sm leading-5 text-text-primary",
          strong && "font-semibold",
        )}
      >
        {label}
      </Text>
      <Text
        className={clsx(
          "text-sm leading-5 text-text-primary",
          strong && "font-semibold text-primary",
        )}
      >
        {value}
      </Text>
    </View>
  );
}

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
};
