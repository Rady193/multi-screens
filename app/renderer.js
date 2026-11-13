'use strict';

// Sizes are CSS pixels (what the page's media queries see), not hardware pixels.
// phys:   millimetres of real glass per CSS pixel, so screens can be drawn at
//         their true size relative to each other (a 6.8" phone next to a 6.3" one).
// top/bottom: system bars that take space away from the page (status bar at
//         the top, navigation bar at the bottom), in CSS px. Measured from
//         screenshots of the real phones.
// bar:    'page' = status bar takes the page's colour (iOS), 'dark' = dark strip (Android).
// cutout: camera cut-out drawn in the status bar.
// nav:    'android' = three-button navigation bar in the bottom strip.
// overlay: what floats over the bottom of the page: 'safari' = the floating
//         address bar, 'grip' = the home indicator line.
// radius/bezel: body shape, CSS px.
const DEVICES = [
  { id: 's24u',   name: 'Samsung S24 Ultra', w: 384,  h: 832,  dpr: 3.75, mobile: true,  touch: true,  ua: 'android', phys: 0.1885, top: 35, bottom: 52, bar: 'dark', cutout: 'hole',   nav: 'android', overlay: null,     radius: 8,  bezel: 7 },
  { id: 'ip16p',  name: 'iPhone 16 Pro',     w: 402,  h: 874,  dpr: 3,    mobile: true,  touch: true,  ua: 'iphone',  phys: 0.1654, top: 62, bottom: 0,  bar: 'page', cutout: 'island', nav: null,      overlay: 'safari', radius: 54, bezel: 9 },
  { id: 'ipad',   name: 'iPad',              w: 820,  h: 1180, dpr: 2,    mobile: true,  touch: true,  ua: 'ipad',    phys: 0.1927, top: 24, bottom: 0,  bar: 'page', cutout: null,     nav: null,      overlay: 'grip',   radius: 18, bezel: 22 },
  { id: 'laptop', name: 'Laptop 15.6"',      w: 1536, h: 864,  dpr: 1.25, mobile: false, touch: false, ua: 'desktop', phys: 0.2246, top: 0,  bottom: 0,  bar: null,   cutout: null,     nav: null,      overlay: null,     radius: 4,  bezel: 14 },
];
// Scale is a share of real-life size: at 100% a device is drawn life-size on
// this display, whichever other screens are shown beside it. That needs the
// physical size of the display the app is running on.
let displayInches = 15.6;
// What is known about the display the window is on (see displayInfo in main.js).
let displayInfo = null;
function applyDisplay(info) {
  if (!info) return;
  displayInfo = info;
  displayInches = info.inches;
}
const MIN_PIXEL = 0.1, MAX_PIXEL = 2, MIN_REAL = 0.15, MAX_REAL = 1.5;
// Millimetres of this display per layout pixel of the app window.
function hostMmPerPx() {
  const diagonal = Math.hypot(window.screen.width, window.screen.height) || 1;
  return (displayInches * 25.4) / diagonal;
}
// Pixel scale that draws `device` at `real` times its life size, and back.
const pixelScale = (device, real) => Math.min(MAX_PIXEL, Math.max(MIN_PIXEL, real * device.phys / hostMmPerPx()));
const realScale = (device, pixel) => pixel * hostMmPerPx() / device.phys;
// System bars currently shown: a phone held sideways hides its status bar.
function insets(device) {
  const sideways = device.w > device.h && device.cutout;
  return { top: sideways ? 0 : device.top, bottom: device.bottom };
}
const outerW = (device) => device.w + 2 * device.bezel;
const outerH = (device) => device.h + 2 * device.bezel;

// Icons are drawn on a 24px grid with a 1.75px rounded stroke.
const ICONS = {
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  forward: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  reload: '<path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4"/><path d="M19.5 4.5v4.6h-4.6"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.500c-2.6-2.4-3.9-5.2-3.9-8.500s1.3-6.1 3.9-8.500z"/>',
  rotate: '<rect x="4" y="9.5" width="9.5" height="11" rx="2"/><path d="M10 4.500h3.500a6 6 0 0 1 6 6V13"/><path d="m16.8 10.6 2.7 2.7 2.7-2.7"/>',
  camera: '<path d="M4.5 8h2.800l1.5-2.500h6.400L16.7 8h2.800A1.5 1.5 0 0 1 21 9.500V17.500A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.500V9.500A1.5 1.5 0 0 1 4.5 8z"/><circle cx="12" cy="13.3" r="3.3"/>',
  code: '<path d="m8 7.5-4.5 4.500L8 16.5"/><path d="m16 7.5 4.5 4.500L16 16.5"/><path d="m13.6 5-3.2 14"/>',
  overflow: '<rect x="3.5" y="5" width="11" height="14" rx="2"/><path d="M14.5 12h6"/><path d="m18 9.2 2.8 2.800L18 14.8"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
  moon: '<path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a7.6 7.6 0 1 0 9.7 9.7z"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  key: '<circle cx="8" cy="15.5" r="3.5"/><path d="M10.6 13 19.5 4"/><path d="m15.5 8 2.6 2.6"/>',
  record: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>',
  stop: '<circle cx="12" cy="12" r="8.5"/><rect x="8.7" y="8.7" width="6.6" height="6.6" rx="1.2" fill="currentColor" stroke="none"/>',
  sliders: '<path d="M4 7.5h9M17.5 7.5H20M4 16.5h3M11.5 16.5H20"/><circle cx="15.2" cy="7.5" r="2.2"/><circle cx="9.2" cy="16.5" r="2.2"/>',
  note: '<path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-6.5L8.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M12 8.5v5M9.5 11h5"/>',
  report: '<path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13.5 3.5V8H18M8.5 12.5h7M8.5 16h5"/>',
  folder: '<path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2H19A1.5 1.5 0 0 1 20.5 9v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
  expand: '<path d="M14 4.5h5.5V10M19.5 4.5 13 11M10 19.5H4.5V14M4.5 19.5 11 13"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9.5 7V5h5v2"/><path d="M6.5 7l.8 11.500A1.5 1.5 0 0 0 8.8 20h6.400a1.5 1.5 0 0 0 1.5-1.500L17.5 7"/>',
};
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const api = window.multiScreens;
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const urlInput = $('url');

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } },
};

let cfg;
let zoom = store.get('zoom', null) ?? 0.5;
// 'each': every screen as large as the window allows (row scrolls sideways),
// 'all': every screen visible at once, 'zoom': fixed slider value.
let view = store.get('viewMode', 'all');
let active = null;
let hoverSource = null;
const panes = [];

function normalizeUrl(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  let candidate;
  if (/^(https?|file):\/\//i.test(t)) candidate = t;
  else if (/^(localhost|127\.0\.0\.1|\[::1\]|[\w-]+\.localhost|[\w.-]+\.test)(:\d+)?(\/|$)/i.test(t)) candidate = 'http://' + t;
  else candidate = 'https://' + t;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'file:' && !url.hostname) return null;
    return url.href;
  } catch { return null; }
}

const MIN_PANE = 214;
// Height of a pane's own controls: name and size rows above, buttons below.
const CHROME_H = 104;

function toast(message, onClick) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  el.onclick = () => { el.hidden = true; if (onClick) onClick(); };
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 5000);
}

function visiblePanes() { return panes.filter((p) => !p.el.hidden); }

function setActive(pane) {
  if (active === pane) return;
  active = pane;
  for (const p of panes) p.el.classList.toggle('active', p === pane);
  showUrl(pane.wv.getURL());
}

function showUrl(url) {
  if (document.activeElement === urlInput) return;
  urlInput.value = url && url !== cfg.startUrl ? url : '';
}

