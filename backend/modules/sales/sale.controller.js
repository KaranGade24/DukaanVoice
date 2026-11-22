import { sendSuccess } from "../../utils/response.js";
import { createSale } from "./sale.service.js";
export const create = async (req, res) => sendSuccess(res, 201, await createSale(req.user._id, req.body, req.get("idempotency-key")));
