import { apiRequest } from "./apiClient";

const queryString = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ).toString();

export const getCustomers = (token, params = {}) =>
  apiRequest(`/customers?${queryString(params)}`, { token });

export const createCustomer = (token, body) =>
  apiRequest("/customers", { token, method: "POST", body });

export const getCustomer = (token, customerId) =>
  apiRequest(`/customers/${customerId}`, { token });
