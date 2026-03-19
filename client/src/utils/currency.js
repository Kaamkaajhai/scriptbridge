export const formatCurrency = (amount, currency = "INR", options = {}) => {
  const numericAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(numericAmount);
};

export const formatCredits = (amount) => {
  const numericAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `${numericAmount.toLocaleString("en-IN")} cr`;
};