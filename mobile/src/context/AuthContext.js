import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as authService from "../services/authService";

const TOKEN_KEY = "dukaanvoice.accessToken";
const AuthContext = createContext(null);

const getStoredToken = async () => {
  if (Platform.OS === "web") return globalThis.localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
};

const setStoredToken = async (token) => {
  if (Platform.OS === "web") {
    globalThis.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

const removeStoredToken = async () => {
  if (Platform.OS === "web") {
    globalThis.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveSession = useCallback(async (session) => {
    await setStoredToken(session.token);
    setToken(session.token);
    setUser(session.user);
    setShop(session.shop);
  }, []);
  const clearSession = useCallback(async () => {
    await removeStoredToken().catch(() => null);
    setToken(null);
    setUser(null);
    setShop(null);
  }, []);
  useEffect(() => {
    (async () => {
      const storedToken = await getStoredToken().catch(() => null);
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const session = await authService.getCurrentUser(storedToken);
        setToken(storedToken);
        setUser(session.user);
        setShop(session.shop);
      } catch (_error) {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession]);
  const login = useCallback(
    async (credentials) => {
      setError(null);
      try {
        const session = await authService.login(credentials);
        await saveSession(session);
        return session;
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      }
    },
    [saveSession],
  );
  const signup = useCallback(
    async (payload) => {
      setError(null);
      try {
        const session = await authService.signup(payload);
        await saveSession(session);
        return session;
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      }
    },
    [saveSession],
  );
  const logout = useCallback(async () => {
    setError(null);
    await clearSession();
  }, [clearSession]);
  const clearError = useCallback(() => setError(null), []);
  const value = useMemo(
    () => ({
      token,
      user,
      shop,
      loading,
      error,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
      clearError,
    }),
    [token, user, shop, loading, error, login, signup, logout, clearError],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
