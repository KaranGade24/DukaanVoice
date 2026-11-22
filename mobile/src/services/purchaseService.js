import { apiRequest } from "./apiClient";

const queryString = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ),
  ).toString();

export const listPurchases = (token, params = {}) =>
  apiRequest(`/purchases?${queryString(params)}`, { token });
export const getPurchase = (token, id) =>
  apiRequest(`/purchases/${id}`, { token });
export const createPurchase = (token, body, idempotencyKey) =>
  apiRequest("/purchases", {
    token,
    method: "POST",
    body,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
  });
export const getPurchaseInvoice = (token, id) =>
  apiRequest(`/purchases/${id}/invoice`, { token });
export const cancelPurchase = (token, id, reason) =>
  apiRequest(`/purchases/${id}/cancel`, {
    token,
    method: "POST",
    body: { reason },
  });
export const listPurchasePayments = (token, id, params = {}) =>
  apiRequest(`/purchases/${id}/payments?${queryString(params)}`, { token });
export const recordPurchasePayment = (token, id, body, idempotencyKey) =>
  apiRequest(`/purchases/${id}/payments`, {
    token,
    method: "POST",
    body,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
  });
