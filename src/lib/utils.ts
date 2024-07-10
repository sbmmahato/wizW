import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}





export function takeUniqueOrThrow<T extends unknown[]>(values: T): T[number] {
  if (values.length !== 1)
    throw new Error("Found non unique or inexistent value");
  return values[0];
}

export function formatPrice(priceInCents: string) {
  const price = parseFloat(priceInCents);
  const dollars = price / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    // Use minimumFractionDigits to handle cases like $59.00 -> $59
    minimumFractionDigits: dollars % 1 !== 0 ? 2 : 0,
  }).format(dollars);
}