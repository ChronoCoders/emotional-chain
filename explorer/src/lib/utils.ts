import { type ClassValue, clsx } from "clsx"
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

export function formatAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end) {
    return address;
  }
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getEmotionalScoreColor(score: number): string {
  if (score >= 85) return 'text-green-500';
  if (score >= 75) return 'text-yellow-500';
  if (score >= 65) return 'text-orange-500';
  return 'text-red-500';
}

export function getEmotionalScoreBackground(score: number): string {
  if (score >= 85) return 'bg-green-500/10 border-green-500/20';
  if (score >= 75) return 'bg-yellow-500/10 border-yellow-500/20';
  if (score >= 65) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export function calculateAPY(rewards: number, stake: number, days: number): number {
  if (stake === 0 || days === 0) return 0;
  const dailyReturn = rewards / stake / days;
  const annualReturn = dailyReturn * 365;
  return annualReturn * 100; // Convert to percentage
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatHashrate(hashrate: number): string {
  const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s'];
  let rate = hashrate;
  let unitIndex = 0;

  while (rate >= 1000 && unitIndex < units.length - 1) {
    rate /= 1000;
    unitIndex++;
  }

  return `${rate.toFixed(2)} ${units[unitIndex]}`;
}

export function getNetworkHealthColor(quality: number): string {
  if (quality >= 95) return 'text-green-500';
  if (quality >= 85) return 'text-yellow-500';
  if (quality >= 70) return 'text-orange-500';
  return 'text-red-500';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}