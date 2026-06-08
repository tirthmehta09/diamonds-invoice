// src/utils/pdfGenerator.js
// Coordinates extracted via PyMuPDF from 03-OM-2025-26.pdf (reference)
// Page: US Letter 215.9 x 279.4mm
// All measurements in mm, verified against reference text positions.

import { jsPDF } from 'jspdf';
import { formatIndianNumber, formatCts, calcTotals, parseNumber } from './calculations';
import { amountInWords } from './amountInWords';
import { formatDate } from './dateHelpers';
import {
  TC_CLAUSES, GST_CERTIFICATION, OFAC_DECLARATION,
  KIMBERLEY_DECLARATION, NATURAL_ORIGIN_HEADER,
  NATURAL_ORIGIN_BODY, NATURAL_ORIGIN_GUARANTEE,
} from '../config/companies';

// ── Page (US Letter, matching reference) ─────────────────────────────────────
const PW  = 215.9;
const PH  = 279.4;
const IW  = 190.5;   // keep content width same
const ML  = (PW - IW) / 2;   // 12.7 (Centered)
const MR  = ML;      // 12.7

// ── Column x-positions (verified from reference) ─────────────────────────────
const C_SR   = 13.5;
const C_DESC = 57;
const C_CTS  = 20;
const C_RATE = 61;
const C_AMT  = 39;
// Total = 13.5+57+20+61+39 = 190.5 = IW ✓

const X_SR   = ML;                           // 6.5
const X_DESC = X_SR   + C_SR;               // 20
const X_CTS  = X_DESC + C_DESC;             // 77
const X_RATE = X_CTS  + C_CTS;              // 97
const X_AMT  = X_RATE + C_RATE;             // 158
const X_R    = X_AMT  + C_AMT;              // 197 (right content edge)

// ── Sold-to column splits (from reference x-coordinates) ─────────────────────
const META_X = X_RATE;                       // 97mm
const META_W = X_R - META_X;                // 100mm
const META_HC = C_RATE;                      // 61mm (Aligns with RATE column)
const META_DX = X_AMT;                      // 158mm (Aligns with AMOUNT column)
const META_DW = C_AMT;                      // 39mm

// ── Line widths ───────────────────────────────────────────────────────────────
const LW_THICK  = 0.5;
const LW_NORMAL = 0.25;

// ── Helpers ───────────────────────────────────────────────────────────────────
const sf  = (doc, sz, bold = false) =>
  doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(sz);

const bx  = (doc, x, y, w, h, lw = LW_NORMAL) =>
  (doc.setLineWidth(lw), doc.rect(x, y, w, h));

const hl  = (doc, x1, y, x2, lw = LW_NORMAL) =>
  (doc.setLineWidth(lw), doc.line(x1, y, x2, y));

const vl  = (doc, x, y1, y2, lw = LW_NORMAL) =>
  (doc.setLineWidth(lw), doc.line(x, y1, x, y2));

const P   = 1.5;  // text padding inside cells

const tL  = (doc, t, x, y, sz, bold = false) =>
  (sf(doc, sz, bold), doc.text(String(t ?? ''), x + P, y));

const tR  = (doc, t, x, w, y, sz, bold = false) =>
  (sf(doc, sz, bold), doc.text(String(t ?? ''), x + w - P, y, { align: 'right' }));

const tC  = (doc, t, x, w, y, sz, bold = false) =>
  (sf(doc, sz, bold), doc.text(String(t ?? ''), x + w / 2, y, { align: 'center' }));

