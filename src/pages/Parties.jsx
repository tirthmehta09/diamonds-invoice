// src/pages/Parties.jsx
import { useState, useEffect } from 'react';
import { getAllParties, saveParty, deleteParty, generateId } from '../utils/storage';
import { useToast } from '../components/Toast.jsx';

function PartyForm({ party, onSave, onCancel }) {
  const [name, setName] = useState(party?.name || '');
  const [address, setAddress] = useState((party?.addressLines || []).join('\n'));
  const [gstin, setGstin] = useState(party?.gstin || '');
  const [defaultTerms, setDefaultTerms] = useState(party?.defaultTerms || 'COD');

  const gstinValid = !gstin || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: party?.id || generateId(),
      name: name.trim().toUpperCase(),
      addressLines: address.split('\n').map((l) => l.trim().toUpperCase()).filter(Boolean),
      gstin: gstin.trim().toUpperCase(),
      defaultTerms,
      createdAt: party?.createdAt,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label className="field-label">Party Name *</label>
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          placeholder="M/S COMPANY NAME"
          autoCapitalize="characters"
          autoFocus
        />
      </div>
      <div>
        <label className="field-label">Address (one line per line)</label>
        <textarea
          className="field-input"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value.toUpperCase())}
          placeholder={'LINE 1\nLINE 2\nCITY - PINCODE'}
          style={{ resize: 'none', lineHeight: 1.6 }}
          autoCapitalize="characters"
        />
      </div>
      <div>
        <label className="field-label">
          GSTIN{' '}
          {gstin && (
            <span style={{ color: gstinValid ? '#10b981' : '#f87171', fontSize: 11 }}>
              {gstinValid ? '✓ Valid' : '✗ Invalid format'}
            </span>
          )}
        </label>
        <input
          className="field-input"
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="27XXXXX0000X1ZX"
          maxLength={15}
          autoCapitalize="characters"
          style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}
        />
      </div>
      <div>
        <label className="field-label">Default Terms</label>
        <input
          className="field-input"
          value={defaultTerms}
          onChange={(e) => setDefaultTerms(e.target.value)}
          placeholder="COD"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 4 }}>
        <button className="btn-primary" onClick={handleSave} disabled={!name.trim()}>
          💾 Save Party
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const showToast = useToast();

  const demoParties = [
    {
      id: 'demo-p1',
      name: 'M/S OM JEWELS LUXURY',
      gstin: '27AADCO8542M1ZQ',
      addressLines: ['102 GOKUL ARCADE', 'S.V. ROAD, VILE PARLE EAST', 'MUMBAI - 400057'],
      defaultTerms: 'COD'
    },
    {
      id: 'demo-p2',
      name: 'M/S DIAMOND PALACE',
      gstin: '24ABCDE1234F1ZA',
      addressLines: ['405 RATNA SAGAR APARTMENTS', 'VARACHHA ROAD', 'SURAT - 395006'],
      defaultTerms: '30 DAYS'
    }
  ];

  const isDemo = parties.length === 0 && !loading;
  const partiesToShow = isDemo ? demoParties : parties;

  const load = () => {
    getAllParties().then((all) => { setParties(all); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = partiesToShow.filter((p) => {
    const q = query.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.gstin || '').toLowerCase().includes(q);
  });

  const handleSave = async (party) => {
    if (isDemo && party.id.startsWith('demo-')) {
      showToast('Demo party editing is disabled', 'info');
      return;
    }
    await saveParty(party);
    setEditing(null);
    showToast('Party saved!', 'success');
    load();
  };

  const handleDelete = async (id) => {
    if (isDemo && id.startsWith('demo-')) {
      showToast('Demo party operations are disabled', 'info');
      return;
    }
    if (!window.confirm('Delete this party?')) return;
    await deleteParty(id);
    showToast('Party deleted', 'info');
    load();
  };

  return (
    <>
      <div className="top-bar">
        <h1>👥 Saved Parties</h1>
        <button
          className="btn-primary"
          style={{ padding: '8px 14px', minHeight: 36, fontSize: 13, width: 'auto', flexShrink: 0 }}
          onClick={() => setEditing('new')}
        >
          + Add
        </button>
      </div>

      <div className="page-content">

        {/* Add/Edit form */}
        {editing === 'new' && (
          <div className="section-card" style={{ borderColor: '#4f46e5', borderWidth: 1.5 }}>
            <div className="section-title">✏️ New Party</div>
            <PartyForm onSave={handleSave} onCancel={() => setEditing(null)} />
          </div>
        )}

        {/* Search */}
        <div className="search-wrapper">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parties..."
          />
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
              <span>Showing demo parties because your list is empty.</span>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <span className="spinner dark" />
          </div>
        )}

        {!loading && filtered.length === 0 && !editing && (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3>No parties saved</h3>
            <p>Tap "＋ Add" to save a buyer for quick autofill on invoices.</p>
          </div>
        )}

        <div className="desktop-grid">
          {filtered.map((party) => (
            <div key={party.id}>
              {editing === party.id ? (
                <div className="section-card" style={{ borderColor: '#4f46e5', borderWidth: 1.5, margin: 0 }}>
                  <div className="section-title">✏️ Edit Party</div>
                  <PartyForm party={party} onSave={handleSave} onCancel={() => setEditing(null)} />
                </div>
              ) : (
                <div className="party-card" style={{ margin: 0 }}>
                  <div className="party-card-header">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="party-name">{party.name}</div>
                      {party.gstin && <div className="party-gstin">GSTIN: {party.gstin}</div>}
                      {party.addressLines?.length > 0 && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, lineHeight: 1.4, fontWeight: 500 }}>
                          {party.addressLines.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 12 }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 13, padding: '9px 12px', minHeight: 38 }}
                      onClick={() => setEditing(party.id)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-secondary btn-danger"
                      style={{ padding: '9px 14px', minHeight: 38, fontSize: 13 }}
                      onClick={() => handleDelete(party.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
