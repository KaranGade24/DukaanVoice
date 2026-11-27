import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import theme from "../constants/theme";

export default function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const { ready } = useLanguage();
  if (loading || !ready)
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  return <Redirect href={isAuthenticated ? "/(app)" : "/(auth)/login"} />;
}
