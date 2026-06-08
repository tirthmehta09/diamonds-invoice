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
