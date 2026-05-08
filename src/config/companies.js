// src/config/companies.js
// Complete static configuration for both companies
// All text is verbatim from the source invoice files

export const COMPANIES = {
  jas_diamond: {
    id: 'jas_diamond',
    displayName: 'JAS DIAMOND',
    shortName: 'JAS',
    color: '#000000',
    address: {
      line1: 'B-403,RUGHANI PALACE-1.,',
      line2: 'S.N.ROAD,KANDIVALI-WEST,',
      line3: 'MUMBAI-67',
    },
    mobile: 'MOB:9820685864',
    gstin: '27ADYPM9225E1Z0',
    pan: 'ADYPM9225E',
    stateCode: 'MH-27',
    bank: {
      name: 'THE SARASWAT CO-OP BANK LTD',
      branch: 'KANDIVALI WEST,MUMBAI-67',
      accountNo: '014100100204467',
      ifsc: 'SRCB0000014',
    },
    defaultHsnCode: '71049120',
    defaultDescription: 'LAB GROWN CUT&POLISH DIAMOND',
    igstRate: 0.015,
    defaultDispatchMode: 'HAND DELIVERY',
    defaultTerms: 'COD',
    defaultDeliveryCity: 'MUMBAI',
    signatory: 'FOR JAS DIAMOND',
  },
  jay_gems: {
    id: 'jay_gems',
    displayName: 'JAY GEMS',
    shortName: 'JAY',
    color: '#FF0000',
    address: {
      line1: 'B-5,HARE KRISHNA APT.,',
      line2: 'S.N.ROAD,KANDIVALI-WEST,',
      line3: 'MUMBAI-67',
    },
    mobile: 'MOB:9820685864',
    gstin: '27AMGPM3151N1ZR',
    pan: 'AMGPM3151N',
    stateCode: 'MH-27',
    bank: {
      name: 'THE SARASWAT CO-OP BANK LTD',
      branch: 'KANDIVALI WEST,MUMBAI-67',
      accountNo: '014100100204268',
      ifsc: 'SRCB0000014',
    },
    defaultHsnCode: '7102',
    defaultDescription: 'CUT & POLISHED DIAMONDS',
    igstRate: 0.015,
    defaultDispatchMode: 'HAND DELIVERY',
    defaultTerms: '30 days',
    defaultDeliveryCity: 'MUMBAI',
    signatory: 'FOR JAY GEMS',
  },
};

// Terms & Conditions clauses — verbatim from source
// Clause 2 city is dynamic (replaced at invoice generation time)
export const TC_CLAUSES = [
  '1.GOODS SOLD SHALL NOT BE TAKEN BACK OR EXCHANGED',
  '2.GOODS SOLD AND DELIVERY AT {CITY}',
  '3.SUBJECT TO MUMBAI JURISDICATION',
  '4.ALL FIGURES ARE ROUNDED OF TO NEAREST RUPEE',
  '5.INTEREST AT 18% PER YEAR WILL BE CHARGED ON ALL A/C REMAINING UNPAID AFTER DUE DATE.',
  '6.E&OE',
];

// GST certification paragraph
export const GST_CERTIFICATION =
  'We hereby certify that our registration certificate under Central/State Goods and Service tax act ,2017 is in force on the date on which the issue of goods specified in this tax invoice is made by us and that transaction of sale covered by this tax invvoice has been effected by us and it shall be accounted for in the turnover of sale while filing of return and the due tax,if any, payable on the sale has been paid or shall be paid';

// OFAC / Conflict-free declaration
export const OFAC_DECLARATION =
  "To the best of our knowledge and/or written assurances from our Suppliers, we state that \u2018Diamonds herein invoiced have not been obtained in violation of applicable National laws and/or sanctions by the U.S. Department of Treasury\u2019s office of Foreign Assets Control (OFAC) and have not originated from the Mbada and Marange Resources of Zimbabwe\u2019.";

// Kimberley Process paragraph
export const KIMBERLEY_DECLARATION =
  'The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and in compliance with The United Nations resolutions.The seller hereby states that these diamonds are conflict free,based on personal knowledge and/or written guarantees provided by the supplier of these.';

// Natural origin declaration
export const NATURAL_ORIGIN_HEADER = 'DECLARATION OF GOODS BEING OF NATURAL ORIGIN';
export const NATURAL_ORIGIN_BODY =
  '"THE DIAMONDS HEREIN INVOICED ARE EXCLISIVELY OF NATURAL ORIGIN  AND UNTREATED BASED ON PERSONAL KNOWLEDGE AND OR WRITTEN GUARANTEE PROVIDED BY THE SUPPLIER OF THESE DIAMONDS "THE ACCEPTANCE  OF GOODS HERE IN INVOICED WILL AS PER THE WFDB GUIDELINE"';
export const NATURAL_ORIGIN_GUARANTEE =
  'The seller hereby guarantees that the diamonds herein invoiced are exclusively of natural origin, formed and grown under naatural and geological processes,based on persional knowledge and/or written guarantees provided by the supplier of these.';

// Delivery city options for T&C Clause 2 dropdown
export const DELIVERY_CITIES = ['MUMBAI', 'JAIPUR', 'SURAT'];

// Dispatch mode options
export const DISPATCH_MODES = ['HAND DELIVERY', 'COURIER', 'BY HAND', 'BY POST'];
