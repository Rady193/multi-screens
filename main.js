const { app, BrowserWindow, ipcMain, webContents, shell, session, safeStorage, nativeImage, dialog, screen, net, clipboard, globalShortcut } = require('electron');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');
const path = require('path');
const registration = require('./registration');
const releases = require('./releases');
const fs = require('fs');
const { pathToFileURL } = require('url');

const chromeMajor = process.versions.chrome.split('.')[0];
const GUEST_PRELOAD = path.join(__dirname, 'guest-preload.js');

const USER_AGENTS = {
  desktop: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`,
  android: `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Mobile Safari/537.36`,
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  // iPadOS Safari identifies itself as a Mac by default.
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
};
const PLATFORMS = { desktop: 'Win32', android: 'Linux armv81', iphone: 'iPhone', ipad: 'MacIntel' };

// Throughput in bytes per second, latency in milliseconds.
const NETWORKS = {
  none: { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750 },
  slow4g: { offline: false, latency: 560, downloadThroughput: 180000, uploadThroughput: 84375 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: 50000, uploadThroughput: 50000 },
  offline: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 },
};
const PARTITION = 'persist:multiscreens';

// Windows stops a window from redrawing while another window covers it. The
// app redraws a screen at full size to take a sharp picture of it, so it must
// keep drawing even then; otherwise screenshots and note pictures come back
// small, or never arrive.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// A capture that does not come back is abandoned instead of waited on forever.
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), ms))]);
}

app.userAgentFallback = USER_AGENTS.desktop;

const CUSTOM_TITLE_BAR = process.platform === 'win32';
const TITLE_BAR_HEIGHT = 34;
// Must match --surface / --text in app/style.css.
const TITLE_BAR = {
  dark: { color: '#191a1b', symbolColor: '#cccccc' },
  light: { color: '#ffffff', symbolColor: '#17141c' },
};

ipcMain.handle('set-theme', (event, theme) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const colors = TITLE_BAR[theme] || TITLE_BAR.dark;
  // Remembered so the next start can draw the window in the right colours from
  // its first frame, before the interface has loaded.
  const name = TITLE_BAR[theme] ? theme : 'dark';
  if (loadSettings().appTheme !== name) {
    settings.appTheme = name;
    saveSettings();
  }
  if (!win) return;
  win.setBackgroundColor(colors.color);
  paintTitleBar(win);
});

// Windows draws the window buttons (minimise, maximise, close) itself, on top of
// the page, so an overlay that dims or tints the whole window (the review screen,
// an enlarged picture, Note anywhere) cannot cover them. The interface names the
// overlays' colours, bottom first, and the buttons are painted as if under them.
const titleBarTints = new WeakMap();

function parseRgba(text) {
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(String(text));
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => Math.min(255, Number(v) || 0));
  const a = m[4] === undefined ? 1 : Math.min(1, Number(m[4]) || 0);
  return a > 0 ? [r, g, b, a] : null;
}

function paintTitleBar(win) {
  if (!CUSTOM_TITLE_BAR || !win || win.isDestroyed()) return;
  const base = TITLE_BAR[loadSettings().appTheme] || TITLE_BAR.dark;
  const tints = titleBarTints.get(win) || [];
  if (!tints.length) {
    win.setTitleBarOverlay({ ...base, height: TITLE_BAR_HEIGHT });
    return;
  }
  let rgb = [1, 3, 5].map((i) => parseInt(base.color.slice(i, i + 2), 16));
  for (const [r, g, b, a] of tints) rgb = rgb.map((v, i) => v * (1 - a) + [r, g, b][i] * a);
  const color = '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  // The symbols stay readable: light on a dimmed dark bar, dark on a light one.
  const light = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 > 0.45;
  const symbolColor = light ? TITLE_BAR.light.symbolColor : TITLE_BAR.dark.symbolColor;
  win.setTitleBarOverlay({ color, symbolColor, height: TITLE_BAR_HEIGHT });
}

ipcMain.handle('title-bar-tint', (event, colours) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  titleBarTints.set(win, (Array.isArray(colours) ? colours.slice(0, 6) : []).map(parseRgba).filter(Boolean));
  paintTitleBar(win);
});

function createWindow() {
  // Start in the colours of the appearance last used. Otherwise the window
  // buttons are drawn dark and then repainted once the interface asks for light.
  const startColors = TITLE_BAR[loadSettings().appTheme] || TITLE_BAR.dark;
  // Sized to the display's work area while still hidden, so the interface is
  // laid out at (almost exactly) its final size before the window appears.
  const area = biggestDisplay().workArea;
  const win = new BrowserWindow({
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    // Kept hidden until it is maximised and has drawn its first frame, so the
    // window buttons are not seen jumping from the small size to the full one.
    show: false,
    backgroundColor: startColors.color,
    autoHideMenuBar: true,
    title: 'Multi Screens',
    icon: path.join(__dirname, 'app', 'icon.png'),
    // On Windows the app draws its own title strip so it can follow the app's
    // light/dark setting; the system only overlays the window buttons.
    ...(CUSTOM_TITLE_BAR
      ? { titleBarStyle: 'hidden', titleBarOverlay: { ...startColors, height: TITLE_BAR_HEIGHT } }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'host-preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // When the window is dragged to another display, the life-size scale has to
  // follow: that display has its own physical size.
  let onDisplay = null;
  let moveTimer = 0;
  const checkDisplay = () => {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (win.isDestroyed()) return;
      const id = displayOf(win).id;
      if (id === onDisplay) return;
      onDisplay = id;
      win.webContents.send('display-changed', displayInfo(displayOf(win)));
    }, 250);
  };
  win.on('move', checkDisplay);
  win.on('resize', checkDisplay);

  // The interface says when it has been built (see 'interface-ready'). If that
  // never comes, show the window anyway.
  setTimeout(() => revealWindow(win), 3500);

  // Guests may only ever run our own preload, and never get Node access.
  win.webContents.on('will-attach-webview', (_e, webPreferences) => {
    webPreferences.preload = GUEST_PRELOAD;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });

  // The tools' shortcuts work wherever the keyboard is in the window: in the
  // interface, or inside a device screen, whose keys never reach the interface.
  const onKey = (event, input) => {
    const tool = toolForKey(input);
    if (!tool) return;
    event.preventDefault();
    win.webContents.send('shortcut', tool);
  };
  win.webContents.on('before-input-event', onKey);
  win.webContents.on('did-attach-webview', (_e, guest) => guest.on('before-input-event', onKey));
  claimPrintScreen(win);

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  return win;
}

// ---- Shortcuts for the tools ------------------------------------------------
// Alt + the tool's letter. Keys are matched by position, not by the letter typed,
// so the same keys work with any keyboard layout (Arabic, French, ...). Input
// that names no position (some on-screen keyboards and remote desktops) is
// matched by the letter instead.
const TOOL_KEYS = { KeyN: 'note-anywhere', KeyR: 'review-notes', KeyO: 'find-overflow', KeyS: 'screenshot-all' };
function toolForKey(input) {
  if (input.type !== 'keyDown' || input.isAutoRepeat || !input.alt || input.control || input.shift || input.meta) return null;
  const code = input.code || (/^[a-z]$/i.test(input.key) ? 'Key' + input.key.toUpperCase() : '');
  return TOOL_KEYS[code] || null;
}

// The Print Screen key starts Note anywhere, but only while this window is in
// front: it is claimed when the window gets the focus and given back when it
// loses it, so in every other program it still does what it did before (the
// Snipping Tool, or a screenshot app). Windows does not hand an app the key
// itself, so it is claimed as a system-wide shortcut. If another program holds
// it already, the key keeps doing what that program does.
function claimPrintScreen(win) {
  const release = () => globalShortcut.unregister('PrintScreen');
  const claim = () => {
    if (globalShortcut.isRegistered('PrintScreen')) return;
    globalShortcut.register('PrintScreen', () => {
      if (!win.isDestroyed() && win.isFocused()) win.webContents.send('shortcut', 'note-anywhere');
    });
  };
  win.on('focus', claim);
  win.on('blur', release);
  win.on('closed', release);
  if (win.isFocused()) claim();
}

app.on('will-quit', () => globalShortcut.unregisterAll());

// Shows a window that was created hidden, maximised, and then asks the
// first-start question about the output folder if it is still open.
function revealWindow(win) {
  if (!win || win.isDestroyed() || win.isVisible()) return;
  win.maximize();
  win.show();
  ensureOutputFolder(win);
}

ipcMain.on('interface-ready', (event) => revealWindow(BrowserWindow.fromWebContents(event.sender)));

/**
 * Emulate a device on a guest page. The DevTools protocol is used first because
 * its overrides survive navigations; if the protocol is unavailable (DevTools
 * window open for that pane) fall back to Electron's built-in emulation.
 */
async function applyEmulation(id, d) {
  const wc = webContents.fromId(id);
  if (!wc || wc.isDestroyed()) return false;
  const landscape = d.w > d.h;
  try {
    if (!wc.debugger.isAttached()) wc.debugger.attach('1.3');
    const send = (method, params) => wc.debugger.sendCommand(method, params);
    await send('Emulation.setUserAgentOverride', {
      userAgent: USER_AGENTS[d.ua] || USER_AGENTS.desktop,
      platform: PLATFORMS[d.ua] || PLATFORMS.desktop,
    });
    await send('Emulation.setDeviceMetricsOverride', {
      width: d.w,
      height: d.h,
      screenWidth: d.w,
      screenHeight: d.screenH || d.h,
      deviceScaleFactor: d.dpr,
      mobile: !!d.mobile,
      scale: d.scale,
      screenOrientation: landscape
        ? { type: 'landscapePrimary', angle: 90 }
        : { type: 'portraitPrimary', angle: 0 },
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: !!d.touch, maxTouchPoints: 5 });
    await send('Emulation.setEmitTouchEventsForMouse', {
      // Off by default: it replaces the mouse pointer with a round touch cursor.
      enabled: !!d.touch && !!d.touchMouse,
      configuration: d.mobile ? 'mobile' : 'desktop',
    });
    await send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: d.scheme || '' },
        { name: 'prefers-reduced-motion', value: d.reducedMotion ? 'reduce' : '' },
      ],
    });
    await send('Network.enable');
    await send('Network.emulateNetworkConditions', NETWORKS[d.network] || NETWORKS.none);
    // A phone page can be left pinch-zoomed if its pane changed size while it
    // was loading; start every (re)emulation from the unzoomed state.
    if (d.mobile) await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 }).catch(() => {});
    return true;
  } catch (err) {
    try {
      wc.enableDeviceEmulation({
        screenPosition: d.mobile ? 'mobile' : 'desktop',
        screenSize: { width: d.w, height: d.h },
        viewPosition: { x: 0, y: 0 },
        viewSize: { width: d.w, height: d.h },
        deviceScaleFactor: d.dpr,
        scale: d.scale,
      });
      wc.setUserAgent(USER_AGENTS[d.ua] || USER_AGENTS.desktop);
    } catch (_) { /* pane went away */ }
    return false;
  }
}

// ---- Output folder --------------------------------------------------------
// Everything the app produces (screenshots, videos, review reports) goes under
// one folder, each kind in its own subfolder. The folder is chosen in the
// installer; without an installer (the portable app) it is asked on first start.
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const installChoiceFile = () => path.join(app.getPath('userData'), 'install-output.txt');
const defaultOutputFolder = () => path.join(app.getPath('documents'), 'Multi Screens');
let settings = null;

function loadSettings() {
  if (settings) return settings;
  try { settings = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) || {}; } catch { settings = {}; }
  // A folder forced from outside (used for automated runs and managed installs).
  if (process.env.MULTI_SCREENS_OUTPUT_DIR) settings.outputDir = process.env.MULTI_SCREENS_OUTPUT_DIR;
  // The installer leaves its choice in a small text file. Adopt it when it is
  // new, so reinstalling with a different folder takes effect, while a later
  // change made in the app's Settings is not undone on every start.
  try {
    const chosen = fs.readFileSync(installChoiceFile(), 'utf16le').replace(/^\uFEFF/, '').trim();
    if (chosen && chosen !== settings.installerDir) {
      settings.installerDir = chosen;
      settings.outputDir = chosen;
      saveSettings();
    }
  } catch { /* not installed with the installer */ }
  return settings;
}

function saveSettings() {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 1));
  } catch { /* keep running with the in-memory value */ }
}

const outputFolder = () => loadSettings().outputDir || defaultOutputFolder();
const outputDir = (kind) => path.join(outputFolder(), kind);

function setOutputFolder(dir) {
  loadSettings().outputDir = dir;
  saveSettings();
}

async function chooseOutputFolder(win) {
  const picked = await dialog.showOpenDialog(win, {
    title: 'Choose the output folder',
    defaultPath: outputFolder(),
    properties: ['openDirectory', 'createDirectory'],
  });
  if (picked.canceled || !picked.filePaths[0]) return false;
  setOutputFolder(picked.filePaths[0]);
  return true;
}

// First start without an installer choice: ask once.
async function ensureOutputFolder(win) {
  if (loadSettings().outputDir) return;
  const fallback = defaultOutputFolder();
  const answer = await dialog.showMessageBox(win, {
    type: 'question',
    title: 'Output folder',
    message: 'Where should Multi Screens save its files?',
    detail: `Screenshots, video recordings and review reports are saved in one folder, each in its own subfolder.\n\nDefault: ${fallback}\n\nYou can change this later in Settings.`,
    buttons: ['Use the default folder', 'Choose a folder…'],
    defaultId: 0,
    cancelId: 0,
  });
  if (answer.response !== 1 || !(await chooseOutputFolder(win))) setOutputFolder(fallback);
}

ipcMain.handle('output-get', () => ({ dir: outputFolder() }));

ipcMain.handle('output-choose', async (event) => {
  await chooseOutputFolder(BrowserWindow.fromWebContents(event.sender));
  return { dir: outputFolder() };
});

ipcMain.handle('output-open', async () => {
  const dir = outputFolder();
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* shown as an error below */ }
  const problem = await shell.openPath(dir);
  return { dir, error: problem || null };
});

// ---- Display sizes ---------------------------------------------------------
// Devices are drawn life-size, so the app needs the physical size of the display
// its window is on. Each monitor reports its own size in millimetres; these are
// read with a small PowerShell script (monitors.ps1), matched to the displays
// Electron knows about, and remembered for the next start.
let monitors = null;           // what the last query returned: { gdi: [], edid: [] }
const measured = new Map();    // Electron display id -> { inches, mmW, mmH }

function queryMonitors() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') { resolve(null); return; }
    let script;
    try {
      // PowerShell cannot read from inside the app's package, so the script is
      // copied next to the settings first.
      script = path.join(app.getPath('userData'), 'monitors.ps1');
      fs.mkdirSync(path.dirname(script), { recursive: true });
      fs.writeFileSync(script, fs.readFileSync(path.join(__dirname, 'monitors.ps1')));
    } catch { resolve(null); return; }
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
      { timeout: 20000, windowsHide: true }, (err, stdout) => {
        const gdi = [];
        const edid = [];
        for (const line of String(stdout || '').split(/\r?\n/)) {
          const p = line.trim().split('|');
          if (p[0] === 'GDI' && p.length >= 9) {
            gdi.push({ x: +p[2], y: +p[3], w: +p[4], h: +p[5], mmW: +p[6], mmH: +p[7], primary: p[8] === '1' });
          } else if (p[0] === 'EDID' && p.length >= 7) {
            edid.push({ w: +p[1], h: +p[2], mmW: +p[3], mmH: +p[4] });
          }
        }
        resolve(gdi.length || edid.length ? { gdi, edid } : null);
      });
  });
}

// A reported size is used only if it is believable for that many pixels.
function believable(mmW, mmH, pxW, pxH) {
  if (!(mmW > 50 && mmH > 30)) return false;
  const dpi = pxW / (mmW / 25.4);
  const shape = (mmW / mmH) / (pxW / pxH);
  return dpi > 40 && dpi < 700 && shape > 0.8 && shape < 1.25;
}

// Works out which reported monitor is which display, and stores the sizes.
function measureDisplays() {
  measured.clear();
  if (!monitors) return;
  const primaryId = screen.getPrimaryDisplay().id;
  const pool = monitors.gdi.slice();
  for (const display of screen.getAllDisplays()) {
    const pxW = Math.round(display.size.width * display.scaleFactor);
    const pxH = Math.round(display.size.height * display.scaleFactor);
    const ratio = display.size.width / display.size.height;
    // Windows marks the primary monitor; the others are told apart by shape,
    // then by position.
    const candidates = pool.filter((m) => m.primary === (display.id === primaryId));
    const cost = (m) => Math.abs(m.w / m.h - ratio) * 10 + Math.hypot(m.x - display.bounds.x, m.y - display.bounds.y) / 100000;
    candidates.sort((a, b) => cost(a) - cost(b));
    const match = candidates[0];
    if (match) pool.splice(pool.indexOf(match), 1);
    let size = match && believable(match.mmW, match.mmH, pxW, pxH) ? match : null;
    // Otherwise, the monitor whose own data names this exact resolution.
    if (!size) size = monitors.edid.find((e) => Math.abs(e.w - pxW) <= 2 && Math.abs(e.h - pxH) <= 2 && believable(e.mmW, e.mmH, pxW, pxH)) || null;
    if (size) measured.set(display.id, { inches: Math.round(Math.hypot(size.mmW, size.mmH) / 25.4 * 10) / 10, mmW: size.mmW, mmH: size.mmH });
  }
  const remembered = { ...(loadSettings().displaySizes || {}) };
  for (const [id, m] of measured) remembered[String(id)] = m.inches;
  settings.displaySizes = remembered;
  saveSettings();
}

// What the interface needs to know about one display.
function displayInfo(display) {
  const s = loadSettings();
  const id = String(display.id);
  const found = measured.get(display.id);
  const detected = found ? found.inches : (s.displaySizes && s.displaySizes[id]) || null;
  const override = (s.displayOverrides && s.displayOverrides[id]) || null;
  // With nothing reported: a guess from how densely Windows scales the display.
  const guess = Math.round(Math.hypot(display.size.width, display.size.height) / (display.internal ? 133 : 96) * 10) / 10;
  return {
    id,
    label: display.label || (display.internal ? 'Built-in display' : 'Display'),
    inches: override || detected || guess,
    detected,
    override: !!override,
    mm: found ? `${found.mmW} × ${found.mmH}` : null,
    count: screen.getAllDisplays().length,
  };
}

const displayOf = (win) => screen.getDisplayMatching(win.getBounds());

// The physically largest connected display: where the app starts.
function biggestDisplay() {
  let best = screen.getPrimaryDisplay();
  let bestInches = 0;
  for (const display of screen.getAllDisplays()) {
    const inches = displayInfo(display).inches;
    if (inches > bestInches) { best = display; bestInches = inches; }
  }
  return best;
}

function tellWindows() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('display-changed', displayInfo(displayOf(win)));
  }
}

let monitorQuery = null;
function refreshMonitors() {
  if (monitorQuery) return monitorQuery;
  monitorQuery = queryMonitors().then((result) => {
    monitorQuery = null;
    if (result) monitors = result;
    measureDisplays();
    tellWindows();
  });
  return monitorQuery;
}

// Called once the app is ready: reads the monitors, and again whenever one is
// plugged in or removed.
function watchDisplays() {
  let timer = 0;
  const later = () => { clearTimeout(timer); timer = setTimeout(refreshMonitors, 1500); };
  screen.on('display-added', later);
  screen.on('display-removed', later);
  screen.on('display-metrics-changed', () => { measureDisplays(); tellWindows(); });
  refreshMonitors();
}

ipcMain.handle('display-get', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? displayInfo(displayOf(win)) : null;
});

// Sets (or, with no value, clears) the size the user typed for the display the
// window is on.
ipcMain.handle('display-set', (event, inches) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  const display = displayOf(win);
  const overrides = { ...(loadSettings().displayOverrides || {}) };
  const value = Number(inches);
  if (value >= 5 && value <= 100) overrides[String(display.id)] = Math.round(value * 10) / 10;
  else delete overrides[String(display.id)];
  settings.displayOverrides = overrides;
  saveSettings();
  return displayInfo(display);
});

// ---- Saved logins ---------------------------------------------------------
// Passwords are encrypted with the operating system's per-user key (DPAPI on
// Windows) and never leave this process except to be typed into a page of the
// site they were saved for.
const loginsFile = () => path.join(app.getPath('userData'), 'logins.json');
function readLogins() {
  try { return JSON.parse(fs.readFileSync(loginsFile(), 'utf8')); } catch { return []; }
}
function writeLogins(list) {
  fs.writeFileSync(loginsFile(), JSON.stringify(list, null, 1));
}
function originOf(text) {
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(text) ? text : 'https://' + text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch { return null; }
}

ipcMain.handle('logins-list', () => ({
  available: safeStorage.isEncryptionAvailable(),
  items: readLogins().map(({ id, origin, username }) => ({ id, origin, username })),
}));

ipcMain.handle('logins-save', (_e, entry) => {
  if (!safeStorage.isEncryptionAvailable()) return { error: 'This computer cannot encrypt passwords.' };
  const origin = originOf(String(entry.origin || '').trim());
  const username = String(entry.username || '').trim();
  const password = String(entry.password || '');
  if (!origin) return { error: 'Enter the site address, for example https://myapp.example.com.' };
  if (!username || !password) return { error: 'Enter both a username and a password.' };
  const list = readLogins().filter((x) => !(x.origin === origin && x.username === username));
  list.push({ id: crypto.randomUUID(), origin, username, secret: safeStorage.encryptString(password).toString('base64') });
  writeLogins(list);
  return { ok: true };
});

ipcMain.handle('logins-delete', (_e, id) => {
  writeLogins(readLogins().filter((x) => x.id !== id));
});

ipcMain.handle('logins-fill', (_e, id, ids) => {
  const item = readLogins().find((x) => x.id === id);
  if (!item) return { filled: 0 };
  let password;
  try { password = safeStorage.decryptString(Buffer.from(item.secret, 'base64')); } catch { return { filled: 0 }; }
  let filled = 0;
  for (const wcId of Array.isArray(ids) ? ids : []) {
    const wc = webContents.fromId(wcId);
    if (!wc || wc.isDestroyed() || wc.getType() !== 'webview') continue;
    if (originOf(wc.getURL()) !== item.origin) continue;
    wc.send('fill-login', { username: item.username, password });
    filled++;
  }
  return { filled };
});

// ---- Review notes and PDF report ------------------------------------------
// Each note keeps a screenshot of the screen as it was when the note was made.
const reviewDir = () => path.join(app.getPath('userData'), 'review');
const notesFile = () => path.join(reviewDir(), 'notes.json');
const reportsDir = () => outputDir('Reports');
const noteImage = (id) => path.join(reviewDir(), `${id}.jpg`);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function readNotes() {
  try { return JSON.parse(fs.readFileSync(notesFile(), 'utf8')); } catch { return []; }
}
function writeNotes(list) {
  fs.mkdirSync(reviewDir(), { recursive: true });
  fs.writeFileSync(notesFile(), JSON.stringify(list, null, 1));
}
const unit = (v) => Math.min(1, Math.max(0, Number(v) || 0));

// The device drawing saved with a note: only known shapes, sizes and colours.
function cleanFrame(f) {
  if (!f || typeof f !== 'object') return null;
  const num = (v, max) => Math.min(max, Math.max(0, Number(v) || 0));
  const colour = (v, fallback) => (/^rgba?\([\d.,\s]+\)$/.test(String(v)) ? String(v) : fallback);
  const one = (v, allowed) => (allowed.includes(v) ? v : null);
  const frame = {
    w: num(f.w, 4000), h: num(f.h, 4000), top: num(f.top, 200), bottom: num(f.bottom, 200),
    radius: num(f.radius, 120), bezel: num(f.bezel, 80),
    cutout: one(f.cutout, ['island', 'hole']), nav: one(f.nav, ['android']), overlay: one(f.overlay, ['safari', 'grip']),
    statusBg: colour(f.statusBg, 'rgb(255, 255, 255)'), statusFg: colour(f.statusFg, 'rgb(0, 0, 0)'),
    host: String(f.host || '').slice(0, 200),
  };
  return frame.w >= 100 && frame.h >= 100 && frame.h > frame.top + frame.bottom ? frame : null;
}

ipcMain.handle('notes-add', (_e, n) => {
  const shot = pendingShots.get(n && n.token);
  if (!shot) return null;
  pendingShots.delete(n.token);
  const id = crypto.randomUUID();
  fs.mkdirSync(reviewDir(), { recursive: true });
  fs.writeFileSync(noteImage(id), shot.image.toJPEG(90));
  const m = n.mark || {};
  const mark = m.type === 'area'
    ? { type: 'area', x: unit(m.x), y: unit(m.y), w: unit(m.w), h: unit(m.h) }
    : { type: 'point', x: unit(m.x), y: unit(m.y) };
  const list = readNotes();
  list.push({
    id,
    deviceId: String(n.deviceId || '').slice(0, 40),
    deviceName: String(n.deviceName || '').slice(0, 80),
    deviceSize: String(n.deviceSize || '').slice(0, 40),
    dpr: Number(n.dpr) || 1,
    url: String(n.url || '').slice(0, 2000),
    title: String(n.title || '').slice(0, 300),
    text: String(n.text || '').slice(0, 5000),
    mark,
    frame: cleanFrame(n.frame),
    imgW: shot.size.width,
    imgH: shot.size.height,
    time: Date.now(),
  });
  writeNotes(list);
  return id;
});

ipcMain.handle('notes-list', () => readNotes());

// Rewording a note's comment before it is reported.
ipcMain.handle('notes-update', (_e, id, text) => {
  const value = String(text || '').trim().slice(0, 5000);
  if (!value) return false;
  const list = readNotes();
  const note = list.find((n) => n.id === id);
  if (!note) return false;
  note.text = value;
  writeNotes(list);
  return true;
});

// A note's picture for the review screen: a small copy for the list, or the
// sharp one (`full`) for the enlarged view.
ipcMain.handle('notes-image', (_e, id, full) => {
  if (!UUID.test(String(id)) || !fs.existsSync(noteImage(id))) return null;
  try {
    const image = nativeImage.createFromPath(noteImage(id));
    const size = image.getSize();
    const width = Math.min(size.width, full ? 2600 : 520);
    const copy = width === size.width ? image : image.resize({ width, quality: 'best' });
    return 'data:image/jpeg;base64,' + copy.toJPEG(full ? 90 : 82).toString('base64');
  } catch { return null; }
});

function removeNoteImage(id) {
  if (UUID.test(id)) fs.rmSync(noteImage(id), { force: true });
}

ipcMain.handle('notes-delete', (_e, id) => {
  writeNotes(readNotes().filter((n) => n.id !== id));
  removeNoteImage(String(id));
});

ipcMain.handle('notes-clear', () => {
  for (const n of readNotes()) removeNoteImage(n.id);
  writeNotes([]);
});

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (v) => (v * 100).toFixed(3) + '%';

// The part of the screenshot shown as the close-up, in fractions of the image.
function closeUp(n) {
  const m = n.mark;
  const ratio = n.imgW / n.imgH;
  let x, y, w, h;
  if (m.type === 'area') {
    const pad = 0.04;
    w = m.w + 2 * pad; h = m.h + 2 * pad * ratio;
    x = m.x - pad; y = m.y - pad * ratio;
  } else {
    w = n.imgW > n.imgH ? 0.34 : 0.62;
    h = w * ratio * 0.62;
    x = m.x - w / 2; y = m.y - h / 2;
  }
  w = Math.min(1, w); h = Math.min(1, h);
  x = Math.min(1 - w, Math.max(0, x)); y = Math.min(1 - h, Math.max(0, y));
  return { x, y, w, h };
}

// The mark drawn over an image that shows region `f` of the screenshot.
function markHtml(m, number, f) {
  const pos = `left:${pct((m.x - f.x) / f.w)};top:${pct((m.y - f.y) / f.h)}`;
  return m.type === 'area'
    ? `<div class="mark area" style="${pos};width:${pct(m.w / f.w)};height:${pct(m.h / f.h)}"><span>${number}</span></div>`
    : `<div class="mark point" style="${pos}"><span>${number}</span></div>`;
}

const NAV_BUTTONS = '<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12l6.5 6.5"/></svg>'
  + '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3.5"/></svg>'
  + '<svg viewBox="0 0 24 24"><path d="M7.5 6v12M12 6v12M16.5 6v12"/></svg>';

// The screenshot inside a drawing of the device, as it appears in the app:
// body, status bar with its cut-out, navigation bar, and the marker on top.
function deviceHtml(n, number, src, wide) {
  const mark = markHtml(n.mark, number, { x: 0, y: 0, w: 1, h: 1 });
  const f = n.frame;
  if (!f) {
    // Notes made before the device drawing was recorded show the screenshot alone.
    const shotW = wide ? 150 : Math.min(64, 150 * n.imgW / n.imgH);
    return `<div class="shot"><div class="img" style="width:${shotW.toFixed(1)}mm;height:${(shotW * n.imgH / n.imgW).toFixed(1)}mm"><img src="${src}" style="width:100%;height:100%">${mark}</div><div class="cap">Where it is on the screen</div></div>`;
  }
  const outerW = f.w + 2 * f.bezel;
  const outerH = f.h + 2 * f.bezel;
  // A landscape screen is kept small enough for its note to fit on one page.
  const widthMm = wide ? 150 : Math.min(60, 118 * outerW / outerH);
  const s = widthMm / outerW; // millimetres on paper per CSS pixel of the device
  const mm = (v) => (v * s).toFixed(2) + 'mm';
  const status = f.top
    ? `<div class="statusbar" style="height:${mm(f.top)};background:${f.statusBg};color:${f.statusFg}"><div class="clock">9:41</div>${f.cutout ? `<div class="cutout ${f.cutout}"></div>` : ''}<div class="battery"></div></div>`
    : '';
  const overlay = f.overlay === 'safari'
    ? `<div class="page-overlay safari"><div class="round"></div><div class="address"><span>${esc(f.host)}</span></div><div class="round"></div></div>`
    : f.overlay === 'grip' ? '<div class="page-overlay grip"><div class="grip"></div></div>' : '';
  const nav = f.bottom && f.nav === 'android' ? `<div class="homebar android" style="height:${mm(f.bottom)}">${NAV_BUTTONS}</div>` : '';
  return `<div class="shot">
    <div class="device" style="padding:${mm(f.bezel)};border-radius:${mm(f.radius + f.bezel)}">
      <div class="screen" style="width:${mm(f.w)};border-radius:${mm(f.radius)};font-size:${(15 * s).toFixed(3)}mm">
        ${status}
        <div class="view" style="height:${mm(f.h - f.top - f.bottom)}"><img src="${src}">${overlay}${mark}</div>
        ${nav}
      </div>
    </div>
    <div class="cap">How it looks on the device</div>
  </div>`;
}

function noteHtml(n, number) {
  const src = pathToFileURL(noteImage(n.id)).href;
  const wide = n.imgW > n.imgH;
  // Sizes in millimetres for an A4 page with 14 mm margins.
  const c = closeUp(n);
  const aspect = (c.w * n.imgW) / (c.h * n.imgH);
  const detailW = wide ? Math.min(150, 62 * aspect) : Math.min(92, 95 * aspect);
  const detailH = detailW / aspect;
  const date = new Date(n.time).toLocaleString();
  return `<section class="note ${wide ? 'wide' : 'tall'}">
  ${deviceHtml(n, number, src, wide)}
  <div class="body">
    <div class="num"><span>${number}</span> Note ${number}</div>
    <p class="text">${esc(n.text).replace(/\n/g, '<br>')}</p>
    <div class="img" style="width:${detailW.toFixed(1)}mm;height:${detailH.toFixed(1)}mm"><img src="${src}" style="left:${pct(-c.x / c.w)};top:${pct(-c.y / c.h)};width:${pct(1 / c.w)};height:${pct(1 / c.h)}">${markHtml(n.mark, number, c)}</div>
    <div class="cap">Close-up of the marked ${n.mark.type === 'area' ? 'area' : 'spot'}</div>
    <div class="meta">${esc(n.title || 'Untitled page')}<br>${esc(n.url)}<br>${esc(date)}</div>
  </div>
</section>`;
}

// `picture`: drawn for one tall picture instead of printed pages. The page then
// keeps the A4 width and its margins itself, on white, without a scrollbar.
function reportHtml(list, deviceId, reviewed, picture) {
  const groups = new Map();
  for (const n of list) {
    if (!groups.has(n.deviceId)) groups.set(n.deviceId, []);
    groups.get(n.deviceId).push(n);
  }
  const sites = [...new Set(list.map((n) => { try { return new URL(n.url).host || n.url; } catch { return n.url; } }))];
  // Devices listed in the summary. A report for one screen lists that screen.
  // A report for all screens lists every screen that was on show, including
  // those with no notes, so the count is the number of devices reviewed.
  const devices = [];
  if (!deviceId && Array.isArray(reviewed)) {
    for (const d of reviewed.slice(0, 20)) {
      if (!d || typeof d !== 'object') continue;
      devices.push({ id: String(d.id || '').slice(0, 40), name: String(d.name || '').slice(0, 80), size: String(d.size || '').slice(0, 40), dpr: Number(d.dpr) || 1, notes: 0 });
    }
  }
  for (const g of groups.values()) {
    let entry = devices.find((d) => d.id === g[0].deviceId);
    if (!entry) {
      entry = { id: g[0].deviceId, name: g[0].deviceName, size: g[0].deviceSize, dpr: g[0].dpr, notes: 0 };
      devices.push(entry);
    }
    entry.notes = g.length;
  }
  const rows = devices.map((d) =>
    `<tr${d.notes ? '' : ' class="none"'}><td>${esc(d.name)}</td><td>${esc(d.size)} CSS px</td><td>${d.dpr}</td><td>${d.notes || 'None'}</td></tr>`).join('');
  const deviceCard = deviceId
    ? `<div><b>Device</b>${esc(devices[0].name)}</div>`
    : `<div><b>Devices reviewed</b>${devices.length}</div>`;
  const sections = [...groups.values()].map((g) =>
    `<h2>${esc(g[0].deviceName)} <small>${esc(g[0].deviceSize)} · ${g.length} note${g.length === 1 ? '' : 's'}</small></h2>`
    + g.map((n, i) => noteHtml(n, i + 1)).join('')).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Review report</title><style>
  * { box-sizing: border-box; }
  body { margin: 0; color: #17141c; font: 10.5pt/1.45 "Segoe UI", system-ui, sans-serif; }
  header { margin-bottom: 5mm; }
  .brand { display: flex; align-items: center; gap: 2mm; margin-bottom: 4mm; color: #6a6175; font-size: 9pt; font-weight: 600; letter-spacing: .2pt; }
  .brand img { width: 5.5mm; height: 5.5mm; }
  h1 { margin: 0 0 3mm; font-size: 20pt; letter-spacing: -.2pt; }
  .cards { display: flex; gap: 3mm; }
  .cards div { flex: 1; min-width: 0; padding: 2.4mm 3.2mm; background: #f6f5f8; border: .25mm solid #e7e4ec; border-radius: 2.5mm; font-size: 10.5pt; font-weight: 600; overflow-wrap: anywhere; }
  .cards div:first-child { flex: 2; }
  .cards b { display: block; margin-bottom: .8mm; color: #6a6175; font-size: 7.5pt; font-weight: 600; letter-spacing: .4pt; text-transform: uppercase; }
  .sub { color: #6a6175; }
  table { width: 100%; margin-top: 4mm; border-collapse: collapse; font-size: 9.5pt; }
  th, td { padding: 1.3mm 2mm; text-align: left; border-bottom: .2mm solid #e7e4ec; }
  th { color: #6a6175; font-weight: 600; }
  h2 { margin: 6mm 0 3.5mm; padding: 0 0 2mm; font-size: 14pt; border-bottom: .5mm solid #5b2c83; break-after: avoid; }
  h2 small { color: #6a6175; font-size: 9pt; font-weight: 400; margin-left: 2mm; }
  .note { display: flex; gap: 7mm; margin-bottom: 5mm; padding: 5mm; border: .3mm solid #e7e4ec; border-radius: 3mm; break-inside: avoid; }
  .note.wide { flex-direction: column; gap: 4mm; }
  .note.wide .shot { align-self: center; }
  .shot { flex: none; }
  .body { flex: 1; min-width: 0; }
  .img { position: relative; overflow: hidden; border: .25mm solid #d4d0dc; border-radius: 1.5mm; background: #f6f5f8; }
  .img img { position: absolute; left: 0; top: 0; display: block; }
  .cap { margin: 1.2mm 0 0; color: #6a6175; font-size: 8pt; }
  .num { display: flex; align-items: center; gap: 2mm; font-size: 12pt; font-weight: 700; }
  .num span { display: inline-grid; place-items: center; width: 6.5mm; height: 6.5mm; color: #fff; background: #e5484d; border-radius: 50%; font-size: 9.5pt; }
  .text { margin: 2.5mm 0 4.5mm; padding: 3mm 3.5mm; background: #fff7f7; border: .25mm solid #f3d4d5; border-left: 1.1mm solid #e5484d; border-radius: 2mm; font-size: 11pt; white-space: normal; overflow-wrap: anywhere; }
  tr.none td { color: #a59bb0; }
  .meta { margin-top: 4mm; padding-top: 2.5mm; border-top: .2mm solid #e7e4ec; color: #6a6175; font-size: 8pt; overflow-wrap: anywhere; }
  /* The device drawing. Bar contents are sized in em: the screen's font-size
     is set per note so they scale with the drawing. */
  .device { width: fit-content; background: #0b0c0f; box-shadow: 0 0 0 .25mm #2e333d; }
  .screen { display: flex; flex-direction: column; overflow: hidden; background: #000; line-height: 1; }
  .view { position: relative; overflow: hidden; background: #fff; }
  .view > img { display: block; width: 100%; height: 100%; }
  .statusbar { position: relative; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 1.7em; font-weight: 600; }
  .statusbar .clock { font-size: 1.05em; }
  .statusbar .battery { width: 1.75em; height: .82em; border: .09em solid currentColor; border-radius: .27em; background: linear-gradient(currentColor, currentColor) no-repeat .1em center / 70% 60%; opacity: .9; }
  .cutout { position: absolute; left: 50%; top: 50%; background: #000; transform: translateX(-50%); }
  .cutout.island { width: 8.3em; height: 2.4em; margin-top: -1.2em; border-radius: 1.3em; }
  .cutout.hole { width: .9em; height: .9em; margin-top: -.45em; border-radius: 50%; box-shadow: 0 0 0 .09em #3a3c42; }
  .homebar.android { flex: none; display: flex; align-items: center; justify-content: space-around; padding: 0 14%; background: #1f2023; }
  .homebar.android svg { width: 1.9em; height: 1.9em; fill: none; stroke: #e8e8ea; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .page-overlay { position: absolute; left: 0; right: 0; bottom: 0; }
  .page-overlay.grip { display: flex; justify-content: center; padding-bottom: .55em; }
  .page-overlay.grip .grip { width: 34%; max-width: 9.5em; height: .32em; border-radius: 1em; background: rgba(60, 60, 67, .75); }
  .page-overlay.safari { display: flex; align-items: center; gap: .9em; padding: 0 1.9em 1.7em; }
  .page-overlay.safari .round, .page-overlay.safari .address { height: 3.2em; border-radius: 1.6em; background: rgba(250, 250, 252, .8); box-shadow: 0 .15em .9em rgba(0, 0, 0, .18); }
  .page-overlay.safari .round { flex: none; width: 3.2em; }
  .page-overlay.safari .address { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: 0 1em; color: rgba(0, 0, 0, .78); font-weight: 500; white-space: nowrap; overflow: hidden; }
  .page-overlay.safari .address span { font-size: 1em; overflow: hidden; text-overflow: ellipsis; }
  .mark { position: absolute; }
  .mark.area { border: .7mm solid #e5484d; border-radius: 1mm; background: rgba(229, 72, 77, .10); }
  .mark.area span { position: absolute; left: -.7mm; top: -.7mm; transform: translate(-40%, -60%); }
  .mark.point { width: 0; height: 0; }
  .mark.point::before { content: ""; position: absolute; left: -5mm; top: -5mm; width: 10mm; height: 10mm; border: .7mm solid #e5484d; border-radius: 50%; background: rgba(229, 72, 77, .12); }
  .mark span { display: inline-grid; place-items: center; min-width: 5mm; height: 5mm; padding: 0 1mm; color: #fff; background: #e5484d; border-radius: 2.5mm; font-size: 8pt; font-weight: 700; line-height: 1; }
  .mark.point span { position: absolute; left: 3mm; top: -8mm; }
  ${picture ? 'html { background: #fff; scrollbar-width: none; } body { padding: 12mm 14mm 9mm; } .note:last-child { margin-bottom: 0; }' : ''}
</style></head><body>
<header>
  <div class="brand"><img src="${pathToFileURL(path.join(__dirname, 'app', 'icon.png')).href}" alt="">Multi Screens</div>
  <h1>Review report</h1>
  <div class="cards">
    <div><b>Site</b>${esc(sites.join(', '))}</div>
    <div><b>Created</b>${esc(new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))}</div>
    ${deviceCard}
    <div><b>Notes</b>${list.length}</div>
  </div>
  <table><tr><th>Device</th><th>Screen size</th><th>Pixel ratio</th><th>Notes</th></tr>${rows}</table>
</header>
${sections}
</body></html>`;
}