function layoutPane(pane) {
  const { device } = pane;
  const z = pane.zoom;
  const { top, bottom } = insets(device);
  const px = (n) => Math.round(n * z);
  const bezel = Math.max(2, px(device.bezel));
  pane.frame.style.padding = bezel + 'px';
  pane.frame.style.borderRadius = px(device.radius + device.bezel) + 'px';
  pane.screen.style.width = px(device.w) + 'px';
  pane.screen.style.height = px(device.h) + 'px';
  pane.screen.style.borderRadius = px(device.radius) + 'px';
  pane.screen.style.fontSize = (15 * z).toFixed(2) + 'px';
  pane.status.hidden = !top;
  pane.status.style.height = px(top) + 'px';
  pane.home.hidden = !bottom;
  pane.home.style.height = px(bottom) + 'px';
  // The page gets the screen minus the status and navigation bars.
  pane.view.style.height = px(device.h) - (top ? px(top) : 0) - (bottom ? px(bottom) : 0) + 'px';
  pane.el.style.width = Math.max(px(device.w) + 2 * bezel, MIN_PANE) + 'px';
  if (document.activeElement !== pane.pctInput) pane.pctInput.value = Math.round(realScale(device, z) * 100);
  pane.el.classList.toggle('custom', pane.custom != null);
  pane.wInput.value = device.w;
  pane.hInput.value = device.h;
  clearTimeout(pane.emulateTimer);
  pane.emulateTimer = setTimeout(() => emulatePane(pane), 70);
}

