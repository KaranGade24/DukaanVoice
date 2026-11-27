import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import theme from "../../constants/theme";

export default function AuthHeader({ title }) {
  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <View className="min-h-16 flex-row items-center border-b border-surface-tint bg-background px-5">
        <Text
          className="mx-1 min-w-0 flex-1 text-lg font-semibold leading-6 text-text-primary"
          numberOfLines={2}
        >
          {title}
        </Text>
        <View className="h-10.5 w-10.5 items-center justify-center rounded-full bg-primary">
          <MaterialCommunityIcons
            name="account-outline"
            size={22}
            color={theme.colors.onPrimary}
          />
        </View>
      </View>
    </>
  );
}
