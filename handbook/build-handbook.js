// Turns handbook.html into "Multi Screens Handbook.pdf" in the project folder.
// Run from the project folder:
//   node_modules\electron\dist\electron.exe handbook\build-handbook.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  let code = 0;
  try {
    const win = new BrowserWindow({ show: false, width: 900, height: 1200, webPreferences: { javascript: false } });
    await win.loadFile(path.join(__dirname, 'handbook.html'));
    const pdf = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      // Margins are in inches.
      margins: { top: 0.6, bottom: 0.8, left: 0.6, right: 0.6 },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;padding:0 15mm;display:flex;justify-content:space-between;font:7.5pt Segoe UI,sans-serif;color:#8b93a5"><span>Multi Screens Handbook</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    });
    const file = path.join(__dirname, '..', 'Multi Screens Handbook.pdf');
    fs.writeFileSync(file, pdf);
    console.log(`Saved ${file} (${Math.round(pdf.length / 1024)} KB)`);
  } catch (err) {
    console.error(err);
    code = 1;
  }
  app.exit(code);
});
