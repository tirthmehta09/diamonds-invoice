// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom';
import { COMPANIES } from '../config/companies';

const RealisticDiamond = ({ color = 'blue', size = 24 }) => {
  const palettes = {
    blue: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
    purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#7e22ce', '#6b21a8'],
    emerald: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#15803d', '#166534'],
  };
  const p = palettes[color] || palettes.blue;

  return (
    <svg viewBox="0 0 512 512" width={size} height={size} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))' }}>
      {/* Crown Far Left */}
      <polygon fill={p[1]} points="32,192 96,192 160,80" />
      {/* Crown Mid Left */}
      <polygon fill={p[0]} points="96,192 256,192 256,80 160,80" />
      {/* Crown Mid Right */}
      <polygon fill={p[2]} points="256,192 416,192 352,80 256,80" />
      {/* Crown Far Right */}
      <polygon fill={p[3]} points="416,192 480,192 352,80" />
      {/* Pavilion Far Left */}
      <polygon fill={p[5]} points="32,192 256,464 96,192" />
      {/* Pavilion Mid Left */}
      <polygon fill={p[4]} points="96,192 256,464 256,192" />
      {/* Pavilion Mid Right */}
      <polygon fill={p[6]} points="256,192 256,464 416,192" />
      {/* Pavilion Far Right */}
      <polygon fill={p[7]} points="416,192 256,464 480,192" />
    </svg>
  );
};

const ArrowIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="top-bar">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <RealisticDiamond color="emerald" size={32} />
          <div>
            <h1 className="text-gradient" style={{ fontSize: 22, marginBottom: 0 }}>Diamond Invoice</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>Select company to create invoice</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Hero Banner */}
        <div className="section-card" style={{ 
          background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)', 
          borderColor: '#e0e7ff',
          boxShadow: '0 4px 12px rgba(37,99,235,0.05)', 
          marginBottom: 24, 
          padding: '22px 24px' 
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>Welcome Back 👋</h2>
          <p style={{ fontSize: 13.5, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Create professional GST invoices instantly.<br />
            Generate PDF and share on WhatsApp in seconds.
          </p>
        </div>

        {/* Company cards */}
        <p className="section-title">📋 New Invoice</p>

        {Object.values(COMPANIES).map((company) => (
          <button
            key={company.id}
            className={`company-card ${company.id === 'jas_diamond' ? 'jas' : 'jay'}`}
            onClick={() => navigate(`/invoice/create/${company.id}`)}
            style={{ width: '100%', cursor: 'pointer', textAlign: 'left', border: '1px solid #e2e8f0' }}
          >
            <div className="company-card-icon" style={{ background: 'transparent' }}>
              <RealisticDiamond color={company.id === 'jas_diamond' ? 'blue' : 'purple'} size={48} />
            </div>
            <div className="company-card-info" style={{ flex: 1 }}>
              <h2 style={{ color: '#0f172a' }}>{company.displayName}</h2>
              <p style={{ color: '#64748b' }}>{company.address.line1} {company.address.line2}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>
                GSTIN: {company.gstin}
              </p>
            </div>
            <ArrowIcon />
          </button>
        ))}

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate('/history')}
          >
            📄 View History
          </button>
          <button
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate('/parties')}
          >
            👥 Parties
          </button>
        </div>
      </div>
    </>
  );
}
