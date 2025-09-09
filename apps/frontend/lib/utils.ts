import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";//for my macbook
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://192.168.0.103:3001";
//export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://betteruptime.abhishek97.icu/api";