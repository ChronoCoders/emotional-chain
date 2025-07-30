import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatLargeNumber(num: number): string {
  const units = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log(num) / Math.log(1000));
  const unitname = units[order];
  const scaled = num / Math.pow(1000, order);
  
  return `${scaled.toFixed(1)}${unitname}`;
}

export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
