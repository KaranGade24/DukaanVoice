import { Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { clsx } from "clsx";
import theme from "../../constants/theme";

export default function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  ...props
}) {
  return (
    <View className="gap-[7px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{label}</Text>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={theme.colors.muted}
          />
        )}
      </View>
      <View className={clsx("min-h-[54px] justify-center rounded-input border bg-surface-subtle", error ? "border-error" : "border-border")}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          className="min-h-[52px] px-4 py-3 text-sm leading-5 text-text-primary"
          autoCorrect={false}
          {...props}
        />
      </View>
      {error ? (
        <Text className="text-xs leading-[17px] text-error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
