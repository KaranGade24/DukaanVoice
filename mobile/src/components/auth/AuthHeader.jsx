import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import theme from "../../constants/theme";

export default function AuthHeader({ title }) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.avatar}>
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

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceTint,
  },
  title: {
    flex: 1,
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginHorizontal: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
