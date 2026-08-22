import { clsx, type ClassValue } from 'clsx';
import type { CSSProperties } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** React style object that may also set the given CSS custom properties. */
export type CSSPropertiesWithVars<VarName extends string> = CSSProperties &
  Partial<Record<VarName, string>>;
