import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line no-misleading-character-class
const DIACRITICS_RE = /\p{M}/gu

export function normalizeStr(str: string): string {
  return str.normalize('NFD').replace(DIACRITICS_RE, '').toLowerCase()
}
