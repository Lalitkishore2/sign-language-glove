/**
 * @fileoverview Utility helper functions including Tailwind CSS class merger.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind CSS class lists cleanly avoiding duplication/overwrites.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
