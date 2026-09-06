/**
 * Central safe formatters to eliminate all invalid UI values like NaN, Infinity, undefined
 */

export function safeNumber(value: any, fallback: string | number = 0): number | string {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function safeCurrency(value: any, fallback: string = 'Not available'): string {
  const num = safeNumber(value, null);
  if (num === null) return fallback;
  return `₹${Number(num).toLocaleString('en-IN')}`;
}

export function safeDate(value: any, fallback: string = 'Unknown Date'): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-IN');
  } catch (e) {
    return fallback;
  }
}

export function safeString(value: any, fallback: string = 'Not available'): string {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (typeof value === 'number' && !isNaN(value)) return String(value);
  return fallback;
}
