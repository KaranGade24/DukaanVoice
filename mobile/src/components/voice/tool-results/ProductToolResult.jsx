import { Text, View } from "react-native";
import {
  EmptyResult,
  money,
  quantity,
  ResultRow,
  ToolResultCard,
} from "./ToolResultCard";

export default function ProductToolResult({ name, data }) {
  const products = Array.isArray(data) ? data : data ? [data] : [];
  const title =
    name === "get_product_details" ? "Product details" : "Product matches";
  return (
    <ToolResultCard
      title={title}
      subtitle={`${products.length} ${products.length === 1 ? "product" : "products"}`}
      icon="package-variant"
    >
      {products.length ? (
        products.map((product, index) => (
          <View
            key={`${product.id || product.name}-${index}`}
            className="border-b border-border last:border-b-0"
          >
            <ResultRow
              label={product.name || "Product"}
              value={money(product.sellingPrice)}
              emphasis
            />
            <View className="flex-row flex-wrap gap-x-4 pb-2">
              <Text className="text-[10px] text-text-secondary">
                Stock: {quantity(product.quantity, product.unit)}
              </Text>
              {product.sku ? (
                <Text className="text-[10px] text-text-secondary">
                  SKU: {product.sku}
                </Text>
              ) : null}
              {product.category ? (
                <Text className="text-[10px] text-text-secondary">
                  {product.category}
                </Text>
              ) : null}
            </View>
            {product.description ? (
              <Text className="pb-2 text-xs text-text-secondary">
                {product.description}
              </Text>
            ) : null}
          </View>
        ))
      ) : (
        <EmptyResult label="No matching products found." />
      )}
    </ToolResultCard>
  );
}
