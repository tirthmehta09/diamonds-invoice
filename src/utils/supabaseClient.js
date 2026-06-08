// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;
let currentUrl = null;
let currentKey = null;

/**
 * Retrieves the current Supabase configuration from environment variables
 * or local storage fallback.
 */
export function getSupabaseConfig() {
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  let bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'invoices';

  try {
    const saved = localStorage.getItem('diamond_invoice_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url) url = parsed.url;
      if (parsed.key) key = parsed.key;
      if (parsed.bucket) bucket = parsed.bucket;
    }
  } catch (e) {
    console.error('Failed to load supabase config from localStorage', e);
  }

  return {
    url: url.trim(),
    key: key.trim(),
    bucket: bucket.trim(),
  };
}

/**
 * Saves the Supabase configuration to local storage and resets the client instance.
 */
export function saveSupabaseConfig(config) {
  try {
    localStorage.setItem('diamond_invoice_supabase_config', JSON.stringify(config));
    // Reset instance so it's re-created with new credentials
    supabaseInstance = null;
    currentUrl = null;
    currentKey = null;
    return true;
  } catch (e) {
    console.error('Failed to save supabase config to localStorage', e);
    return false;
  }
}

/**
 * Gets the singleton Supabase client, re-initializing if config changed.
 */
export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (supabaseInstance && currentUrl === url && currentKey === key) {
    return supabaseInstance;
  }

  currentUrl = url;
  currentKey = key;
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}
