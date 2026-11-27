import { Pressable, Text, View } from "react-native";
import { clsx } from "clsx";
import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSelector() {
  const { language, languages, setLanguage } = useLanguage();
  return (
    <View
      className="w-33 flex-row rounded-full bg-surface-tint p-1"
      accessibilityRole="tablist"
    >
      {languages.map((item) => (
        <Pressable
          key={item.code}
          onPress={() => setLanguage(item.code)}
          className={clsx(
            "min-h-9 min-w-0 flex-1 items-center justify-center rounded-full px-1",
            language === item.code && "bg-primary shadow-md",
          )}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: language === item.code }}
        >
          <Text
            className={
              language === item.code
                ? "text-center text-xs leading-4.25 font-bold text-on-primary"
                : "text-center text-xs leading-4.25 font-semibold text-text-secondary"
            }
          >
            {item.code.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