// The notes that go into a report: one screen's (`deviceId`) or all of them.
const reportNotes = (deviceId) =>
  readNotes().filter((n) => (!deviceId || n.deviceId === deviceId) && UUID.test(n.id) && fs.existsSync(noteImage(n.id)));

// Draws the report in a window of its own that is never shown, hands its page
// to `use`, and closes it. A picture needs the window drawn off screen: Chromium
// does not paint a hidden window, so there would be nothing to capture.
async function withReportPage(list, deviceId, reviewed, picture, use) {
  const htmlFile = path.join(reviewDir(), picture ? 'report-picture.html' : 'report.html');
  let win;
  try {
    fs.writeFileSync(htmlFile, reportHtml(list, deviceId, reviewed, picture));
    win = new BrowserWindow({
      show: false, width: 900, height: 1200, useContentSize: true,
      webPreferences: { javascript: false, offscreen: !!picture },
    });
    await win.loadFile(htmlFile);
    return await use(win.webContents);
  } finally {
    if (win && !win.isDestroyed()) win.destroy();
    fs.rmSync(htmlFile, { force: true });
  }
}

ipcMain.handle('notes-report', async (_e, deviceId, reviewed) => {
  const list = reportNotes(deviceId);
  if (!list.length) return { error: 'There are no notes to report.' };
  try {
    const pdf = await withReportPage(list, deviceId, reviewed, false, (wc) => wc.printToPDF({
      // Margins are in inches; the footer carries the page number.
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0.55, bottom: 0.75, left: 0.55, right: 0.55 },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;padding:0 14mm;display:flex;justify-content:space-between;font:7.5pt Segoe UI,sans-serif;color:#8b93a5"><span>Multi Screens review report</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    }));
    const dir = reportsDir();
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const who = (deviceId ? list[0].deviceName : 'All screens').replace(/[^\w\- ]+/g, '').trim() || 'Screen';
    const file = path.join(dir, `Review report - ${who} - ${stamp}.pdf`);
    fs.writeFileSync(file, pdf);
    // The report now holds these notes, so they leave the app. Only the notes
    // that went into this report are removed, and only once the PDF is on disk.
    const reported = new Set(list.map((n) => n.id));
    writeNotes(readNotes().filter((n) => !reported.has(n.id)));
    for (const id of reported) removeNoteImage(id);
    return { file, cleared: reported.size };
  } catch (err) {
    return { error: 'The report could not be created.' };
  }
});

// The same report as one tall picture on the clipboard, to paste into a chat,
// an email or a document. Nothing is saved and the notes stay in the app.
// The page is drawn at the A4 width, twice as sharp as on screen; a report too
// long for that is drawn smaller, so the picture stays within PICTURE_MAX_H.
const PICTURE_W = 794; // A4 at 96 dpi, in CSS pixels
const PICTURE_MAX_H = 16000; // in pixels; Chromium cannot capture much taller
ipcMain.handle('notes-copy-picture', async (_e, deviceId, reviewed) => {
  const list = reportNotes(deviceId);
  if (!list.length) return { error: 'There are no notes to report.' };
  try {
    const image = await withReportPage(list, deviceId, reviewed, true, async (wc) => {
      wc.debugger.attach('1.3');
      const send = (method, params) => wc.debugger.sendCommand(method, params);
      const metrics = (height, deviceScaleFactor) =>
        send('Emulation.setDeviceMetricsOverride', { width: PICTURE_W, height, deviceScaleFactor, mobile: false });
      await metrics(1000, 1);
      const { cssContentSize } = await send('Page.getLayoutMetrics');
      const height = Math.ceil(cssContentSize.height);
      await metrics(height, Math.min(2, PICTURE_MAX_H / height));
      // Closing the window (on a timeout) ends a capture that never finishes.
      const { data } = await withTimeout(send('Page.captureScreenshot', { format: 'png' }), 20000);
      return nativeImage.createFromBuffer(Buffer.from(data, 'base64'));
    });
    if (image.isEmpty()) throw new Error('empty picture');
    clipboard.writeImage(image);
    return { ...image.getSize(), notes: list.length };
  } catch (err) {
    return { error: 'The report could not be copied as a picture.' };
  }
});

// Opens a report, and only a report: a PDF inside the reports folder.
ipcMain.handle('notes-open', (_e, file) => {
  const full = path.resolve(String(file));
  if (path.dirname(full) === path.resolve(reportsDir()) && full.toLowerCase().endsWith('.pdf')) return shell.openPath(full);
  return null;
});

// ---- Video recordings -----------------------------------------------------
// The app records its own window only: this hands the interface the capture id
// of the window that asked, never of anything else on the desktop.
ipcMain.handle('media-source-id', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.getMediaSourceId() : null;
});

ipcMain.handle('save-video', (_e, buffer, name) => {
  try {
    const dir = outputDir('Videos');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // A recording of one device carries that device's name.
    const device = String(name || '').replace(/[^\w\- ]+/g, '').trim();
    const file = path.join(dir, `Recording ${device ? device + ' ' : ''}${stamp}.webm`);
    fs.writeFileSync(file, Buffer.from(buffer));
    return file;
  } catch { return null; }
});

ipcMain.handle('config', (event) => ({
  display: (() => { const win = BrowserWindow.fromWebContents(event.sender); return win ? displayInfo(displayOf(win)) : null; })(),
  guestPreload: pathToFileURL(GUEST_PRELOAD).href,
  startUrl: pathToFileURL(path.join(__dirname, 'app', 'start.html')).href,
  userAgents: USER_AGENTS,
  customTitleBar: CUSTOM_TITLE_BAR,
}));

// Emulation requests for one pane can arrive in bursts (load, resize, zoom).
// Run them one at a time and always finish on the most recent request.
const pendingEmulation = new Map();
const emulating = new Set();
async function emulate(id, device) {
  pendingEmulation.set(id, device);
  if (emulating.has(id)) return;
  emulating.add(id);
  try {
    while (pendingEmulation.has(id)) {
      const next = pendingEmulation.get(id);
      pendingEmulation.delete(id);
      await applyEmulation(id, next);
    }
  } finally {
    emulating.delete(id);
  }
}

ipcMain.handle('emulate', (_e, id, device) => emulate(id, device));

ipcMain.handle('devtools', (_e, id) => {
  const wc = webContents.fromId(id);
  if (wc && !wc.isDestroyed()) wc.openDevTools({ mode: 'detach' });
});

ipcMain.handle('clear-data', async () => {
  const ses = session.fromPartition(PARTITION);
  await ses.clearStorageData();
  await ses.clearCache();
});

// ---- Capturing a screen -----------------------------------------------------
// A capture is a picture of what a pane is drawing right now. The interface
// briefly draws the pane at full size first, so the picture is sharp. Captures
// wait here until they are saved as a screenshot, attached to a note, or dropped.
const pendingShots = new Map();

// Pages without a background colour capture as transparent; put them on white.
function onWhite(image) {
  const size = image.getSize();
  const pixels = image.toBitmap();
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha === 255) continue;
    const add = 255 - alpha;
    pixels[i] = Math.min(255, pixels[i] + add);
    pixels[i + 1] = Math.min(255, pixels[i + 1] + add);
    pixels[i + 2] = Math.min(255, pixels[i + 2] + add);
    pixels[i + 3] = 255;
  }
  return nativeImage.createFromBitmap(pixels, { width: size.width, height: size.height });
}

