-- SQL Script to set up database tables in Supabase SQL Editor

-- 1. Create the parties table
CREATE TABLE IF NOT EXISTS public.parties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address_lines TEXT[] NOT NULL,
    gstin TEXT,
    default_terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expose parties table to API
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- Create simple policy to allow anonymous read/write/delete (since it's a shared family app using anon key)
CREATE POLICY "Allow anonymous access to parties"
ON public.parties
FOR ALL
USING (true)
WITH CHECK (true);


-- 2. Create the invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    dispatch_date TEXT NOT NULL,
    dispatch_mode TEXT NOT NULL,
    terms TEXT NOT NULL,
    hsn_code TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_address TEXT NOT NULL,
    buyer_gstin TEXT NOT NULL,
    items JSONB NOT NULL,
    totals JSONB NOT NULL,
    amount_in_words TEXT NOT NULL,
    filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expose invoices table to API
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read/write/delete
CREATE POLICY "Allow anonymous access to invoices"
ON public.invoices
FOR ALL
USING (true)
WITH CHECK (true);
