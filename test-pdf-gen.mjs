// test-pdf-gen.mjs  — run with: node test-pdf-gen.mjs
// Uses the actual pdfGenerator logic ported to standalone Node + jsdom
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';

// Setup jsdom globals that jsPDF needs
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window       = dom.window;
global.document     = dom.window.document;

global.Blob         = dom.window.Blob || (await import('buffer')).Blob;
global.URL          = dom.window.URL;

// Polyfill URL.createObjectURL
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = (blob) => 'blob:test';
}

// Import jsPDF after globals are set
const { jsPDF } = await import('jspdf');

// ─── Inline data (from companies.js & calculations.js) ────────────────────────

const company = {
  displayName: 'JAS DIAMOND',
  address: { line1: 'B-403,RUGHANI PALACE-1.,', line2: 'S.N.ROAD,KANDIVALI-WEST,', line3: 'MUMBAI-67' },
  mobile: 'MOB:9820685864',
  gstin: '27ADYPM9225E1Z0',
  pan: 'ADYPM9225E',
  stateCode: 'MH-27',
  bank: { name: 'THE SARASWAT CO-OP BANK LTD', branch: 'KANDIVALI WEST,MUMBAI-67', accountNo: '014100100204467', ifsc: 'SRCB0000014' },
  defaultHsnCode: '71049120',
  igstRate: 0.015,
  signatory: 'FOR JAS DIAMOND',
};

const TC_CLAUSES = [
  '1.GOODS SOLD SHALL NOT BE TAKEN BACK OR EXCHANGED',
  '2.GOODS SOLD AND DELIVERY AT MUMBAI',
  '3.SUBJECT TO MUMBAI JURISDICATION',
  '4.ALL FIGURES ARE ROUNDED OF TO NEAREST RUPEE',
  '5.INTEREST AT 18% PER YEAR WILL BE CHARGED ON ALL A/C REMAINING UNPAID AFTER DUE DATE.',
  '6.E&OE',
];

const GST_CERTIFICATION = 'We hereby certify that our registration certificate under Central/State Goods and Service tax act ,2017 is in force on the date on which the issue of goods specified in this tax invoice is made by us and that transaction of sale covered by this tax invvoice has been effected by us and it shall be accounted for in the turnover of sale while filing of return and the due tax,if any, payable on the sale has been paid or shall be paid';
const OFAC_DECLARATION = "To the best of our knowledge and/or written assurances from our Suppliers, we state that \u2018Diamonds herein invoiced have not been obtained in violation of applicable National laws and/or sanctions by the U.S. Department of Treasury\u2019s office of Foreign Assets Control (OFAC) and have not originated from the Mbada and Marange Resources of Zimbabwe\u2019.";
const KIMBERLEY_DECLARATION = 'The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and in compliance with The United Nations resolutions.The seller hereby states that these diamonds are conflict free,based on personal knowledge and/or written guarantees provided by the supplier of these.';
const NATURAL_ORIGIN_HEADER = 'DECLARATION OF GOODS BEING OF NATURAL ORIGIN';
const NATURAL_ORIGIN_BODY = '"THE DIAMONDS HEREIN INVOICED ARE EXCLISIVELY OF NATURAL ORIGIN  AND UNTREATED BASED ON PERSONAL KNOWLEDGE AND OR WRITTEN GUARANTEE PROVIDED BY THE SUPPLIER OF THESE DIAMONDS "THE ACCEPTANCE  OF GOODS HERE IN INVOICED WILL AS PER THE WFDB GUIDELINE"';
const NATURAL_ORIGIN_GUARANTEE = 'The seller hereby guarantees that the diamonds herein invoiced are exclusively of natural origin, formed and grown under naatural and geological processes,based on persional knowledge and/or written guarantees provided by the supplier of these.';