ipcMain.handle('capture-begin', async (_e, wcId, preview) => {
  const wc = webContents.fromId(wcId);
  if (!wc || wc.isDestroyed() || wc.getType() !== 'webview') return null;
  let image;
  try { image = onWhite(await withTimeout(wc.capturePage(), 4000)); } catch { return null; }
  const size = image.getSize();
  if (!size.width || !size.height) return null;
  if (preview) return { dataUrl: image.toDataURL() };
  const token = crypto.randomUUID();
  pendingShots.set(token, { image, size });
  return { token, width: size.width, height: size.height };
});

// A picture of the whole app window, for a note that is not on one device.
ipcMain.handle('capture-window', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  let image;
  try { image = await withTimeout(win.capturePage(), 4000); } catch { return null; }
  const size = image.getSize();
  if (!size.width || !size.height) return null;
  const token = crypto.randomUUID();
  pendingShots.set(token, { image, size });
  return { token, width: size.width, height: size.height };
});

ipcMain.handle('capture-cancel', (_e, token) => { pendingShots.delete(token); });

ipcMain.handle('capture-save', (_e, token, name, full) => {
  const shot = pendingShots.get(token);
  if (!shot) return null;
  pendingShots.delete(token);
  const dir = outputDir('Screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const clean = (String(name) + (full ? ' full' : '')).replace(/[^\w\- ]+/g, '').trim() || 'screen';
  const file = path.join(dir, `${clean} ${stamp}.png`);
  fs.writeFileSync(file, shot.image.toPNG());
  return file;
});

ipcMain.handle('reveal', (_e, file) => shell.showItemInFolder(file));

// ---- Updates ----------------------------------------------------------------
// New versions are published as releases on GitHub. The app asks GitHub which
// release is the latest. Only when the user chooses "Update now" does it
// download the file that matches how it was installed (installer or portable),
// check it against the SHA-256 checksums that GitHub and the release notes give
// for it, and run it.
const UPDATE_REPO = 'Rady193/multi-screens';
const UPDATE_PAGE = `https://github.com/${UPDATE_REPO}/releases/latest`;
// The newest release is asked of the SCAFFApps website first (releases.js), GitHub's API last. A stand-in for
// GitHub's releases/latest can be named for tests; it is then asked alone.
const UPDATE_TEST = process.env.MULTI_SCREENS_UPDATE_API || null;
const UPDATE_EVERY = 24 * 60 * 60 * 1000;
const UPDATE_AGENT = `MultiScreens/${app.getVersion()}`;
const UPDATE_FILES = {
  installed: /^Multi-Screens-Setup-\d+(\.\d+)*\.exe$/i,
  portable: /^Multi-Screens-\d+(\.\d+)*-portable\.exe$/i,
};
// The installer starts the new version with this argument when it is done.
const JUST_UPDATED = process.argv.includes('--updated');

const update = {
  state: 'idle',   // idle | checking | current | available | downloading | installing | error
  latest: null,    // the newest release: { version, name, notes, page, published, asset }
  progress: null,  // { received, total } while downloading
  error: null,
  checkedAt: 0,
  replaced: null,  // after a portable update: what became of the old file
};
let updateAbort = null;

// How this copy was installed decides what "Update now" downloads.
function installKind() {
  if (!app.isPackaged) return 'source';
  if (process.platform !== 'win32') return 'other';
  if (process.env.PORTABLE_EXECUTABLE_FILE) return 'portable';
  if (fs.existsSync(path.join(path.dirname(process.execPath), 'Uninstall Multi Screens.exe'))) return 'installed';
  return 'other';
}

function versionParts(v) {
  return String(v).replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
}

function isNewer(a, b) {
  const x = versionParts(a);
  const y = versionParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}

// The checksum a download must have. GitHub works one out for every file it
// holds, and the release notes list one per file; where both exist they must
// agree. Returns null when there is none, 'mismatch' when they differ.
function expectedChecksum(asset, notes) {
  const sums = new Set();
  const digest = /^sha256:([0-9a-f]{64})$/i.exec(asset.digest || '');
  if (digest) sums.add(digest[1].toLowerCase());
  for (const line of String(notes || '').split('\n')) {
    if (!line.includes(asset.name)) continue;
    const listed = /\b[0-9a-f]{64}\b/i.exec(line);
    if (listed) sums.add(listed[0].toLowerCase());
  }
  if (!sums.size) return null;
  return sums.size === 1 ? [...sums][0] : 'mismatch';
}

function updateMessage(err) {
  const text = String((err && err.message) || err || '');
  if (/ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|ERR_NETWORK|ERR_TIMED_OUT|ERR_PROXY/i.test(text)) {
    return 'GitHub could not be reached. Check the internet connection and try again.';
  }
  return text || 'Something went wrong.';
}

function updateStatus() {
  const l = update.latest;
  const kind = installKind();
  return {
    current: app.getVersion(),
    kind,
    auto: loadSettings().updateAuto !== false,
    state: update.state,
    checkedAt: update.checkedAt || loadSettings().updateCheckedAt || 0,
    latest: l && {
      version: l.version,
      name: l.name,
      notes: l.notes,
      published: l.published,
      size: l.asset ? l.asset.size : 0,
      // Why "Update now" cannot be offered, if it cannot.
      manual: kind === 'source' ? 'source'
        : kind === 'other' ? 'other'
          : !l.asset ? 'no-file'
            : !l.asset.sha256 || l.asset.sha256 === 'mismatch' ? 'unverified' : null,
      file: l.asset ? l.asset.name : null,
    },
    progress: update.progress,
    error: update.error,
    justUpdated: JUST_UPDATED,
    replaced: update.replaced,
  };
}

function sendUpdate() {
  const status = updateStatus();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('update-status', status);
  }
}

