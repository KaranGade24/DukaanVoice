import { apiRequest } from "./apiClient";

const queryString = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ),
  ).toString();

export const listSuppliers = (token, params = {}) =>
  apiRequest(`/suppliers?${queryString(params)}`, { token });
export const getSupplier = (token, id) =>
  apiRequest(`/suppliers/${id}`, { token });
export const createSupplier = (token, body) =>
  apiRequest("/suppliers", { token, method: "POST", body });
export const updateSupplier = (token, id, body) =>
  apiRequest(`/suppliers/${id}`, { token, method: "PUT", body });
export const archiveSupplier = (token, id) =>
  apiRequest(`/suppliers/${id}/archive`, { token, method: "PATCH" });
export const getSupplierSummary = (token, id) =>
  apiRequest(`/suppliers/${id}/summary`, { token });
export const listSupplierPurchases = (token, id, params = {}) =>
  apiRequest(`/suppliers/${id}/purchases?${queryString(params)}`, { token });
export const getSupplierOutstanding = (token, id, params = {}) =>
  apiRequest(`/suppliers/${id}/outstanding?${queryString(params)}`, { token });
