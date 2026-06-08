// src/pages/CreateInvoice.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMPANIES, DELIVERY_CITIES, DISPATCH_MODES } from '../config/companies';
import { calcItemAmount, calcTotals, formatIndianNumber, formatCts, parseNumber } from '../utils/calculations';
import { amountInWords } from '../utils/amountInWords';
import { todayISO } from '../utils/dateHelpers';
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
  const [loadedParty, setLoadedParty] = useState(null);
  const [savedInvoiceId] = useState(invoiceId || generateId());
  const [errors, setErrors] = useState({});

  // ── filename prompt state ──────────────────────────────────────────────
  const [showFilenameModal, setShowFilenameModal] = useState(false);
  const [namingAction, setNamingAction] = useState(null); // 'share' | 'download'
  const [customFilename, setCustomFilename] = useState('');
  const [filenameError, setFilenameError] = useState('');

  useEffect(() => {
    if (company && !invoiceId) {
      setInvoiceNo(getNextInvoiceNumber(company.id));
    }
  }, [company, invoiceId]);

  if (!company) {
    return <div style={{ padding: 24, color: '#ef4444' }}>Invalid company.</div>;
  }

  // ── item helpers ─────────────────────────────────────────────────────────
  const updateItem = useCallback((id, field, value) => {
    if (field === 'description') {
      setItems((prev) => {
        if (prev[0]?.id === id) {
          return prev.map((item) => ({ ...item, description: value }));
        }
        return prev.map((item) => (item.id === id ? { ...item, description: value } : item));
      });
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id !== id ? item : { ...item, [field]: value }))
      );
    }
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem(prev[0]?.description || company.defaultDescription)]);
  }, [company]);

  const removeItem = useCallback((id) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));
  }, []);

  // ── totals ────────────────────────────────────────────────────────────────
  const totals = calcTotals(items, company.igstRate);

  // ── build invoice ─────────────────────────────────────────────────────────
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

  // ── validate (all fields required) ───────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!invoiceNo.trim())        newErrors.invoiceNo = true;
    if (!invoiceDate)             newErrors.invoiceDate = true;
    if (!dispatchDate)            newErrors.dispatchDate = true;
    if (!dispatchMode.trim())     newErrors.dispatchMode = true;
    if (!terms.trim())            newErrors.terms = true;
    if (!hsnCode.trim())          newErrors.hsnCode = true;
    if (!deliveryCity.trim())     newErrors.deliveryCity = true;
    if (!buyerName.trim())        newErrors.buyerName = true;
    if (!buyerAddress.trim())     newErrors.buyerAddress = true;
    if (!buyerGstin.trim())       newErrors.buyerGstin = true;

    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (buyerGstin.trim() && !gstinPattern.test(buyerGstin.trim())) {
      newErrors.buyerGstinFormat = true;
    }

    const itemErrors = {};
    items.forEach((item) => {
      const errs = {};
      if (!item.description.trim())       errs.description = true;
      if (!(parseNumber(item.cts) > 0))   errs.cts = true;
      if (!(parseNumber(item.rate) > 0))  errs.rate = true;
      if (Object.keys(errs).length) itemErrors[item.id] = errs;
    });
    if (Object.keys(itemErrors).length) newErrors.items = itemErrors;

    setErrors(newErrors);

    if (newErrors.invoiceNo)        { showToast('Invoice Number is required', 'error'); return false; }
    if (newErrors.invoiceDate)      { showToast('Invoice Date is required', 'error'); return false; }
    if (newErrors.dispatchDate)     { showToast('Dispatch Date is required', 'error'); return false; }
    if (newErrors.terms)            { showToast('Terms is required', 'error'); return false; }
    if (newErrors.hsnCode)          { showToast('HSN Code is required', 'error'); return false; }
    if (newErrors.buyerName)        { showToast('Buyer Name is required', 'error'); return false; }
    if (newErrors.buyerAddress)     { showToast('Buyer Address is required', 'error'); return false; }
    if (newErrors.buyerGstin)       { showToast('Buyer GSTIN is required', 'error'); return false; }
    if (newErrors.buyerGstinFormat) { showToast('Buyer GSTIN format is invalid', 'error'); return false; }
    if (newErrors.items)            { showToast('Each item needs Description, CTS & Rate', 'error'); return false; }
    return true;
  };

  // ── party auto-save ───────────────────────────────────────────────────────
  const checkAndPromptPartySave = async () => {
    if (!buyerName.trim()) return;
    try {
      const parties = await getAllParties();
      const currentName = buyerName.trim();
      const currentAddressLines = buyerAddress.split('\n').map(l => l.trim()).filter(Boolean);
      const currentGstin = buyerGstin.trim();

      const existingByName = parties.find(p => p.name.toUpperCase() === currentName.toUpperCase());
      const existingById = loadedParty ? parties.find(p => p.id === loadedParty.id) : null;
      
      const existingParty = existingById || existingByName;

      if (existingParty) {
        const addressChanged = JSON.stringify(existingParty.addressLines || []) !== JSON.stringify(currentAddressLines);
        const gstinChanged = (existingParty.gstin || '') !== currentGstin;
        const nameChanged = existingParty.name !== currentName;

        if (addressChanged || gstinChanged || nameChanged) {
          if (window.confirm(`Buyer details for "${existingParty.name}" have changed.\n\nClick OK to UPDATE the saved party, or click Cancel to SKIP.`)) {
            await saveParty({
              ...existingParty,
              name: currentName,
              addressLines: currentAddressLines,
              gstin: currentGstin,
            });
            showToast('Party updated!', 'success');
          } else if (window.confirm(`Would you like to SAVE AS A NEW party instead?`)) {
            await saveParty({
              id: generateId(),
              name: currentName,
              addressLines: currentAddressLines,
              gstin: currentGstin,
            });
            showToast('New party saved!', 'success');
          }
        }
      } else {
        if (window.confirm(`Save "${currentName}" as a new party?`)) {
          await saveParty({
            id: generateId(),
            name: currentName,
            addressLines: currentAddressLines,
            gstin: currentGstin,
          });
          showToast('Party saved!', 'success');
        }
      }
    } catch (err) {
      console.error('Error saving party:', err);
    }
  };

  // ── filename helpers ─────────────────────────────────────────────────────
  const getSuggestedFilename = () => {
    const serialMatch = invoiceNo.match(/^(\d+)/);
    const yearMatch = invoiceNo.match(/(\d{4}-\d{2})/);
    const serial = serialMatch ? serialMatch[1].padStart(2, '0') : '01';
    const year = yearMatch ? yearMatch[1] : '2026-27';
    const cleanedBuyer = buyerName
      .toUpperCase()
      .replace(/[^A-Z0-9\s_-]/g, '')
      .trim();
    return `${serial}-${cleanedBuyer}-${year}`;
  };

  const handleFilenameChange = (value) => {
    const val = value.toUpperCase();
    setCustomFilename(val);

    const regex = /^\d{2,}-[A-Z0-9_\s-]+-\d{4}-\d{2}$/;
    if (!val.trim()) {
      setFilenameError('Filename is required');
    } else if (!regex.test(val)) {
      setFilenameError('Must be: [Serial]-[Buyer Name]-[Financial Year]\ne.g. 03-OM-2025-26');
    } else {
      setFilenameError('');
    }
  };

  // ── actions ───────────────────────────────────────────────────────────────
  const handleShareClick = () => {
    if (!validate()) return;
    const suggested = getSuggestedFilename();
    setCustomFilename(suggested);
    setFilenameError('');
    setNamingAction('share');
    setShowFilenameModal(true);
  };

  const handleDownloadClick = () => {
    if (!validate()) return;
    const suggested = getSuggestedFilename();
    setCustomFilename(suggested);
    setFilenameError('');
    setNamingAction('download');
    setShowFilenameModal(true);
  };

  const confirmAndSaveInvoice = async () => {
    const regex = /^\d{2,}-[A-Z0-9_\s-]+-\d{4}-\d{2}$/;
    if (!regex.test(customFilename)) {
      setFilenameError('Filename must match the required format');
      return;
    }

    setGenerating(true);
    setShowFilenameModal(false);
    try {
      const invoice = buildInvoice();
      invoice.filename = customFilename;
      await saveInvoice(invoice);
      confirmInvoiceNumber(company.id);

      if (namingAction === 'share') {
        await shareInvoicePDF(invoice, company, customFilename);
        showToast('Invoice shared!', 'success');
      } else {
        downloadInvoicePDF(invoice, company, customFilename);
        showToast('PDF downloaded!', 'success');
      }
      await checkAndPromptPartySave();
    } catch (err) {
      console.error(err);
      showToast(`Error ${namingAction === 'share' ? 'sharing' : 'downloading'} PDF`, 'error');
    } finally {
      setGenerating(false);
      setNamingAction(null);
    }
  };

  const handlePartySelect = (party) => {
    setBuyerName(party.name);
    setBuyerAddress((party.addressLines || []).join('\n'));
    setBuyerGstin(party.gstin || '');
    setLoadedParty(party);
    setShowPartySearch(false);
    showToast(`Loaded: ${party.name}`, 'success');
  };

  const gstinValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(buyerGstin);
  const isJas = company.id === 'jas_diamond';
  const accentBg = isJas ? 'rgba(37,99,235,0.12)' : 'rgba(147,51,234,0.12)';
  const accentColor = isJas ? '#3b82f6' : '#a855f7';

  // error border helper
  const eb = (key) => errors[key]
    ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
    : {};

  const REQ = <span style={{ color: '#ef4444', marginLeft: 1 }}>*</span>;

  return (
    <>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="top-bar">
        <button
          className="btn-secondary"
          style={{ padding: '8px 12px', minHeight: 36, fontSize: 13, flexShrink: 0 }}
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: 15 }}>{company.displayName}</h1>
        <div className="badge" style={{ background: accentBg, color: accentColor, border: 'none' }}>
          {company.shortName}
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: 150 }}>

        {/* ── SECTION 1: Invoice Details ─────────────────────────────────── */}
        <div className="section-card">
          <div className="section-title">📋 Invoice Details</div>

          <div style={{ marginBottom: 10 }}>
            <label className="field-label">Invoice Number {REQ}</label>
            <input
              className="field-input"
              value={invoiceNo}
              onChange={(ev) => { setInvoiceNo(ev.target.value); setErrors(p => ({ ...p, invoiceNo: false })); }}
              placeholder="03/2026-27"
              style={eb('invoiceNo')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="field-label">Invoice Date {REQ}</label>
              <input
                className="field-input"
                type="date"
                value={invoiceDate}
                onChange={(ev) => { setInvoiceDate(ev.target.value); setErrors(p => ({ ...p, invoiceDate: false })); }}
                style={eb('invoiceDate')}
              />
            </div>
            <div>
              <label className="field-label">Dispatch Date {REQ}</label>
              <input
                className="field-input"
                type="date"
                value={dispatchDate}
                onChange={(ev) => { setDispatchDate(ev.target.value); setErrors(p => ({ ...p, dispatchDate: false })); }}
                style={eb('dispatchDate')}
              />
            </div>
            <div>
              <label className="field-label">Dispatch Mode {REQ}</label>
              <select
                className="field-input"
                value={dispatchMode}
                onChange={(ev) => { setDispatchMode(ev.target.value); setErrors(p => ({ ...p, dispatchMode: false })); }}
                style={eb('dispatchMode')}
              >
                {DISPATCH_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Terms {REQ}</label>
              <input
                className="field-input"
                value={terms}
                onChange={(ev) => { setTerms(ev.target.value); setErrors(p => ({ ...p, terms: false })); }}
                placeholder="COD"
                style={eb('terms')}
              />
            </div>
            <div>
              <label className="field-label">HSN Code {REQ}</label>
              <input
                className="field-input"
                value={hsnCode}
                onChange={(ev) => { setHsnCode(ev.target.value); setErrors(p => ({ ...p, hsnCode: false })); }}
                placeholder={company.defaultHsnCode}
                style={eb('hsnCode')}
              />
            </div>
            <div>
              <label className="field-label">Delivery City {REQ}</label>
              <select
                className="field-input"
                value={deliveryCity}
                onChange={(ev) => { setDeliveryCity(ev.target.value); setErrors(p => ({ ...p, deliveryCity: false })); }}
                style={eb('deliveryCity')}
              >
                {DELIVERY_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Buyer Details ───────────────────────────────────── */}
        <div className="section-card">
          <div className="section-title">
            👤 Buyer Details
            <button
              className="btn-secondary"
              style={{ marginLeft: 'auto', padding: '5px 11px', minHeight: 30, fontSize: 11 }}
              onClick={() => setShowPartySearch(true)}
            >
              🔍 Search
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="field-label">Buyer Name {REQ}</label>
              <input
                className="field-input"
                value={buyerName}
                onChange={(ev) => { setBuyerName(ev.target.value.toUpperCase()); setErrors(p => ({ ...p, buyerName: false })); }}
                placeholder="M/S COMPANY NAME"
                autoCapitalize="characters"
                style={eb('buyerName')}
              />
            </div>
            <div>
              <label className="field-label">Address {REQ}</label>
              <textarea
                className="field-input"
                rows={3}
                value={buyerAddress}
                onChange={(ev) => { setBuyerAddress(ev.target.value.toUpperCase()); setErrors(p => ({ ...p, buyerAddress: false })); }}
                placeholder={'LINE 1\nLINE 2\nCITY - PINCODE'}
                style={{ resize: 'none', lineHeight: 1.6, ...eb('buyerAddress') }}
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="field-label">
                Buyer GSTIN {REQ}{' '}
                {buyerGstin.length > 0 && (
                  <span style={{ color: gstinValid ? '#10b981' : '#f87171', marginLeft: 4 }}>
                    {gstinValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                )}
              </label>
              <input
                className="field-input"
                value={buyerGstin}
                onChange={(ev) => {
                  setBuyerGstin(ev.target.value.toUpperCase());
                  setErrors(p => ({ ...p, buyerGstin: false, buyerGstinFormat: false }));
                }}
                placeholder="27XXXXX0000X1ZX"
                maxLength={15}
                autoCapitalize="characters"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                  ...(errors.buyerGstin || errors.buyerGstinFormat
                    ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
                    : {}),
                }}
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Items ───────────────────────────────────────────── */}
        <div className="section-card">
          <div className="section-title">💎 Diamond Items</div>

          {items.map((item, idx) => {
            const amt = calcItemAmount(item.cts, item.rate);
            const itemErr = errors.items?.[item.id] || {};
            const ib = (field) => itemErr[field]
              ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.1)' }
              : {};
            return (
              <div
                className="item-card"
                key={item.id}
                style={Object.keys(itemErr).length ? { borderColor: '#fca5a5' } : {}}
              >
                <div className="item-card-header">
                  <span className="item-sr-badge">{idx + 1}</span>
                  <span className={`item-amount-display${amt > 0 ? '' : ' zero'}`}>
                    {amt > 0 ? `₹${formatIndianNumber(amt)}` : '—'}
                  </span>
                  <button
                    className="item-delete-btn"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    style={{ opacity: items.length === 1 ? 0.3 : 1, marginLeft: 6 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label className="item-field-label">Description {REQ}</label>
                  <input
                    className="item-field-input desc"
                    value={item.description}
                    onChange={(ev) => {
                      updateItem(item.id, 'description', ev.target.value.toUpperCase());
                      setErrors(p => ({
                        ...p,
                        items: { ...p.items, [item.id]: { ...p.items?.[item.id], description: false } },
                      }));
                    }}
                    placeholder="DIAMOND DESCRIPTION"
                    autoCapitalize="characters"
                    style={ib('description')}
                  />
                </div>

                <div className="item-fields-row">
                  <div>
                    <label className="item-field-label">CTS (Carats) {REQ}</label>
                    <input
                      className="item-field-input"
                      value={item.cts}
                      onChange={(ev) => {
                        updateItem(item.id, 'cts', ev.target.value);
                        setErrors(p => ({
                          ...p,
                          items: { ...p.items, [item.id]: { ...p.items?.[item.id], cts: false } },
                        }));
                      }}
                      placeholder="0.00"
                      inputMode="decimal"
                      style={ib('cts')}
                    />
                  </div>
                  <div>
                    <label className="item-field-label">Rate (₹/ct) {REQ}</label>
                    <input
                      className="item-field-input"
                      value={item.rate}
                      onChange={(ev) => {
                        updateItem(item.id, 'rate', ev.target.value);
                        setErrors(p => ({
                          ...p,
                          items: { ...p.items, [item.id]: { ...p.items?.[item.id], rate: false } },
                        }));
                      }}
                      placeholder="0"
                      inputMode="numeric"
                      style={ib('rate')}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: 4 }}
            onClick={addItem}
          >
            + Add Item Row
          </button>
        </div>

        {/* ── Amount in Words ────────────────────────────────────────────── */}
        {totals.grandTotal > 0 && (
          <div className="amount-words-card">
            <div className="amount-words-label">Amount in Words</div>
            <div className="amount-words-text">{amountInWords(totals.grandTotal)}</div>
          </div>
        )}

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" onClick={handleShareClick} disabled={generating}>
            {generating ? <span className="spinner" /> : '💬 Share PDF (WhatsApp)'}
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={handleDownloadClick}
            disabled={generating}
          >
            {generating ? <span className="spinner dark" /> : '📥 Download PDF'}
          </button>
        </div>
      </div>

      {/* ── Fixed Totals Bar ───────────────────────────────────────────────── */}
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
          <span className="totals-bar-label">IGST</span>
          <span className="totals-bar-value">₹{formatIndianNumber(totals.igstAmount)}</span>
        </div>
        <div className="totals-bar-item">
          <span className="totals-bar-label">Total</span>
          <span className="totals-bar-value grand">₹{formatIndianNumber(totals.grandTotal)}</span>
        </div>
      </div>

      {/* ── Party Search Modal ─────────────────────────────────────────────── */}
      {showPartySearch && (
        <PartySearchModal
          onSelect={handlePartySelect}
          onClose={() => setShowPartySearch(false)}
        />
      )}

      {/* ── Filename Modal ─────────────────────────────────────────────────── */}
      {showFilenameModal && (
        <div className="modal-overlay" onClick={() => setShowFilenameModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
              Confirm PDF Filename
            </h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
              Enter the filename for this invoice. It must follow the exact format below:
            </p>
            
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12.5,
              color: '#334155',
              lineHeight: 1.5
            }}>
              <div>
                <strong style={{ color: '#6366f1' }}>Format: </strong>
                <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace' }}>
                  [Serial]-[BuyerName]-[FinancialYear]
                </code>
              </div>
              <div style={{ marginTop: 6 }}>
                <strong style={{ color: '#6366f1' }}>Example: </strong>
                <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace', color: '#0f172a' }}>
                  03-OM-2025-26
                </code>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label className="field-label" style={{ color: '#475569', marginBottom: 6 }}>Filename {REQ}</label>
              <input
                className="field-input"
                value={customFilename}
                onChange={(ev) => handleFilenameChange(ev.target.value)}
                placeholder="e.g. 03-OM-2025-26"
                autoFocus
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  borderColor: filenameError ? '#ef4444' : '#cbd5e1',
                  boxShadow: filenameError ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none'
                }}
              />
              {filenameError && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 5, whiteSpace: 'pre-line', fontWeight: 500 }}>
                  {filenameError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, minHeight: 44 }}
                onClick={() => setShowFilenameModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{
                  flex: 2,
                  minHeight: 44,
                  background: filenameError || !customFilename.trim() ? '#94a3b8' : accentColor
                }}
                disabled={!!filenameError || !customFilename.trim()}
                onClick={confirmAndSaveInvoice}
              >
                {generating ? <span className="spinner" /> : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