async function checkForUpdates() {
  if (['checking', 'downloading', 'installing'].includes(update.state)) return updateStatus();
  update.state = 'checking';
  update.error = null;
  sendUpdate();
  try {
    const release = await releases.latest(UPDATE_REPO, { agent: UPDATE_AGENT, test: UPDATE_TEST });
    const version = String(release.tag_name || '').replace(/^v/i, '');
    if (!/^\d+(\.\d+)*$/.test(version)) throw new Error('The latest release has no version number.');
    const pattern = UPDATE_FILES[installKind()];
    const asset = pattern && (release.assets || []).find((a) => pattern.test(a.name || ''));
    const page = /^https:\/\/github\.com\//.test(release.html_url || '') ? release.html_url : UPDATE_PAGE;
    update.latest = {
      version,
      name: String(release.name || `Multi Screens ${version}`),
      notes: String(release.body || ''),
      page,
      published: release.published_at || null,
      asset: asset ? {
        name: asset.name,
        url: asset.browser_download_url,
        size: Number(asset.size) || 0,
        sha256: expectedChecksum(asset, release.body),
      } : null,
    };
    update.state = isNewer(version, app.getVersion()) ? 'available' : 'current';
    update.checkedAt = Date.now();
    loadSettings().updateCheckedAt = update.checkedAt;
    saveSettings();
  } catch (err) {
    // A newer version found by an earlier check is still on offer.
    update.state = update.latest && isNewer(update.latest.version, app.getVersion()) ? 'available' : 'error';
    update.error = updateMessage(err);
  }
  sendUpdate();
  return updateStatus();
}

