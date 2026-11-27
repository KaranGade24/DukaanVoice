import { Pressable, Text, View } from "react-native";
import { clsx } from "clsx";

export default function PaymentMethodSelector({
  value,
  onChange,
  t,
  methods = ["CASH", "UPI", "CARD", "UDHAR"],
  disabled = false,
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {methods.map((method) => {
        const selected = value === method;
        return (
          <Pressable
            key={method}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(method)}
            className={clsx(
              "pos-payment-chip",
              selected && "pos-payment-chip-selected",
              disabled && "opacity-50",
            )}
          >
            <Text
              className={clsx(
                "text-xs leading-4.25",
                selected
                  ? "font-bold text-primary"
                  : "text-text-secondary",
              )}
            >
              {t(`pos.methods.${method}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
