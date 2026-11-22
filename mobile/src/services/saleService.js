import { apiRequest } from "./apiClient";
export const createSale = (token, body, idempotencyKey) => apiRequest("/sales", {
  token, method: "POST", body, headers: { "Idempotency-Key": idempotencyKey },
});
