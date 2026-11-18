import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import theme from '../constants/theme';

export default function RootRedirect() { const { isAuthenticated, loading } = useAuth(); const { ready } = useLanguage(); if (loading || !ready) return <View style={styles.container}><ActivityIndicator color={theme.colors.primary} size="large" /></View>; return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />; }
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background } });
