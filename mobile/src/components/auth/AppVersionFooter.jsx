import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function AppVersionFooter() {
  const { t } = useTranslation();

  return (
    <View className="mt-auto items-center py-1">
      <Text className="text-xs leading-[17px] text-text-secondary">
        {t("common.appVersion")}
      </Text>
    </View>
  );
}
