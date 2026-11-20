'use strict';
// Fix spelling in a SCAFFApps app's text boxes: the main process's half (the window's is scaffapps-spelling.js).
// The same file in every SCAFFApps Electron app (master: SCAFFApps Brand/apps/electron), beside main.js with
// scaffapps-spell.ps1; both are in package.json's build "files".
//
// Windows' own spell checker reads the text, through scaffapps-spell.ps1: a PowerShell helper started the first
// time a box is used (a box asks with no text as it takes the keyboard, so the first real check is quick), and
// stopped after ten minutes unused. Nothing leaves the computer.
//
//   require('./scaffapps-spelling-main').register();    in main.js; the preload passes the window's questions:
//   spelling: (text) => ipcRenderer.invoke('spelling-check', String(text || '')),
const { app, ipcMain } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const IDLE_MS = 10 * 60 * 1000;
const LANG = /^[A-Za-z0-9-]+$/;
let helper = null;
let buffer = '';
let idle = 0;
const queue = [];

function stop() {
  clearTimeout(idle);
  if (!helper) return;
  const child = helper;
  helper = null;
  try { child.stdin.write('quit\n'); } catch { /* already gone */ }
  setTimeout(() => { try { child.kill(); } catch { /* already gone */ } }, 1500);
}

// The helper, started if it is not running; null where it cannot run.
function ensure() {
  clearTimeout(idle);
  idle = setTimeout(stop, IDLE_MS);
  if (helper || process.platform !== 'win32') return helper;
  // PowerShell cannot read a script inside the app's archive: a copy goes next to the settings.
  const script = path.join(app.getPath('userData'), 'scaffapps-spell.ps1');
  try {
    fs.mkdirSync(path.dirname(script), { recursive: true });
    fs.writeFileSync(script, fs.readFileSync(path.join(__dirname, 'scaffapps-spell.ps1')));
  } catch { return null; }
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
    { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  helper = child;
  buffer = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line) continue;
      let value = null;
      try { value = JSON.parse(line); } catch { /* answered as null */ }
      if (value && value.ready) continue;
      const waiting = queue.shift();
      if (waiting) waiting(value);
    }
  });
  child.on('exit', () => {
    if (helper === child) helper = null;
    while (queue.length) queue.shift()(null);
  });
  child.on('error', () => { if (helper === child) helper = null; });
  return child;
}

// One question to the helper. Never rejects: no answer is null (a stuck helper is replaced).
function ask(command, ms) {
  const child = ensure();
  if (!child) return Promise.resolve(null);
  return new Promise((resolve) => {
    let done = false;
    const answer = (v) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => {
      answer(null);
      const i = queue.indexOf(answer);
      if (i >= 0) queue.splice(i, 1);
      if (helper === child) { helper = null; try { child.kill(); } catch { /* already gone */ } }
    }, ms);
    queue.push(answer);
    try { child.stdin.write(command + '\n'); } catch { answer(null); }
  });
}

function register() {
  // { language, mistakes: [{ start, length, action, replacement, suggestions }] }, or { error }. In the languages
  // the box itself is checked in (its red underlines); no text: only gets the helper ready.
  ipcMain.handle('spelling-check', async (event, text) => {
    if (process.platform !== 'win32') return { error: 'Fix spelling needs Windows’ own spell checker' };
    const t = String(text || '').slice(0, 5000);
    if (!t.trim()) { ensure(); return { language: '', mistakes: [] }; }
    const langs = event.sender.session.getSpellCheckerLanguages().filter((l) => LANG.test(l));
    if (!langs.length) langs.push(LANG.test(app.getLocale()) ? app.getLocale() : 'en-US');
    const answer = await ask(`spell ${langs.join(',')} ${Buffer.from(t, 'utf8').toString('base64')}`, 10000);
    return answer || { error: 'Windows’ spell checker did not answer. Try again in a moment' };
  });
  app.on('will-quit', stop);
}

module.exports = { register };
