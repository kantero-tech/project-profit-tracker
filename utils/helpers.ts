
export const formatCurrency = (amount: number, currencyCode: string = 'RWF'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
};
