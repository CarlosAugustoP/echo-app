import type { GoalDto } from "../../types/api";

export const defaultProjectImage = require("../../assets/adaptive-icon.png");

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatEth(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)} ETH`;
}

export function normalizeImageUrl(imageUrl?: string | null) {
  const trimmedImageUrl = imageUrl?.trim();
  return trimmedImageUrl ? trimmedImageUrl : null;
}

export function formatRelativeTime(isoDate: string) {
  const publishedAt = new Date(isoDate).getTime();
  const diffInHours = Math.max(1, Math.round((Date.now() - publishedAt) / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}

export function sumGoalAmounts(goals: readonly GoalDto[], field: "targetAmount" | "currentAmount") {
  return goals.reduce((total, goal) => {
    const amount = Number(goal[field]);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

export function normalizeProgress(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((currentAmount / targetAmount) * 100)));
}

export function normalizePercentageProgress(progress: number) {
  return Math.max(0, Math.min(100, Math.round(progress)));
}
