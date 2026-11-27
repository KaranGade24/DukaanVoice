import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
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
    <View className="gap-[7px]">
      <Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{label}</Text>
      <View className={clsx("min-h-[54px] flex-row items-center rounded-input border bg-surface-subtle", error ? "border-error" : "border-border")}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          className="min-h-[52px] flex-1 px-4 py-3 text-sm leading-5 text-text-primary"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          {...props}
        />
        <Pressable
          onPress={() => setVisible((current) => !current)}
          className="h-[52px] w-[52px] items-center justify-center"
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
        <Text className="text-xs leading-[17px] text-error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
