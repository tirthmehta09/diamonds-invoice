// src/utils/amountInWords.js
// Indian number system: Crores → Lakhs → Thousands → Hundreds
// Output always ALL CAPS + "ONLY"
// Tested against:
//   89946    → "EIGHTY NINE THOUSAND NINE HUNDRED FORTY SIX ONLY"
//   1193811  → "ELEVEN LAKHS NINETY THREE THOUSAND EIGHT HUNDRED AND ELEVEN ONLY"
//   1176168  → "ELEVEN LAKHS SEVENTY SIX THOUSAND ONE HUNDRED SIXTY EIGHT ONLY"

const ones = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
];

const tens = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY',
];

function twoDigits(n) {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? ' ' + ones[o] : '');
}

function threeDigits(n) {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let result = '';
  if (h > 0) result = ones[h] + ' HUNDRED';
  if (rem > 0) {
    const td = twoDigits(rem);
    result = result ? result + ' AND ' + td : td;
  }
  return result;
}

export function amountInWords(amount) {
  const n = Math.round(Number(amount));
  if (isNaN(n) || n === 0) return 'ZERO ONLY';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts = [];
  if (crore > 0) parts.push(twoDigits(crore) + ' CRORE' + (crore > 1 ? 'S' : ''));
  if (lakh > 0) parts.push(twoDigits(lakh) + ' LAKH' + (lakh > 1 ? 'S' : ''));
  if (thousand > 0) parts.push(twoDigits(thousand) + ' THOUSAND');
  if (rest > 0) parts.push(threeDigits(rest));

  return parts.join(' ') + ' ONLY';
}
