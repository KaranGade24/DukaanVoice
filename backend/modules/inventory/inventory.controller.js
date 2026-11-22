import { sendSuccess } from "../../utils/response.js";
import * as service from "./inventory.service.js";

export const summary = async (req, res) =>
  sendSuccess(res, 200, await service.getSummary(req.user._id));

export const stockIn = async (req, res) =>
  sendSuccess(res, 201, await service.addStock(req.user._id, req.body));

export const stockOut = async (req, res) =>
  sendSuccess(res, 201, await service.removeStock(req.user._id, req.body));

export const adjust = async (req, res) =>
  sendSuccess(res, 201, await service.adjustStock(req.user._id, req.body));

export const history = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.getHistory(req.user._id, req.validatedQuery || req.query),
  );

export const productHistory = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.getProductHistory(
      req.user._id,
      req.params.productId,
      req.validatedQuery || req.query,
    ),
  );

export const alerts = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.getAlerts(req.user._id, req.validatedQuery || req.query),
  );
