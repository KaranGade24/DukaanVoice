import { StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={theme.colors.muted}
          />
        )}
      </View>
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoCorrect={false}
          {...props}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { ...theme.typography.label, color: theme.colors.textPrimary },
  inputContainer: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.input,
    backgroundColor: theme.colors.surfaceSubtle,
    justifyContent: "center",
  },
  errorBorder: { borderColor: theme.colors.error },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    minHeight: 52,
  },
  error: { ...theme.typography.small, color: theme.colors.error },
});
