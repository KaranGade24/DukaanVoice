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
import LanguageSelector from "../../components/auth/LanguageSelector";
import FormField from "../../components/auth/FormField";
import PasswordField from "../../components/auth/PasswordField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CategorySelector from "../../components/auth/CategorySelector";
import { useAuth } from "../../context/AuthContext";
import { normalizeEmail, validateSignup } from "../../utils/authValidation";
import theme from "../../constants/theme";

export default function SignupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signup } = useAuth();
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    shopName: "",
    businessType: "",
    city: "",
  });
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
    const nextErrors = validateSignup(values, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        ...values,
        fullName: values.fullName.trim(),
        email: normalizeEmail(values.email),
        shopName: values.shopName.trim(),
        city: values.city.trim(),
      });
      router.replace("/(app)");
    } catch (error) {
      if (
        error.code === "EMAIL_ALREADY_REGISTERED" ||
        error.code === "DUPLICATE_RESOURCE"
      )
        setErrors({ email: t("auth.signupFailed") });
      else if (
        error.code === "NETWORK_ERROR" ||
        error.code === "NETWORK_TIMEOUT"
      )
        setGeneralError(t("auth.networkError"));
      else setGeneralError(t("auth.signupFailed"));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthHeader title={t("auth.signupTitle")} backHref="/(auth)/login" />
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
        <View style={styles.intro}>
          <Text style={styles.heading}>{t("auth.signupHeading")}</Text>
          <Text style={styles.subheading}>
            <MaterialCommunityIcons
              name="flash"
              size={18}
              color={theme.colors.primary}
            />{" "}
            {t("auth.signupSub")}
          </Text>
        </View>
        <View style={styles.formCard}>
          <FormField
            label={t("auth.fullName")}
            placeholder={t("auth.fullNamePlaceholder")}
            value={values.fullName}
            onChangeText={(value) => update("fullName", value)}
            error={errors.fullName}
            icon="account-outline"
            autoCapitalize="words"
            textContentType="name"
          />
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
              Platform.OS === "android" ? "new-password" : undefined
            }
            textContentType={Platform.OS === "ios" ? "newPassword" : undefined}
            importantForAutofill="yes"
          />
          <FormField
            label={t("auth.shopName")}
            placeholder={t("auth.shopNamePlaceholder")}
            value={values.shopName}
            onChangeText={(value) => update("shopName", value)}
            error={errors.shopName}
            icon="storefront-outline"
            autoCapitalize="words"
          />
          <CategorySelector
            value={values.businessType}
            onChange={(value) => update("businessType", value)}
            error={errors.businessType}
          />
          <FormField
            label={t("auth.city")}
            placeholder={t("auth.cityPlaceholder")}
            value={values.city}
            onChangeText={(value) => update("city", value)}
            error={errors.city}
            icon="map-marker-outline"
            autoCapitalize="words"
          />
          {generalError ? (
            <Text style={styles.generalError} accessibilityRole="alert">
              {generalError}
            </Text>
          ) : null}
          <View style={styles.terms}>
            <Text style={styles.termsText}>{t("auth.secureNote")}</Text>
          </View>
          <PrimaryButton
            label={
              submitting ? t("auth.creatingAccount") : t("auth.createAccount")
            }
            loading={submitting}
            onPress={submit}
          />
        </View>
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={styles.loginCard}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="login"
            size={24}
            color={theme.colors.primary}
          />
          <View style={styles.loginCopy}>
            <Text style={styles.loginTitle}>{t("auth.haveAccount")}</Text>
            <Text style={styles.loginAction}>
              {t("auth.login")}{" "}
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.primary}
              />
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.screenGutter, gap: 20, paddingBottom: 36 },
  topRow: {
    flexDirection: "row",
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
  intro: { gap: 5 },
  heading: { ...theme.typography.headline, color: theme.colors.textPrimary },
  subheading: { ...theme.typography.body, color: theme.colors.textSecondary },
  formCard: {
    gap: 17,
    padding: 18,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  terms: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceMint,
  },
  termsText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  generalError: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: "center",
  },
  loginCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loginCopy: { alignItems: "center", gap: 3 },
  loginTitle: { ...theme.typography.label, color: theme.colors.textPrimary },
  loginAction: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
