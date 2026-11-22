import { apiRequest } from "./apiClient";
const queryString = (params) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ),
  ).toString();
const get = (path, token) => apiRequest(path, { token });
const send = (path, token, method, body) =>
  apiRequest(path, { token, method, body });

export const getSummary = async (token) => {
  const data = await get("/inventory/summary", token);
  return {
    ...data,
    totalProducts: data.totalActiveProducts,
    totalCategories: data.totalActiveCategories,
    totalStockValue: data.totalStockValuation,
    lowStockProducts: data.lowStockProductCount,
    outOfStockProducts: data.outOfStockProductCount,
  };
};

export const getCategories = async (token, params = {}) => {
  const query = {
    limit: 100,
    ...params,
    isActive: params.includeInactive ? undefined : "true",
  };
  delete query.includeInactive;
  return (await get(`/categories?${queryString(query)}`, token)).items || [];
};

export const createCategory = async (token, body) =>
  send("/categories", token, "POST", body);

export const updateCategory = async (token, id, body) => {
  if ("isActive" in body)
    return send(`/categories/${id}/status`, token, "PATCH", {
      isActive: body.isActive,
    });
  return send(`/categories/${id}`, token, "PUT", body);
};

export const deleteCategory = async (token, id) =>
  send(`/categories/${id}`, token, "DELETE");
const normalizeStatus = (item) => ({
  ...item,
  stockStatus:
    { IN_STOCK: "inStock", LOW_STOCK: "lowStock", OUT_OF_STOCK: "outOfStock" }[
      item.stockStatus
    ] || item.stockStatus,
});

export const getProducts = async (token, params = {}) => {
  const query = {
    ...params,
    stockStatus: {
      inStock: "IN_STOCK",
      lowStock: "LOW_STOCK",
      outOfStock: "OUT_OF_STOCK",
    }[params.status],
  };
  delete query.status;
  const data = await get(`/products?${queryString(query)}`, token);
  return { ...data, items: (data.items || []).map(normalizeStatus) };
};

export const getProduct = async (token, id) =>
  normalizeStatus(await get(`/products/${id}`, token));

export const createProduct = (token, body) => {
  const { openingStock, ...fields } = body;
  return send("/products", token, "POST", {
    ...fields,
    quantity: openingStock,
  });
};

export const updateProduct = (token, id, body) =>
  send(`/products/${id}`, token, "PUT", body);

export const archiveProduct = (token, id) =>
  send(`/products/${id}/status`, token, "PATCH", { isActive: false });

export const stockIn = (token, body) =>
  send("/inventory/stock-in", token, "POST", body);

export const stockOut = (token, body) =>
  send("/inventory/stock-out", token, "POST", body);

export const adjustStock = (token, body) => {
  const { correctedQuantity, ...fields } = body;
  return send("/inventory/adjust", token, "POST", {
    ...fields,
    newQuantity: correctedQuantity,
  });
};

export const getStockHistory = async (token, params = {}) => {
  const path = params.productId
    ? `/inventory/history/${params.productId}`
    : "/inventory/history";
  const { productId, ...query } = params;
  const data = await get(`${path}?${queryString(query)}`, token);
  return { ...data, items: data.items || [] };
};

export const getAlerts = async (token, params = {}) => {
  const data = await get(`/inventory/alerts?${queryString(params)}`, token);
  return { ...data, items: (data.items || []).map(normalizeStatus) };
};
