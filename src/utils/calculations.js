// src/utils/calculations.js

/**
 * Format a number in Indian comma format: 1,23,456
 * Does NOT use toLocaleString() due to Safari inconsistencies
 */
export function formatIndianNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const num = Math.round(Number(n));
  const s = String(Math.abs(num));
  if (s.length <= 3) return (num < 0 ? '-' : '') + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return (num < 0 ? '-' : '') + formatted;
}

/**
 * Format CTS weight — always 2 decimal places
 */
export function formatCts(n) {
  return Number(n || 0).toFixed(2);
}

/**
 * Calculate amount for one item: Math.round(cts * rate)
 */
export function calcItemAmount(cts, rate) {
  const c = parseFloat(String(cts).replace(/,/g, '')) || 0;
  const r = parseFloat(String(rate).replace(/,/g, '')) || 0;
  return Math.round(c * r);
}

/**
 * Calculate all totals from items array
 * Returns: { totalCts, subtotal, igstAmount, grandTotal }
 */
export function calcTotals(items, igstRate = 0.015) {
  let totalCts = 0;
  let subtotal = 0;
  for (const item of items) {
    const cts = parseFloat(String(item.cts || 0).replace(/,/g, '')) || 0;
    const rate = parseFloat(String(item.rate || 0).replace(/,/g, '')) || 0;
    totalCts += cts;
    subtotal += Math.round(cts * rate);
  }
  const igstAmount = Math.round(subtotal * igstRate);
  const grandTotal = subtotal + igstAmount;
  return {
    totalCts: parseFloat(totalCts.toFixed(2)),
    subtotal,
    igstAmount,
    grandTotal,
  };
}

/**
 * Parse a number that may have commas (Indian habit: "18,009")
 */
export function parseNumber(str) {
  return parseFloat(String(str || 0).replace(/,/g, '')) || 0;
}
