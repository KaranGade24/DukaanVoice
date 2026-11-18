import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resources from "./locales";

i18n
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(resources).map(([language, value]) => [
        language,
        { translation: value },
      ]),
    ),
    fallbackLng: "en",
    lng: "en",
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });
export default i18n;
