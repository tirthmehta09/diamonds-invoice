// src/pages/CreateInvoice.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMPANIES, DELIVERY_CITIES, DISPATCH_MODES, TC_CLAUSES } from '../config/companies';
import { calcItemAmount, calcTotals, formatIndianNumber, formatCts, parseNumber } from '../utils/calculations';
import { amountInWords } from '../utils/amountInWords';
import { todayISO, formatDate } from '../utils/dateHelpers';
import { getNextInvoiceNumber, confirmInvoiceNumber } from '../utils/invoiceNumber';
import { saveInvoice, generateId, getAllParties, saveParty } from '../utils/storage';
import { downloadInvoicePDF, shareInvoicePDF } from '../utils/pdfGenerator';
import { useToast } from '../components/Toast.jsx';
import PartySearchModal from '../components/PartySearchModal.jsx';

const emptyItem = (description = '') => ({
  id: generateId(),
  description,
  cts: '',
  rate: '',
});

export default function CreateInvoice() {
  const { companyId, invoiceId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const company = COMPANIES[companyId];

  // ── form state ─────────────────────────────────────────────────────────
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [dispatchDate, setDispatchDate] = useState(todayISO());
  const [dispatchMode, setDispatchMode] = useState(company?.defaultDispatchMode || 'HAND DELIVERY');
  const [terms, setTerms] = useState(company?.defaultTerms || 'COD');
  const [hsnCode, setHsnCode] = useState(company?.defaultHsnCode || '');
  const [deliveryCity, setDeliveryCity] = useState(company?.defaultDeliveryCity || 'MUMBAI');

  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');

  const [items, setItems] = useState([emptyItem(company?.defaultDescription || '')]);
  const [generating, setGenerating] = useState(false);
  const [showPartySearch, setShowPartySearch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedInvoiceId] = useState(invoiceId || generateId());

  // Auto-suggest invoice number on mount
  useEffect(() => {
    if (company && !invoiceId) {
      setInvoiceNo(getNextInvoiceNumber(company.id));
    }
  }, [company, invoiceId]);

  if (!company) {
    return <div style={{ padding: 24, color: '#ef4444' }}>Invalid company.</div>;
  }

  // ── item helpers ────────────────────────────────────────────────────────
  const updateItem = useCallback((id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Auto-copy description to all other rows
        if (field === 'description') {
          return updated;
        }
        return updated;
      })
    );

    // If description changed in first row, propagate to all
    if (field === 'description') {
      setItems((prev) => {
        if (prev[0]?.id === id) {
          return prev.map((item) => ({ ...item, description: value }));
        }
        return prev.map((item) => (item.id === id ? { ...item, [field]: value } : item));
      });
    }
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem(prev[0]?.description || company.defaultDescription)]);
  }, [company]);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      if (prev.length === 1) return prev; // keep at least one row
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // ── totals ──────────────────────────────────────────────────────────────
  const totals = calcTotals(items, company.igstRate);

  // ── build invoice object ─────────────────────────────────────────────────
  const buildInvoice = () => ({
    id: savedInvoiceId,
    company: company.id,
    invoiceNo,
    invoiceDate,
    dispatchDate,
    dispatchMode,
    terms,
    hsnCode,
    deliveryCity,
    buyer: {
      name: buyerName,
      addressLines: buyerAddress.split('\n').map((l) => l.trim()).filter(Boolean),
      gstin: buyerGstin,
    },
    items: items.map((item, idx) => ({
      ...item,
      sr: idx + 1,
      cts: parseNumber(item.cts),
      rate: parseNumber(item.rate),
    })),
    totals,
    amountInWords: amountInWords(totals.grandTotal),
    status: 'final',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ── validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!buyerName.trim()) { showToast('Please enter buyer name', 'error'); return false; }
    const hasItems = items.some((i) => parseNumber(i.cts) > 0 && parseNumber(i.rate) > 0);
    if (!hasItems) { showToast('Please fill at least one item (CTS + Rate)', 'error'); return false; }
    return true;
  };

  // ── party auto-save ──────────────────────────────────────────────────────
  const checkAndPromptPartySave = async () => {
    if (!buyerName.trim()) return;
    try {
      const parties = await getAllParties();
      const exists = parties.some(p => p.name.toUpperCase() === buyerName.trim().toUpperCase());
      if (!exists) {
        if (window.confirm(`Save "${buyerName}" as a new party for future invoices?`)) {
          await saveParty({
            id: generateId(),
            name: buyerName.trim(),
            addressLines: buyerAddress.split('\n').map(l => l.trim()).filter(Boolean),
            gstin: buyerGstin.trim()
          });
          showToast('Party saved successfully!', 'success');
        }
      }
    } catch (err) {
      console.error('Error saving party:', err);
    }
  };

  // ── save & generate PDF ──────────────────────────────────────────────────
  const handleGeneratePDF = async () => {
    if (!validate()) return;
    setGenerating(true);
    try {
      const invoice = buildInvoice();
      await saveInvoice(invoice);
      confirmInvoiceNumber(company.id);
      downloadInvoicePDF(invoice, company);
      showToast('PDF downloaded!', 'success');
      await checkAndPromptPartySave();
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!validate()) return;
    setGenerating(true);
    try {
      const invoice = buildInvoice();
      await saveInvoice(invoice);
      confirmInvoiceNumber(company.id);
      await shareInvoicePDF(invoice, company);
      showToast('Invoice shared!', 'success');
      await checkAndPromptPartySave();
    } catch (err) {
      console.error(err);
      showToast('Error sharing PDF', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ── party autofill ───────────────────────────────────────────────────────
  const handlePartySelect = (party) => {
    setBuyerName(party.name);
    setBuyerAddress((party.addressLines || []).join('\n'));
    setBuyerGstin(party.gstin || '');
    setShowPartySearch(false);
    showToast(`Loaded: ${party.name}`, 'success');
  };

  // ── GSTIN validation indicator ───────────────────────────────────────────
  const gstinValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(buyerGstin);

  const isJas = company.id === 'jas_diamond';

  return (
    <>
      {/* Top bar */}
      <div className="top-bar">
        <button
          className="btn-secondary"
          style={{ padding: '8px 12px', minHeight: 36, fontSize: 13 }}
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: 16 }}>{company.displayName}</h1>
        <div
          className="badge"
          style={{
            background: isJas ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
            color: isJas ? '#60a5fa' : '#c084fc',
          }}
        >
          {company.shortName}
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: 200 }}>

        {/* ─── SECTION 1: Invoice Details ──────────────────────────────── */}
        <div className="section-card">
          <div className="section-title">📋 Invoice Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="field-label">Invoice Number</label>
              <input
                className="field-input"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="03/2026-27"
              />
            </div>
            <div>
              <label className="field-label">Invoice Date</label>
              <input
                className="field-input"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Dispatch Date</label>
              <input
                className="field-input"
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Dispatch Mode</label>
              <select
                className="field-input"
                value={dispatchMode}
                onChange={(e) => setDispatchMode(e.target.value)}
              >
                {DISPATCH_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Terms</label>
              <input
                className="field-input"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="COD"
              />
            </div>
            <div>
              <label className="field-label">HSN Code</label>
              <input
                className="field-input"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder={company.defaultHsnCode}
              />
            </div>
            <div>
              <label className="field-label">Delivery City (T&amp;C)</label>
              <select
                className="field-input"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
              >
                {DELIVERY_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: Buyer Details ─────────────────────────────────── */}
        <div className="section-card">
          <div className="section-title">
            👤 Buyer Details
            <button
              className="btn-secondary"
              style={{ marginLeft: 'auto', padding: '5px 12px', minHeight: 30, fontSize: 12 }}
              onClick={() => setShowPartySearch(true)}
            >
              🔍 Search Saved
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="field-label">Buyer Name</label>
              <input
                className="field-input"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value.toUpperCase())}
                placeholder="M/S COMPANY NAME"
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="field-label">Address (one line per line)</label>
              <textarea
                className="field-input"
                rows={4}
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value.toUpperCase())}
                placeholder={'LINE 1\nLINE 2\nCITY-PINCODE'}
                style={{ resize: 'none', lineHeight: 1.6 }}
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="field-label">
                Buyer GSTIN{' '}
                {buyerGstin.length > 0 && (
                  <span style={{ color: gstinValid ? '#34d399' : '#f87171', marginLeft: 4 }}>
                    {gstinValid ? '✓' : '✗'}
                  </span>
                )}
              </label>
              <input
                className="field-input"
                value={buyerGstin}
                onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                placeholder="27XXXXX0000X1ZX"
                maxLength={15}
                autoCapitalize="characters"
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: Items ─────────────────────────────────────────── */}
        <div className="section-card">
          <div className="section-title">💎 Items</div>

          {/* Header */}
          <div className="items-header">
            <span>#</span>
            <span>Description</span>
            <span>CTS</span>
            <span>Rate</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
            <span></span>
          </div>

          {/* Item rows */}
          {items.map((item, idx) => {
            const amt = calcItemAmount(item.cts, item.rate);
            return (
              <div className="item-row" key={item.id}>
                <span className="item-sr">{idx + 1}</span>
                <input
                  className="desc-input"
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    padding: '8px 10px',
                    outline: 'none',
                    minHeight: 40,
                  }}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value.toUpperCase())}
                  placeholder="Description"
                  autoCapitalize="characters"
                />
                <input
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    padding: '8px',
                    outline: 'none',
                    textAlign: 'center',
                    minHeight: 40,
                  }}
                  value={item.cts}
                  onChange={(e) => updateItem(item.id, 'cts', e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
                <input
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    padding: '8px',
                    outline: 'none',
                    textAlign: 'center',
                    minHeight: 40,
                  }}
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                />
                <div style={{
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 600,
                  color: amt > 0 ? '#94a3b8' : '#334155',
                  paddingRight: 4,
                }}>
                  {amt > 0 ? formatIndianNumber(amt) : '—'}
                </div>
                <button
                  className="item-delete-btn"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  style={{ opacity: items.length === 1 ? 0.3 : 1 }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Add item row */}
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: 10 }}
            onClick={addItem}
          >
            + Add Item Row
          </button>
        </div>

        {/* ─── Preview info box ─────────────────────────────────────────── */}
        {totals.grandTotal > 0 && (
          <div className="section-card" style={{ background: 'rgba(52,211,153,0.06)', borderColor: 'rgba(52,211,153,0.2)' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Amount in Words:</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', lineHeight: 1.5 }}>
              {amountInWords(totals.grandTotal)}
            </div>
          </div>
        )}

        {/* ─── Action buttons ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" onClick={handleShare} disabled={generating}>
            {generating ? <span className="spinner" /> : '💬 Share PDF (WhatsApp)'}
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={handleGeneratePDF}
            disabled={generating}
          >
            {generating ? <span className="spinner" /> : '📥 Download PDF'}
          </button>
        </div>
      </div>

      {/* ─── Sticky Totals Bar ────────────────────────────────────────────── */}
      <div className="totals-bar">
        <div className="totals-bar-item">
          <span className="totals-bar-label">CTS</span>
          <span className="totals-bar-value">{formatCts(totals.totalCts)}</span>
        </div>
        <div className="totals-bar-item">
          <span className="totals-bar-label">Amount</span>
          <span className="totals-bar-value">₹{formatIndianNumber(totals.subtotal)}</span>
        </div>
        <div className="totals-bar-item">
          <span className="totals-bar-label">IGST 1.5%</span>
          <span className="totals-bar-value">₹{formatIndianNumber(totals.igstAmount)}</span>
        </div>
        <div className="totals-bar-item">
          <span className="totals-bar-label">Grand Total</span>
          <span className="totals-bar-value grand">₹{formatIndianNumber(totals.grandTotal)}</span>
        </div>
      </div>

      {/* ─── Party Search Modal ───────────────────────────────────────────── */}
      {showPartySearch && (
        <PartySearchModal
          onSelect={handlePartySelect}
          onClose={() => setShowPartySearch(false)}
        />
      )}
    </>
  );
}
