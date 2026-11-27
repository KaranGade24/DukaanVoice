import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import theme from "../../../constants/theme";

export const money = (value) =>
  `₹${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const quantity = (value, unit = "") =>
  `${Number(value || 0).toLocaleString()}${unit ? ` ${unit}` : ""}`;

export function ToolResultCard({
  title,
  subtitle,
  icon = "creation-outline",
  children,
}) {
  return (
    <View className="mb-2.5 gap-3 rounded-2xl border border-border bg-white p-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-mint">
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={theme.colors.primary}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-xs text-text-secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function ResultRow({ label, value, emphasis = false }) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <Text className="min-w-0 flex-1 text-xs text-text-secondary">
        {label}
      </Text>
      <Text
        className={`shrink text-right text-sm ${emphasis ? "font-bold text-primary" : "font-semibold text-text-primary"}`}
      >
        {value}
      </Text>
    </View>
  );
}

export function EmptyResult({ label }) {
  return (
    <Text className="rounded-xl bg-background px-3 py-3 text-center text-xs text-text-secondary">
      {label}
    </Text>
  );
}
