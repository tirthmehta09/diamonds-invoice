// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import CreateInvoice from './pages/CreateInvoice.jsx';
import InvoiceHistory from './pages/InvoiceHistory.jsx';
import Parties from './pages/Parties.jsx';
import Storage from './pages/Storage.jsx';
import Login from './pages/Login.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { getSupabaseClient } from './utils/supabaseClient';

export default function App() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session setup and auth state listener
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    // Get current session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Session absolute expiry (30 mins) & Inactivity timeout (5 mins)
  useEffect(() => {
    if (!session) {
      localStorage.removeItem('session_start_time');
      return;
    }

    // Absolute Expiry Setup
    let startTime = localStorage.getItem('session_start_time');
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem('session_start_time', startTime);
    }

    const absoluteLimit = 30 * 60 * 1000; // 30 minutes
    const checkSessionExpiry = () => {
      const start = parseInt(localStorage.getItem('session_start_time') || '0', 10);
      if (start > 0 && Date.now() - start >= absoluteLimit) {
        handleAutoLogout('Session expired after 30 minutes.');
      }
    };

    // Idle Inactivity Setup
    const idleLimit = 5 * 60 * 1000; // 5 minutes
    let lastActivity = Date.now();

    const checkIdle = () => {
      if (Date.now() - lastActivity >= idleLimit) {
        handleAutoLogout('Logged out due to 5 minutes of inactivity.');
      }
    };

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const handleAutoLogout = async (message) => {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
        localStorage.removeItem('session_start_time');
        alert(message);
      }
    };

    // Listen to all interaction events on the window
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Run interval checks every 5 seconds
    const intervalId = setInterval(() => {
      checkSessionExpiry();
      checkIdle();
    }, 5000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [session]);

  const hideNav = location.pathname.startsWith('/invoice/create') || location.pathname.startsWith('/invoice/edit');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f8fafc' }}>
        <div className="spinner" />
      </div>
    );
  }

  // If there is no authenticated session, render the Login screen
  if (!session) {
    return (
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invoice/create/:companyId" element={<CreateInvoice />} />
          <Route path="/invoice/edit/:invoiceId" element={<CreateInvoice />} />
          <Route path="/history" element={<InvoiceHistory />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/storage" element={<Storage />} />
        </Routes>
        {!hideNav && <BottomNav />}
      </div>
    </ToastProvider>
  );
}
