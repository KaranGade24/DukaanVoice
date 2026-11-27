import { ActivityIndicator, Pressable, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../constants/theme";

export default function PrimaryButton({
  label,
  loading,
  onPress,
  icon = "arrow-right",
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`min-h-[54px] flex-row items-center justify-center gap-2.5 rounded-button bg-primary px-4 shadow-md ${loading ? "opacity-70" : ""}`}
      style={({ pressed }) =>
        pressed ? { backgroundColor: theme.colors.primaryPressed } : undefined
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      <Text className="text-lg font-semibold leading-6 text-on-primary">
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator color={theme.colors.onPrimary} size="small" />
      ) : (
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={theme.colors.onPrimary}
        />
      )}
    </Pressable>
  );
}
