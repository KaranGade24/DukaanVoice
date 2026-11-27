import { Image, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../constants/theme";

const money = (value) => `${"\u20B9"}${Number(value || 0).toFixed(2)}`;

export default function ProductCard({ product, onAdd, t }) {
  const outOfStock = product.quantity <= 0;

  return (
    <View className="card-compact">
      <View className="pos-product-image">
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            className="h-full w-full"
            resizeMode="contain"
          />
        ) : (
          <MaterialCommunityIcons
            name="package-variant"
            size={28}
            color={theme.colors.primary}
          />
        )}
      </View>
      <Text
        numberOfLines={2}
        className="pos-product-name"
      >
        {product.name}
      </Text>
      <Text numberOfLines={1} className="text-xs text-text-secondary">
        {outOfStock
          ? t("pos.outOfStock")
          : `${product.quantity} ${product.unit}`}
      </Text>
      <View className="mt-1.5 flex-row items-center justify-between gap-2">
        <Text className="pos-price">
          {money(product.sellingPrice)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("pos.add")} ${product.name}`}
          accessibilityState={{ disabled: outOfStock }}
          disabled={outOfStock}
          onPress={() => onAdd(product)}
          className={`h-9 w-9 items-center justify-center rounded-[9px] bg-primary ${outOfStock ? "opacity-45" : ""}`}
        >
          <Text className="text-[23px] leading-6.75 text-white">
            {"\uFF0B"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
