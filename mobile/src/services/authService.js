import { apiRequest } from "./apiClient";

export const signup = (payload) =>
  apiRequest("/auth/signup", { method: "POST", body: payload });

export const login = (payload) =>
  apiRequest("/auth/login", { method: "POST", body: payload });

export const getCurrentUser = (token) => apiRequest("/auth/me", { token });
