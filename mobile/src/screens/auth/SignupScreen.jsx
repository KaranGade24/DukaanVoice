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
import LanguageSelector from "../../components/auth/LanguageSelector";
import FormField from "../../components/auth/FormField";
import PasswordField from "../../components/auth/PasswordField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CategorySelector from "../../components/auth/CategorySelector";
import { useAuth } from "../../context/AuthContext";
import { showValidationAlert } from "../../utils/validationAlert";
import { normalizeEmail, validateSignup } from "../../utils/authValidation";
import theme from "../../constants/theme";

export default function SignupScreen() {
  const { height } = useWindowDimensions();
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
      showValidationAlert(error, t("validation.alertTitle"));
      if (
        error.code === "EMAIL_ALREADY_REGISTERED" ||
        error.code === "DUPLICATE_RESOURCE"
      )
        setErrors({ email: t("auth.signupFailed") });
      else if (error.code === "VALIDATION_ERROR")
        setGeneralError(error.message);
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
      style={{ height: height - 56 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <AuthHeader title={t("auth.signupTitle")} />
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
        <View className="gap-1.25">
          <Text className="text-2xl font-bold leading-8 text-text-primary">
            {t("auth.signupHeading")}
          </Text>
          <Text className="text-sm leading-5 text-text-secondary">
            <MaterialCommunityIcons
              name="flash"
              size={18}
              color={theme.colors.primary}
            />{" "}
            {t("auth.signupSub")}
          </Text>
        </View>
        <View className="gap-4.5 rounded-card border border-border bg-white p-4 shadow-sm">
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
            <Text
              className="text-center text-sm leading-5 text-error"
              accessibilityRole="alert"
            >
              {generalError}
            </Text>
          ) : null}
          <View className="rounded-xl bg-surface-mint p-3">
            <Text className="text-center text-xs leading-4.25 text-text-secondary">
              {t("auth.secureNote")}
            </Text>
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
          className="flex-row items-center justify-center gap-3 rounded-card border border-border bg-white p-4.5"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="login"
            size={24}
            color={theme.colors.primary}
          />
          <View className="items-center gap-0.75">
            <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
              {t("auth.haveAccount")}
            </Text>
            <Text className="text-sm leading-5 font-bold text-primary">
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