const invoice = {
  invoiceNo: '03/2026-27',
  invoiceDate: '2026-04-30',
  dispatchDate: '2026-04-30',
  dispatchMode: 'HAND DELIVERY',
  terms: 'COD',
  hsnCode: '71049120',
  deliveryCity: 'MUMBAI',
  buyer: {
    name: 'M/S OM JEWELS LUXURY PRIVATE LIMITED',
    addressLines: ['2ND FLOOR,PLOT NO C AND D R.S.NO.432', 'C.J.HOUSE,OPP.ZENITEX MILL,', 'NEAR TORRENT POWER,', 'VASTA DEVDI ROAD,KATARGAM,', 'SURAT-395004'],
    gstin: '24AAFCO0528D1ZY',
  },
  items: [{ description: 'LAB GROWN CUT&POLISH DIAMOND', cts: 8.13, rate: 10900 }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatIndian = (n) => {
  if (!n) return '0';
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
};
const formatCts = (n) => Number(n).toFixed(2);
const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const subtotal = Math.round(8.13 * 10900);
const igst     = Math.round(subtotal * 0.015);
const grand    = subtotal + igst;
const totalCts = 8.13;

// Amount in words (simplified)
const words = 'EIGHTY NINE THOUSAND NINE HUNDRED FORTY SIX ONLY';

// ─── Page geometry ────────────────────────────────────────────────────────────
const ML = 12, MT = 10, PW = 210, MR = 12;
const IW = PW - ML - MR;

const C_SR = 12, C_DESC = 76, C_CTS = 26, C_RATE = 34, C_AMT = 38;
const X_SR = ML, X_DESC = ML+C_SR, X_CTS = ML+C_SR+C_DESC, X_RATE = ML+C_SR+C_DESC+C_CTS, X_AMT = ML+C_SR+C_DESC+C_CTS+C_RATE;

const LW_THICK = 0.6, LW_NORMAL = 0.3, LW_THIN = 0.2;
const PAD = 1.8;

// ─── Generate PDF ─────────────────────────────────────────────────────────────
const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

const sf = (size, bold=false) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); };
const bx = (x,y,w,h,lw=LW_NORMAL) => { doc.setLineWidth(lw); doc.rect(x,y,w,h); };
const hl = (x1,y,x2,lw=LW_NORMAL) => { doc.setLineWidth(lw); doc.line(x1,y,x2,y); };
const tL = (text,x,y,size,bold=false) => { sf(size,bold); doc.text(String(text??''),x+PAD,y); };
const tR = (text,x,w,y,size,bold=false) => { sf(size,bold); doc.text(String(text??''),x+w-PAD,y,{align:'right'}); };
const tC = (text,x,w,y,size,bold=false) => { sf(size,bold); doc.text(String(text??''),x+w/2,y,{align:'center'}); };

let y = MT;

// 1. HEADER
sf(22, true);
doc.text(company.displayName, PW/2, y+8, {align:'center'});
y += 12;

const addrStr = `${company.address.line1} ${company.address.line2} ${company.address.line3}`;
sf(8.5);
doc.text(addrStr, PW/2, y, {align:'center'});
tR(company.mobile, ML, IW, y, 8.5);
y += 6;

sf(11, true);
doc.text('TAX INVOICE', PW/2, y, {align:'center'});
y += 5;

// 2. SOLD TO / META GRID
const BUY_W = 115, META_W = IW - 115, META_X = ML + 115, META_HC = (IW-115)/2;
const R1H=7, R2H=7, R3H=7, R4H=8, TOTAL_META_H = 29;

bx(ML, y, BUY_W, TOTAL_META_H);
tL('SOLD TO,', ML, y+4.5, 8.5, true);
tL(invoice.buyer.name, ML, y+9, 8.5, true);
let addrY = y+13.5;
for (const ln of invoice.buyer.addressLines) { tL(ln, ML, addrY, 8); addrY += 3.8; }
tL(`GSTIN: ${invoice.buyer.gstin}`, ML, y+TOTAL_META_H-2, 8.5);

let ry = y;
bx(META_X, ry, META_HC, R1H);
bx(META_X+META_HC, ry, META_W-META_HC, R1H);
tL(`INVOICE NO:${invoice.invoiceNo}`, META_X, ry+R1H-2, 8);
tL(`DATE:${formatDate(invoice.invoiceDate)}`, META_X+META_HC, ry+R1H-2, 8);
ry += R1H;

