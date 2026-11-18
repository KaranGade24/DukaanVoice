import Constants from "expo-constants";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
const expoHost =
  Constants.expoConfig?.hostUri?.split(":")[0] ||
  Constants.expoGoConfig?.debuggerHost?.split(":")[0];
const fallbackUrl = expoHost
  ? `http://${expoHost}:8080/api`
  : "http://localhost:8080/api";

// `localhost` points to the phone itself when the app runs on a physical
// device. Replace it with the machine hosting Expo so auth requests reach the
// local backend while keeping explicit non-local URLs unchanged.
const apiUrl = configuredUrl || fallbackUrl;
const usesLocalhost = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(
  apiUrl,
);
const resolvedUrl =
  usesLocalhost && expoHost
    ? apiUrl.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)/i, `$1${expoHost}`)
    : apiUrl;

export const API_BASE_URL = resolvedUrl.replace(/\/$/, "");
