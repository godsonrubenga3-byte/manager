export const STATIC_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.35,
  TZS: 2550,
  JPY: 151.5,
  CAD: 1.35,
  AUD: 1.52,
};

/**
 * Fetches real-time exchange rates from a public API.
 * Fallbacks to static rates if the request fails.
 */
export async function fetchLiveRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD');
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    
    // The API returns rates relative to the 'from' parameter (USD)
    // We add USD: 1 back since it's the base
    return {
      USD: 1,
      ...data.rates,
      // Frankfurter doesn't support TZS by default, we keep our static one or find another source
      // For this implementation, we'll merge live rates with our static list for missing ones
      TZS: 2550 
    };
  } catch (error) {
    console.warn("Using static exchange rates due to network error:", error);
    return STATIC_EXCHANGE_RATES;
  }
}

/**
 * Converts an amount from one currency to another using provided rates.
 */
export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number> = STATIC_EXCHANGE_RATES): number {
  if (from === to) return amount;
  
  // Convert from 'from' to USD (base)
  const amountInUSD = amount / (rates[from] || STATIC_EXCHANGE_RATES[from] || 1);
  
  // Convert from USD to 'to'
  const convertedAmount = amountInUSD * (rates[to] || STATIC_EXCHANGE_RATES[to] || 1);
  
  return convertedAmount;
}

/**
 * Formats a number as a currency string.
 */
export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
