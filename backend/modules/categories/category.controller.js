import { sendSuccess } from "../../utils/response.js";
import * as service from "./category.service.js";

export const create = async (req, res) =>
  sendSuccess(res, 201, await service.createCategory(req.user._id, req.body));

export const list = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.listCategories(req.user._id, req.validatedQuery || req.query),
  );

export const get = async (req, res) =>
  sendSuccess(res, 200, await service.getCategory(req.user._id, req.params.id));

export const update = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.updateCategory(req.user._id, req.params.id, req.body),
  );

export const setStatus = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.setCategoryStatus(
      req.user._id,
      req.params.id,
      req.body.isActive,
    ),
  );

export const remove = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.deleteCategory(req.user._id, req.params.id),
  );
