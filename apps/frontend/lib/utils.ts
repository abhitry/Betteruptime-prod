import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://betteruptime.abhishek97.icu/api";