const MONEY_SCALE = 100n;
const QUANTITY_SCALE = 1_000_000n;
const MAX_SAFE_MINOR = BigInt(Number.MAX_SAFE_INTEGER);

const decimalParts = (value) => {
  if (!Number.isFinite(value)) throw new Error("Amount must be finite");
  const text = String(value).toLowerCase();
  const [coefficient, exponentText] = text.split("e");
  const exponent = Number(exponentText || 0);
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = BigInt(`${whole}${fraction}`);
  const decimalPlaces = fraction.length - exponent;
  return decimalPlaces <= 0
    ? { numerator: digits * 10n ** BigInt(-decimalPlaces), denominator: 1n }
    : { numerator: digits, denominator: 10n ** BigInt(decimalPlaces) };
};

const roundRatio = (numerator, denominator) => (numerator * 2n + denominator) / (denominator * 2n);
const safeNumber = (value) => {
  if (value > MAX_SAFE_MINOR || value < -MAX_SAFE_MINOR) throw new Error("Calculated amount exceeds the supported limit");
  return Number(value);
};
const sumMinor = (values) => safeNumber(values.reduce((sum, value) => sum + BigInt(value), 0n));
export const toMinorUnits = (amount) => {
  if (amount < 0) throw new Error("Amount cannot be negative");
  const { numerator, denominator } = decimalParts(amount);
  return safeNumber(roundRatio(numerator * MONEY_SCALE, denominator));
};
export const toQuantityMicros = (quantity) => {
  const { numerator, denominator } = decimalParts(quantity);
  const scaled = numerator * QUANTITY_SCALE;
  if (scaled % denominator !== 0n) throw new Error("Quantity supports at most six decimal places");
  return safeNumber(scaled / denominator);
};
export const toBasisPoints = (percentage) => {
  const { numerator, denominator } = decimalParts(percentage);
  const scaled = numerator * 100n;
  if (scaled % denominator !== 0n) throw new Error("Rate supports at most two decimal places");
  return safeNumber(scaled / denominator);
};
const percentageOfMinor = (amountMinor, percentage) => {
  const basisPoints = toBasisPoints(percentage);
  if (basisPoints < 0 || basisPoints > 10_000) throw new Error("Discount percentage must be between 0 and 100");
  return safeNumber(roundRatio(BigInt(amountMinor) * BigInt(basisPoints), 10_000n));
};
export const minorToAmount = (minor) => Number((minor / 100).toFixed(2));

const allocateDiscount = (amounts, discount) => {
  const total = amounts.reduce((sum, amount) => sum + BigInt(amount), 0n);
  if (discount === 0 || total === 0n) return amounts.map(() => 0);
  const shares = amounts.map((amount, index) => {
    const numerator = BigInt(amount) * BigInt(discount);
    return { index, value: numerator / total, remainder: numerator % total };
  });
  let left = BigInt(discount) - shares.reduce((sum, share) => sum + share.value, 0n);
  shares.sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
  for (let index = 0; left > 0n; index += 1, left -= 1n) shares[index].value += 1n;
  shares.sort((a, b) => a.index - b.index);
  return shares.map((share) => Number(share.value));
};

