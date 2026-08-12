export interface NormalizedIsbn {
  isbn10: string | null;
  isbn13: string;
}

function stripIsbnFormatting(value: string): string {
  const trimmed = value.trim();
  const formulaValue = trimmed.match(/^=\s*["'](.+)["']$/)?.[1] ?? trimmed;

  return formulaValue.replace(/[^0-9Xx]/g, '').toUpperCase();
}

function hasValidIsbn10CheckDigit(value: string): boolean {
  if (!/^\d{9}[\dX]$/.test(value)) {
    return false;
  }

  const sum = Array.from(value).reduce((total, character, index) => {
    const digit = character === 'X' ? 10 : Number(character);
    return total + digit * (10 - index);
  }, 0);

  return sum % 11 === 0;
}

function hasValidIsbn13CheckDigit(value: string): boolean {
  if (!/^97[89]\d{10}$/.test(value)) {
    return false;
  }

  const sum = Array.from(value.slice(0, 12)).reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0
  );
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(value[12]);
}

function isbn10To13(isbn10: string): string {
  const base = `978${isbn10.slice(0, 9)}`;
  const sum = Array.from(base).reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0
  );

  return `${base}${(10 - (sum % 10)) % 10}`;
}

function isbn13To10(isbn13: string): string | null {
  if (!isbn13.startsWith('978')) {
    return null;
  }

  const base = isbn13.slice(3, 12);
  const sum = Array.from(base).reduce(
    (total, character, index) => total + Number(character) * (10 - index),
    0
  );
  const remainder = (11 - (sum % 11)) % 11;
  const checkDigit = remainder === 10 ? 'X' : String(remainder);

  return `${base}${checkDigit}`;
}

export function normalizeIsbn(value: string | null | undefined): NormalizedIsbn | null {
  if (!value?.trim()) {
    return null;
  }

  const compactValue = stripIsbnFormatting(value);
  if (compactValue.length === 10 && hasValidIsbn10CheckDigit(compactValue)) {
    return {
      isbn10: compactValue,
      isbn13: isbn10To13(compactValue),
    };
  }

  if (compactValue.length === 13 && hasValidIsbn13CheckDigit(compactValue)) {
    return {
      isbn10: isbn13To10(compactValue),
      isbn13: compactValue,
    };
  }

  return null;
}

export function formatIsbn(value: string | null | undefined): string {
  const normalized = normalizeIsbn(value);
  return normalized?.isbn13 ?? '';
}
