// src/utils/storage.js
// localforage-based storage for invoices and parties

import localforage from 'localforage';

// Configure separate stores
const invoiceStore = localforage.createInstance({ name: 'diamond_invoice', storeName: 'invoices' });
const partyStore = localforage.createInstance({ name: 'diamond_invoice', storeName: 'parties' });

// ─── Invoice CRUD ────────────────────────────────────────────────────────────

export async function getAllInvoices() {
  const all = [];
  await invoiceStore.iterate((value) => { all.push(value); });
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInvoice(id) {
  return invoiceStore.getItem(id);
}

export async function saveInvoice(invoice) {
  const now = new Date().toISOString();
  const record = {
    ...invoice,
    updatedAt: now,
    createdAt: invoice.createdAt || now,
  };
  await invoiceStore.setItem(record.id, record);
  return record;
}

export async function deleteInvoice(id) {
  return invoiceStore.removeItem(id);
}

// ─── Party CRUD ──────────────────────────────────────────────────────────────

export async function getAllParties() {
  const all = [];
  await partyStore.iterate((value) => { all.push(value); });
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getParty(id) {
  return partyStore.getItem(id);
}

export async function saveParty(party) {
  const now = new Date().toISOString();
  const record = { ...party, updatedAt: now, createdAt: party.createdAt || now };
  await partyStore.setItem(record.id, record);
  return record;
}

export async function deleteParty(id) {
  return partyStore.removeItem(id);
}

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