// `override` replaces individual values for one call (used while capturing).
function emulatePane(pane, override) {
  if (!pane.ready) return undefined;
  const { w, h, dpr, mobile, touch, ua } = pane.device;
  const { top, bottom } = insets(pane.device);
  return api.emulate(pane.wv.getWebContentsId(), {
    w, dpr, mobile, touch, ua,
    h: h - top - bottom,
    screenH: h,
    touchMouse: $('touch-input').checked,
    scale: pane.zoom,
    scheme: $('scheme').value,
    reducedMotion: $('reduced-motion').checked,
    network: $('network').value,
    ...(override && typeof override === 'object' ? override : {}),
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Takes a sharp picture of a screen. A screen is normally drawn scaled down, so
// a plain capture would be small and blurry. Instead the page is drawn at full
// size for a moment, hidden behind a frozen picture of itself, captured, and
// put back.
async function captureScreen(pane) {
  if (!pane.ready || pane.capturing) return null;
  const { device, wv } = pane;
  const id = wv.getWebContentsId();
  const hostRatio = window.devicePixelRatio || 1;
  pane.capturing = true;
  const cover = document.createElement('img');
  cover.className = 'capture-cover';
  try {
    const frozen = await api.capture.begin(id, true);
    if (frozen) {
      cover.src = frozen.dataUrl;
      pane.view.append(cover);
    }
    // Aim for the device's own pixel density. A pane cannot be drawn larger
    // than the app window, or the picture comes back cut off at the edge.
    const roomW = Math.min(window.innerWidth, window.screen.width);
    const roomH = Math.min(window.innerHeight, window.screen.height);
    let scale = Math.max(1, Math.min(device.dpr, 3) / hostRatio);
    scale = Math.max(pane.zoom, Math.min(scale, roomW / device.w, roomH / device.h));
    wv.style.flex = 'none';
    wv.style.width = Math.round(device.w * scale) + 'px';
    const bars = insets(device);
    wv.style.height = Math.round((device.h - bars.top - bars.bottom) * scale) + 'px';
    await emulatePane(pane, { scale });
    await sleep(450);
    // The page is redrawn at the larger size a moment after it is asked to.
    // If the picture comes back smaller than that, it was taken too early:
    // wait and take it again rather than keep a blurry one.
    const wanted = Math.round(device.w * scale) * hostRatio;
    let shot = await api.capture.begin(id, false);
    for (let attempt = 0; attempt < 5 && shot && shot.width < wanted * 0.9; attempt++) {
      api.capture.cancel(shot.token);
      await sleep(300);
      shot = await api.capture.begin(id, false);
    }
    wv.style.flex = '';
    wv.style.width = '';
    wv.style.height = '';
    await emulatePane(pane);
    await sleep(200);
    return shot;
  } catch {
    wv.style.flex = '';
    wv.style.width = '';
    wv.style.height = '';
    emulatePane(pane);
    return null;
  } finally {
    cover.remove();
    pane.capturing = false;
  }
}

// The colour a page presents at its top edge: its theme colour, else its background.
const PAGE_COLOUR_SCRIPT = `(() => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && meta.content) return meta.content;
  const solid = (el) => {
    const c = el && getComputedStyle(el).backgroundColor;
    return c && c !== 'transparent' && !/,\\s*0\\)$/.test(c) ? c : null;
  };
  return solid(document.body) || solid(document.documentElement) || '#ffffff';
})()`;

const OUTLINE_CSS = '* { outline: 1px solid rgba(255, 0, 90, .45) !important; outline-offset: -1px !important; }';
const OVERFLOW_CSS = '[data-ms-overflow] { outline: 2px dashed #ff2d2d !important; outline-offset: -2px !important; background-color: rgba(255, 45, 45, .14) !important; }';
// Marks every element that sticks out past the viewport edge, but only when the
// page really scrolls sideways (carousels and off-canvas menus are not bugs).
const OVERFLOW_SCRIPT = `(() => {
  document.querySelectorAll('[data-ms-overflow]').forEach((e) => e.removeAttribute('data-ms-overflow'));
  const root = document.documentElement;
  const vw = root.clientWidth;
  const extra = Math.max(root.scrollWidth, document.body ? document.body.scrollWidth : 0) - vw;
  let count = 0;
  if (extra > 1 && document.body) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.right + scrollX > vw + 1 || r.left + scrollX < -1)) {
        el.setAttribute('data-ms-overflow', '');
        count++;
      }
    }
  }
  return { extra: Math.max(0, Math.round(extra)), count };
})()`;

async function applyOutline(pane) {
  if (!pane.ready) return;
  const on = $('outline').checked;
  try {
    if (on && !pane.outlineKey) pane.outlineKey = await pane.wv.insertCSS(OUTLINE_CSS);
    else if (!on && pane.outlineKey) {
      const key = pane.outlineKey;
      pane.outlineKey = null;
      await pane.wv.removeInsertedCSS(key);
    }
  } catch { /* page navigated away */ }
}

async function findOverflow() {
  const found = [];
  for (const pane of visiblePanes()) {
    if (!pane.ready) continue;
    try {
      if (!pane.overflowKey) pane.overflowKey = await pane.wv.insertCSS(OVERFLOW_CSS);
      const result = await pane.wv.executeJavaScript(OVERFLOW_SCRIPT);
      if (result.extra > 0) found.push(`${pane.device.name}: ${result.extra}px too wide, ${result.count} element${result.count === 1 ? '' : 's'} highlighted`);
    } catch { /* page navigated away */ }
  }
  toast(found.length ? 'Sideways overflow — ' + found.join(' · ') : 'No sideways overflow on any screen.');
}

async function screenshotAll() {
  let last = null, count = 0;
  for (const pane of visiblePanes()) {
    if (!pane.ready) continue;
    const shot = await captureScreen(pane);
    const file = shot && await api.capture.save(shot.token, pane.device.name, false);
    if (file) { last = file; count++; }
  }
  if (last) toast(`Saved ${count} screenshot${count === 1 ? '' : 's'} — click to show`, () => api.reveal(last));
}

function setErrors(pane, count) {
  pane.errors = count;
  pane.badge.textContent = count > 99 ? '99+' : String(count);
  pane.badge.hidden = count === 0;
}

function saveHidden() {
  store.set('hidden', panes.filter((p) => p.el.hidden).map((p) => p.device.id));
}

// Clicking a screen's name shows only that screen; clicking again restores the rest.
let soloRestore = null;
function toggleSolo(pane) {
  if (soloRestore) {
    for (const p of panes) p.el.hidden = soloRestore.includes(p.device.id);
    soloRestore = null;
  } else {
    soloRestore = panes.filter((p) => p.el.hidden).map((p) => p.device.id);
    for (const p of panes) p.el.hidden = p !== pane;
  }
  for (const p of panes) p.box.checked = !p.el.hidden;
  saveHidden();
  refit();
}

function setView(mode) {
  view = mode;
  store.set('viewMode', mode);
  $('fit-each').classList.toggle('on', mode === 'each');
  $('fit').classList.toggle('on', mode === 'all');
  $('actual').classList.toggle('on', mode === 'actual');
}

function setZoom(value, mode = 'zoom') {
  zoom = Math.min(MAX_REAL, Math.max(MIN_REAL, value));
  $('zoom').value = Math.round(zoom * 100);
  $('zoom-label').textContent = Math.round(zoom * 100) + '%';
  store.set('zoom', zoom);
  setView(mode);
  // `zoom` is a share of life size, the same for every screen, so devices stay
  // in true proportion. A screen with its own scale ignores the slider.
  for (const pane of panes) pane.zoom = pixelScale(pane.device, pane.custom ?? zoom);
  panes.forEach(layoutPane);
}

// Each screen gets the largest scale that fits the window on its own.
function fitEach() {
  const availW = stage.clientWidth - 32;
  const availH = stage.clientHeight - 32 - CHROME_H - 14;
  for (const pane of panes) {
    if (pane.custom != null) {
      pane.zoom = pixelScale(pane.device, pane.custom);
      continue;
    }
    const z = Math.min(MAX_PIXEL, availH / outerH(pane.device), availW / outerW(pane.device));
    pane.zoom = Math.max(MIN_PIXEL, Math.floor(z * 100) / 100);
  }
  $('zoom-label').textContent = 'auto';
  setView('each');
  panes.forEach(layoutPane);
}

function refit() {
  if (view === 'each') fitEach();
  else if (view === 'all') fitAll();
  // 'actual': every screen life-size, whatever display the window is on.
  else if (view === 'actual') setZoom(1, 'actual');
  else setZoom(zoom);
}

function fitAll() {
  const shown = visiblePanes();
  if (!shown.length) return;
  const gap = 14, pad = 32, head = CHROME_H;
  const availW = stage.clientWidth - pad - gap * (shown.length - 1);
  const availH = stage.clientHeight - pad - head - 14;
  // One share of life size scales every screen, except those with their own scale.
  // Narrow screens keep a minimum pane width for their buttons, so search downwards.
  const scaleOf = (p, zz) => pixelScale(p.device, p.custom ?? zz);
  const rowWidth = (zz) => shown.reduce((s, p) => s + Math.max(Math.round(outerW(p.device) * scaleOf(p, zz)), MIN_PANE), 0);
  const rowHeight = (zz) => Math.max(...shown.map((p) => outerH(p.device) * scaleOf(p, zz)));
  let z = MAX_REAL;
  while (z > MIN_REAL && (rowWidth(z) > availW || rowHeight(z) > availH)) z = Math.round((z - 0.01) * 100) / 100;
  setZoom(z, 'all');
}

function saveSizes() {
  store.set('sizes', Object.fromEntries(panes.map((p) => [p.device.id, [p.device.w, p.device.h]])));
}

function createPane(device) {
  const el = document.createElement('section');
  el.className = 'pane';

  const head = document.createElement('div');
  head.className = 'pane-head';
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = device.name;
  name.title = `${device.name} — pixel ratio ${device.dpr}. Click to show only this screen.`;
  // Size as a share of life size; typing a value sizes this screen on its own.
  const pct = document.createElement('span');
  pct.className = 'pct';
  const pctInput = Object.assign(document.createElement('input'), {
    type: 'number', min: 10, max: 200,
    title: 'Size compared with the real device (100 = life size on this display). Type a value to size this screen on its own.',
  });
  const pctReset = document.createElement('button');
  pctReset.className = 'pct-reset';
  pctReset.innerHTML = icon('close');
  pctReset.title = 'Follow the zoom slider again';
  pct.append(pctInput, '%', pctReset);
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.hidden = true;
  badge.title = 'Errors logged by the page — click to open developer tools';

  const size = document.createElement('span');
  size.className = 'size';
  const wInput = Object.assign(document.createElement('input'), { type: 'number', min: 200, max: 4000, title: 'Width (CSS px)' });
  const hInput = Object.assign(document.createElement('input'), { type: 'number', min: 200, max: 4000, title: 'Height (CSS px)' });
  size.append(wInput, '×', hInput);

  const spacer = document.createElement('span');
  spacer.className = 'spacer';

  const button = (label, title, onClick) => {
    const b = document.createElement('button');
    b.innerHTML = icon(label);
    b.setAttribute('aria-label', title);
    b.title = title;
    b.addEventListener('click', onClick);
    return b;
  };

  const frame = document.createElement('div');
  frame.className = 'frame';
  const wv = document.createElement('webview');
  wv.setAttribute('partition', 'persist:multiscreens');
  wv.setAttribute('preload', cfg.guestPreload);
  wv.setAttribute('useragent', cfg.userAgents[device.ua]);
  wv.setAttribute('allowpopups', '');
  wv.setAttribute('src', normalizeUrl(store.get('url', null)) || cfg.startUrl);
  const error = document.createElement('div');
  error.className = 'error';
  error.hidden = true;
  // Device body: bezel > screen > status bar, page, home indicator.
  const div = (className) => Object.assign(document.createElement('div'), { className });
  const screen = div('screen');
  const status = div('statusbar ' + (device.bar || ''));
  const clock = div('clock');
  clock.textContent = '9:41';
  const battery = div('battery');
  status.append(clock);
  if (device.cutout) status.append(div('cutout ' + device.cutout));
  status.append(battery);
  const view = div('view');
  // Transparent layer that takes the mouse while a note is being placed.
  const noteLayer = div('note-layer');
  noteLayer.hidden = true;
  // What floats over the bottom of the page on the real device.
  const overlay = div('page-overlay ' + (device.overlay || ''));
  const barText = document.createElement('span');
  if (device.overlay === 'safari') {
    const address = div('address');
    address.append(barText);
    overlay.append(div('round'), address, div('round'));
  } else if (device.overlay === 'grip') {
    overlay.append(div('grip'));
  }
  view.append(wv, error, overlay, noteLayer);
  const home = div('homebar ' + (device.nav || ''));
  if (device.nav === 'android') {
    home.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12l6.5 6.5"/></svg>'
      + '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3.5"/></svg>'
      + '<svg viewBox="0 0 24 24"><path d="M7.5 6v12M12 6v12M16.5 6v12"/></svg>';
  }
  screen.append(status, view, home);
  frame.append(screen);

  const pane = { device, el, frame, screen, status, view, home, wv, wInput, hInput, error, name, pct, pctInput, badge, zoom, custom: store.get('customScale', {})[device.id] ?? null, ready: false, errors: 0, outlineKey: null, overflowKey: null, box: null };
  name.addEventListener('click', () => toggleSolo(pane));
  const setCustom = (value) => {
    pane.custom = value;
    store.set('customScale', Object.fromEntries(panes.filter((p) => p.custom != null).map((p) => [p.device.id, p.custom])));
    refit();
  };
  pctInput.addEventListener('change', () => {
    const v = Number(pctInput.value) / 100;
    pctInput.blur();
    if (v >= 0.1 && v <= 2) setCustom(v);
    else refit();
  });
  pctReset.addEventListener('click', () => setCustom(null));
  badge.addEventListener('click', () => api.devtools(wv.getWebContentsId()));

  const tools = document.createElement('div');
  tools.className = 'pane-tools';
  head.append(name, pct, badge);
  tools.append(size);
  const actions = document.createElement('div');
  actions.className = 'pane-actions';
  const bar = document.createElement('div');
  bar.className = 'bar';
  actions.append(bar);
  pane.noteLayer = noteLayer;
  pane.recBtn = button('record', 'Record a video of this screen', () => toggleRecording(pane));
  pane.recBtn.classList.add('rec-btn');
  pane.noteBtn = button('note', 'Add a note: click a spot or drag over an area on this screen, then write your comment', () => startNoting(pane));
  pane.reportBtn = button('report', 'Review this screen\'s notes and create the PDF report (add a note first)', () => openReview(device.id));
  pane.reportBtn.classList.add('report-btn');
  pane.noteBtn.classList.add('note-btn');
  setupNoteLayer(pane);
  bar.append(
    button('rotate', 'Rotate', () => {
      [device.w, device.h] = [device.h, device.w];
      saveSizes();
      refit();
    }),
    button('reload', 'Reload this screen', () => wv.reload()),
    button('camera', 'Save a screenshot of this screen', async () => {
      const shot = await captureScreen(pane);
      const file = shot && await api.capture.save(shot.token, device.name, false);
      if (file) toast(`Saved ${file} — click to show`, () => api.reveal(file));
    }),
    pane.recBtn,
    button('code', 'Open developer tools for this screen', () => api.devtools(wv.getWebContentsId())),
    h('span', { className: 'bar-sep' }),
    pane.noteBtn,
    pane.reportBtn,
  );
  el.append(head, tools, frame, actions);

  const onSize = () => {
    const w = Math.round(Number(wInput.value)), h = Math.round(Number(hInput.value));
    if (w >= 200 && w <= 4000 && h >= 200 && h <= 4000) {
      device.w = w;
      device.h = h;
      saveSizes();
    }
    refit();
  };
  wInput.addEventListener('change', onSize);
  hInput.addEventListener('change', onSize);

  wv.addEventListener('dom-ready', () => {
    pane.ready = true;
    // A new document drops any injected styles.
    pane.outlineKey = null;
    pane.overflowKey = null;
    emulatePane(pane);
    applyOutline(pane);
  });
  // An iOS status bar takes the colour of the page beneath it.
  const tintStatusBar = async () => {
    if (device.bar !== 'page') return;
    let colour = '#ffffff';
    try { colour = await wv.executeJavaScript(PAGE_COLOUR_SCRIPT) || colour; } catch { /* keep white */ }
    status.style.backgroundColor = colour;
    const rgb = (getComputedStyle(status).backgroundColor.match(/[\d.]+/g) || [255, 255, 255]).map(Number);
    const light = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 150;
    status.style.color = light ? '#000' : '#fff';
  };
  const showAddress = () => {
    try { barText.textContent = new URL(wv.getURL()).host; } catch { barText.textContent = ''; }
  };
  wv.addEventListener('dom-ready', () => { tintStatusBar(); showAddress(); });
  wv.addEventListener('did-navigate-in-page', () => { tintStatusBar(); showAddress(); });
  wv.addEventListener('did-change-theme-color', tintStatusBar);
  wv.addEventListener('did-navigate', () => setErrors(pane, 0));
  wv.addEventListener('console-message', (e) => {
    if (e.level === 3) setErrors(pane, pane.errors + 1);
  });
  // The developer tools window takes over the emulation channel; restore it after.
  wv.addEventListener('devtools-opened', () => emulatePane(pane));
  wv.addEventListener('devtools-closed', () => emulatePane(pane));

  // A thin progress line runs along the top of the screen while a page loads.
  wv.addEventListener('did-start-loading', () => { error.hidden = true; el.classList.add('loading'); });
  wv.addEventListener('did-stop-loading', () => el.classList.remove('loading'));
  wv.addEventListener('did-fail-load', (e) => {
    if (!e.isMainFrame || e.errorCode === -3) return;
    error.replaceChildren(
      Object.assign(document.createElement('strong'), { textContent: 'Could not load the page' }),
      Object.assign(document.createElement('span'), { textContent: e.errorDescription }),
      Object.assign(document.createElement('small'), { textContent: e.validatedURL }),
    );
    error.hidden = false;
  });

  const onNavigate = (e) => {
    if (e.isMainFrame === false || pane !== active) return;
    showUrl(e.url);
    if (e.url !== cfg.startUrl) store.set('url', e.url);
    addHistory(e.url, pane.wv.getTitle());
    if (!$('sync-nav').checked) return;
    for (const other of panes) {
      if (other !== pane && other.ready && other.wv.getURL() !== e.url) other.wv.loadURL(e.url).catch(() => {});
    }
  };
  wv.addEventListener('page-title-updated', (e) => {
    if (pane === active) setHistoryTitle(wv.getURL(), e.title);
  });
  wv.addEventListener('did-navigate', onNavigate);
  wv.addEventListener('did-navigate-in-page', onNavigate);

  wv.addEventListener('ipc-message', (e) => {
    if (e.channel === 'activity') {
      setActive(pane);
    } else if (e.channel === 'scroll' && pane === active && !pane.capturing && $('sync-scroll').checked) {
      for (const other of panes) {
        if (other !== pane && other.ready) other.wv.send('scroll-to', e.args[0]);
      }
    } else if ((e.channel === 'click' || e.channel === 'input') && $('sync-input').checked) {
      setActive(pane);
      for (const other of panes) {
        if (other !== pane && other.ready) other.wv.send(e.channel + '-at', e.args[0]);
      }
    } else if (e.channel === 'hover' && pane === hoverSource && $('sync-input').checked) {
      for (const other of panes) {
        if (other !== pane && other.ready && !other.el.hidden) other.wv.send('hover-at', e.args[0]);
      }
    } else if (e.channel === 'hover-point' && pane !== hoverSource && hoverSource) {
      // The page answers in its own CSS pixels; the pane is drawn scaled.
      api.mouseMove(wv.getWebContentsId(), e.args[0].x * pane.zoom, e.args[0].y * pane.zoom, false);
    }
  });

  // Only the pane under the real mouse is a hover source; the mirrored mouse
  // moves in the other panes must not echo back.
  wv.addEventListener('mouseenter', () => { hoverSource = pane; });
  wv.addEventListener('mouseleave', () => {
    if (hoverSource !== pane) return;
    hoverSource = null;
    for (const other of panes) {
      if (other !== pane && other.ready) api.mouseMove(other.wv.getWebContentsId(), 0, 0, true);
    }
  });

  return pane;
}

function loadAll(url) {
  for (const pane of panes) pane.wv.loadURL(url).catch(() => {});
}

// ---- Small DOM helper and popover ------------------------------------------

function h(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((c) => c != null));
  return node;
}

function closePopover() {
  const pop = $('popover');
  pop.hidden = true;
  delete pop.dataset.for;
}

function togglePopover(anchor, build) {
  const pop = $('popover');
  if (!pop.hidden && pop.dataset.for === anchor.id) { closePopover(); return; }
  pop.replaceChildren();
  build(pop);
  pop.dataset.for = anchor.id;
  pop.hidden = false;
  const r = anchor.getBoundingClientRect();
  pop.style.top = Math.round(r.bottom + 8) + 'px';
  pop.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
}

// ---- History of visited pages ----------------------------------------------

const HISTORY_MAX = 300;
let historyItems = [];

function saveHistory() {
  store.set('history', historyItems);
  $('url-history').replaceChildren(...historyItems.slice(0, 60).map((i) => h('option', { value: i.url })));
}

function addHistory(url, title) {
  if (!url || url === cfg.startUrl) return;
  const existing = historyItems.find((i) => i.url === url);
  historyItems = historyItems.filter((i) => i !== existing);
  historyItems.unshift({ url, title: title || (existing && existing.title) || '', t: Date.now() });
  if (historyItems.length > HISTORY_MAX) historyItems.length = HISTORY_MAX;
  saveHistory();
}

function setHistoryTitle(url, title) {
  const item = historyItems.find((i) => i.url === url);
  if (item && title && item.title !== title) {
    item.title = title;
    saveHistory();
  }
}

function when(time) {
  const d = new Date(time);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function buildHistory(pop) {
  pop.append(h('div', { className: 'pop-head' },
    h('strong', { textContent: 'History' }),
    historyItems.length ? h('button', {
      className: 'link', textContent: 'Clear all', title: 'Delete the whole list',
      onclick: () => {
        if (!confirm('Delete the whole history list?')) return;
        historyItems = [];
        saveHistory();
        closePopover();
      },
    }) : null));
  if (!historyItems.length) {
    pop.append(h('p', { className: 'pop-note', textContent: 'Pages you open will be listed here.' }));
    return;
  }
  const list = h('div', { className: 'pop-list' });
  for (const item of historyItems) {
    list.append(h('button', {
      className: 'pop-row', title: item.url,
      onclick: () => { closePopover(); loadAll(item.url); },
    },
    h('span', { className: 'row-main' },
      h('span', { className: 'row-title', textContent: item.title || item.url }),
      h('span', { className: 'row-sub', textContent: item.url })),
    h('span', { className: 'row-when', textContent: when(item.t) })));
  }
  pop.append(list);
}

// ---- Saved logins (passwords are encrypted and kept in the main process) ----

function currentOrigin() {
  try {
    const url = new URL(active.wv.getURL());
    return url.protocol === 'file:' ? '' : url.origin;
  } catch { return ''; }
}

async function buildLogins(pop) {
  pop.replaceChildren(h('div', { className: 'pop-head' }, h('strong', { textContent: 'Saved logins' })));
  const data = await api.logins.list();
  if (!data.available) {
    pop.append(h('p', { className: 'pop-note', textContent: 'This computer cannot encrypt passwords, so logins cannot be saved here.' }));
    return;
  }
  if (data.items.length) {
    const list = h('div', { className: 'pop-list' });
    for (const item of data.items) {
      list.append(h('div', { className: 'pop-row static' },
        h('span', { className: 'row-main' },
          h('span', { className: 'row-title', textContent: item.username }),
          h('span', { className: 'row-sub', textContent: item.origin })),
        h('button', {
          className: 'small primary', textContent: 'Fill',
          title: 'Type this login into the sign-in form on every screen showing this site',
          onclick: async () => {
            const ids = panes.filter((p) => p.ready && !p.el.hidden).map((p) => p.wv.getWebContentsId());
            const result = await api.logins.fill(item.id, ids);
            closePopover();
            toast(result.filled
              ? `Filled the login on ${result.filled} screen${result.filled === 1 ? '' : 's'}.`
              : `No screen is showing ${item.origin}.`);
          },
        }),
        h('button', {
          className: 'small icon-only', innerHTML: icon('trash'), title: 'Delete this saved login',
          onclick: async () => {
            if (!confirm(`Delete the saved login "${item.username}" for ${item.origin}? This cannot be undone.`)) return;
            await api.logins.remove(item.id);
            buildLogins(pop);
          },
        })));
    }
    pop.append(list);
  } else {
    pop.append(h('p', { className: 'pop-note', textContent: 'No logins saved yet.' }));
  }

  const site = h('input', { type: 'text', placeholder: 'https://myapp.example.com', value: currentOrigin(), spellcheck: false, required: true });
  const user = h('input', { type: 'text', placeholder: 'Username or email', autocomplete: 'off', spellcheck: false, required: true });
  const pass = h('input', { type: 'password', placeholder: 'Password', autocomplete: 'new-password', required: true });
  pop.append(h('form', {
    className: 'pop-form',
    onsubmit: async (e) => {
      e.preventDefault();
      const result = await api.logins.save({ origin: site.value, username: user.value, password: pass.value });
      pass.value = '';
      if (result.error) toast(result.error);
      else buildLogins(pop);
    },
  },
  h('strong', { textContent: 'Add a login' }),
  h('label', {}, 'Site', site),
  h('label', {}, 'Username', user),
  h('label', {}, 'Password', pass),
  h('button', { type: 'submit', className: 'primary', textContent: 'Save login' })),
  h('p', { className: 'pop-note', textContent: 'Passwords are encrypted with your Windows account and stay on this computer. A login is only filled into pages of the site it was saved for.' }));
}

// ---- Video recording of the app window --------------------------------------

let recorder = null;
let recordTimer = 0;

// The pane being recorded on its own, or null when the whole window is.
let recordingPane = null;

function setRecordingUi(startedAt) {
  const button = $('record-btn');
  clearInterval(recordTimer);
  button.classList.toggle('recording', !!startedAt);
  button.innerHTML = icon(startedAt ? 'stop' : 'record');
  button.title = startedAt ? 'Stop recording and save the video' : 'Record a video of the app window';
  for (const pane of panes) {
    const on = !!startedAt && pane === recordingPane;
    pane.recBtn.classList.toggle('recording', on);
    pane.recBtn.innerHTML = icon(on ? 'stop' : 'record');
    pane.recBtn.title = on ? 'Stop recording and save the video' : 'Record a video of this screen';
  }
  $('record-time').hidden = !startedAt;
  if (!startedAt) return;
  const tick = () => {
    const s = Math.floor((Date.now() - startedAt) / 1000);
    $('record-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  tick();
  recordTimer = setInterval(tick, 500);
}

// Starts a recording, or stops the one in progress. With a pane, only that
// device is recorded; without, the whole app window.
async function toggleRecording(pane) {
  if (recorder) { recorder.stop(); return; }
  const what = pane ? pane.device.name : 'the app window';
  if (!confirm(`Start recording ${what}?\n\nThe recording runs until you press the record button again. There is no sound.`)) return;
  let stream;
  try {
    const sourceId = await api.mediaSourceId();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId, maxFrameRate: 30 } },
    });
  } catch (err) {
    console.warn('Recording could not start:', err && err.message);
    toast('Recording could not start.');
    return;
  }

  // One device: the window is still what gets captured, and each frame is cut
  // down to that device's body on a canvas. The device can move (scrolling the
  // row, changing the zoom); its place is looked up again for every frame.
  let recorded = stream;
  let stopCutting = () => {};
  if (pane) {
    const video = document.createElement('video');
    video.muted = true;
    video.srcObject = stream;
    try { await video.play(); } catch { /* frames still arrive */ }
    for (let i = 0; i < 40 && !video.videoWidth; i++) await sleep(50);
    const kx = () => video.videoWidth / window.innerWidth;
    const ky = () => video.videoHeight / window.innerHeight;
    const first = pane.frame.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    // Video encoders want even dimensions.
    canvas.width = Math.max(2, Math.round(first.width * kx() / 2) * 2);
    canvas.height = Math.max(2, Math.round(first.height * ky() / 2) * 2);
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const draw = () => {
      const r = pane.frame.getBoundingClientRect();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Keep the device's shape if its size on screen changes mid-recording.
      const fit = Math.min(canvas.width / (r.width * kx()), canvas.height / (r.height * ky()));
      const w = r.width * kx() * fit, hgt = r.height * ky() * fit;
      ctx.drawImage(video, r.left * kx(), r.top * ky(), r.width * kx(), r.height * ky(), (canvas.width - w) / 2, (canvas.height - hgt) / 2, w, hgt);
      frame = requestAnimationFrame(draw);
    };
    draw();
    recorded = canvas.captureStream(30);
    stopCutting = () => { cancelAnimationFrame(frame); video.srcObject = null; };
  }

  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  const chunks = [];
  recordingPane = pane || null;
  recorder = new MediaRecorder(recorded, { mimeType, videoBitsPerSecond: 8000000 });
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.onstop = async () => {
    recorder = null;
    stopCutting();
    setRecordingUi(0);
    recordingPane = null;
    stream.getTracks().forEach((t) => t.stop());
    const file = await api.saveVideo(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer(), pane ? pane.device.name : '');
    if (file) toast(`Saved ${file} — click to show`, () => api.reveal(file));
    else toast('The video could not be saved.');
  };
  recorder.start(1000);
  setRecordingUi(Date.now());

  // Windows hands back blank frames while the display is asleep or locked, and
  // the recording would be a plain white video. Look at one frame a moment in
  // and say so, rather than let that be discovered after the fact.
  const thisRecording = recorder;
  setTimeout(async () => {
    if (recorder !== thisRecording) return;
    try {
      const probe = document.createElement('video');
      probe.muted = true;
      probe.srcObject = stream;
      await probe.play();
      await sleep(300);
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 36;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(probe, 0, 0, 64, 36);
      const data = ctx.getImageData(0, 0, 64, 36).data;
      let darkest = 255, lightest = 0;
      for (let i = 0; i < data.length; i += 4) {
        const level = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (level < darkest) darkest = level;
        if (level > lightest) lightest = level;
      }
      probe.srcObject = null;
      if (recorder === thisRecording && lightest - darkest < 6) {
        toast('The recording looks blank. Make sure the display is on and the app is not minimised, then stop and record again.');
      }
    } catch { /* the check is only a courtesy */ }
  }, 1200);
}

// ---- Settings ---------------------------------------------------------------

function buildSettings(pop) {
  const inches = h('input', { type: 'number', min: 5, max: 100, step: 0.1, value: displayInches });
  const about = h('p', { className: 'pop-note' });
  const useDetected = h('button', { className: 'small', textContent: 'Use the detected size' });
  const describe = () => {
    const d = displayInfo || {};
    if (document.activeElement !== inches) inches.value = displayInches;
    useDetected.hidden = !d.override;
    about.textContent = (d.label ? d.label + ': ' : '')
      + (d.detected ? `the monitor reports ${d.detected} inches${d.mm ? ` (${d.mm} mm)` : ''}.` : 'this monitor does not report its size, so the figure is an estimate.')
      + (d.override ? ` You have set ${d.inches} inches instead.` : '')
      + (d.count > 1 ? ` ${d.count} displays are connected; the app uses the one its window is on.` : '');
  };
  inches.addEventListener('change', async () => {
    const v = Number(inches.value);
    if (!(v >= 5 && v <= 100)) { inches.value = displayInches; return; }
    applyDisplay(await api.display.set(v));
    describe();
    refit();
  });
  useDetected.addEventListener('click', async () => {
    applyDisplay(await api.display.set(null));
    describe();
    refit();
  });
  describe();
  pop.append(
    h('div', { className: 'pop-head' }, h('strong', { textContent: 'Settings' })),
    h('div', { className: 'pop-form' },
      h('label', {}, 'This display, diagonal in inches', inches),
      useDetected),
    about,
    h('p', {
      className: 'pop-note',
      textContent: 'Used to draw devices life-size at 100%. It is read from the monitor automatically. Change it only if a real phone held against the screen does not match.',
    }));

  const where = h('p', { className: 'pop-path' });
  const showFolder = async () => { where.textContent = (await api.output.get()).dir; };
  showFolder();
  pop.append(
    h('div', { className: 'pop-form' },
      h('strong', { textContent: 'Output folder' }),
      where,
      h('div', { className: 'note-editor-row' },
        h('button', { className: 'small', textContent: 'Open folder', onclick: () => api.output.open() }),
        h('button', {
          className: 'small', textContent: 'Change…',
          onclick: async () => { where.textContent = (await api.output.choose()).dir; },
        }))),
    h('p', {
      className: 'pop-note',
      textContent: 'Screenshots, videos and review reports are saved here, each in its own subfolder. Changing the folder does not move files already saved.',
    }));
}

// ---- Review notes -------------------------------------------------------------
// A note is a spot or an area marked on one screen, a screenshot of that screen
// taken at that moment, and the reviewer's comment. Notes are kept by the main
// process and turned into a PDF report on request.

let notes = [];
// The note being made: which pane, the captured screenshot's token, the mark.
let noting = null;

async function refreshNotes() {
  notes = await api.notes.list();
  for (const pane of panes) {
    const n = notes.filter((x) => x.deviceId === pane.device.id).length;
    pane.reportBtn.dataset.count = n || '';
    pane.reportBtn.title = n
      ? `Report ready: review the ${n} note${n === 1 ? '' : 's'} on this screen and create the PDF`
      : 'Review this screen\'s notes and create the PDF report (add a note first)';
  }
  $('notes-count').textContent = notes.length;
  $('notes-count').hidden = !notes.length;
}

function endNoting() {
  if (!noting) return;
  const { pane } = noting;
  noting = null;
  pane.noteLayer.hidden = true;
  pane.noteLayer.replaceChildren();
  pane.noteBtn.classList.remove('on');
  $('note-editor').hidden = true;
}

function cancelNoting() {
  if (!noting) return;
  if (noting.token) api.notes.cancel(noting.token);
  endNoting();
}

function startNoting(pane) {
  if (noting) {
    const same = noting.pane === pane;
    cancelNoting();
    if (same) return;
  }
  if (!pane.ready) return;
  noting = { pane, token: null, mark: null };
  pane.noteLayer.hidden = false;
  pane.noteBtn.classList.add('on');
  toast(`Click the spot, or drag to mark an area, on ${pane.device.name}. Esc cancels.`);
}

function drawMark(layer, mark, label) {
  const el = h('div', { className: 'note-mark ' + mark.type }, h('span', { textContent: label }));
  el.style.left = mark.x * 100 + '%';
  el.style.top = mark.y * 100 + '%';
  if (mark.type === 'area') {
    el.style.width = mark.w * 100 + '%';
    el.style.height = mark.h * 100 + '%';
  }
  layer.append(el);
  return el;
}

function setupNoteLayer(pane) {
  const layer = pane.noteLayer;
  let start = null;
  let box = null;
  const at = (e) => {
    const r = layer.getBoundingClientRect();
    const clamp = (v) => Math.min(1, Math.max(0, v));
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };
  layer.addEventListener('mousedown', (e) => {
    if (!noting || noting.pane !== pane || noting.token || noting.mark || e.button !== 0) return;
    e.preventDefault();
    start = at(e);
    box = h('div', { className: 'note-mark area drawing' });
    layer.append(box);
  });
  window.addEventListener('mousemove', (e) => {
    if (!start) return;
    const p = at(e);
    box.style.left = Math.min(start.x, p.x) * 100 + '%';
    box.style.top = Math.min(start.y, p.y) * 100 + '%';
    box.style.width = Math.abs(p.x - start.x) * 100 + '%';
    box.style.height = Math.abs(p.y - start.y) * 100 + '%';
  });
  window.addEventListener('mouseup', async (e) => {
    if (!start) return;
    const from = start;
    start = null;
    box.remove();
    if (!noting || noting.pane !== pane) return;
    const to = at(e);
    const r = layer.getBoundingClientRect();
    const w = Math.abs(to.x - from.x), hgt = Math.abs(to.y - from.y);
    // A drag of more than a few pixels marks an area; anything less is a spot.
    const mark = w * r.width > 6 && hgt * r.height > 6
      ? { type: 'area', x: Math.min(from.x, to.x), y: Math.min(from.y, to.y), w, h: hgt }
      : { type: 'point', x: from.x, y: from.y };
    noting.mark = mark;
    const number = notes.filter((x) => x.deviceId === pane.device.id).length + 1;
    drawMark(layer, mark, number);
    let shot;
    if (pane.isWindow) {
      // Picture of the whole app window, taken without the tint, mark or message in it.
      $('toast').hidden = true;
      layer.style.visibility = 'hidden';
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await sleep(80);
      shot = await api.capture.window();
      layer.style.visibility = '';
    } else {
      shot = await captureScreen(pane);
    }
    if (!noting || noting.pane !== pane) {
      if (shot) api.notes.cancel(shot.token);
      return;
    }
    if (!shot) {
      toast('The screen could not be captured.');
      cancelNoting();
      return;
    }
    noting.token = shot.token;
    openNoteEditor(pane, number, e.clientX, e.clientY);
  });
}

function openNoteEditor(pane, number, x, y) {
  const editor = $('note-editor');
  const { device } = pane;
  const text = h('textarea', { rows: 4, placeholder: 'Describe what you see here…' });
  const save = async () => {
    const value = text.value.trim();
    if (!value) { text.focus(); return; }
    await api.notes.add({
      token: noting.token,
      deviceId: device.id,
      deviceName: device.name,
      deviceSize: `${device.w} × ${device.h}`,
      dpr: device.dpr,
      url: (pane.isWindow ? active : pane).wv.getURL(),
      title: (pane.isWindow ? active : pane).wv.getTitle(),
      text: value,
      mark: noting.mark,
      // How the device is drawn right now, so the report can draw it the same way.
      frame: pane.isWindow ? null : (() => {
        const bars = insets(device);
        const bar = getComputedStyle(pane.status);
        const address = pane.el.querySelector('.address span');
        return {
          w: device.w, h: device.h, top: bars.top, bottom: bars.bottom,
          radius: device.radius, bezel: device.bezel,
          cutout: bars.top ? device.cutout : null, nav: device.nav, overlay: device.overlay,
          statusBg: bar.backgroundColor, statusFg: bar.color,
          host: address ? address.textContent : '',
        };
      })(),
    });
    noting.token = null;
    endNoting();
    await refreshNotes();
    toast(`Note ${number} saved for ${device.name}.`);
  };
  text.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
  });
  editor.replaceChildren(
    h('strong', { textContent: `Note ${number} · ${device.name}` }),
    text,
    h('div', { className: 'note-editor-row' },
      h('span', { className: 'pop-note', textContent: 'Ctrl+Enter saves' }),
      h('button', { className: 'small', textContent: 'Cancel', onclick: cancelNoting }),
      h('button', { className: 'small primary', textContent: 'Save note', onclick: save })));
  editor.hidden = false;
  editor.style.left = Math.max(8, Math.min(x + 16, window.innerWidth - 316)) + 'px';
  editor.style.top = Math.max(8, Math.min(y + 16, window.innerHeight - 230)) + 'px';
  text.focus();
}

