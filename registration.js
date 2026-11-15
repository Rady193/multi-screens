// SCAFFApps registration: who uses the SCAFFApps apps. The same file in every SCAFFApps Electron app (the SCAFFApps
// Suite, Multi Screens, Smart Snap); Instant Share does the same in Python.
//
// The first time any SCAFFApps app starts on a Windows account it asks for the user's name and e-mail address
// (app/registration.html) and keeps them in %APPDATA%\SCAFFApps\registration.json, with a random install id. Every
// SCAFFApps app then sends these details once per version of itself to www.scaffapps.com/api/register, which keeps
// them until the SCAFFApps console collects them (Tool Users). Another app finding the file asks nothing. Sending
// that fails (no internet) is tried again at the next start and every hour while the app runs.
//
// Tests: SCAFFAPPS_REGISTRATION_FILE (where the file is) and SCAFFAPPS_REGISTER_URL (where it is sent).
const { app, BrowserWindow, ipcMain } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FILE = process.env.SCAFFAPPS_REGISTRATION_FILE
  || path.join(process.env.APPDATA || app.getPath('appData'), 'SCAFFApps', 'registration.json');
const URL = process.env.SCAFFAPPS_REGISTER_URL || 'https://www.scaffapps.com/api/register';
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const RETRY = 60 * 60 * 1000;

function read() {
  try {
    const r = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return r && r.install_id && r.name && EMAIL.test(r.email || '') ? r : null;
  } catch { return null; }
}

function write(r) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(r, null, 2));
  fs.renameSync(FILE + '.tmp', FILE);
}

function windowsName() {
  const rel = os.release(), build = Number(rel.split('.')[2]) || 0;
  return process.platform === 'win32' ? `Windows ${build >= 22000 ? 11 : 10} (${rel})` : `${os.type()} ${rel}`;
}

// Sends this app's registration if this version of it has not been sent yet. Never throws.
let retry = null;
async function report(appId, version) {
  const r = read();
  if (!r) return false;
  const key = `${appId}@${version}`;
  if (r.reported && r.reported[key]) return true;
  try {
    const res = await fetch(URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ name: r.name, email: r.email, install: r.install_id, app: appId, version, windows: windowsName() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const now = read() || r;                     // another app may have written the file meanwhile: keep its marks
    now.reported = { ...(now.reported || {}), [key]: new Date().toISOString() };
    write(now);
    if (retry) { clearInterval(retry); retry = null; }
    return true;
  } catch {
    if (!retry) retry = setInterval(() => report(appId, version), RETRY);
    return false;
  }
}

// Returns the registration, asking for it first if this Windows account has none; null if the user closed the window
// without registering (the app then quits: registering is required).
function ensure({ appId, appName, version, icon, theme = 'dark' }) {
  const have = read();
  if (have) { report(appId, version); return Promise.resolve(have); }
  return new Promise((resolve) => {
    let done = false;
    const win = new BrowserWindow({
      width: 480, height: 620, resizable: false, maximizable: false, minimizable: false, show: false,
      title: `Welcome to ${appName}`, icon, autoHideMenuBar: true, backgroundColor: theme === 'light' ? '#ffffff' : '#191a1b',
      webPreferences: { preload: path.join(__dirname, 'registration-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    win.setMenu(null);
    const finish = async (event, data) => {
      const name = String((data && data.name) || '').trim().replace(/\s+/g, ' ');
      const email = String((data && data.email) || '').trim();
      if (!name) return { ok: false, error: 'Please enter your name.' };
      if (name.length > 150) return { ok: false, error: 'That name is too long.' };
      if (!EMAIL.test(email) || email.length > 150) return { ok: false, error: 'Please enter a valid e-mail address.' };
      const r = read() || { install_id: crypto.randomUUID(), created: new Date().toISOString(), reported: {} };
      r.name = name; r.email = email.toLowerCase();
      try { write(r); } catch (e) { return { ok: false, error: `Could not save your details: ${e.message}` }; }
      done = true;
      ipcMain.removeHandler('scaffapps-register');
      report(appId, version);
      win.hide();                                // closed a moment later, once the app's own window is open
      setTimeout(() => { if (!win.isDestroyed()) win.destroy(); }, 1500);
      resolve(r);
      return { ok: true };
    };
    ipcMain.removeHandler('scaffapps-register');
    ipcMain.handle('scaffapps-register', finish);
    win.on('closed', () => { if (!done) { ipcMain.removeHandler('scaffapps-register'); resolve(null); } });
    win.once('ready-to-show', () => win.show());
    win.loadFile(path.join(__dirname, 'app', 'registration.html'), { query: { app: appName, theme, icon: icon ? require('url').pathToFileURL(icon).href : '' } });
  });
}

module.exports = { ensure, report, read, FILE };
