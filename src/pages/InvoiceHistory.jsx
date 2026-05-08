// src/pages/InvoiceHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllInvoices, deleteInvoice } from '../utils/storage';
import { downloadInvoicePDF, shareInvoicePDF } from '../utils/pdfGenerator';
import { COMPANIES } from '../config/companies';
import { formatIndianNumber } from '../utils/calculations';
import { formatDate } from '../utils/dateHelpers';
import { useToast } from '../components/Toast.jsx';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const showToast = useToast();

  const load = () => {
    getAllInvoices().then((all) => {
      setInvoices(all);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = invoices.filter((inv) => {
    const q = query.toLowerCase();
    const matchQ = !q ||
      inv.invoiceNo?.toLowerCase().includes(q) ||
      inv.buyer?.name?.toLowerCase().includes(q) ||
      inv.buyer?.gstin?.toLowerCase().includes(q);
    const matchF = filter === 'all' || inv.company === filter;
    return matchQ && matchF;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    await deleteInvoice(id);
    showToast('Invoice deleted', 'info');
    load();
  };

  const handleDownload = (inv) => {
    const company = COMPANIES[inv.company];
    if (!company) return;
    downloadInvoicePDF(inv, company);
  };

  const handleShare = async (inv) => {
    const company = COMPANIES[inv.company];
    if (!company) return;
    await shareInvoicePDF(inv, company);
  };

  return (
    <>
      <div className="top-bar">
        <h1>📄 Invoice History</h1>
      </div>

      <div className="page-content">
        {/* Search */}
        <div className="search-wrapper">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice no., buyer..."
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'jas_diamond', label: 'JAS' },
            { key: 'jay_gems', label: 'JAY' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: '1px solid',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: filter === f.key ? '#3b82f6' : 'transparent',
                color: filter === f.key ? 'white' : '#64748b',
                borderColor: filter === f.key ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#475569', alignSelf: 'center' }}>
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span className="spinner" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>No invoices yet</h3>
            <p>Create your first invoice from the Home tab.</p>
          </div>
        )}

        {filtered.map((inv) => {
          const company = COMPANIES[inv.company];
          const isJas = inv.company === 'jas_diamond';
          return (
            <div className="invoice-card" key={inv.id}>
              <div className="invoice-card-header">
                <div>
                  <div className="invoice-no">{inv.invoiceNo}</div>
                  <span
                    className="badge"
                    style={{
                      background: isJas ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                      color: isJas ? '#60a5fa' : '#c084fc',
                      marginTop: 3,
                    }}
                  >
                    {company?.shortName || inv.company}
                  </span>
                </div>
                <div className="invoice-amount">
                  ₹{formatIndianNumber(inv.totals?.grandTotal || 0)}
                </div>
              </div>
              <div className="invoice-buyer">{inv.buyer?.name}</div>
              <div className="invoice-meta">
                <span className="invoice-date">{formatDate(inv.invoiceDate)}</span>
                <span style={{ color: '#334155', fontSize: 12 }}>·</span>
                <span className="invoice-date">{formatIndianNumber(inv.totals?.totalCts || 0)} cts</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: 12, padding: '8px 10px', minHeight: 36 }}
                  onClick={() => handleDownload(inv)}
                >
                  📥 PDF
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: 12, padding: '8px 10px', minHeight: 36 }}
                  onClick={() => handleShare(inv)}
                >
                  💬 Share
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: 12, padding: '8px 10px', minHeight: 36 }}
                  onClick={() => navigate(`/invoice/create/${inv.company}`)}
                >
                  ✏️ New
                </button>
                <button
                  className="btn-secondary btn-danger"
                  style={{ padding: '8px 10px', minHeight: 36 }}
                  onClick={() => handleDelete(inv.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