async function makeReport(deviceId) {
  const count = notes.filter((x) => !deviceId || x.deviceId === deviceId).length;
  if (!count) {
    toast('There are no notes to report yet. Use the note button under a screen to add one.');
    return;
  }
  toast('Preparing the report…');
  // The screens on show are listed in the report, including those with no notes.
  const reviewed = visiblePanes().map((p) => ({ id: p.device.id, name: p.device.name, size: `${p.device.w} × ${p.device.h}`, dpr: p.device.dpr }));
  const result = await api.notes.report(deviceId || null, reviewed);
  if (result && result.file) {
    await refreshNotes();
    const cleared = result.cleared === 1 ? '1 note' : `${result.cleared} notes`;
    toast(`Report saved and ${cleared} cleared: ${result.file} — click to open`, () => api.notes.open(result.file));
  }
  else toast((result && result.error) || 'The report could not be created.');
}

function closeZoom() {
  const view = $('zoom-view');
  view.hidden = true;
  view.replaceChildren();
}

// A note's picture shown large, with its marker, and zoom controls.
// 100% means the whole picture fits the window; it can be enlarged up to 6 times.
function openZoom(note, number) {
  const view = $('zoom-view');
  let scale = 1;
  const picture = h('img', { alt: '' });
  const mark = h('div', { className: 'note-mark ' + note.mark.type }, h('span', { textContent: number }));
  mark.style.left = note.mark.x * 100 + '%';
  mark.style.top = note.mark.y * 100 + '%';
  if (note.mark.type === 'area') {
    mark.style.width = note.mark.w * 100 + '%';
    mark.style.height = note.mark.h * 100 + '%';
  }
  const sheet = h('div', { className: 'zoom-sheet', title: 'Click to zoom in on this point; click again to fit' }, picture, mark);
  const area = h('div', { className: 'zoom-area' }, sheet);
  const label = h('span', { className: 'zoom-pct' });
  const ratio = note.imgW / note.imgH;
  const fitSize = () => {
    const roomW = Math.max(120, area.clientWidth - 40);
    const roomH = Math.max(120, area.clientHeight - 40);
    return roomW / roomH > ratio ? { w: roomH * ratio, h: roomH } : { w: roomW, h: roomW / ratio };
  };
  // Zooms while keeping the point at (fx, fy) of the picture where it is on screen.
  const setScale = (next, fx = 0.5, fy = 0.5, atX = area.clientWidth / 2, atY = area.clientHeight / 2) => {
    scale = Math.min(6, Math.max(1, next));
    const fit = fitSize();
    sheet.style.width = Math.round(fit.w * scale) + 'px';
    sheet.style.height = Math.round(fit.h * scale) + 'px';
    label.textContent = Math.round(scale * 100) + '%';
    area.classList.toggle('zoomed', scale > 1);
    area.scrollLeft = sheet.offsetLeft + fx * sheet.offsetWidth - atX;
    area.scrollTop = sheet.offsetTop + fy * sheet.offsetHeight - atY;
  };
  const pointAt = (e) => {
    const r = sheet.getBoundingClientRect();
    const a = area.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, e.clientX - a.left, e.clientY - a.top];
  };
  sheet.addEventListener('click', (e) => {
    if (scale > 1) setScale(1);
    else setScale(2.5, ...pointAt(e));
  });
  area.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return; // plain wheel scrolls the enlarged picture
    e.preventDefault();
    setScale(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), ...pointAt(e));
  }, { passive: false });
  const step = (label, title, factor) => h('button', { className: 'small', textContent: label, title, onclick: () => setScale(scale * factor) });
  view.replaceChildren(
    h('div', { className: 'zoom-bar' },
      h('strong', { textContent: `Note ${number} · ${note.deviceName}` }),
      h('span', { className: 'pop-note', textContent: 'Click the picture or use Ctrl + mouse wheel to zoom' }),
      h('span', { className: 'spacer' }),
      step('−', 'Zoom out', 1 / 1.4),
      label,
      step('+', 'Zoom in', 1.4),
      h('button', { className: 'small', textContent: 'Fit', title: 'Show the whole picture', onclick: () => setScale(1) }),
      h('button', { className: 'small icon-only', innerHTML: icon('close'), title: 'Close (Esc)', onclick: closeZoom })),
    area);
  view.hidden = false;
  setScale(1);
  // The review list uses a small copy; fetch the sharp one for looking closely.
  api.notes.image(note.id, true).then((src) => { if (src) picture.src = src; });
}

