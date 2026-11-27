import { env } from "../../../config/env.js";
export const agentConfig = {
  model: env.geminiModel,
  temperature: env.geminiTemperature,
  maxOutputTokens: env.geminiMaxOutputTokens,
  timeoutMs: env.geminiTimeoutMs,
  maxRetries: env.geminiMaxRetries,
  maxToolRounds: env.aiMaxToolRounds,
  recursionLimit: env.aiRecursionLimit,
  historyLimit: env.aiHistoryLimit,
  cooldownMs: env.geminiCooldownMs,
  maxCooldownMs: Math.max(env.geminiCooldownMs, env.geminiMaxCooldownMs),
};
