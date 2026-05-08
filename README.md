# 💎 Diamond Invoice

A Progressive Web App (PWA) specifically built for the diamond trading industry to instantly generate pixel-perfect GST-compliant invoices.

## Features
- **Offline Capable:** Full PWA support. Works seamlessly without an internet connection in trading environments.
- **Pixel-Perfect PDF Generation:** Generates absolute-positioned PDFs that map identically to legacy Excel-based templates.
- **Party Auto-Save:** Automatically saves buyer details and GSTINs to a local database for lightning-fast repeat invoicing.
- **Real-Time Calculations:** Auto-calculates total CTS, subtotals, IGST, and dynamically translates grand totals into English words.
- **Multi-Company Support:** Built-in profiles for multiple trading entities (e.g., JAS DIAMOND, JAY GEMS) with dedicated billing and bank details.
- **Minimalist UI:** Responsive, clean, and professional interface utilizing 3D faceted diamond SVGs and modern light-theme layouts.

## Tech Stack
- **React 19** (via Vite)
- **Tailwind v4** (for rapid styling)
- **jsPDF** (for client-side precise PDF generation)
- **LocalForage** (IndexedDB for offline state persistence)
- **Vite PWA Plugin** (for service worker caching)

## Local Development

```bash
# Install dependencies
npm install

# Start the local development server
npm run dev

# Build for production
npm run build
```

## Deployment
This project is configured to be deployed easily to any static hosting provider like **Vercel** or **Netlify**. Upon deployment, the service worker will automatically register, enabling users to "Add to Home Screen" on mobile devices.

---
*Created by [tirthmehta09](https://github.com/tirthmehta09).*
