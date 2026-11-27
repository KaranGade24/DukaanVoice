import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { clsx } from "clsx";

const money = (value) => `\u20B9${Number(value || 0).toFixed(2)}`;

export default function PosBottomBar({
  total,
  saving,
  canComplete,
  onComplete,
  t,
}) {
  return (
    <View className="pos-bottom-bar">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canComplete }}
        disabled={!canComplete}
        onPress={onComplete}
        className={clsx("pos-submit", !canComplete && "opacity-50")}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={22}
              color="#fff"
            />
            <Text numberOfLines={1} className="flex-1 font-bold text-white">
              {t("pos.completeSale")}
            </Text>
            <Text className="font-bold text-white">{money(total)}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#fff"
            />
          </>
        )}
      </Pressable>
    </View>
  );
}
