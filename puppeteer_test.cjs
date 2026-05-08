const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const downloadPath = path.resolve('./downloads-test');
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  } else {
    // clean up old pdfs
    for (const file of fs.readdirSync(downloadPath)) {
      if (file.endsWith('.pdf')) fs.unlinkSync(path.join(downloadPath, file));
    }
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  console.log("Navigating to app...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Click JAS DIAMOND to create new invoice
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const jasBtn = buttons.find(b => b.textContent.includes('JAS DIAMOND'));
    if (jasBtn) jasBtn.click();
  });

  await new Promise(r => setTimeout(r, 500));

  console.log("Filling form...");
  // Fill form
  await page.evaluate(() => {
    document.querySelector('input[name="buyerName"]').value = 'M/S OM JEWELS LUXURY PRIVATE LIMITED';
    
    // Add address lines
    const addLineBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Line'));
    if (addLineBtn) {
      addLineBtn.click();
      addLineBtn.click();
      addLineBtn.click();
      addLineBtn.click();
    }
    
    const addressInputs = document.querySelectorAll('input[placeholder="Address Line"]');
    if (addressInputs.length >= 5) {
      addressInputs[0].value = '2ND FLOOR,PLOT NO C AND D R.S.NO.432';
      addressInputs[1].value = 'C.J.HOUSE,OPP.ZENITEX MILL,';
      addressInputs[2].value = 'NEAR TORRENT POWER,';
      addressInputs[3].value = 'VASTA DEVDI ROAD,KATARGAM,';
      addressInputs[4].value = 'SURAT-395004';
    }
    
    document.querySelector('input[name="buyerGstin"]').value = '24AAFCO0528D1ZY';
    
    const ctsInput = document.querySelector('input[placeholder="Cts/Wt"]');
    const rateInput = document.querySelector('input[placeholder="Rate"]');
    if (ctsInput) ctsInput.value = '8.13';
    if (rateInput) rateInput.value = '10900';
    
    // Trigger React events
    document.querySelector('input[name="buyerName"]').dispatchEvent(new Event('input', { bubbles: true }));
    if (ctsInput) ctsInput.dispatchEvent(new Event('input', { bubbles: true }));
    if (rateInput) rateInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await new Promise(r => setTimeout(r, 500));

  console.log("Downloading PDF...");
  // Click Generate / Download PDF
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const genBtn = buttons.find(b => b.textContent.includes('Generate PDF'));
    if (genBtn) genBtn.click();
  });

  // Wait for file download
  await new Promise(r => setTimeout(r, 2000));
  
  const files = fs.readdirSync(downloadPath).filter(f => f.endsWith('.pdf'));
  if (files.length > 0) {
    const latestPdf = path.join(downloadPath, files[0]);
    console.log(`PDF successfully generated: ${latestPdf}`);
    fs.copyFileSync(latestPdf, path.resolve('./public/gen_puppeteer.pdf'));
    console.log(`Copied to public/gen_puppeteer.pdf`);
  } else {
    console.log("No PDF generated!");
  }

  await browser.close();
})();
