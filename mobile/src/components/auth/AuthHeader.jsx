import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import theme from '../../constants/theme';


export default function AuthHeader({ title, backHref }) {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (backHref) {
      router.replace(backHref);
      return;
    }
    if (router.canGoBack()) router.back();
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={goBack}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-outline" size={22} color={theme.colors.onPrimary} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceTint,
  },
  back: { width: 44, height: 48, justifyContent: 'center' },
  title: { flex: 1, ...theme.typography.title, color: theme.colors.textPrimary, marginHorizontal: 4 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
