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

  const demoInvoices = [
    {
      id: 'demo-inv-1',
      company: 'jas_diamond',
      invoiceNo: 'JAS/26-27/001',
      invoiceDate: '2026-06-05',
      buyer: {
        name: 'M/S OM JEWELS LUXURY',
        gstin: '27AADCO8542M1ZQ'
      },
      totals: {
        totalCts: 4.85,
        grandTotal: 154800
      }
    },
    {
      id: 'demo-inv-2',
      company: 'jay_gems',
      invoiceNo: 'JAY/26-27/002',
      invoiceDate: '2026-06-03',
      buyer: {
        name: 'M/S DIAMOND PALACE',
        gstin: '24ABCDE1234F1ZA'
      },
      totals: {
        totalCts: 12.34,
        grandTotal: 843200
      }
    }
  ];

  const isDemo = invoices.length === 0 && !loading;
  const invoicesToShow = isDemo ? demoInvoices : invoices;

  const load = () => {
    getAllInvoices().then((all) => {
      setInvoices(all);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = invoicesToShow.filter((inv) => {
    const q = query.toLowerCase();
    const matchQ = !q ||
      inv.invoiceNo?.toLowerCase().includes(q) ||
      inv.buyer?.name?.toLowerCase().includes(q) ||
      inv.buyer?.gstin?.toLowerCase().includes(q);
    const matchF = filter === 'all' || inv.company === filter;
    return matchQ && matchF;
  });

  const handleDelete = async (id) => {
    if (isDemo) {
      showToast('Demo invoice operations are disabled', 'info');
      return;
    }
    if (!window.confirm('Delete this invoice?')) return;
    await deleteInvoice(id);
    showToast('Invoice deleted', 'info');
    load();
  };

  const handleDownload = (inv) => {
    if (isDemo) {
      showToast('Demo invoice operations are disabled', 'info');
      return;
    }
    const company = COMPANIES[inv.company];
    if (!company) return;
    downloadInvoicePDF(inv, company);
  };

  const handleShare = async (inv) => {
    if (isDemo) {
      showToast('Demo invoice operations are disabled', 'info');
      return;
    }
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
            placeholder="Search invoice no., buyer..."
          />
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'jas_diamond', label: 'JAS Diamond' },
            { key: 'jay_gems', label: 'JAY Gems' },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-tab${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Banner for Demo mode */}
        {isDemo && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#b45309', fontWeight: 600 }}>
              <span className="preview-data-badge">Preview Mode</span>
              <span>Showing demo invoices because history is empty.</span>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <span className="spinner dark" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>No invoices found</h3>
            <p>Create your first invoice from the Home tab.</p>
          </div>
        )}

        {filtered.map((inv) => {
          const company = COMPANIES[inv.company];
          const isJas = inv.company === 'jas_diamond';
          return (
            <div className="invoice-card" key={inv.id}>
              <div className="invoice-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="invoice-no">{inv.invoiceNo}</div>
                  <span
                    className="badge"
                    style={{
                      background: isJas ? '#eff6ff' : '#faf5ff',
                      color: isJas ? '#1d4ed8' : '#7e22ce',
                      border: `1px solid ${isJas ? '#bfdbfe' : '#e9d5ff'}`,
                      marginTop: 4,
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
                <span style={{ color: '#cbd5e1', fontSize: 12 }}>·</span>
                <span className="invoice-date">{formatIndianNumber(inv.totals?.totalCts || 0)} cts</span>
              </div>

              {/* Actions — 2×2 grid */}
              <div className="invoice-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleDownload(inv)}
                >
                  📥 Download PDF
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleShare(inv)}
                >
                  💬 Share
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/invoice/create/${inv.company}`)}
                >
                  ✏️ New Invoice
                </button>
                <button
                  className="btn-secondary btn-danger"
                  onClick={() => handleDelete(inv.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