export const calculatePurchase = ({ items, additionalDiscount, additionalDiscountPercent, additionalCharges = 0 }) => {
  const consolidated = new Map();
  for (const item of items) {
    const key = item.productId.toString();
    const normalized = {
      productId: key,
      quantityMicros: toQuantityMicros(item.quantity),
      unitPurchasePriceMinor: toMinorUnits(item.unitPurchasePrice),
      discountType: item.discountPercent !== undefined ? "PERCENTAGE" : "AMOUNT",
      discountValue: item.discountPercent ?? item.discountAmount ?? 0,
      discountAmountMinor: 0,
      taxRateBasisPoints: toBasisPoints(item.taxRate || 0),
    };
    const lineSubtotalMinor = safeNumber(roundRatio(BigInt(normalized.quantityMicros) * BigInt(normalized.unitPurchasePriceMinor), QUANTITY_SCALE));
    normalized.discountAmountMinor = normalized.discountType === "PERCENTAGE"
      ? percentageOfMinor(lineSubtotalMinor, normalized.discountValue)
      : toMinorUnits(normalized.discountValue);
    const prior = consolidated.get(key);
    if (!prior) consolidated.set(key, normalized);
    else {
      if (prior.unitPurchasePriceMinor !== normalized.unitPurchasePriceMinor || prior.taxRateBasisPoints !== normalized.taxRateBasisPoints)
        throw new Error("Duplicate product lines must use the same unit price and tax rate");
      prior.quantityMicros = safeNumber(BigInt(prior.quantityMicros) + BigInt(normalized.quantityMicros));
      prior.discountAmountMinor = safeNumber(BigInt(prior.discountAmountMinor) + BigInt(normalized.discountAmountMinor));
      if (prior.discountType !== normalized.discountType || prior.discountValue !== normalized.discountValue) {
        prior.discountType = "MIXED";
        prior.discountValue = null;
      }
    }
  }

  const lines = [...consolidated.values()].map((line) => {
    const lineSubtotalMinor = safeNumber(roundRatio(BigInt(line.quantityMicros) * BigInt(line.unitPurchasePriceMinor), QUANTITY_SCALE));
    if (line.discountAmountMinor > lineSubtotalMinor) throw new Error("Line discount cannot exceed its subtotal");
    return { ...line, lineSubtotalMinor, itemTaxableMinor: lineSubtotalMinor - line.discountAmountMinor };
  });
  const subtotalMinor = sumMinor(lines.map((line) => line.lineSubtotalMinor));
  const itemDiscountTotalMinor = sumMinor(lines.map((line) => line.discountAmountMinor));
  const preTaxTaxable = sumMinor(lines.map((line) => line.itemTaxableMinor));
  const additionalDiscountType = additionalDiscountPercent !== undefined ? "PERCENTAGE" : "AMOUNT";
  const additionalDiscountValue = additionalDiscountPercent ?? additionalDiscount ?? 0;
  const additionalDiscountMinor = additionalDiscountType === "PERCENTAGE"
    ? percentageOfMinor(preTaxTaxable, additionalDiscountValue)
    : toMinorUnits(additionalDiscountValue);
  if (additionalDiscountMinor > preTaxTaxable) throw new Error("Additional discount cannot exceed the taxable amount");
  const additionalChargesMinor = toMinorUnits(additionalCharges);
  const allocatedDiscounts = allocateDiscount(lines.map((line) => line.itemTaxableMinor), additionalDiscountMinor);
  const calculatedLines = lines.map((line, index) => {
    const taxableAmountMinor = line.itemTaxableMinor - allocatedDiscounts[index];
    const taxAmountMinor = safeNumber(roundRatio(BigInt(taxableAmountMinor) * BigInt(line.taxRateBasisPoints), 10_000n));
    const quantity = Number((BigInt(line.quantityMicros) / 1n).toString()) / Number(QUANTITY_SCALE);
    return {
      productId: line.productId,
      quantity,
      unitPurchasePriceMinor: line.unitPurchasePriceMinor,
      lineSubtotalMinor: line.lineSubtotalMinor,
      discountType: line.discountType,
      discountValue: line.discountValue,
      discountAmountMinor: line.discountAmountMinor,
      additionalDiscountAllocationMinor: allocatedDiscounts[index],
      taxableAmountMinor,
      taxRateBasisPoints: line.taxRateBasisPoints,
      taxAmountMinor,
      lineTotalMinor: taxableAmountMinor + taxAmountMinor,
    };
  });
  const taxableAmountMinor = sumMinor(calculatedLines.map((line) => line.taxableAmountMinor));
  const taxAmountMinor = sumMinor(calculatedLines.map((line) => line.taxAmountMinor));
  const grandTotalMinor = safeNumber(BigInt(taxableAmountMinor) + BigInt(taxAmountMinor) + BigInt(additionalChargesMinor));
  return { lines: calculatedLines, subtotalMinor, itemDiscountTotalMinor, additionalDiscountMinor, additionalDiscountType, additionalDiscountValue, taxableAmountMinor, taxAmountMinor, additionalChargesMinor, grandTotalMinor };
};