function sha256File(file) {
  return new Promise((resolve) => {
    const hash = crypto.createHash('sha256');
    fs.createReadStream(file)
      .on('error', () => resolve(null))
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')));
  });
}

// Downloads a release file into the first of the folders that can be written
// to and returns its path. It is written under a temporary name and only
// given its real name once its checksum is right.
async function downloadVerified(asset, folders) {
  let handle = null;
  let dest = null;
  for (const dir of folders) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const candidate = path.join(dir, asset.name);
      // Already downloaded by an earlier attempt that did not finish: use it.
      if (fs.existsSync(candidate) && await sha256File(candidate) === asset.sha256) return candidate;
      handle = await fs.promises.open(candidate + '.part', 'w');
      dest = candidate;
      break;
    } catch { /* not writable: try the next folder */ }
  }
  if (!handle) throw new Error('There is no folder the update can be saved in.');
  const part = dest + '.part';
  updateAbort = new AbortController();
  try {
    const res = await net.fetch(asset.url, { headers: { 'User-Agent': UPDATE_AGENT }, signal: updateAbort.signal });
    if (!res.ok || !res.body) throw new Error(`The download failed (error ${res.status}). Try again later.`);
    const total = asset.size || Number(res.headers.get('content-length')) || 0;
    const hash = crypto.createHash('sha256');
    const reader = res.body.getReader();
    let received = 0;
    let shown = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
      await handle.write(value);
      received += value.length;
      if (Date.now() - shown > 200) {
        shown = Date.now();
        update.progress = { received, total };
        sendUpdate();
      }
    }
    await handle.close();
    handle = null;
    if (total && received !== total) throw new Error('The download was incomplete. Try again.');
    if (hash.digest('hex') !== asset.sha256) {
      throw new Error('The downloaded file did not match its published checksum, so it was not used.');
    }
    fs.renameSync(part, dest);
    return dest;
  } catch (err) {
    if (handle) await handle.close().catch(() => {});
    try { fs.unlinkSync(part); } catch { /* already gone */ }
    throw err;
  } finally {
    updateAbort = null;
  }
}

