import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import theme from "../../constants/theme";

const items = [
  { key: "grocery", icon: "cart-outline" },
  { key: "dairy_bakery", icon: "cup" },
  { key: "pharmacy", icon: "pill" },
  { key: "wholesale", icon: "package-variant-closed" },
];

export default function CategorySelector({ value, onChange, error }) {
  const { t } = useTranslation();

  return (
    <View className="gap-2">
      {<Text className="text-[15px] leading-[21px] font-semibold text-text-primary">{t("auth.businessType")}</Text>}
      <View className="flex-row flex-wrap gap-2.5">
        {items.map((item) => {
          const selected = value === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              className={clsx(
                "min-h-[94px] w-[48%] justify-between rounded-card bg-surface-subtle p-3.5",
                selected && "bg-primary",
              )}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View className="flex-row justify-between">
                <MaterialCommunityIcons
                  name={item.icon}
                  size={25}
                  color={
                    selected ? theme.colors.onPrimary : theme.colors.primary
                  }
                />
                {selected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.colors.onPrimary}
                  />
                )}
              </View>
              <Text className={clsx(
                "text-[15px] leading-[21px] font-semibold text-text-primary",
                selected && "text-on-primary",
              )}>
                {t(`categories.${item.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-xs leading-[17px] text-error">{error}</Text> : null}
    </View>
  );
}
