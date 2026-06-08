// src/utils/storage.js
// Supabase cloud database connector (replacing IndexedDB localforage)
import { getSupabaseClient } from './supabaseClient';

// ─── Utility helpers ─────────────────────────────────────────────────────────

// Map invoice object from database schema (snake_case) to frontend schema (camelCase)
function mapDbInvoiceToApp(row) {
  if (!row) return null;
  return {
    id: row.id,
    company: row.company,
    invoiceNo: row.invoice_no,
    invoiceDate: row.invoice_date,
    dispatchDate: row.dispatch_date,
    dispatchMode: row.dispatch_mode,
    terms: row.terms,
    hsnCode: row.hsn_code,
    deliveryCity: row.delivery_city,
    buyer: {
      name: row.buyer_name,
      addressLines: (row.buyer_address || '').split('\n').map(l => l.trim()).filter(Boolean),
      gstin: row.buyer_gstin,
    },
    items: row.items || [],
    totals: row.totals || {},
    amountInWords: row.amount_in_words,
    filename: row.filename,
    createdAt: row.created_at,
  };
}

// Map party from database schema to frontend schema
function mapDbPartyToApp(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    addressLines: row.address_lines || [],
    gstin: row.gstin || '',
    defaultTerms: row.default_terms || 'COD',
    createdAt: row.created_at,
  };
}

// ─── Invoice CRUD ────────────────────────────────────────────────────────────

export async function getAllInvoices() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbInvoiceToApp);
  } catch (err) {
    console.error('Error fetching invoices from Supabase:', err);
    return [];
  }
}

export async function getInvoice(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapDbInvoiceToApp(data);
  } catch (err) {
    console.error(`Error fetching invoice ${id}:`, err);
    return null;
  }
}

export async function saveInvoice(invoice) {
  const client = getSupabaseClient();
  if (!client) return invoice;

  const dbRecord = {
    id: invoice.id,
    company: invoice.company,
    invoice_no: invoice.invoiceNo,
    invoice_date: invoice.invoiceDate,
    dispatch_date: invoice.dispatchDate,
    dispatch_mode: invoice.dispatchMode,
    terms: invoice.terms,
    hsn_code: invoice.hsnCode,
    delivery_city: invoice.deliveryCity,
    buyer_name: invoice.buyer?.name || '',
    buyer_address: (invoice.buyer?.addressLines || []).join('\n'),
    buyer_gstin: invoice.buyer?.gstin || '',
    items: invoice.items || [],
    totals: invoice.totals || {},
    amount_in_words: invoice.amountInWords || '',
    filename: invoice.filename || null,
  };

  try {
    const { error } = await client
      .from('invoices')
      .upsert(dbRecord);

    if (error) throw error;
    return invoice;
  } catch (err) {
    console.error('Error saving invoice to Supabase:', err);
    throw err;
  }
}

export async function deleteInvoice(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { error } = await client
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Error deleting invoice ${id}:`, err);
    throw err;
  }
}

// ─── Party CRUD ──────────────────────────────────────────────────────────────

export async function getAllParties() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('parties')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDbPartyToApp);
  } catch (err) {
    console.error('Error fetching parties from Supabase:', err);
    return [];
  }
}

export async function getParty(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('parties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapDbPartyToApp(data);
  } catch (err) {
    console.error(`Error fetching party ${id}:`, err);
    return null;
  }
}

export async function saveParty(party) {
  const client = getSupabaseClient();
  if (!client) return party;

  const dbRecord = {
    id: party.id,
    name: party.name,
    address_lines: party.addressLines || [],
    gstin: party.gstin || '',
    default_terms: party.defaultTerms || 'COD',
  };

  try {
    const { error } = await client
      .from('parties')
      .upsert(dbRecord);

    if (error) throw error;
    return party;
  } catch (err) {
    console.error('Error saving party to Supabase:', err);
    throw err;
  }
}

export async function deleteParty(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { error } = await client
      .from('parties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Error deleting party ${id}:`, err);
    throw err;
  }
}

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