// The installer needs administrator rights, so it is started through Windows,
// which asks for permission first. It runs without its pages, closes this copy
// if it is still open, and opens the new version when it is done.
function runInstaller(file) {
  const command = "try { Start-Process -FilePath $env:MULTI_SCREENS_SETUP -ArgumentList '--updated','/S','--force-run' -Verb RunAs -ErrorAction Stop } catch { exit 1 }";
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { env: { ...process.env, MULTI_SCREENS_SETUP: file }, windowsHide: true },
      (err) => (err
        ? reject(new Error('The installer did not start. If Windows asked for permission and it was refused, choose Update now again.'))
        : resolve()));
  });
}

// A portable copy cannot delete itself while it runs: Windows holds its file
// until it has closed. The new file is saved beside it and started instead,
// and told which file it replaces so it can remove it (removeReplacedFile).
function runPortable(file) {
  return new Promise((resolve, reject) => {
    const args = ['--updated', `--replaces=${process.env.PORTABLE_EXECUTABLE_FILE}`];
    const child = spawn(file, args, { detached: true, stdio: 'ignore' });
    child.once('error', () => reject(new Error(`The new version could not be started. It is saved at ${file}.`)));
    child.once('spawn', () => { child.unref(); resolve(); });
  });
}

// Run by the new portable version: moves the file it replaced to the Recycle
// Bin. Only an older Multi Screens portable file in this file's own folder is
// touched. The old copy may still be closing, so it keeps trying for a minute.
const REPLACES = (process.argv.find((a) => a.startsWith('--replaces=')) || '').slice('--replaces='.length);

