// src/pages/Parties.jsx
import { useState, useEffect } from 'react';
import { getAllParties, saveParty, deleteParty, generateId } from '../utils/storage';
import { useToast } from '../components/Toast.jsx';
import { useNavigate } from 'react-router-dom';

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
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="field-label">Party Name *</label>
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="M/S COMPANY NAME"
            autoCapitalize="characters"
          />
        </div>
        <div>
          <label className="field-label">Address (one line per line)</label>
          <textarea
            className="field-input"
            rows={4}
            value={address}
            onChange={(e) => setAddress(e.target.value.toUpperCase())}
            placeholder={'LINE 1\nLINE 2\nCITY-PINCODE'}
            style={{ resize: 'none', lineHeight: 1.6 }}
            autoCapitalize="characters"
          />
        </div>
        <div>
          <label className="field-label">
            GSTIN{' '}
            {gstin && (
              <span style={{ color: gstinValid ? '#34d399' : '#f87171' }}>
                {gstinValid ? '✓' : '✗ Invalid format'}
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
            style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={!name.trim()}>
            Save Party
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | partyId
  const showToast = useToast();

  const load = () => {
    getAllParties().then((all) => { setParties(all); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = parties.filter((p) => {
    const q = query.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.gstin || '').toLowerCase().includes(q);
  });

  const handleSave = async (party) => {
    await saveParty(party);
    setEditing(null);
    showToast('Party saved!', 'success');
    load();
  };

  const handleDelete = async (id) => {
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
          style={{ padding: '8px 16px', minHeight: 36, fontSize: 13, width: 'auto' }}
          onClick={() => setEditing('new')}
        >
          + Add
        </button>
      </div>

      <div className="page-content">
        {/* Add form */}
        {editing === 'new' && (
          <div className="section-card" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
            <div className="section-title">✏️ New Party</div>
            <PartyForm
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
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

        {loading && <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>}

        {!loading && filtered.length === 0 && !editing && (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3>No parties saved</h3>
            <p>Tap "+ Add" to save a buyer for quick autofill.</p>
          </div>
        )}

        {filtered.map((party) => (
          <div key={party.id}>
            {editing === party.id ? (
              <div className="section-card" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
                <div className="section-title">✏️ Edit Party</div>
                <PartyForm
                  party={party}
                  onSave={handleSave}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div className="party-card">
                <div className="party-card-header">
                  <div style={{ flex: 1 }}>
                    <div className="party-name">{party.name}</div>
                    {party.gstin && <div className="party-gstin">GSTIN: {party.gstin}</div>}
                    {party.addressLines?.length > 0 && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                        {party.addressLines.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: 12, padding: '8px', minHeight: 36 }}
                    onClick={() => setEditing(party.id)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-secondary btn-danger"
                    style={{ padding: '8px 12px', minHeight: 36, fontSize: 12 }}
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
    </>
  );
}
