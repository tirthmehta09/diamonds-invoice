// src/pages/Login.jsx
import { useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { useToast } from '../components/Toast.jsx';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Please enter your phone number or email', 'error');
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

    setLoading(true);
    const input = identifier.trim();

    try {
      let emailAddress = '';
      if (input.includes('@')) {
        emailAddress = input.toLowerCase();
      } else {
        // Clean up phone number input and map to a virtual email
        const cleaned = input.replace(/[^0-9]/g, ''); // Keep only digits
        emailAddress = `${cleaned}@jayjas.com`;
      }

      const { error } = await client.auth.signInWithPassword({
        email: emailAddress,
        password: password.trim(),
      });

      if (error) throw error;
      showToast('Logged in successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.12), transparent 50%), #f8fafc',
      padding: '16px 14px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '36px 28px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Title / Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            Diamond Invoice
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, margin: 0 }}>
            Sign in to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label" style={{ color: '#475569', marginBottom: 6 }}>
              Phone Number or Email
            </label>
            <input
              className="field-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your phone or email"
              autoComplete="username"
              autoFocus
              style={{ fontSize: 15 }}
            />
          </div>

          <div>
            <label className="field-label" style={{ color: '#475569', marginBottom: 6 }}>
              Password
            </label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{ fontSize: 15 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              minHeight: 48,
              background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(147,51,234,0.25)',
              marginTop: 4,
              borderRadius: 12,
            }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
