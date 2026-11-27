import { sendSuccess } from "../../utils/response.js";
import {
  createSale,
  getFrequentlySoldProducts,
  getSaleDetails,
  getSalesSummary,
  listSales,
  recordCreditPayment,
} from "./sale.service.js";

export const create = async (req, res) =>
  sendSuccess(
    res,
    201,
    await createSale(req.user._id, req.body, req.get("idempotency-key")),
  );

export const list = async (req, res) =>
  sendSuccess(res, 200, await listSales(req.user._id, req.validatedQuery));

export const summary = async (req, res) =>
  sendSuccess(
    res,
    200,
    await getSalesSummary(req.user._id, req.validatedQuery),
  );

export const frequentlySold = async (req, res) =>
  sendSuccess(
    res,
    200,
    await getFrequentlySoldProducts(req.user._id, req.validatedQuery),
  );

export const details = async (req, res) =>
  sendSuccess(
    res,
    200,
    await getSaleDetails(req.user._id, req.validatedParams.saleId),
  );

export const creditPayment = async (req, res) =>
  sendSuccess(
    res,
    200,
    await recordCreditPayment(
      req.user._id,
      req.validatedParams.saleId,
      req.body.amount,
    ),
  );
