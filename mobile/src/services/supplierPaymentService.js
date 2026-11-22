import { apiRequest } from "./apiClient";

const queryString = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ),
  ).toString();

export const listSupplierPayments = (token, params = {}) =>
  apiRequest(`/purchases/supplier-payments?${queryString(params)}`, { token });
export const getSupplierPayment = (token, id) =>
  apiRequest(`/purchases/supplier-payments/${id}`, { token });