bx(META_X, ry, META_HC, R2H);
bx(META_X+META_HC, ry, META_W-META_HC, R2H);
tL(`DISPATCH DETAIL-${invoice.dispatchMode}`, META_X, ry+R2H-2, 7.5);
tL(`DATE:${formatDate(invoice.dispatchDate)}`, META_X+META_HC, ry+R2H-2, 8);
ry += R2H;

bx(META_X, ry, META_W, R3H);
tC(`TERMS-${invoice.terms}`, META_X, META_W, ry+R3H-2, 8.5, true);
ry += R3H;

bx(META_X, ry, META_HC, R4H);
bx(META_X+META_HC, ry, META_W-META_HC, R4H);
tC(`HSN CODE ${invoice.hsnCode}`, META_X, META_HC, ry+R4H/2+0.5, 8.5, true);
tC(company.stateCode, META_X+META_HC, META_W-META_HC, ry+R4H/2+0.5, 8.5, true);

y += TOTAL_META_H;

// 3. ITEMS TABLE HEADER
const TH_H=9, ROW_H=7, MIN_ROWS=6;
bx(X_SR,y,C_SR,TH_H); bx(X_DESC,y,C_DESC,TH_H); bx(X_CTS,y,C_CTS,TH_H); bx(X_RATE,y,C_RATE,TH_H); bx(X_AMT,y,C_AMT,TH_H);
const thMid = y+TH_H/2;
tC('Sr.', X_SR,C_SR,thMid-1.5,8.5,true); tC('No.',X_SR,C_SR,thMid+2.5,8.5,true);
tC('DESCRIPTION',X_DESC,C_DESC,thMid+1,8.5,true);
tC('WEIGHT',X_CTS,C_CTS,thMid-1.5,8.5,true); tC('CTS',X_CTS,C_CTS,thMid+2.5,8.5,true);
tC('RATE PER',X_RATE,C_RATE,thMid-1.5,8.5,true); tC('CTS Rs.',X_RATE,C_RATE,thMid+2.5,8.5,true);
tC('AMOUNT',X_AMT,C_AMT,thMid-1.5,8.5,true); tC('Rs.',X_AMT,C_AMT,thMid+2.5,8.5,true);
y += TH_H;

// 4. ITEM ROWS
for (let i=0; i<MIN_ROWS; i++) {
  const item = invoice.items[i];
  const rowTY = y+ROW_H/2+1.8;
  bx(X_SR,y,C_SR,ROW_H); bx(X_DESC,y,C_DESC,ROW_H); bx(X_CTS,y,C_CTS,ROW_H); bx(X_RATE,y,C_RATE,ROW_H); bx(X_AMT,y,C_AMT,ROW_H);
  if (item) {
    const amt = Math.round(item.cts * item.rate);
    tC(String(i+1), X_SR,C_SR,rowTY,8.5);
    tL(item.description, X_DESC,rowTY,8.5);
    tC(formatCts(item.cts), X_CTS,C_CTS,rowTY,8.5);
    tR(formatIndian(item.rate), X_RATE,C_RATE,rowTY,8.5);
    tR(formatIndian(amt), X_AMT,C_AMT,rowTY,8.5);
  }
  y += ROW_H;
}

// 5. TOTALS ROW
const totH=7, totTY=y+totH/2+1.8;
bx(X_SR,y,C_SR,totH); bx(X_DESC,y,C_DESC,totH); bx(X_CTS,y,C_CTS,totH); bx(X_RATE,y,C_RATE,totH); bx(X_AMT,y,C_AMT,totH);
tC('TOTAL CTS',X_SR,C_SR+C_DESC,totTY,8.5,true);
tC(formatCts(totalCts),X_CTS,C_CTS,totTY,8.5,true);
tC('TOTAL',X_RATE,C_RATE,totTY,8.5,true);
tR(formatIndian(subtotal),X_AMT,C_AMT,totTY,8.5,true);
y += totH;

// 6. T&C + IGST/GRAND TOTAL
const tcStartY = y;
const TC_W = C_SR + C_DESC;

