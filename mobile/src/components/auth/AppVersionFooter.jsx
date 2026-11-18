import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import theme from "../../constants/theme";

export default function AppVersionFooter() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.version}>{t("common.appVersion")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 4, marginTop: "auto" },
  version: { ...theme.typography.small, color: theme.colors.textSecondary },
});
