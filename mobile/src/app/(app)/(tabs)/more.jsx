import { Text, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import LanguageSelector from "../../../components/auth/LanguageSelector";

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View className="flex-1">
      <View className="flex-1 gap-5 bg-background p-6">
        <Text className="text-2xl font-bold leading-8 text-text-primary">
          {t("tabs.more")}
        </Text>
        <View className="gap-2.5">
          {[
            ["pos.open", "/sales"],
            ["salesHistory.moreLabel", "/sales/history"],
            ["supplierPurchase.suppliers", "/suppliers"],
            ["supplierPurchase.purchases", "/purchases"],
            ["supplierPurchase.supplierPayments", "/supplier-payments"],
          ].map(([label, path]) => (
            <Pressable
              key={path}
              onPress={() => router.push(path)}
              className="min-h-14.5 flex-row items-center justify-between rounded-card border border-border bg-white px-4"
            >
              <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
                {t(label)}
              </Text>
              <Text className="text-[26px] text-primary">›</Text>
            </Pressable>
          ))}
        </View>
        <LanguageSelector />
      </View>
    </View>
  );
}