async function removeReplacedFile() {
  const own = process.env.PORTABLE_EXECUTABLE_FILE;
  if (!REPLACES || installKind() !== 'portable' || !own) return;
  const old = path.resolve(REPLACES);
  const name = path.basename(old);
  const version = (/^Multi-Screens-(\d+(?:\.\d+)*)-portable\.exe$/i.exec(name) || [])[1];
  if (!version || !isNewer(app.getVersion(), version)) return;
  const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
  if (!same(path.dirname(old), path.dirname(own)) || same(old, own)) return;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (!fs.existsSync(old)) return;
    try {
      await shell.trashItem(old);
      update.replaced = { name, removed: true };
      sendUpdate();
      return;
    } catch { /* still in use */ }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  update.replaced = { name, removed: false, path: old };
  sendUpdate();
}

async function installUpdate() {
  const l = update.latest;
  const kind = installKind();
  if (update.state !== 'available' || !l || !l.asset || !UPDATE_FILES[kind]) return updateStatus();
  if (!l.asset.sha256 || l.asset.sha256 === 'mismatch') return updateStatus();
  update.state = 'downloading';
  update.error = null;
  update.progress = { received: 0, total: l.asset.size };
  sendUpdate();
  let file;
  try {
    const folders = kind === 'portable'
      ? [process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.env.PORTABLE_EXECUTABLE_FILE), app.getPath('downloads')]
      : [path.join(app.getPath('temp'), 'Multi Screens update')];
    file = await downloadVerified(l.asset, folders);
  } catch (err) {
    update.state = 'available';
    update.progress = null;
    update.error = err && err.name === 'AbortError' ? null : updateMessage(err);
    sendUpdate();
    return updateStatus();
  }
  update.state = 'installing';
  update.progress = null;
  sendUpdate();
  try {
    if (kind === 'installed') await runInstaller(file);
    else await runPortable(file);
  } catch (err) {
    update.state = 'available';
    update.error = updateMessage(err);
    sendUpdate();
    return updateStatus();
  }
  // Give the interface a moment to say what is happening, then make way.
  setTimeout(() => app.quit(), 1500);
  return updateStatus();
}

