import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { agentConfig } from "./agentConfig.js";

const state = new Map();
let activeKeyId = null;
const keys = () => {
  const found = Object.entries(process.env)
    .flatMap(([name, value]) => {
      if (name === "GOOGLE_API_KEY")
        return value?.trim() ? [[0, name, value.trim()]] : [];
      const match = name.match(/^GOOGLE_API_KEY_(\d+)$/);
      return match && value?.trim()
        ? [[Number(match[1]), name, value.trim()]]
        : [];
    })
    .sort((a, b) => a[0] - b[0]);
  return [...new Map(found.map(([, id, key]) => [key, { id, key }])).values()];
};

const isQuotaError = (error) => {
  const detail = [error?.status, error?.code, error?.message].join(" ");
  const status = Number(error?.status || error?.statusCode);
  return (
    status === 429 ||
    status === 401 ||
    (status === 403 &&
      /permission_denied|api.?key|authentication|unauthorized/i.test(detail) &&
      !/safety|unsafe|blocked prompt|content/i.test(detail)) ||
    /resource[_ ]exhausted|quota|rate.?limit|too many requests/i.test(detail) ||
    /invalid api.?key|api.?key.{0,20}(invalid|not valid|blocked)|unauthorized|authentication failed/i.test(
      detail,
    )
  );
};

const isTransientError = (error) =>
  Number(error?.status || error?.statusCode) >= 500 ||
  /timeout|timed out|abort|econnreset|enotfound|network/i.test(
    [error?.code, error?.message].join(" "),
  );

export const getAvailableGeminiModel = () => {
  const now = Date.now();
  const available = keys().filter(
    ({ id }) => (state.get(id)?.cooldownUntil || 0) <= now,
  );
  const selected =
    available.find(({ id }) => id === activeKeyId) ||
    available.sort(
      (a, b) =>
        (state.get(a.id)?.lastUsedAt || 0) - (state.get(b.id)?.lastUsedAt || 0),
    )[0];
  if (!selected) {
    if (!keys().length)
      throw Object.assign(new Error("AI assistant is not configured"), {
        statusCode: 503,
        code: "AI_NOT_CONFIGURED",
      });
    throw Object.assign(
      new Error(
        "The AI assistant is temporarily busy. Please try again shortly.",
      ),
      { statusCode: 503, code: "AI_KEYS_UNAVAILABLE" },
    );
  }
  state.set(selected.id, {
    ...(state.get(selected.id) || {}),
    lastUsedAt: now,
  });
  activeKeyId = selected.id;
  return {
    model: new ChatGoogleGenerativeAI({
      apiKey: selected.key,
      model: agentConfig.model,
      temperature: agentConfig.temperature,
      maxOutputTokens: agentConfig.maxOutputTokens,
      maxRetries: 0,
    }),
    keyId: selected.id,
  };
};

export const invokeWithGeminiFailover = async (invoke) => {
  const configured = keys();
  if (!configured.length)
    throw Object.assign(new Error("AI assistant is not configured"), {
      statusCode: 503,
      code: "AI_NOT_CONFIGURED",
    });
  let lastError;
  let quotaFailures = 0;
  let transientRetries = 0;
  while (
    quotaFailures < configured.length &&
    transientRetries <= agentConfig.maxRetries
  ) {
    const { model, keyId } = getAvailableGeminiModel();
    try {
      return await invoke(model, keyId);
    } catch (error) {
      lastError = error;
      if (isQuotaError(error)) {
        const prior = state.get(keyId) || {};
        const failureCount = (prior.failureCount || 0) + 1;
        const headers = error?.headers || error?.response?.headers;
        const retryHeader =
          headers?.get?.("retry-after") ||
          Object.entries(headers || {}).find(
            ([name]) => name.toLowerCase() === "retry-after",
          )?.[1];
        const retryAfterSeconds = Number(retryHeader);
        const retryAfterValue =
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : Date.parse(retryHeader || "") - Date.now();
        const retryAfter = Number.isFinite(retryAfterValue)
          ? Math.max(0, retryAfterValue)
          : 0;
        const cooldown = Math.min(
          agentConfig.maxCooldownMs,
          Math.max(
            retryAfter,
            agentConfig.cooldownMs * 2 ** Math.min(failureCount - 1, 4),
          ),
        );
        state.set(keyId, {
          ...prior,
          failureCount,
          cooldownUntil: Date.now() + cooldown,
        });
        if (activeKeyId === keyId) activeKeyId = null;
        quotaFailures += 1;
        continue;
      }
      if (
        !isTransientError(error) ||
        transientRetries >= agentConfig.maxRetries
      )
        throw error;
      // Try the next configured key on provider/server failures when possible.
      // This preserves retries for a single-key setup while avoiding repeatedly
      // sending a failing request through the same key in multi-key setups.
      if (configured.length > 1) {
        const prior = state.get(keyId) || {};
        state.set(keyId, {
          ...prior,
          cooldownUntil: Date.now() + 1000,
        });
        if (activeKeyId === keyId) activeKeyId = null;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 250 * 2 ** transientRetries),
      );
      transientRetries += 1;
    }
  }
  throw Object.assign(
    new Error(
      "The AI assistant is temporarily busy. Please try again shortly.",
    ),
    { statusCode: 503, code: "AI_KEYS_UNAVAILABLE", cause: lastError },
  );
};
