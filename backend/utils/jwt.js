import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    algorithms: ["HS256"],
  });
