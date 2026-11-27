import { apiRequest } from "./apiClient";

const queryString = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ).toString();

export const createSale = (token, body, idempotencyKey) =>
  apiRequest("/sales", {
    token,
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
  });

export const getSalesSummary = (token, params = {}) =>
  apiRequest(`/sales/summary?${queryString(params)}`, { token });

export const getSales = (token, params = {}) =>
  apiRequest(`/sales?${queryString(params)}`, { token });

export const getFrequentlySoldProducts = (token, params = {}) =>
  apiRequest(`/sales/frequently-sold?${queryString(params)}`, { token });

export const getSaleDetails = (token, saleId) =>
  apiRequest(`/sales/${saleId}`, { token });

export const recordCreditPayment = (token, saleId, amount) =>
  apiRequest(`/sales/${saleId}/credit-payments`, {
    token,
    method: "POST",
    body: { amount },
  });
