import { Text, StyleSheet, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LanguageSelector from "../../../components/auth/LanguageSelector";
import theme from "../../../constants/theme";

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.page}>
      <Text style={styles.title}>{t("tabs.more")}</Text>
      <View style={styles.links}>
        {[
          ["pos.open", "/sales"],
          ["supplierPurchase.suppliers", "/suppliers"],
          ["supplierPurchase.purchases", "/purchases"],
          ["supplierPurchase.supplierPayments", "/supplier-payments"],
        ].map(([label, path]) => (
          <Pressable
            key={path}
            onPress={() => router.push(path)}
            style={styles.link}
          >
            <Text style={styles.linkText}>{t(label)}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
      <LanguageSelector />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 24,
    gap: 20,
    backgroundColor: theme.colors.background,
  },
  title: { ...theme.typography.headline, color: theme.colors.textPrimary },
  links: { gap: 10 },
  link: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: { ...theme.typography.label, color: theme.colors.textPrimary },
  chevron: { fontSize: 26, color: theme.colors.primary },
});
