import { API_BASE_URL } from "../config/env";

const humanizeField = (field) =>
  field
    .replace(/\.(\d+)(?=\.|$)/g, (_, index) => ` ${Number(index) + 1}`)
    .split(".")
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, "$1 $2"))
    .join(" · ")
    .replace(/^./, (character) => character.toUpperCase());

export const formatApiErrorMessage = (message, code, details) => {
  if (code !== "VALIDATION_ERROR") return message || "Request failed";

  const issues = Array.isArray(details?.issues) ? details.issues : [];
  const lines = issues
    .filter((issue) => typeof issue?.message === "string")
    .map((issue) => {
      const field = typeof issue.field === "string" ? issue.field : "_form";
      const location = issue.location === "query" ? "Query" : issue.location === "params" ? "Path" : "";
      const label = field === "_form" ? "Request" : humanizeField(field);
      return `• ${location ? `${location} · ` : ""}${label}: ${issue.message}`;
    });

  if (!lines.length && details?.fieldErrors && typeof details.fieldErrors === "object") {
    for (const [field, messages] of Object.entries(details.fieldErrors)) {
      const list = Array.isArray(messages) ? messages : [messages];
      for (const reason of list) {
        if (typeof reason === "string") {
          lines.push(`• ${field === "_form" ? "Request" : humanizeField(field)}: ${reason}`);
        }
      }
    }
  }

  if (details?.truncated && lines.length) {
    lines.push("• Additional validation issues were omitted.");
  }

  return lines.length
    ? `Please check the following fields:\n${lines.join("\n")}`
    : message || "Request validation failed";
};

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(formatApiErrorMessage(message, code, details));
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
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(requestOptions.headers || {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    if (response.status === 304) {
      throw new ApiError(
        "The server returned no cached data. Please retry the request.",
        304,
        "EMPTY_NOT_MODIFIED_RESPONSE",
      );
    }

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
