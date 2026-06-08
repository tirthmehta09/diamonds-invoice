// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { getSupabaseClient } from '../utils/supabaseClient';
import { useState, useEffect } from 'react';

const HomeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const HistoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PartiesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StorageIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const DiamondLogo = () => (
  <svg viewBox="0 0 512 512" width="26" height="26">
    <polygon fill="#bae6fd" points="32,192 96,192 160,80" />
    <polygon fill="#f0f9ff" points="96,192 256,192 256,80 160,80" />
    <polygon fill="#bae6fd" points="256,192 416,192 352,80 256,80" />
    <polygon fill="#7dd3fc" points="416,192 480,192 352,80" />
    <polygon fill="#0ea5e9" points="32,192 256,464 96,192" />
    <polygon fill="#38bdf8" points="96,192 256,464 256,192" />
    <polygon fill="#0284c7" points="256,192 256,464 416,192" />
    <polygon fill="#0369a1" points="416,192 256,464 480,192" />
  </svg>
);

export default function Sidebar() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      });
    }
  }, []);

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '?';

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <DiamondLogo />
        <div className="sidebar-brand-text">
          <h2>Diamond Invoice</h2>
          <span>GST Billing</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-menu">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <HomeIcon />
          <span>Home</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <HistoryIcon />
          <span>History</span>
        </NavLink>
        <NavLink to="/parties" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <PartiesIcon />
          <span>Parties</span>
        </NavLink>
        <NavLink to="/storage" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <StorageIcon />
          <span>Files</span>
        </NavLink>
      </nav>

      {/* Sidebar Footer / User + Logout */}
      <div className="sidebar-footer">
        {userEmail && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{initials}</div>
            <span className="sidebar-user-name">{userEmail}</span>
          </div>
        )}
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogoutIcon />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
