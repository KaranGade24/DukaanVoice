import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
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
  const { height } = useWindowDimensions();
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
      style={{ height: height - 56 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <AuthHeader title={t("auth.loginTitle")} />
      <ScrollView
        contentContainerClassName="flex-grow gap-4 px-4 pt-4 pb-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-row items-center gap-1.75 rounded-full bg-surface-tint px-3.5 py-2.25">
            <MaterialCommunityIcons
              name="account-voice"
              size={18}
              color={theme.colors.primary}
            />
            <Text className="text-sm leading-5 font-semibold text-primary">
              {t("auth.welcomeBadge")}
            </Text>
          </View>
          <LanguageSelector />
        </View>
        <View className="flex-row items-center gap-4">
          <View className="h-25.5 w-25.5 items-center justify-center rounded-3xl bg-accent">
            <MaterialCommunityIcons
              name="storefront-outline"
              size={38}
              color={theme.colors.primary}
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold leading-6 tracking-[1.2px] text-primary">
              {t("auth.welcomeBadge")}
            </Text>
            <Text className="text-2xl font-bold leading-8 text-text-primary">
              {t("auth.welcome")}
            </Text>
            <Text className="text-sm leading-5 text-text-secondary">
              {t("auth.welcomeSub")}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3 rounded-card border border-border-primary bg-surface-mint p-3.5">
          <View className="h-11.5 w-11.5 items-center justify-center rounded-xl bg-white">
            <MaterialCommunityIcons
              name="microphone-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View className="min-w-0 flex-1 gap-0.75">
            <Text className="text-[15px] leading-5.25 font-semibold text-primary">
              {t("auth.voiceHint")}
            </Text>
            <Text className="text-sm leading-5 text-text-secondary">
              {t("auth.voiceExample")}
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
            <MaterialCommunityIcons
              name="waveform"
              size={23}
              color={theme.colors.primary}
            />
          </View>
        </View>
        <View className="gap-4.5 rounded-card border border-border bg-white p-4 shadow-sm">
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
            <Text
              className="text-center text-sm leading-5 text-error"
              accessibilityRole="alert"
            >
              {generalError}
            </Text>
          ) : null}
          <View className="min-h-13 flex-row items-center gap-2.5 rounded-card bg-surface-mint px-3.5">
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text className="min-w-0 flex-1 text-sm leading-5 text-primary">
              {t("auth.secureNote")}
            </Text>
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
          className="flex-row items-center gap-3 rounded-card border border-border-primary bg-surface-tint p-3.5"
          accessibilityRole="button"
        >
          <View className="h-12 w-12 items-center justify-center rounded-card bg-white">
            <MaterialCommunityIcons
              name="store-plus-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View className="flex-1 gap-0.75">
            <Text className="text-lg font-semibold leading-6 text-text-primary">
              {t("auth.noAccount")}
            </Text>
            <Text className="text-sm leading-5 font-bold text-primary">
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
