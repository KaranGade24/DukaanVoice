import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LanguageSelector from "../components/auth/LanguageSelector";
import { useAuth } from "../context/AuthContext";
import theme from "../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, shop, logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("home.title")}</Text>
          <Text style={styles.subtitle}>
            {t("home.signedInAs", { name: user?.fullName || "" })}
          </Text>
        </View>
        <Pressable
          onPress={handleLogout}
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel={t("auth.logout")}
        >
          <MaterialCommunityIcons
            name="logout"
            size={22}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>
      <LanguageSelector />
      <View style={styles.card}>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={32}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.shopName}>{shop?.shopName || t("home.title")}</Text>
        <Text style={styles.cardText}>{t("home.subtitle")}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>{t("home.location")}</Text>
          <Text style={styles.metaValue}>{shop?.city || "—"}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...theme.typography.headline, color: theme.colors.textPrimary },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  logout: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: 20,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  shopName: { ...theme.typography.title, color: theme.colors.textPrimary },
  cardText: { ...theme.typography.body, color: theme.colors.textSecondary },
  meta: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: { ...theme.typography.body, color: theme.colors.textSecondary },
  metaValue: { ...theme.typography.label, color: theme.colors.textPrimary },
});
