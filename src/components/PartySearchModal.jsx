// src/components/PartySearchModal.jsx
import { useState, useEffect } from 'react';
import { getAllParties, saveParty, generateId } from '../utils/storage';

export default function PartySearchModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [parties, setParties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllParties().then((all) => {
      setParties(all);
      setFiltered(all);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      q ? parties.filter((p) => p.name.toLowerCase().includes(q) || (p.gstin || '').toLowerCase().includes(q)) : parties
    );
  }, [query, parties]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#f1f5f9' }}>
          Select Buyer
        </h2>

        {/* Search */}
        <div className="search-wrapper">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or GSTIN..."
          />
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <p>No saved parties found.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Parties are saved automatically when you create invoices.<br />
              Go to the Parties tab to add new ones.
            </p>
          </div>
        )}

        {filtered.map((party) => (
          <div
            key={party.id}
            className="party-card"
            onClick={() => onSelect(party)}
            style={{ cursor: 'pointer' }}
          >
            <div className="party-name">{party.name}</div>
            {party.gstin && <div className="party-gstin">GSTIN: {party.gstin}</div>}
            {party.addressLines?.length > 0 && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                {party.addressLines.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