function closeReview() {
  const modal = $('review-modal');
  modal.hidden = true;
  modal.replaceChildren();
}

// The review screen: every note that would go into the report, with its picture
// and marker. A comment can be reworded, a note discarded, and only then is the
// report created. `deviceId` limits it to one screen; without it, all notes.
async function openReview(deviceId) {
  await refreshNotes();
  const modal = $('review-modal');
  const list = notes.filter((n) => !deviceId || n.deviceId === deviceId);
  if (!list.length) {
    closeReview();
    toast('There are no notes to report yet. Use the note button under a screen to add one.');
    return;
  }
  const scope = deviceId ? list[0].deviceName : 'All screens';
  const items = h('div', { className: 'review-list' });
  const perDevice = {};
  for (const note of list) {
    perDevice[note.deviceId] = (perDevice[note.deviceId] || 0) + 1;
    const number = perDevice[note.deviceId];
    const picture = h('img', { alt: '' });
    api.notes.image(note.id).then((src) => { if (src) picture.src = src; });
    const mark = h('div', { className: 'note-mark ' + note.mark.type }, h('span', { textContent: number }));
    mark.style.left = note.mark.x * 100 + '%';
    mark.style.top = note.mark.y * 100 + '%';
    if (note.mark.type === 'area') {
      mark.style.width = note.mark.w * 100 + '%';
      mark.style.height = note.mark.h * 100 + '%';
    }
    const saved = h('span', { className: 'review-saved' });
    const text = h('textarea', { value: note.text, rows: 3, title: 'Edit the comment; it is saved when you click elsewhere' });
    text.addEventListener('change', async () => {
      const value = text.value.trim();
      if (!value) { text.value = note.text; return; }
      await api.notes.update(note.id, value);
      note.text = value;
      saved.textContent = 'Saved';
      setTimeout(() => { saved.textContent = ''; }, 1600);
    });
    items.append(h('div', { className: 'review-item' },
      h('div', {
        className: 'review-thumb' + (note.imgW > note.imgH ? ' wide' : ''),
        title: 'Click to enlarge and zoom',
        onclick: () => openZoom(note, number),
      }, picture, mark, h('span', { className: 'enlarge', innerHTML: icon('expand') })),
      h('div', { className: 'review-body' },
        h('div', { className: 'review-head' },
          h('strong', { textContent: `Note ${number}` }),
          h('span', { className: 'pop-note', textContent: `${note.deviceName} · ${note.mark.type === 'area' ? 'marked area' : 'marked spot'}` }),
          saved,
          h('button', {
            className: 'small discard', innerHTML: icon('trash') + '<span>Discard</span>', title: 'Remove this note; it will not be in the report',
            onclick: async () => {
              if (!confirm('Discard this note and its picture? This cannot be undone.')) return;
              await api.notes.remove(note.id);
              openReview(deviceId);
            },
          })),
        text,
        h('div', { className: 'pop-note review-page', textContent: note.title ? `${note.title} — ${note.url}` : note.url }))));
  }
  modal.replaceChildren(h('div', { className: 'review-card' },
    h('div', { className: 'review-top' },
      h('div', {},
        h('strong', { textContent: 'Review before creating the report' }),
        h('div', { className: 'pop-note', textContent: `${scope} · ${list.length} note${list.length === 1 ? '' : 's'}. Reword a comment by typing in it, or discard a note you no longer want.` })),
      h('button', { className: 'small icon-only', innerHTML: icon('close'), title: 'Close (Esc)', onclick: closeReview })),
    items,
    h('div', { className: 'review-foot' },
      h('span', { className: 'pop-note', textContent: 'Creating the report saves a PDF and clears these notes from the app.' }),
      h('button', { textContent: 'Close', onclick: closeReview }),
      h('button', {
        className: 'primary', textContent: 'Create PDF report',
        onclick: async () => {
          // Let a comment still being typed save first.
          if (document.activeElement) document.activeElement.blur();
          await sleep(200);
          closeReview();
          makeReport(deviceId || null);
        },
      }))));
  modal.hidden = false;
}

