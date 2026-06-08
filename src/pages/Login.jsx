// src/pages/Login.jsx
import { useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { useToast } from '../components/Toast.jsx';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  // Helper to map usernames or phone numbers to Supabase-required email format
  const getEmailFromIdentifier = (val) => {
    const cleaned = val.trim().toLowerCase();
    if (cleaned.includes('@')) {
      return cleaned;
    }
    // Remove all spaces for usernames, e.g. "Tirth Mehta" -> "tirthmehta"
    const username = cleaned.replace(/\s+/g, '');
    return `${username}@family.com`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Please enter your name, phone, or email', 'error');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter your password', 'error');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      showToast('Supabase is not configured. Please contact the administrator.', 'error');
      return;
    }

    setLoading(false);
    setLoading(true);

    const email = getEmailFromIdentifier(identifier);

    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password: password.trim(),
      });

      if (error) throw error;
      showToast('Logged in successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Check your password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: '#f1f5f9',
      padding: '20px 14px'
    }}>
      <div className="app-shell" style={{
        margin: '0 auto',
        padding: '30px 20px',
        borderRadius: 20,
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Title / Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 14px rgba(168,85,247,0.3)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
            Diamond Invoice
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Sign in to access your family's cloud database
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="field-label" style={{ color: '#475569', marginBottom: 5 }}>
              Username, Phone, or Email
            </label>
            <input
              className="field-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. Tirth Mehta or 9819185864"
              autoFocus
              style={{ fontSize: 15 }}
            />
          </div>

          <div>
            <label className="field-label" style={{ color: '#475569', marginBottom: 5 }}>
              Password
            </label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ fontSize: 15 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              minHeight: 46,
              background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 14.5,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(147,51,234,0.15)',
              marginTop: 6
            }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Log In'}
          </button>
        </form>

        {/* Helper Note */}
        <div style={{
          marginTop: 26,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '10px 12px',
          borderRadius: 10,
          fontSize: 11.5,
          color: '#64748b',
          lineHeight: 1.5
        }}>
          💡 <strong style={{ color: '#475569' }}>Family Admin Note:</strong> If your username contains spaces (like "Tirth Mehta"), the system will automatically log you in using the email format <code style={{ fontFamily: 'monospace' }}>tirthmehta@family.com</code>.
        </div>
      </div>
    </div>
  );
}
