import Customer from "../../models/Customer.js";
import Sale from "../../models/Sale.js";
import {
  escapeRegex,
  paginationMeta,
  parsePagination,
  resolveShop,
  serviceError,
} from "../inventory/inventory.shared.js";

const outstandingByCustomer = async (shopId, customerIds) => {
  if (!customerIds.length) return new Map();
  const totals = await Sale.aggregate([
    {
      $match: {
        shopId,
        customerId: { $in: customerIds },
        paymentMethod: "UDHAR",
      },
    },
    {
      $group: {
        _id: "$customerId",
        amountMinor: { $sum: { $ifNull: ["$balanceDueMinor", "$totalMinor"] } },
      },
    },
  ]);
  return new Map(
    totals.map((row) => [row._id.toString(), row.amountMinor / 100]),
  );
};

const shape = (customer, outstandingBalance = 0) => ({
  id: customer._id.toString(),
  name: customer.name,
  phone: customer.phone || "",
  outstandingBalance,
  createdAt: customer.createdAt,
});

export const listCustomers = async (userId, query) => {
  const shopId = await resolveShop(userId);
  const filter = { shopId };
  if (query.search) {
    const term = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: term }, { phone: term }];
  }
  const { page, limit, skip } = parsePagination(query);
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .select("name phone createdAt")
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);
  const balances = await outstandingByCustomer(
    shopId,
    customers.map((customer) => customer._id),
  );
  return {
    items: customers.map((customer) =>
      shape(customer, balances.get(customer._id.toString()) || 0),
    ),
    pagination: paginationMeta(page, limit, total),
  };
};

export const createCustomer = async (userId, input) => {
  const shopId = await resolveShop(userId);
  const phone = input.phone.trim();
  const normalizedPhone = phone.replace(/\D/g, "");
  const phoneKey = normalizedPhone.length >= 7 ? normalizedPhone : null;
  try {
    const customer = await Customer.create({
      shopId,
      name: input.name,
      phone,
      phoneKey,
      createdBy: userId,
    });
    return shape(customer);
  } catch (error) {
    if (error.code === 11000 && phoneKey)
      throw serviceError(
        409,
        "CUSTOMER_PHONE_EXISTS",
        "A customer with this phone number already exists",
      );
    throw error;
  }
};

export const getCustomerDetails = async (userId, customerId) => {
  const shopId = await resolveShop(userId);
  const customer = await Customer.findOne({ _id: customerId, shopId }).lean();
  if (!customer)
    throw serviceError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  const [balances, purchases] = await Promise.all([
    outstandingByCustomer(shopId, [customer._id]),
    Sale.find({ shopId, customerId: customer._id })
      .select("saleNumber totalMinor balanceDueMinor paymentMethod createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);
  return {
    ...shape(customer, balances.get(customer._id.toString()) || 0),
    recentPurchases: purchases.map((sale) => ({
      saleNumber: sale.saleNumber,
      total: sale.totalMinor / 100,
      balanceDue:
        (sale.balanceDueMinor ??
          (sale.paymentMethod === "UDHAR" ? sale.totalMinor : 0)) / 100,
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
    })),
  };
};
