import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
    <View style={styles.wrapper}>
      {<Text style={styles.label}>{t("auth.businessType")}</Text>}
      <View style={styles.grid}>
        {items.map((item) => {
          const selected = value === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              style={[styles.item, selected && styles.selected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={styles.iconRow}>
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
              <Text style={[styles.itemText, selected && styles.selectedText]}>
                {t(`categories.${item.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { ...theme.typography.label, color: theme.colors.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  item: {
    width: "48%",
    minHeight: 94,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 14,
    justifyContent: "space-between",
  },
  selected: { backgroundColor: theme.colors.primary },
  iconRow: { flexDirection: "row", justifyContent: "space-between" },
  itemText: { ...theme.typography.label, color: theme.colors.textPrimary },
  selectedText: { color: theme.colors.onPrimary },
  error: { ...theme.typography.small, color: theme.colors.error },
});
