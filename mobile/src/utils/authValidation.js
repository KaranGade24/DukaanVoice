const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const businessTypes = ['grocery', 'dairy_bakery', 'pharmacy', 'wholesale'];

export function validateEmail(value, t) {
  if (!value.trim()) return t('validation.emailRequired');
  if (!emailPattern.test(value.trim().toLowerCase())) return t('validation.emailInvalid');
  return '';
}

export function validatePassword(value, t, required = true) {
  if (!value && required) return t('validation.passwordRequired');
  if (value.length < 8) return t('validation.passwordLength');
  if (!/[A-Z]/.test(value)) return t('validation.passwordUppercase');
  if (!/[a-z]/.test(value)) return t('validation.passwordLowercase');
  if (!/[0-9]/.test(value)) return t('validation.passwordNumber');
  if (!/[^A-Za-z0-9]/.test(value)) return t('validation.passwordSpecial');
  return '';
}

export function validateSignup(values, t) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = t('validation.fullNameRequired');
  else if (values.fullName.trim().length < 2) errors.fullName = t('validation.nameTooShort');
  const emailError = validateEmail(values.email, t); if (emailError) errors.email = emailError;
  const passwordError = validatePassword(values.password, t); if (passwordError) errors.password = passwordError;
  if (!values.shopName.trim()) errors.shopName = t('validation.shopNameRequired');
  if (!businessTypes.includes(values.businessType)) errors.businessType = t('validation.businessTypeRequired');
  if (!values.city.trim()) errors.city = t('validation.cityRequired');
  return errors;
}

export function validateLogin(values, t) {
  const errors = {};
  const emailError = validateEmail(values.email, t); if (emailError) errors.email = emailError;
  if (!values.password) errors.password = t('validation.passwordRequired');
  return errors;
}

export const normalizeEmail = (value) => value.trim().toLowerCase();
