import { Stack } from "expo-router";

import "../../global.css";
import AppProviders from "../AppProviders";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }} />
        </AppProviders>
      </SafeAreaView>
    </>
  );
}