async function init() {
  for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = icon(el.dataset.icon);
  cfg = await api.config();
  document.querySelector('.titlebar').hidden = !cfg.customTitleBar;
  applyDisplay(cfg.display);
  // Earlier versions kept one hand-typed size for every display; it is no longer used.
  try { localStorage.removeItem('displayInches'); } catch { /* ignore */ }
  // The size arrives a moment after start, and again when the window moves to
  // another display or a monitor is plugged in.
  api.display.onChange((info) => {
    const before = displayInches;
    applyDisplay(info);
    if (displayInches !== before) refit();
  });
  historyItems = store.get('history', []);
  saveHistory();
  setRecordingUi(0);
  $('history-btn').addEventListener('click', () => togglePopover($('history-btn'), buildHistory));
  $('logins-btn').addEventListener('click', () => togglePopover($('logins-btn'), buildLogins));
  $('settings-btn').addEventListener('click', () => togglePopover($('settings-btn'), buildSettings));
  $('record-btn').addEventListener('click', () => toggleRecording(null));
  $('folder-btn').addEventListener('click', async () => {
    const result = await api.output.open();
    if (result.error) toast(`The output folder could not be opened: ${result.dir}`);
  });
  $('notes-btn').addEventListener('click', () => { closePopover(); openReview(null); });
  // A note on the app window as a whole behaves like one more "screen".
  const windowTarget = {
    isWindow: true,
    ready: true,
    device: { id: 'window', name: 'App window', w: 0, h: 0, dpr: 1 },
    noteLayer: $('window-note-layer'),
    noteBtn: $('window-note-btn'),
  };
  setupNoteLayer(windowTarget);
  $('window-note-btn').addEventListener('click', () => {
    Object.assign(windowTarget.device, { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio });
    closePopover();
    startNoting(windowTarget);
  });
  document.addEventListener('mousedown', (e) => {
    if (!$('popover').hidden && !$('popover').contains(e.target) && !e.target.closest('.pop-btn')) closePopover();
  });

  const sizes = store.get('sizes', {});
  const hidden = store.get('hidden', []);
  for (const device of DEVICES) {
    if (Array.isArray(sizes[device.id])) [device.w, device.h] = sizes[device.id];
    const pane = createPane(device);
    pane.el.hidden = hidden.includes(device.id);
    panes.push(pane);
    stage.append(pane.el);

    const label = document.createElement('label');
    label.className = 'toggle';
    label.title = `Show or hide ${device.name}`;
    const box = Object.assign(document.createElement('input'), { type: 'checkbox', checked: !pane.el.hidden });
    pane.box = box;
    box.addEventListener('change', () => {
      pane.el.hidden = !box.checked;
      soloRestore = null;
      refit();
      saveHidden();
    });
    label.append(box, ' ' + device.name);
    $('device-toggles').append(label);
  }
  active = panes[0];
  active.el.classList.add('active');
  showUrl(store.get('url', ''));

  $('url-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = normalizeUrl(urlInput.value);
    if (!url) {
      if (urlInput.value.trim()) toast('That does not look like a web address.');
      return;
    }
    urlInput.blur();
    loadAll(url);
  });
  urlInput.addEventListener('focus', () => urlInput.select());

  $('back').addEventListener('click', () => panes.forEach((p) => p.ready && p.wv.canGoBack() && p.wv.goBack()));
  $('forward').addEventListener('click', () => panes.forEach((p) => p.ready && p.wv.canGoForward() && p.wv.goForward()));
  // Shift-click (or Ctrl+Shift+R) reloads without the cache.
  $('reload').addEventListener('click', (e) => panes.forEach((p) => p.ready && (e.shiftKey ? p.wv.reloadIgnoringCache() : p.wv.reload())));
  $('fit').addEventListener('click', fitAll);
  $('fit-each').addEventListener('click', fitEach);
  $('actual').addEventListener('click', () => setZoom(1, 'actual'));
  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refit, 150);
  }).observe(stage);
  $('zoom').addEventListener('input', (e) => setZoom(Number(e.target.value) / 100));

  for (const id of ['scheme', 'network']) {
    const select = $(id);
    select.value = store.get(id, select.value);
    select.addEventListener('change', () => {
      store.set(id, select.value);
      panes.forEach(emulatePane);
    });
  }
  $('overflow').addEventListener('click', findOverflow);
  $('shot-all').addEventListener('click', screenshotAll);
  $('clear-data').addEventListener('click', async () => {
    if (!confirm('Delete cookies, saved logins, storage and cache for the previewed pages? You will be signed out on every screen.')) return;
    await api.clearData();
    panes.forEach((p) => p.ready && p.wv.reload());
    toast('Site data cleared.');
  });

  // App appearance (separate from the page theme the previewed site sees).
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    $('theme-toggle').innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
    $('theme-toggle').title = theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance';
    store.set('appTheme', theme);
    api.setTheme(theme);
  };
  applyTheme(store.get('appTheme', 'dark'));
  $('theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  for (const id of ['sync-scroll', 'sync-nav', 'sync-input', 'reduced-motion', 'touch-input', 'outline', 'wrap']) {
    const box = $(id);
    box.checked = store.get(id, box.checked);
    box.addEventListener('change', () => {
      store.set(id, box.checked);
      if (id === 'wrap') stage.classList.toggle('wrap', box.checked);
      else if (id === 'outline') panes.forEach(applyOutline);
      else if (id === 'reduced-motion' || id === 'touch-input') panes.forEach(emulatePane);
    });
  }
  stage.classList.toggle('wrap', $('wrap').checked);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // The enlarged picture sits on top of the review screen: close only it.
      if (!$('zoom-view').hidden) { closeZoom(); return; }
      closePopover();
      cancelNoting();
      closeReview();
    } else if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      panes.forEach((p) => p.ready && (e.shiftKey ? p.wv.reloadIgnoringCache() : p.wv.reload()));
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      urlInput.focus();
    }
  });

  refreshNotes();
  // The window is still hidden here, so lay out now instead of waiting for a
  // frame (a hidden window draws none), then ask for the window to be shown.
  if (view === 'zoom') setZoom(zoom);
  else refit();
  setTimeout(() => api.ready(), 60);

}

init();
