import { API_BASE_URL } from "../config/env";

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  const { token, body, ...requestOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      method: requestOptions.method || "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(requestOptions.headers || {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      throw new ApiError(
        payload?.error?.message || "Request failed",
        response.status,
        payload?.error?.code,
        payload?.error?.details,
      );
    }

    return payload?.data ?? payload;
  } catch (error) {
    if (error.name === "AbortError")
      throw new ApiError("Network request timed out", 0, "NETWORK_TIMEOUT");
    if (error instanceof ApiError) throw error;
    throw new ApiError("Unable to connect to the server", 0, "NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}
