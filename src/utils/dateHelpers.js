// src/utils/dateHelpers.js

/**
 * Returns today as YYYY-MM-DD (for input[type=date] value)
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Formats an ISO date string (YYYY-MM-DD) as DD/MM/YYYY for display on invoice
 */
export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Returns current Indian financial year string: e.g., "2026-27"
 * April (month 3) = start of new financial year
 */
export function getCurrentFinancialYear() {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed
  const year = today.getFullYear();
  if (month >= 3) {
    // April or later = new FY
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}
