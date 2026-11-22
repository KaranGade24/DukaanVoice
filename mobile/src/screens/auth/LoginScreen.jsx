import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import AuthHeader from "../../components/auth/AuthHeader";
import AppVersionFooter from "../../components/auth/AppVersionFooter";
import LanguageSelector from "../../components/auth/LanguageSelector";
import FormField from "../../components/auth/FormField";
import PasswordField from "../../components/auth/PasswordField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { showValidationAlert } from "../../utils/validationAlert";
import { validateLogin, normalizeEmail } from "../../utils/authValidation";
import theme from "../../constants/theme";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setGeneralError("");
  };
  const submit = async () => {
    Keyboard.dismiss();
    const nextErrors = validateLogin(values, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    setGeneralError("");
    try {
      await login({
        email: normalizeEmail(values.email),
        password: values.password,
      });
      router.replace("/(app)");
    } catch (error) {
      showValidationAlert(error, t("validation.alertTitle"));
      if (error.code === "INVALID_CREDENTIALS")
        setGeneralError(t("auth.invalidCredentials"));
      else if (error.code === "VALIDATION_ERROR")
        setGeneralError(error.message);
      else if (
        error.code === "NETWORK_ERROR" ||
        error.code === "NETWORK_TIMEOUT"
      )
        setGeneralError(t("auth.networkError"));
      else setGeneralError(t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <AuthHeader title={t("auth.loginTitle")} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="account-voice"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.badgeText}>{t("auth.welcomeBadge")}</Text>
          </View>
          <LanguageSelector />
        </View>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={38}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brand}>{t("auth.welcomeBadge")}</Text>
            <Text style={styles.heading}>{t("auth.welcome")}</Text>
            <Text style={styles.subheading}>{t("auth.welcomeSub")}</Text>
          </View>
        </View>
        <View style={styles.voiceCard}>
          <View style={styles.voiceIcon}>
            <MaterialCommunityIcons
              name="microphone-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.voiceCopy}>
            <Text style={styles.voiceTitle}>{t("auth.voiceHint")}</Text>
            <Text style={styles.voiceExample}>{t("auth.voiceExample")}</Text>
          </View>
          <View style={styles.wave}>
            <MaterialCommunityIcons
              name="waveform"
              size={23}
              color={theme.colors.primary}
            />
          </View>
        </View>
        <View style={styles.formCard}>
          <FormField
            label={t("auth.email")}
            placeholder={t("auth.emailPlaceholder")}
            value={values.email}
            onChangeText={(value) => update("email", value)}
            error={errors.email}
            icon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete={Platform.OS === "android" ? "email" : undefined}
            textContentType={Platform.OS === "ios" ? "username" : undefined}
            importantForAutofill="yes"
          />
          <PasswordField
            label={t("auth.password")}
            placeholder={t("auth.passwordPlaceholder")}
            value={values.password}
            onChangeText={(value) => update("password", value)}
            error={errors.password}
            autoComplete={
              Platform.OS === "android" ? "current-password" : undefined
            }
            textContentType={Platform.OS === "ios" ? "password" : undefined}
            importantForAutofill="yes"
          />
          {generalError ? (
            <Text style={styles.generalError} accessibilityRole="alert">
              {generalError}
            </Text>
          ) : null}
          <View style={styles.secureNote}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.secureText}>{t("auth.secureNote")}</Text>
          </View>
          <PrimaryButton
            label={submitting ? t("auth.loggingIn") : t("auth.login")}
            loading={submitting}
            onPress={submit}
            icon="arrow-right"
          />
        </View>
        <Pressable
          onPress={() => router.replace("/(auth)/signup")}
          style={styles.switchCard}
          accessibilityRole="button"
        >
          <View style={styles.switchIcon}>
            <MaterialCommunityIcons
              name="store-plus-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>{t("auth.noAccount")}</Text>
            <Text style={styles.switchAction}>
              {t("auth.signup")}{" "}
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color={theme.colors.primary}
              />
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={26}
            color={theme.colors.textSecondary}
          />
        </Pressable>
        <AppVersionFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceTint,
  },
  badgeText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  brandRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  brandIcon: {
    width: 102,
    height: 102,
    borderRadius: 24,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brandCopy: { flex: 1, gap: 4 },
  brand: {
    ...theme.typography.title,
    color: theme.colors.primary,
    letterSpacing: 1.2,
  },
  heading: { ...theme.typography.headline, color: theme.colors.textPrimary },
  subheading: { ...theme.typography.body, color: theme.colors.textSecondary },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surfaceMint,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimary,
  },
  voiceIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCopy: { flex: 1, gap: 3 },
  voiceTitle: { ...theme.typography.label, color: theme.colors.primary },
  voiceExample: { ...theme.typography.body, color: theme.colors.textSecondary },
  wave: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    gap: 18,
    padding: 16,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  secureNote: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMint,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secureText: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  generalError: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: "center",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimary,
  },
  switchIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  switchCopy: { flex: 1, gap: 3 },
  switchTitle: { ...theme.typography.title, color: theme.colors.textPrimary },
  switchAction: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
