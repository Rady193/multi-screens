// Draws build/icon.svg into build/icon.png (512 px), app/icon.png (256 px) and
// build/icon.ico (16 to 256 px). Run from the project folder:
//   node_modules\electron\dist\electron.exe build\make-icon.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256];

// The SVG is drawn onto a canvas of exactly `size` pixels.
async function render(win, size) {
  const url = await win.webContents.executeJavaScript(`(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = ${size};
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, ${size}, ${size});
    return c.toDataURL('image/png');
  })()`);
  return Buffer.from(url.split(',')[1], 'base64');
}

// An .ico file whose entries are PNG images (Windows Vista and later).
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

app.whenReady().then(async () => {
  let code = 0;
  try {
    const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
    const html = `<html><body style="margin:0;background:transparent"><img width="512" height="512" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`;
    const win = new BrowserWindow({ show: false });
    await win.loadURL('data:text/html;base64,' + Buffer.from(html).toString('base64'));
    fs.writeFileSync(path.join(__dirname, 'icon.png'), await render(win, 512));
    fs.writeFileSync(path.join(__dirname, '..', 'app', 'icon.png'), await render(win, 256));
    const pngs = [];
    for (const size of SIZES) pngs.push({ size, data: await render(win, size) });
    fs.writeFileSync(path.join(__dirname, 'icon.ico'), ico(pngs));
    console.log('Icons written.');
  } catch (err) {
    console.error(err);
    code = 1;
  }
  app.exit(code);
});
