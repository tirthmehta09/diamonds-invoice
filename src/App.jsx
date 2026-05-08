// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import CreateInvoice from './pages/CreateInvoice.jsx';
import InvoiceHistory from './pages/InvoiceHistory.jsx';
import Parties from './pages/Parties.jsx';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/invoice/create');

  return (
    <ToastProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invoice/create/:companyId" element={<CreateInvoice />} />
          <Route path="/invoice/edit/:invoiceId" element={<CreateInvoice />} />
          <Route path="/history" element={<InvoiceHistory />} />
          <Route path="/parties" element={<Parties />} />
        </Routes>
        {!hideNav && <BottomNav />}
      </div>
    </ToastProvider>
  );
}
