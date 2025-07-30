/**
 * EmotionalChain Constants
 * Official token pricing and formatting utilities
 */

// OFFICIAL EMO TOKEN PRICE
export const EMO_PRICE_USD = 0.01; // $0.01 per EMO token

/**
 * Format EMO amount to USD currency
 * @param emoAmount - Amount of EMO tokens
 * @returns Formatted USD string
 */
export const formatEmoToUSD = (emoAmount: number | undefined): string => {
  if (!emoAmount && emoAmount !== 0) return '$0.00';
  
  const usdValue = emoAmount * EMO_PRICE_USD;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(usdValue);
};

/**
 * Calculate USD value from EMO amount
 * @param emoAmount - Amount of EMO tokens
 * @returns USD value as number
 */
export const calculateUSDValue = (emoAmount: number | undefined): number => {
  if (!emoAmount && emoAmount !== 0) return 0;
  return emoAmount * EMO_PRICE_USD;
};

/**
 * Format large EMO amounts with abbreviations
 * @param amount - EMO amount
 * @returns Formatted string with K/M/B abbreviations
 */
export const formatEMO = (amount: number | undefined): string => {
  if (!amount && amount !== 0) return '0 EMO';
  
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B EMO`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M EMO`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K EMO`;
  }
  
  return `${amount.toLocaleString()} EMO`;
};