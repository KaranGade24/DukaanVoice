import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_ISSUER: z.string().default("dukaanvoice-api"),
  JWT_AUDIENCE: z.string().default("dukaanvoice-mobile"),
  CORS_ORIGIN: z.string().default("*"),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  GEMINI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(128)
    .max(8192)
    .default(512),
  GEMINI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(120000)
    .default(30000),
  GEMINI_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),
  GEMINI_COOLDOWN_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(3600000)
    .default(60000),
  GEMINI_MAX_COOLDOWN_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(86400000)
    .default(900000),
  AI_MAX_TOOL_ROUNDS: z.coerce.number().int().min(1).max(20).default(4),
  AI_RECURSION_LIMIT: z.coerce.number().int().min(4).max(100).default(18),
  AI_HISTORY_LIMIT: z.coerce.number().int().min(4).max(100).default(8),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid environment configuration",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment configuration");
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  mongodbUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  jwtIssuer: parsed.data.JWT_ISSUER,
  jwtAudience: parsed.data.JWT_AUDIENCE,
  corsOrigin:
    parsed.data.CORS_ORIGIN === "*"
      ? true
      : parsed.data.CORS_ORIGIN.split(",").map((value) => value.trim()),
  geminiModel: parsed.data.GEMINI_MODEL,
  geminiTemperature: parsed.data.GEMINI_TEMPERATURE,
  geminiMaxOutputTokens: parsed.data.GEMINI_MAX_OUTPUT_TOKENS,
  geminiTimeoutMs: parsed.data.GEMINI_TIMEOUT_MS,
  geminiMaxRetries: parsed.data.GEMINI_MAX_RETRIES,
  geminiCooldownMs: parsed.data.GEMINI_COOLDOWN_MS,
  geminiMaxCooldownMs: parsed.data.GEMINI_MAX_COOLDOWN_MS,
  aiMaxToolRounds: parsed.data.AI_MAX_TOOL_ROUNDS,
  aiRecursionLimit: parsed.data.AI_RECURSION_LIMIT,
  aiHistoryLimit: parsed.data.AI_HISTORY_LIMIT,
};