// ── Main generator ────────────────────────────────────────────────────────────
export function generateInvoicePDF(invoice, company) {
  const doc = new jsPDF({ unit: 'mm', format: [PW, PH], orientation: 'portrait' });

  const igstRate = invoice.totals?.igstRate !== undefined 
    ? invoice.totals.igstRate 
    : (invoice.igstRate !== undefined ? invoice.igstRate : company.igstRate);

  const { totalCts, subtotal, igstAmount, grandTotal } =
    calcTotals(invoice.items, igstRate);

  // ═══════════════════════════════════════════════════════════════════
  // 1. HEADER  (y ≈ 23–44mm, verified from reference)
  // ═══════════════════════════════════════════════════════════════════
  // Company name — sz=30, centered, custom color & font
  doc.setTextColor(company.color || '#000000');
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.text(company.displayName, PW / 2, 23, { align: 'center' });

  // Reset to default black & helvetica for rest of doc
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'normal');

  // Address centered + MOB right-aligned — same line y=35.9
  const addrStr = `${company.address.line1} ${company.address.line2} ${company.address.line3}`;
  sf(doc, 9.1); doc.text(addrStr, PW / 2, 36, { align: 'center' });
  tR(doc, company.mobile, ML, IW, 36, 9.1);

  // TAX INVOICE — bold, centered y=43.6
  sf(doc, 9.8, true);
  doc.text('TAX INVOICE', PW / 2, 44, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════
  // 2. SOLD-TO / META GRID  (rows at verified y-positions)
  // Layout: left buyer col | mid label col | right date col
  // ═══════════════════════════════════════════════════════════════════
  const GY = 48;  // top of the sold-to grid box
  const SOLD_H = 45;
  const SOLD_BOT = GY + SOLD_H;  // 93

  // Outer box + Vertical divider: buyer | meta
  bx(doc, ML, GY, IW, SOLD_H, LW_THICK);
  vl(doc, META_X, GY, SOLD_BOT, LW_THICK);

  // Row 1 horizontal (Invoice/Date)
  const R1Y = GY;  const R1H = 7.5;
  hl(doc, META_X, R1Y + R1H, X_R, LW_THICK);
  vl(doc, META_DX, R1Y, R1Y + R1H, LW_THICK);

  // Row 2 horizontal (Dispatch/Date)
  const R2Y = R1Y + R1H; const R2H = 8;
  hl(doc, META_X, R2Y + R2H, X_R, LW_THICK);
  vl(doc, META_DX, R2Y, R2Y + R2H, LW_THICK);

  // Row 3 horizontal (Terms)
  const R3Y = R2Y + R2H; const R3H = 9;
  hl(doc, META_X, R3Y + R3H, X_R, LW_THICK);

  // Row 4 (HSN / MH-27)
  const R4Y = R3Y + R3H; const R4H = SOLD_H - (R1H + R2H + R3H);
  vl(doc, META_DX, R4Y, SOLD_BOT, LW_THICK);

  // ── SOLD TO content ───────────────────────────────────────────────
  sf(doc, 9.1, false);
  const soldToText = 'SOLD TO, ';
  const stWidth = doc.getTextWidth(soldToText);
  tL(doc, soldToText, ML, GY + 5.5, 9.1, false);
  tL(doc, invoice.buyer.name, ML + stWidth, GY + 5.5, 9.1, true);

  let addrY = GY + 10.5;
  for (const ln of (invoice.buyer.addressLines || [])) {
    if (ln.trim()) { tL(doc, ln, ML + stWidth, addrY, 8.5); addrY += 4.2; }
  }
  tL(doc, `GSTIN: ${invoice.buyer.gstin || ''}`, ML, SOLD_BOT - 2, 9.1);

  // ── Meta row 1: Invoice No | Date ────────────────────────────────
  tL(doc, `INVOICE NO:${invoice.invoiceNo}`, META_X, R1Y + R1H - 2.5, 8.5);
  tL(doc, `DATE:${formatDate(invoice.invoiceDate)}`, META_DX, R1Y + R1H - 2.5, 8.5);

  // ── Meta row 2: Dispatch Detail | Date ───────────────────────────
  tL(doc, `DISPATCH DETAIL-${invoice.dispatchMode}`, META_X, R2Y + R2H - 2.5, 8.5);
  tL(doc, `DATE:${formatDate(invoice.dispatchDate)}`, META_DX, R2Y + R2H - 2.5, 8.5);

  // ── Meta row 3: TERMS (centered) ─────────────────────────────────
  tC(doc, `TERMS- ${invoice.terms}`, META_X, META_W, R3Y + R3H - 2.5, 8.5, true);

  // ── Meta row 4: HSN CODE | MH-27 ─────────────────────────────────
  tC(doc, `HSN CODE ${invoice.hsnCode || company.defaultHsnCode}`,
    META_X, META_HC, R4Y + R4H / 2 + 1.5, 8.5, true);
  tC(doc, company.stateCode, META_DX, META_DW, R4Y + R4H / 2 + 1.5, 8.5, true);

  // ═══════════════════════════════════════════════════════════════════
  // 3. ITEMS TABLE  (starts y=SOLD_BOT=93, header height=10mm)
  // ═══════════════════════════════════════════════════════════════════
  let y = SOLD_BOT;
  const TH_H = 10;

  bx(doc, ML, y, IW, TH_H, LW_THICK);
  vl(doc, X_DESC, y, y + TH_H, LW_THICK);
  vl(doc, X_CTS,  y, y + TH_H, LW_THICK);
  vl(doc, X_RATE, y, y + TH_H, LW_THICK);
  vl(doc, X_AMT,  y, y + TH_H, LW_THICK);

  const hm = y + TH_H / 2;
  tC(doc, 'Sr.',         X_SR,   C_SR,   hm - 1.5, 8.4, true);
  tC(doc, 'No.',         X_SR,   C_SR,   hm + 2.5, 8.4, true);
  tC(doc, 'DESCRIPTION', X_DESC, C_DESC, hm + 1,   8.4, true);
  tC(doc, 'WEIGHT',      X_CTS,  C_CTS,  hm - 1.5, 8.4, true);
  tC(doc, 'CTS',         X_CTS,  C_CTS,  hm + 2.5, 8.4, true);
  tC(doc, 'RATE PER',    X_RATE, C_RATE, hm - 1.5, 8.4, true);
  tC(doc, 'CTS',         X_RATE, C_RATE, hm + 2.5, 8.4, true);
  tC(doc, 'AMOUNT',      X_AMT,  C_AMT,  hm - 1.5, 8.4, true);
  tC(doc, 'Rs.',         X_AMT,  C_AMT,  hm + 2.5, 8.4, true);

  y += TH_H;

  // ── Item rows
  const ROW_H  = 7;
  const N_ROWS = Math.max(invoice.items.length, 6);

  // Draw continuous vertical lines for table body
  const bodyH = N_ROWS * ROW_H;
  bx(doc, ML, y, IW, bodyH, LW_THICK); // Outer box
  vl(doc, X_DESC, y, y + bodyH, LW_THICK);
  vl(doc, X_CTS,  y, y + bodyH, LW_THICK);
  vl(doc, X_RATE, y, y + bodyH, LW_THICK);
  vl(doc, X_AMT,  y, y + bodyH, LW_THICK);

  for (let i = 0; i < N_ROWS; i++) {
    const item = invoice.items[i];
    if (item) {
      const cts  = parseNumber(item.cts);
      const rate = parseNumber(String(item.rate).replace(/,/g, ''));
      const amt  = Math.round(cts * rate);
      const ty   = y + ROW_H / 2 + 1.8;

      tC(doc, String(i + 1),                        X_SR,   C_SR,   ty, 8.4, true);
      tL(doc, item.description || '',               X_DESC, ty, 8.4, true);
      tC(doc, cts  > 0 ? formatCts(cts)           : '', X_CTS,  C_CTS,  ty, 8.4);
      tR(doc, rate > 0 ? formatIndianNumber(rate)  : '', X_RATE, C_RATE, ty, 8.4);
      tR(doc, amt  > 0 ? formatIndianNumber(amt)   : '', X_AMT,  C_AMT,  ty, 8.4);
    }
    y += ROW_H;
  }

  // ── TOTAL CTS row ─────────────────────────────────────────────────
  const TOT_H = 7;
  bx(doc, ML, y, IW, TOT_H, LW_THICK); // Outer box for total
  vl(doc, X_CTS,  y, y + TOT_H, LW_THICK); // Divider before CTS
  vl(doc, X_RATE, y, y + TOT_H, LW_THICK); // Divider before RATE
  vl(doc, X_AMT,  y, y + TOT_H, LW_THICK); // Divider before AMOUNT

  const ty = y + TOT_H / 2 + 1.8;
  tC(doc, 'TOTAL CTS',                  X_SR,   C_SR + C_DESC, ty, 8.4, true);
  tC(doc, formatCts(totalCts),          X_CTS,  C_CTS,         ty, 8.4, true);
  tC(doc, 'TOTAL',                      X_RATE, C_RATE,        ty, 8.4, true);
  tR(doc, formatIndianNumber(subtotal), X_AMT,  C_AMT,         ty, 8.4, true);

  y += TOT_H;  

  // ═══════════════════════════════════════════════════════════════════
  // 4. T&C (left) + IGST / GRAND TOTAL (right, overlapping T&C band)
  // ═══════════════════════════════════════════════════════════════════
  let tcTextHeight = 4.5;
  for (const clause of TC_CLAUSES) {
    const text = clause.replace('{CITY}', invoice.deliveryCity || 'MUMBAI');
    const wrapped = doc.splitTextToSize(text, X_RATE - ML - P*2);
    tcTextHeight += wrapped.length * 3.7;
  }
  
  const GRAND_H = 6;
  const IGST_H = 5.5;
  const MIN_TC_H = tcTextHeight + 2;
  const tcHeight = Math.max(MIN_TC_H, 25); 

  // T&C outer box
  bx(doc, ML, y, X_RATE - ML, tcHeight, LW_THICK);
  
  // Right side empty space (above IGST/Grand Total) - Split for IGST amount
  bx(doc, X_RATE, y, C_RATE, tcHeight - GRAND_H, LW_THICK);
  bx(doc, X_AMT,  y, C_AMT,  tcHeight - GRAND_H, LW_THICK);
  
  // Right side GRAND TOTAL box - SINGLE BOX
  bx(doc, X_RATE, y + tcHeight - GRAND_H, C_RATE + C_AMT, GRAND_H, LW_THICK);
  
  // --- T&C Text ---
  tL(doc, 'TERMS & CONDITION', ML, y + 4, 8.4, true);
  let tcY = y + 8.5;
  for (const clause of TC_CLAUSES) {
    const text = clause.replace('{CITY}', invoice.deliveryCity || 'MUMBAI');
    sf(doc, 6.7);
    const wrapped = doc.splitTextToSize(text, X_RATE - ML - P*2);
    doc.text(wrapped, ML + P, tcY);
    tcY += wrapped.length * 3.7;
  }
  
  // --- IGST Text ---
  const igstY = y + tcHeight - GRAND_H;
  tC(doc, `IGST-${(igstRate * 100).toFixed(2)}%`, X_RATE, C_RATE, igstY - 1.5, 8.4, true);
  tR(doc, formatIndianNumber(igstAmount), X_AMT, C_AMT, igstY - 1.5, 8.4);
  
  // --- GRAND TOTAL Text ---
  tC(doc, 'GRAND TOTAL', X_RATE, C_RATE, y + tcHeight - 1.5, 9.8, true);
  tR(doc, `${formatIndianNumber(grandTotal)}.00`, X_RATE, C_RATE + C_AMT, y + tcHeight - 1.5, 8.4, true);
  
  y += tcHeight;

  // ═══════════════════════════════════════════════════════════════════
  // 5. AMOUNT IN WORDS  (full width bordered row)
  // ═══════════════════════════════════════════════════════════════════
  const words   = amountInWords(grandTotal);
  const AMT_BOX_H = 6;
  bx(doc, ML, y, IW, AMT_BOX_H, LW_THICK);
  tL(doc, words, ML, y + AMT_BOX_H - 1.5, 8.4, true);
  y += AMT_BOX_H;

  // ═══════════════════════════════════════════════════════════════════
  // 6. BANK DETAILS  (Combined box for Bank Info)
  // ═══════════════════════════════════════════════════════════════════
  bx(doc, ML, y, IW, 12, LW_THICK);
  
  // Row 1: PLEASE REMIT...
  sf(doc, 7.4); doc.text('PLEASE REMIT PROCEEDS TO:', ML + P, y + 4.5);
  sf(doc, 8.4, true); 
  doc.text(` ${company.bank.name},${company.bank.branch}`, ML + P + doc.getTextWidth('PLEASE REMIT PROCEEDS TO: '), y + 4.5);
  
  // Row 2: CURRENT A/C NO... (Underlined)
  const accText = `CURRENT A/C NO-${company.bank.accountNo}.  IFSC CODE -${company.bank.ifsc}`;
  tL(doc, accText, ML, y + 10, 8.4, true);
  
  // Draw underline
  const accW = doc.getTextWidth(accText);
  doc.setLineWidth(LW_NORMAL);
  doc.line(ML + P, y + 10.8, ML + P + accW, y + 10.8);
  
  y += 12;

  // Row 3: GSTIN... PAN NO...
  bx(doc, ML, y, IW, 6, LW_THICK);
  tL(doc, `GSTIN-${company.gstin}`, ML, y + 4.5, 8.4, true);
  tR(doc, `PAN NO-${company.pan}`, ML, IW, y + 4.5, 8.4, true);
  y += 6;

  // ═══════════════════════════════════════════════════════════════════
  // 7-10. DECLARATIONS  (sz=6.7, bordered rows)
  // ═══════════════════════════════════════════════════════════════════
  const drawParaBox = (text, bold = false, sz = 6.7) => {
    sf(doc, sz, bold);
    const w = doc.splitTextToSize(text, IW - P*2);
    const boxHeight = w.length * 3.1 + 2; 
    bx(doc, ML, y, IW, boxHeight, LW_THICK);
    doc.text(w, ML + P, y + 2.5);
    y += boxHeight;
  };

  drawParaBox(GST_CERTIFICATION, true, 6.7);
  drawParaBox(OFAC_DECLARATION, false, 6.7);
  drawParaBox(KIMBERLEY_DECLARATION, false, 6.7);
  
  // Natural origin header + body inside ONE box
  sf(doc, 6.7, true);
  const noHeaderHeight = 3.5;
  sf(doc, 6.7, false);
  const nobW = doc.splitTextToSize(NATURAL_ORIGIN_BODY, IW - P*2);
  const noBoxHeight = noHeaderHeight + nobW.length * 3.1 + 2;
  
  bx(doc, ML, y, IW, noBoxHeight, LW_THICK);
  sf(doc, 6.7, true);
  doc.text(NATURAL_ORIGIN_HEADER, ML + P, y + 2.5);
  sf(doc, 6.7, false);
  doc.text(nobW, ML + P, y + 2.5 + noHeaderHeight);
  y += noBoxHeight;

  // ═══════════════════════════════════════════════════════════════════
  // 11. NATURAL ORIGIN GUARANTEE + STAMP & SIGNATURE (Full width box)
  // ═══════════════════════════════════════════════════════════════════
  const sigH = 22;
  bx(doc, ML, y, IW, sigH, LW_THICK); // Outer box
  vl(doc, X_AMT, y, y + sigH, LW_THICK); // Vertical divider for stamp/signatory
  
  // Left side: Guarantee + Stamp Purchaser
  sf(doc, 8.4);
  const nogW = doc.splitTextToSize(NATURAL_ORIGIN_GUARANTEE, X_AMT - ML - P*2);
  doc.text(nogW, ML + P, y + 3.5);
  tL(doc, 'STAMP AND SIGNATURE OF PURCHASER', ML, y + sigH - 1.5, 8.4, false);
  
  // Right side: For Company + Proprietor
  tR(doc, company.signatory, X_AMT, C_AMT, y + 3.5, 8.4, true);
  tR(doc, 'PROPRIETOR', X_AMT, C_AMT, y + sigH - 1.5, 8.4, true);

  return doc.output('blob');
}

// ── Download ──────────────────────────────────────────────────────────────────
export function downloadInvoicePDF(invoice, company, customFilename) {
  const blob = generateInvoicePDF(invoice, company);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  
  if (customFilename) {
    a.download = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
  } else {
    const no    = (invoice.invoiceNo || 'INV').replace(/\//g, '-');
    const buyer = (invoice.buyer?.name || 'buyer').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    a.download  = `${no}-${buyer}.pdf`;
  }
  
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Share (Web Share API → fallback open in tab) ───────────────────────────────
export async function shareInvoicePDF(invoice, company, customFilename) {
  const blob     = generateInvoicePDF(invoice, company);
  let fileName = '';
  
  if (customFilename) {
    fileName = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
  } else {
    const no       = (invoice.invoiceNo || 'INV').replace(/\//g, '-');
    fileName = `Invoice-${no}.pdf`;
  }
  
  const file     = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Invoice ${invoice.invoiceNo}` });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') downloadInvoicePDF(invoice, company, customFilename);
      return false;
    }
  } else {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return false;
  }
}
