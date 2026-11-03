import { useSyncExternalStore } from 'react';

// Approximate rates: 1 ZAR = x units. Prices are stored in ZAR.
export const CURRENCIES = {
  ZAR: { rate: 1, locale: 'en-ZA', label: 'R · Rand' },
  USD: { rate: 0.055, locale: 'en-US', label: '$ · US Dollar' },
  EUR: { rate: 0.05, locale: 'de-DE', label: '€ · Euro' },
  GBP: { rate: 0.043, locale: 'en-GB', label: '£ · Pound' },
  AUD: { rate: 0.084, locale: 'en-AU', label: 'A$ · Aus Dollar' },
  AED: { rate: 0.2, locale: 'en-AE', label: 'AED · Dirham' },
  JPY: { rate: 8.2, locale: 'ja-JP', label: '¥ · Yen' },
  BRL: { rate: 0.3, locale: 'pt-BR', label: 'R$ · Real' },
  NGN: { rate: 85, locale: 'en-NG', label: '₦ · Naira' },
  INR: { rate: 4.6, locale: 'en-IN', label: '₹ · Rupee' },
} as const;
export type Currency = keyof typeof CURRENCIES;

const KEY = 'velour-currency';
const listeners = new Set<() => void>();
let current: Currency = 'ZAR';
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(KEY) as Currency | null;
  if (saved && saved in CURRENCIES) current = saved;
}

export function setCurrency(c: Currency) {
  current = c;
  localStorage.setItem(KEY, c);
  listeners.forEach((l) => l());
}

export function useCurrency() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => 'ZAR' as Currency,
  );
}

export function useMoney() {
  const c = useCurrency();
  const { rate, locale } = CURRENCIES[c];
  return (zar: number | string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(
      Number(zar) * rate,
    );
}