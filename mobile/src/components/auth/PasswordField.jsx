import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import theme from "../../constants/theme";

export default function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  ...props
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          {...props}
        />
        <Pressable
          onPress={() => setVisible((current) => !current)}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={visible ? t("common.hide") : t("common.show")}
        >
          <MaterialCommunityIcons
            name={visible ? "eye-outline" : "eye-off-outline"}
            size={22}
            color={theme.colors.muted}
          />
        </Pressable>
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
  label: { ...theme.typography.label, color: theme.colors.textPrimary },
  inputContainer: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.input,
    backgroundColor: theme.colors.surfaceSubtle,
    flexDirection: "row",
    alignItems: "center",
  },
  errorBorder: { borderColor: theme.colors.error },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    minHeight: 52,
  },
  toggle: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { ...theme.typography.small, color: theme.colors.error },
});
