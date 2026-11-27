import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import theme from "../../constants/theme";
import ToolResultRenderer from "./tool-results/ToolResultRenderer";

const movementPattern =
  /[-*]\s*\*\*(.+?)\*\*:\s*([A-Z_]+)\s*\(([+-]?[\d.]+)\s*units?,\s*new stock:\s*([+-]?[\d.]+)\)/i;

const movementLabels = {
  SALE: "Sale",
  PURCHASE: "Purchase",
  STOCK_IN: "Stock in",
  STOCK_OUT: "Stock out",
  STOCK_ADJUSTMENT: "Adjustment",
  OPENING_STOCK: "Opening stock",
};

const formatQuantity = (value) =>
  Number.isInteger(Number(value)) ? String(Number(value)) : String(value);

export default function VoiceAssistantMessage({
  content,
  t,
  toolResults = [],
}) {
  const structuredHistory = toolResults.some(
    (result) => result.name === "get_stock_movement_history",
  );
  if (toolResults.length) {
    return (
      <View className="gap-2">
        {content && !structuredHistory ? (
          <Text className="text-sm leading-5 text-text-primary">{content}</Text>
        ) : null}
        <ToolResultRenderer results={toolResults} />
      </View>
    );
  }

  const lines = String(content || "").split("\n");
  const rows = lines
    .map((line) => {
      const match = line.match(movementPattern);
      if (!match) return null;
      return {
        date: match[1],
        type: match[2].toUpperCase(),
        changed: Number(match[3]),
        stock: Number(match[4]),
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return (
      <Text className="text-sm leading-5 text-text-primary">{content}</Text>
    );
  }

  const heading = lines.find(
    (line) => line.trim() && !movementPattern.test(line),
  );
  const productMatch = heading?.match(/history for\s+(.+?)[.!:]?$/i);
  const productName = productMatch?.[1]?.replace(/[.!:]+$/, "").trim();

  return (
    <View className="w-full gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-mint">
          <MaterialCommunityIcons
            name="history"
            size={21}
            color={theme.colors.primary}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold leading-5 text-text-primary">
            {t("home.voiceMovementHistory")}
          </Text>
          {productName ? (
            <Text className="text-xs leading-4 text-text-secondary">
              {productName}
            </Text>
          ) : null}
        </View>
        <View className="rounded-full bg-surface-mint px-2.5 py-1">
          <Text className="text-xs font-semibold text-primary">
            {t("home.voiceMovementCount", { count: rows.length })}
          </Text>
        </View>
      </View>

      <View className="overflow-hidden rounded-xl border border-border">
        {rows.map((row, index) => {
          const incoming = row.changed > 0;
          return (
            <View
              key={`${row.date}-${row.type}-${index}`}
              className={`flex-row items-center gap-3 px-3 py-3 ${index < rows.length - 1 ? "border-b border-border" : ""}`}
            >
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${incoming ? "bg-surface-mint" : "bg-[#FFF1F0]"}`}
              >
                <MaterialCommunityIcons
                  name={incoming ? "arrow-down-left" : "arrow-up-right"}
                  size={18}
                  color={incoming ? theme.colors.primary : "#DC2626"}
                />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm font-semibold text-text-primary">
                    {movementLabels[row.type]
                      ? t(`home.voiceMovementTypes.${row.type}`)
                      : row.type.replaceAll("_", " ")}
                  </Text>
                  <Text
                    className={`text-sm font-bold ${incoming ? "text-primary" : "text-[#DC2626]"}`}
                  >
                    {row.changed > 0 ? "+" : ""}
                    {formatQuantity(row.changed)} {t("pos.units")}
                  </Text>
                </View>
                <Text className="text-xs text-text-secondary">{row.date}</Text>
              </View>
              <View className="items-end border-l border-border pl-3">
                <Text className="text-[10px] text-text-secondary">
                  {t("home.voiceStockAfter")}
                </Text>
                <Text className="text-sm font-semibold text-text-primary">
                  {formatQuantity(row.stock)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
