import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAtp(value: number) {
  return `${value.toLocaleString()} ATP`;
}

export function shortId(id: string) {
  return id.slice(0, 8);
}
