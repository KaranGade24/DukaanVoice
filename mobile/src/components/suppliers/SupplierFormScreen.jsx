import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as suppliersApi from "../../services/supplierService";
import { showValidationAlert } from "../../utils/validationAlert";
import {
  Button,
  Field,
  Notice,
  ScrollPage,
  errorText,
} from "../purchase-management/PurchaseManagementUI";

const initialForm = () => ({
  supplierName: "",
  contactPerson: "",
  phoneNumber: "",
  alternatePhone: "",
  email: "",
  businessName: "",
  gstNumber: "",
  notes: "",
  address: { street: "", city: "", state: "", pincode: "", country: "India" },
});

const validPhone = (value) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 24 && /^\+?[\d ()-]+$/.test(trimmed);
};

export function SupplierFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const editing = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
    setFieldErrors((old) => {
      if (!old[key]) return old;
      const next = { ...old };
      delete next[key];
      return next;
    });
    setError("");
  };

  const setAddress = (key, value) => {
    setForm((old) => ({ ...old, address: { ...old.address, [key]: value } }));
    setFieldErrors((old) => {
      const next = { ...old };
      delete next[`address.${key}`];
      return next;
    });
    setError("");
  };

  const fieldError = (key) => fieldErrors[key]?.[0] || "";

  useEffect(() => {
    if (!editing) return;
    let active = true;
    suppliersApi
      .getSupplier(token, id)
      .then((data) => {
        if (!active) return;
        setForm((old) => ({
          ...old,
          supplierName: data.supplierName || "",
          contactPerson: data.contactPerson || "",
          phoneNumber: data.phoneNumber || "",
          alternatePhone: data.alternatePhone || "",
          email: data.email || "",
          businessName: data.businessName || "",
          gstNumber: data.gstNumber || "",
          notes: data.notes || "",
          address: { ...old.address, ...(data.address || {}) },
        }));
      })
      .catch((e) => {
        if (active) setError(errorText(e, t("supplierPurchase.loadFailed")));
      });
    return () => {
      active = false;
    };
  }, [editing, id, token, t]);

  const submit = async () => {
    const localErrors = {};
    if (!form.supplierName.trim())
      localErrors.supplierName = [t("supplierPurchase.requiredSupplierName")];
    if (!validPhone(form.phoneNumber))
      localErrors.phoneNumber = [t("supplierPurchase.invalidPhone")];
    if (form.alternatePhone.trim() && !validPhone(form.alternatePhone))
      localErrors.alternatePhone = [t("supplierPurchase.invalidPhone")];
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      localErrors.email = [t("supplierPurchase.invalidEmail")];

    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      setError(t("supplierPurchase.validationFailed"));
      return;
    }

    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const payload = {
        supplierName: form.supplierName.trim(),
        contactPerson: form.contactPerson.trim(),
        phoneNumber: form.phoneNumber.trim(),
        alternatePhone: form.alternatePhone.trim(),
        email: form.email.trim(),
        businessName: form.businessName.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(),
        notes: form.notes.trim(),
        address: Object.fromEntries(
          Object.entries(form.address).map(([key, value]) => [key, value.trim()]),
        ),
      };
      const result = editing
        ? await suppliersApi.updateSupplier(token, id, payload)
        : await suppliersApi.createSupplier(token, payload);
      if (result.duplicateWarning)
        Alert.alert(
          t("supplierPurchase.duplicateTitle"),
          t("supplierPurchase.duplicateMessage", {
            name: result.duplicateWarning.supplierName,
          }),
        );
      router.replace(editing ? `/suppliers/${id}` : `/suppliers/${result.id}`);
    } catch (e) {
      showValidationAlert(e, t("validation.alertTitle"));
      const serverFieldErrors = e.details?.fieldErrors;
      if (serverFieldErrors && typeof serverFieldErrors === "object") {
        setFieldErrors(serverFieldErrors);
        setError(e.message);
      } else if (e.code === "INVALID_GSTIN") {
        setFieldErrors({ gstNumber: [e.message] });
        setError(e.message);
      } else {
        setError(errorText(e, t("supplierPurchase.saveFailed")));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollPage
      title={
        editing
          ? t("supplierPurchase.editSupplier")
          : t("supplierPurchase.addSupplier")
      }
    >
      {error ? <Notice text={error} /> : null}
      <Field
        label={t("supplierPurchase.supplierName")}
        value={form.supplierName}
        onChangeText={(value) => set("supplierName", value)}
        autoCapitalize="words"
        autoComplete="organization"
        maxLength={160}
        returnKeyType="next"
        error={fieldError("supplierName")}
      />
      <Field
        label={t("supplierPurchase.phone")}
        value={form.phoneNumber}
        onChangeText={(value) => set("phoneNumber", value)}
        keyboardType="phone-pad"
        autoCapitalize="none"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={24}
        returnKeyType="next"
        error={fieldError("phoneNumber")}
      />
      <Field
        label={t("supplierPurchase.contactPerson")}
        value={form.contactPerson}
        onChangeText={(value) => set("contactPerson", value)}
        autoCapitalize="words"
        autoComplete="name"
        maxLength={120}
        returnKeyType="next"
        error={fieldError("contactPerson")}
      />
      <Field
        label={t("supplierPurchase.alternatePhone")}
        value={form.alternatePhone}
        onChangeText={(value) => set("alternatePhone", value)}
        keyboardType="phone-pad"
        autoCapitalize="none"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={24}
        returnKeyType="next"
        error={fieldError("alternatePhone")}
      />
      <Field
        label={t("supplierPurchase.email")}
        value={form.email}
        onChangeText={(value) => set("email", value)}
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={254}
        returnKeyType="next"
        error={fieldError("email")}
      />
      <Field
        label={t("supplierPurchase.businessName")}
        value={form.businessName}
        onChangeText={(value) => set("businessName", value)}
        autoCapitalize="words"
        maxLength={160}
        returnKeyType="next"
        error={fieldError("businessName")}
      />
      <Field
        label={t("supplierPurchase.gstNumber")}
        value={form.gstNumber}
        onChangeText={(value) => set("gstNumber", value.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={15}
        returnKeyType="next"
        error={fieldError("gstNumber")}
      />
      <Field
        label={t("supplierPurchase.street")}
        value={form.address.street}
        onChangeText={(value) => setAddress("street", value)}
        autoCapitalize="sentences"
        maxLength={200}
        returnKeyType="next"
        error={fieldError("address.street")}
      />
      <Field
        label={t("supplierPurchase.city")}
        value={form.address.city}
        onChangeText={(value) => setAddress("city", value)}
        autoCapitalize="words"
        maxLength={120}
        returnKeyType="next"
        error={fieldError("address.city")}
      />
      <Field
        label={t("supplierPurchase.state")}
        value={form.address.state}
        onChangeText={(value) => setAddress("state", value)}
        autoCapitalize="words"
        maxLength={120}
        returnKeyType="next"
        error={fieldError("address.state")}
      />
      <Field
        label={t("supplierPurchase.pincode")}
        value={form.address.pincode}
        onChangeText={(value) => setAddress("pincode", value.replace(/\D/g, ""))}
        keyboardType="number-pad"
        inputMode="numeric"
        autoCapitalize="none"
        maxLength={12}
        returnKeyType="next"
        error={fieldError("address.pincode")}
      />
      <Field
        label={t("supplierPurchase.notes")}
        value={form.notes}
        onChangeText={(value) => set("notes", value)}
        multiline
        autoCapitalize="sentences"
        maxLength={1000}
        numberOfLines={4}
        error={fieldError("notes")}
      />
      <Button
        title={
          busy
            ? t("supplierPurchase.saving")
            : t("supplierPurchase.saveSupplier")
        }
        disabled={busy}
        onPress={submit}
      />
    </ScrollPage>
  );
}
