import { sendSuccess } from "../../utils/response.js";
import * as service from "./customer.service.js";

export const list = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.listCustomers(req.user._id, req.validatedQuery),
  );

export const create = async (req, res) =>
  sendSuccess(res, 201, await service.createCustomer(req.user._id, req.body));

export const details = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.getCustomerDetails(
      req.user._id,
      req.validatedParams.customerId,
    ),
  );
