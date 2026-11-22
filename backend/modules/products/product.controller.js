import { sendSuccess } from "../../utils/response.js";
import * as service from "./product.service.js";

export const create = async (req, res) =>
  sendSuccess(res, 201, await service.createProduct(req.user._id, req.body));

export const list = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.listProducts(req.user._id, req.validatedQuery || req.query),
  );

export const get = async (req, res) =>
  sendSuccess(res, 200, await service.getProduct(req.user._id, req.params.id));

export const update = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.updateProduct(req.user._id, req.params.id, req.body),
  );

export const setStatus = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.setProductStatus(
      req.user._id,
      req.params.id,
      req.body.isActive,
    ),
  );

export const remove = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.deleteProduct(req.user._id, req.params.id),
  );
