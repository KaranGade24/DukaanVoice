import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../constants/theme';

export default function LanguageSelector() {
  const { language, languages, setLanguage } = useLanguage();
  return <View style={styles.container} accessibilityRole="tablist">{languages.map((item) => <Pressable key={item.code} onPress={() => setLanguage(item.code)} style={[styles.option, language === item.code && styles.active]} accessibilityRole="tab" accessibilityState={{ selected: language === item.code }}><Text style={[styles.text, language === item.code && styles.activeText]}>{item.label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({ container: { flexDirection: 'row', backgroundColor: theme.colors.surfaceTint, borderRadius: theme.radii.pill, padding: 4 }, option: { minHeight: 36, paddingHorizontal: 12, borderRadius: theme.radii.pill, justifyContent: 'center' }, active: { backgroundColor: theme.colors.primary, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 }, text: { ...theme.typography.body, color: theme.colors.textSecondary }, activeText: { color: theme.colors.onPrimary, fontWeight: '700' } });
