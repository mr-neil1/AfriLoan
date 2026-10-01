export const FALLBACK_RATES: Record<string, number> = {
  XOF: 1,
  XAF: 1,
  CDF: 4.10,
  GNF: 15.60,
  NGN: 2.40,
  KES: 0.23,
  RWF: 2.60,
  USD: 0.00178,
  EUR: 0.001524,
  GHS: 0.02,
  UGX: 6.62,
  ZMW: 0.033,
};

export const SUPPORTED_CURRENCIES = [
  { code: "XOF", symbol: "FCFA", name: "Franc CFA (BCEAO)" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA (BEAC)" },
  { code: "USD", symbol: "$", name: "Dollar US" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "NGN", symbol: "₦", name: "Naira nigérian" },
  { code: "KES", symbol: "KSh", name: "Shilling kenyan" },
  { code: "RWF", symbol: "FRw", name: "Franc rwandais" },
  { code: "CDF", symbol: "FC", name: "Franc congolais" },
  { code: "GNF", symbol: "FG", name: "Franc guinéen" },
  { code: "GHS", symbol: "GH₵", name: "Cedi ghanéen" },
  { code: "UGX", symbol: "USh", name: "Shilling ougandais" },
  { code: "ZMW", symbol: "ZK", name: "Kwacha zambien" },
];

export const EXCHANGE_MARGIN = 0.03; // 3% platform margin

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600 * 1000;

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/XOF", {
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Failed to fetch exchange rates");
    const data = await res.json();
    
    if (data && data.rates) {
      cachedRates = { ...FALLBACK_RATES, ...data.rates };
      cacheTimestamp = now;
      return cachedRates!;
    }
  } catch (error) {
    console.error("Exchange rates fetch error, using fallbacks:", error);
  }

  return cachedRates || FALLBACK_RATES;
}

export function convertFromXOF(amount: number, currencyCode: string, rates: Record<string, number>): number {
  const rate = rates[currencyCode] || FALLBACK_RATES[currencyCode] || 1;
  return amount * rate;
}

export function convertToXOF(
  amount: number,
  currencyCode: string,
  rates: Record<string, number>,
  type: "deposit" | "withdraw" | "display"
): number {
  const rate = rates[currencyCode] || FALLBACK_RATES[currencyCode] || 1;
  
  if (currencyCode === "XOF" || currencyCode === "XAF") {
    return amount;
  }

  if (type === "display") {
    return amount / rate;
  }

  if (type === "deposit") {
    return (amount / rate) * (1 - EXCHANGE_MARGIN);
  }

  if (type === "withdraw") {
    return (amount / rate) * (1 + EXCHANGE_MARGIN);
  }

  return amount / rate;
}
