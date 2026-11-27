import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { invokeWithGeminiFailover } from "../config/geminiKeyManager.js";
import { agentConfig } from "../config/agentConfig.js";
import { billingPrompt } from "../prompts/billingPrompt.js";
import { customerPrompt } from "../prompts/customerPrompt.js";
import { inventoryPrompt } from "../prompts/inventoryPrompt.js";
import { systemPrompt } from "../prompts/systemPrompt.js";
import { createAgentTools } from "../tools/tools.js";

const prompt = [
  systemPrompt,
  billingPrompt,
  inventoryPrompt,
  customerPrompt,
].join(" ");

const unsupportedGeminiSchemaKeys = new Set([
  "$schema",
  "additionalProperties",
  "default",
  "exclusiveMaximum",
  "exclusiveMinimum",
  "maxLength",
  "minLength",
  "pattern",
]);

const toGeminiSchema = (value) => {
  if (Array.isArray(value)) return value.map(toGeminiSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsupportedGeminiSchemaKeys.has(key))
      .map(([key, child]) => [key, toGeminiSchema(child)]),
  );
};

export const geminiToolDeclarations = (tools) =>
  tools.map((tool) => {
    const parameters = toGeminiSchema(z.toJSONSchema(tool.schema, { io: "input" }));
    if (parameters.properties && !Object.keys(parameters.properties).length)
      delete parameters.properties;
    return {
      name: tool.name,
      description: tool.description || tool.name,
      ...(parameters.properties ? { parameters } : {}),
    };
  });

export const createAgentGraph = ({ userId, shopId, conversationId }) => {
  const tools = createAgentTools({ userId, shopId, conversationId });
  const geminiTools = [{ functionDeclarations: geminiToolDeclarations(tools) }];
  let toolRounds = 0;
  const modelNode = async (state) => {
    const lastMessage = state.messages.at(-1);
    if (lastMessage?.getType?.() === "tool" || lastMessage?.type === "tool")
      toolRounds += 1;
    const response = await invokeWithGeminiFailover(async (model, keyId) => {
      const runnable = toolRounds >= agentConfig.maxToolRounds
        ? model
        : model.bindTools(geminiTools);
      const startedAt = process.hrtime.bigint();
      try {
        const result = await runnable.invoke(state.messages, { timeout: agentConfig.timeoutMs });
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        console.info("AI model call", {
          model: agentConfig.model,
          keyId,
          toolRound: toolRounds,
          inputMessages: state.messages.length,
          durationMs: Number(durationMs.toFixed(2)),
          outputTokens: result.usage_metadata?.output_tokens ?? null,
          toolCalls: result.tool_calls?.length ?? 0,
        });
        return result;
      } catch (error) {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        console.warn("AI model call failed", {
          model: agentConfig.model,
          keyId,
          toolRound: toolRounds,
          durationMs: Number(durationMs.toFixed(2)),
          status: error.status || error.statusCode || error.response?.status || null,
          code: typeof error.code === "string" ? error.code : null,
        });
        throw error;
      }
    });
    return { messages: [response] };
  };
  return new StateGraph(MessagesAnnotation)
    .addNode("assistant", modelNode)
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "assistant")
    .addConditionalEdges("assistant", toolsCondition, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "assistant")
    .compile();
};

export const conversationMessages = (messages) =>
  messages.map((message) =>
    message.role === "user"
      ? new HumanMessage(message.content)
      : new AIMessage(message.content),
  );

export const systemMessage = (language) => new SystemMessage(
  language === "hi"
    ? `${prompt} Reply in Hindi.`
    : language === "mr"
      ? `${prompt} Reply in Marathi.`
      : language === "en"
        ? `${prompt} Reply in English.`
        : prompt,
);
