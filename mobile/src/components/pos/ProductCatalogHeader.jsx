import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { clsx } from "clsx";
import theme from "../../constants/theme";

export default function ProductCatalogHeader({
  search,
  onSearchChange,
  categories,
  productsCount,
  categoryId,
  onCategoryChange,
  error,
  onRetry,
  resultCount,
  onBack,
  t,
}) {
  return (
    <View className="pb-1">
      <View className="flex-row items-center gap-2.5 px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={onBack}
          className="h-10 w-10 items-center justify-center"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-bold leading-6.25 text-text-primary">
            {t("pos.title")}
          </Text>
          <Text className="pos-muted">{t("pos.subtitle")}</Text>
        </View>
        <View className="rounded-lg bg-[#D9FBE8] px-2.5 py-1.25">
          <Text className="text-xs font-bold text-primary">POS</Text>
        </View>
      </View>

      <View className="pos-search">
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.muted}
        />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t("pos.search")}
          placeholderTextColor={theme.colors.muted}
          className="min-w-0 flex-1 py-2.5 text-text-primary"
          returnKeyType="search"
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("pos.clearSearch")}
            onPress={() => onSearchChange("")}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.colors.muted}
            />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 py-1.5"
        keyboardShouldPersistTaps="handled"
      >
        <CategoryChip active={!categoryId} onPress={() => onCategoryChange("")}>
          {t("pos.all", { count: productsCount })}
        </CategoryChip>
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            active={categoryId === category.id}
            onPress={() => onCategoryChange(category.id)}
          >
            {category.name} · {category.productCount ?? 0}
          </CategoryChip>
        ))}
      </ScrollView>

      {error ? (
        <View className="pos-notice">
          <Text className="text-xs text-error">{error}</Text>
          <Pressable onPress={onRetry}>
            <Text className="pt-1 font-bold text-primary">
              {t("common.retry")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between px-4 pb-0.5 pt-2">
        <Text className="font-semibold text-text-primary">
          {t("pos.products")}
        </Text>
        <Text className="pos-muted">{resultCount}</Text>
      </View>
    </View>
  );
}

function CategoryChip({ active, children, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("pos-chip", active && "pos-chip-selected")}
    >
      <Text
        className={clsx("pos-chip-label", active && "pos-chip-label-selected")}
      >
        {children}
      </Text>
    </Pressable>
  );
}
