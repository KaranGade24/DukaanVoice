import User from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.get("authorization");
    if (!header?.startsWith("Bearer ")) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      error.code = "AUTH_REQUIRED";
      return next(error);
    }
    const payload = verifyAccessToken(header.slice(7));

    const user = await User.findById(payload.sub)
      .select("_id fullName email accountStatus")
      .lean();

    if (!user || user.accountStatus !== "active") {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      error.code = "AUTH_REQUIRED";
      return next(error);
    }

    req.user = user;
    next();
  } catch (_error) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    error.code = "AUTH_REQUIRED";
    next(error);
  }
};