ipcMain.handle('update-status', () => updateStatus());
ipcMain.handle('update-check', () => checkForUpdates());
ipcMain.handle('update-install', () => installUpdate());
ipcMain.handle('update-cancel', () => { if (updateAbort) updateAbort.abort(); });
ipcMain.handle('update-auto', (_e, on) => {
  loadSettings().updateAuto = !!on;
  saveSettings();
  return updateStatus();
});
ipcMain.handle('update-page', () => shell.openExternal(update.latest ? update.latest.page : UPDATE_PAGE));

// Checks a few seconds after start, then once a day while the app stays open,
// unless automatic checks are turned off in Settings.
function scheduleUpdateChecks() {
  const auto = () => { if (loadSettings().updateAuto !== false) checkForUpdates(); };
  setTimeout(auto, 8000);
  setInterval(auto, UPDATE_EVERY);
}

app.whenReady().then(async () => {
  // the user's name and e-mail, asked once for every SCAFFApps app (registration.js); required
  const who = await registration.ensure({ appId: 'multi-screens', appName: 'Multi Screens', version: app.getVersion(),
    icon: path.join(__dirname, 'app', 'icon.png'), theme: loadSettings().appTheme });
  if (!who) { app.quit(); return; }
  watchDisplays();
  createWindow();
  scheduleUpdateChecks();
  removeReplacedFile();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());

// Moves a synthetic mouse over a guest page (coordinates in on-screen pixels of
// the pane) so hover effects can be mirrored from another pane.
ipcMain.handle('mouse-move', (_e, id, x, y, leave) => {
  const wc = webContents.fromId(id);
  if (!wc || wc.isDestroyed()) return;
  wc.sendInputEvent({ type: leave ? 'mouseLeave' : 'mouseMove', x: Math.round(x), y: Math.round(y) });
});
