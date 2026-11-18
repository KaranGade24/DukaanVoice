import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function AppLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF3" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
