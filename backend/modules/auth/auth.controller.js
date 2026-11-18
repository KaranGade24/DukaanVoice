import { signup, login, getCurrentUser } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";

export const signupController = async (req, res) =>
  sendSuccess(res, 201, await signup(req.body));

export const loginController = async (req, res) =>
  sendSuccess(res, 200, await login(req.body));

export const meController = async (req, res) =>
  sendSuccess(res, 200, await getCurrentUser(req.user._id));
