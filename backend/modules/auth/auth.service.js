import mongoose from "mongoose";
import User from "../../models/User.js";
import Shop from "../../models/Shop.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signAccessToken } from "../../utils/jwt.js";

const publicUser = (user) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  accountStatus: user.accountStatus,
});

export const signup = async ({
  fullName,
  email,
  password,
  shopName,
  businessType,
  city,
}) => {
  const session = await mongoose.startSession();
  try {
    let result;

    await session.withTransaction(async () => {
      const existing = await User.exists({ email }).session(session);

      if (existing) {
        const error = new Error("An account with this email already exists");
        error.statusCode = 409;
        error.code = "EMAIL_ALREADY_REGISTERED";
        throw error;
      }

      const [user] = await User.create(
        [{ fullName, email, passwordHash: await hashPassword(password) }],
        { session },
      );

      const [shop] = await Shop.create(
        [{ shopName, businessType, city, userId: user._id }],
        { session },
      );

      result = {
        user: publicUser(user),
        shop: {
          id: shop._id.toString(),
          shopName: shop.shopName,
          businessType: shop.businessType,
          city: shop.city,
        },
        token: signAccessToken(user._id),
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email })
    .select("+passwordHash _id fullName email accountStatus")
    .lean();

  const valid = user
    ? await comparePassword(password, user.passwordHash)
    : false;

  if (!valid || user.accountStatus !== "active") {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const shop = await Shop.findOne({ userId: user._id })
    .select("_id shopName businessType city")
    .lean();

  return {
    user: publicUser(user),
    shop: shop
      ? {
          id: shop._id.toString(),
          shopName: shop.shopName,
          businessType: shop.businessType,
          city: shop.city,
        }
      : null,
    token: signAccessToken(user._id),
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
    .select("_id fullName email accountStatus")
    .lean();

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const shop = await Shop.findOne({ userId })
    .select("_id shopName businessType city")
    .lean();

  return {
    user: publicUser(user),
    shop: shop
      ? {
          id: shop._id.toString(),
          shopName: shop.shopName,
          businessType: shop.businessType,
          city: shop.city,
        }
      : null,
  };
};
