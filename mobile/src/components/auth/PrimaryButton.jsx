import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
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
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      <Text style={styles.label}>{loading ? label : label}</Text>
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
const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  pressed: { backgroundColor: theme.colors.primaryPressed },
  disabled: { opacity: 0.7 },
  label: { ...theme.typography.title, color: theme.colors.onPrimary },
});
