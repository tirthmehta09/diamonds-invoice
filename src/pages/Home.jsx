// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom';
import { COMPANIES } from '../config/companies';
import { getSupabaseClient } from '../utils/supabaseClient';

const RealisticDiamond = ({ color = 'blue', size = 24 }) => {
  const palettes = {
    blue:    ['#f0f9ff','#e0f2fe','#bae6fd','#7dd3fc','#38bdf8','#0ea5e9','#0284c7','#0369a1'],
    purple:  ['#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#7e22ce','#6b21a8'],
    emerald: ['#f0fdf4','#dcfce7','#bbf7d0','#86efac','#4ade80','#22c55e','#15803d','#166534'],
  };
  const p = palettes[color] || palettes.blue;

  return (
    <svg viewBox="0 0 512 512" width={size} height={size} style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.1))' }}>
      <polygon fill={p[1]} points="32,192 96,192 160,80" />
      <polygon fill={p[0]} points="96,192 256,192 256,80 160,80" />
      <polygon fill={p[2]} points="256,192 416,192 352,80 256,80" />
      <polygon fill={p[3]} points="416,192 480,192 352,80" />
      <polygon fill={p[5]} points="32,192 256,464 96,192" />
      <polygon fill={p[4]} points="96,192 256,464 256,192" />
      <polygon fill={p[6]} points="256,192 256,464 416,192" />
      <polygon fill={p[7]} points="416,192 256,464 480,192" />
    </svg>
  );
};

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <RealisticDiamond color="emerald" size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="text-gradient" style={{ fontSize: 20 }}>Diamond Invoice</h1>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            GST Billing App
          </p>
        </div>
        <button
          className="btn-secondary"
          style={{ padding: '6px 10px', minHeight: 32, fontSize: 12, border: '1px solid #cbd5e1' }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="page-content">

        {/* Hero Banner */}
        <div
          className="section-card"
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
            borderColor: '#e0e7ff',
            marginBottom: 20,
            padding: '18px 16px',
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e3a8a', marginBottom: 5, marginTop: 0 }}>
            Welcome Back 👋
          </h2>
          <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Create professional GST invoices instantly.<br />
            Generate PDF and share on WhatsApp in seconds.
          </p>
        </div>

        {/* New Invoice label */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            marginTop: 0,
          }}
        >
          📋 Select Company
        </p>

        {/* Company Cards */}
        {Object.values(COMPANIES).map((company) => {
          const isJas = company.id === 'jas_diamond';
          return (
            <button
              key={company.id}
              className={`company-card ${isJas ? 'jas' : 'jay'}`}
              onClick={() => navigate(`/invoice/create/${company.id}`)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <div className="company-card-icon">
                <RealisticDiamond color={isJas ? 'blue' : 'purple'} size={44} />
              </div>
              <div className="company-card-info" style={{ flex: 1, minWidth: 0 }}>
                <h2>{company.displayName}</h2>
                <p>{company.address.line1}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>
                  {company.gstin}
                </p>
              </div>
              <svg
                fill="none"
                stroke="#cbd5e1"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                style={{ width: 18, height: 18, flexShrink: 0 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}


      </div>
    </>
  );
}
