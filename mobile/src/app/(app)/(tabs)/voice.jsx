import { Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../constants/theme";

export default function VoiceScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.page}>
      <Text style={styles.title}>{t("tabs.voice")}</Text>
      <Text style={styles.body}>{t("tabs.comingSoon")}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { ...theme.typography.headline, color: theme.colors.textPrimary },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
});
