// src/utils/invoiceNumber.js
import { getCurrentFinancialYear } from './dateHelpers';

const STORAGE_KEY = 'diamond_invoice_counters';

function getCounters() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCounters(counters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
}

/**
 * Preview the next invoice number without incrementing the counter
 */
export function getNextInvoiceNumber(companyId) {
  const fy = getCurrentFinancialYear();
  const counters = getCounters();
  const current = counters?.[companyId]?.[fy] || 0;
  const next = current + 1;
  return `${String(next).padStart(2, '0')}/${fy}`;
}

/**
 * Increment the counter — call ONLY when invoice is finalized (saved)
 */
export function confirmInvoiceNumber(companyId) {
  const fy = getCurrentFinancialYear();
  const counters = getCounters();
  if (!counters[companyId]) counters[companyId] = {};
  counters[companyId][fy] = (counters[companyId][fy] || 0) + 1;
  saveCounters(counters);
}

/**
 * Manually set the counter for a company/FY (used on first setup or correction)
 */
export function setInvoiceCounter(companyId, count) {
  const fy = getCurrentFinancialYear();
  const counters = getCounters();
  if (!counters[companyId]) counters[companyId] = {};
  counters[companyId][fy] = count;
  saveCounters(counters);
}

/**
 * Get the current count (how many invoices have been finalized this FY)
 */
export function getCurrentCount(companyId) {
  const fy = getCurrentFinancialYear();
  const counters = getCounters();
  return counters?.[companyId]?.[fy] || 0;
}
