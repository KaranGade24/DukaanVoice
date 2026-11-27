import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getLocales } from "expo-localization";
import i18n from "../i18n";
import { supportedLanguages } from "../i18n/locales";

const LANGUAGE_KEY = "dukaanvoice.language";
const LanguageContext = createContext(null);

const readStoredLanguage = async () => {
  try {
    return Platform.OS === "web"
      ? globalThis.localStorage?.getItem(LANGUAGE_KEY) || null
      : await SecureStore.getItemAsync(LANGUAGE_KEY);
  } catch {
    return null;
  }
};

const persistLanguage = async (nextLanguage) => {
  try {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(LANGUAGE_KEY, nextLanguage);
    } else {
      await SecureStore.setItemAsync(LANGUAGE_KEY, nextLanguage);
    }
  } catch {
    // Keep the language change active even when device storage is unavailable.
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      const saved = await readStoredLanguage();
      const device = getLocales()[0]?.languageCode;
      const selected =
        saved ||
        (supportedLanguages.some((item) => item.code === device) && device) ||
        "en";
      await i18n.changeLanguage(selected);
      setLanguageState(selected);
      setReady(true);
    })();
  }, []);
  const setLanguage = async (nextLanguage) => {
    if (!supportedLanguages.some((item) => item.code === nextLanguage)) return;
    await i18n.changeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
    await persistLanguage(nextLanguage);
  };
  const value = useMemo(
    () => ({ language, setLanguage, ready, languages: supportedLanguages }),
    [language, ready],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
export const useLanguage = () => useContext(LanguageContext);
