import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { clsx } from "clsx";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function BillLineItem({
  product,
  quantity,
  subtotal,
  onAdjust,
  onQuantityChange,
  t,
}) {
  return (
    <View className="flex-row items-center gap-2 py-1.75">
      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-text-primary">{product.name}</Text>
        <Text className="pos-muted leading-4.25">
          {money(product.sellingPrice)} / {product.unit}
          {product.quantity == null
            ? ""
            : ` · ${t("pos.stock")}: ${product.quantity}`}
        </Text>
        <Text className="pos-price mt-0.5">{money(subtotal)}</Text>
      </View>
      {onAdjust ? (
        <View className="flex-row items-center gap-1.25">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t("pos.decrease")} ${product.name}`}
            onPress={() => onAdjust(product, -1)}
            className="pos-quantity-control"
          >
            <Text className="text-lg font-bold text-[#202B25]">−</Text>
          </Pressable>
          <Text className="min-w-5 text-center font-bold text-text-primary">
            {quantity}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t("pos.increase")} ${product.name}`}
            disabled={quantity >= product.quantity}
            onPress={() => onAdjust(product, 1)}
            className={clsx(
              "pos-quantity-control",
              quantity >= product.quantity && "opacity-45",
            )}
          >
            <Text className="text-lg font-bold text-[#202B25]">＋</Text>
          </Pressable>
        </View>
      ) : (
        <TextInput
          value={String(quantity)}
          onChangeText={onQuantityChange}
          keyboardType="decimal-pad"
          accessibilityLabel={t("pos.quantity")}
          className="min-h-10 min-w-18 rounded-lg border border-border bg-white px-2.25 text-text-primary"
        />
      )}
      {onAdjust ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("pos.remove")} ${product.name}`}
          onPress={() => onAdjust(product, -quantity)}
          className="p-1"
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={21}
            color="#66736B"
          />
        </Pressable>
      ) : null}
    </View>
  );
}