tL('TERMS & CONDITION', ML, y+4.5, 8, true);
let tcY = y+8.5;
sf(7.5);
for (const clause of TC_CLAUSES) {
  const wrapped = doc.splitTextToSize(clause, TC_W-2);
  doc.text(wrapped, ML+PAD, tcY);
  tcY += wrapped.length * 3.6;
}
const tcEndY = tcY + 2;

const igstY  = tcStartY + (tcEndY-tcStartY)*0.55;
const grandY = tcStartY + (tcEndY-tcStartY)*0.85;
const igst_h=6, grand_h=6.5;

bx(X_CTS,igstY,C_CTS+C_RATE,igst_h); bx(X_AMT,igstY,C_AMT,igst_h);
tL(`IGST-1.50%`, X_CTS,igstY+igst_h-2,8.5,true);
tR(formatIndian(igst), X_AMT,C_AMT,igstY+igst_h-2,8.5);

bx(X_CTS,grandY,C_CTS+C_RATE,grand_h,LW_THICK); bx(X_AMT,grandY,C_AMT,grand_h,LW_THICK);
tL('GRAND TOTAL', X_CTS,grandY+grand_h-2,9,true);
tR(formatIndian(grand)+'.00', X_AMT,C_AMT,grandY+grand_h-2,9,true);

y = tcEndY;

// 7. AMOUNT IN WORDS
const WORDS_H=7;
bx(ML,y,IW,WORDS_H);
tL(words, ML,y+WORDS_H-2,8.5,true);
y += WORDS_H;

// 8. BANK DETAILS
y += 2; hl(ML,y,ML+IW,LW_THIN); y += 3;
sf(8.5); doc.text('PLEASE REMIT PROCEEDS TO:  ', ML+PAD, y);
sf(8.5,true); doc.text(`${company.bank.name},${company.bank.branch}`, ML+PAD+doc.getTextWidth('PLEASE REMIT PROCEEDS TO:  '), y);
y += 4; hl(ML,y,ML+IW,LW_THIN); y += 3;
sf(8.5,true); doc.text(`CURRENT A/C NO-${company.bank.accountNo}.  IFSC CODE -${company.bank.ifsc}`, ML+PAD, y);
y += 4; hl(ML,y,ML+IW,LW_THIN); y += 3;
sf(8); doc.text(`GSTIN-${company.gstin}`, ML+PAD, y);
tC(`PAN NO-${company.pan}`, ML, IW, y, 8);
y += 4; hl(ML,y,ML+IW,LW_THIN); y += 3;

// 9-11. DECLARATIONS
for (const para of [GST_CERTIFICATION, OFAC_DECLARATION, KIMBERLEY_DECLARATION]) {
  sf(7); const w = doc.splitTextToSize(para, IW-PAD); doc.text(w, ML+PAD, y); y += w.length*3.3+2;
}

// 12. NATURAL ORIGIN
sf(7.5,true); doc.text(NATURAL_ORIGIN_HEADER, ML+PAD, y); y += 4;
sf(7.5);
const nobW = doc.splitTextToSize(NATURAL_ORIGIN_BODY, IW-PAD);
doc.text(nobW, ML+PAD, y);
const sigStartY2 = y;
y += nobW.length*3.3+1;
tR(company.signatory, ML,IW,sigStartY2+4,8.5,true);
const nogW = doc.splitTextToSize(NATURAL_ORIGIN_GUARANTEE, IW*0.65);
doc.text(nogW, ML+PAD, y);
y += nogW.length*3.3+2;
tR('PROPRIETOR', ML,IW,y+2,8.5,true);
y += 5;

// 13. SIGNATURE / FOOTER
hl(ML,y,ML+IW,LW_THIN); y += 3;
tL('STAMP AND SIGNATURE OF PURCHASER', ML, y+1.5, 8.5);
tR(`TOTAL CTS  ${formatCts(totalCts)}`, ML,IW,y+1.5,8.5,true);

// OUTER BORDER
bx(ML-2, MT-2, IW+4, y+5-MT+2, LW_THICK);

// Save
const arrayBuffer = doc.output('arraybuffer');
writeFileSync('C:\\Users\\Admin\\Desktop\\jayjas\\diamond-invoice\\public\\gen_test.pdf', Buffer.from(arrayBuffer));
console.log('PDF saved to public/gen_test.pdf');
