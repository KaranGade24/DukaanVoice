export const calculateBillTotals = (items, discount = 0) => {
  const subtotalMinor = (items || []).reduce((sum, item) => {
    const price = item.product?.sellingPrice ?? item.sellingPrice;
    return (
      sum + Math.round(Number(price || 0) * 100 * Number(item.quantity || 0))
    );
  }, 0);
  const discountMinor = Math.max(0, Math.round(Number(discount || 0) * 100));
  return {
    subtotal: subtotalMinor / 100,
    discount: discountMinor / 100,
    total: Math.max(0, subtotalMinor - discountMinor) / 100,
  };
};
