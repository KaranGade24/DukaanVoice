import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import theme from "../../../constants/theme";

const icons = {
  index: "home-variant-outline",
  inventory: "package-variant-closed",
  voice: "microphone-outline",
  reports: "chart-box-outline",
  more: "dots-horizontal-circle-outline",
};
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={icons[route.name] || "circle-outline"}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="inventory" options={{ title: t("tabs.inventory") }} />
      <Tabs.Screen name="voice" options={{ title: t("tabs.voice") }} />
      <Tabs.Screen name="reports" options={{ title: t("tabs.reports") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.more") }} />
    </Tabs>
  );
}
