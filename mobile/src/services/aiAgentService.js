import { apiRequest } from "./apiClient";

export const sendAgentMessage = (token, message, conversationId, draft, responseLanguage) =>
  apiRequest("/ai-agent/chat", {
    token,
    method: "POST",
    timeoutMs: 100000,
    body: {
      message,
      ...(conversationId ? { conversationId } : {}),
      ...(draft ? { draft } : {}),
      ...(responseLanguage ? { responseLanguage } : {}),
    },
  });

export const getAgentConversation = (token, conversationId) =>
  apiRequest("/ai-agent/conversations/" + encodeURIComponent(conversationId), {
    token,
  });

export const updateAgentDraft = (token, conversationId, draft) =>
  apiRequest("/ai-agent/conversations/" + encodeURIComponent(conversationId) + "/draft", {
    token,
    method: "PUT",
    body: { draft },
  });

export const confirmAgentAction = (token, conversationId, confirmationToken) =>
  apiRequest("/ai-agent/confirm-action", {
    token,
    method: "POST",
    timeoutMs: 30000,
    body: { conversationId, confirmationToken },
  });

export const cancelAgentAction = (token, conversationId) =>
  apiRequest("/ai-agent/cancel-action", {
    token,
    method: "POST",
    body: { conversationId },
  });
