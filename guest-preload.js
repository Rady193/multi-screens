// Runs inside every previewed page. Reports user activity and scroll position
// to the host so it can mirror them to the other device panes.
const { ipcRenderer } = require('electron');

let applying = false;
let applyTimer = 0;
let queued = false;

const activity = () => ipcRenderer.sendToHost('activity');
for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
  window.addEventListener(type, activity, { capture: true, passive: true });
}

window.addEventListener('scroll', (event) => {
  if (applying || queued || event.target !== document) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    const el = document.scrollingElement;
    if (!el) return;
    const max = el.scrollHeight - window.innerHeight;
    ipcRenderer.sendToHost('scroll', { ratio: max > 0 ? el.scrollTop / max : 0, anchor: scrollAnchor() });
  });
}, { capture: true, passive: true });

// The same page is a different height on every device, so "40% scrolled" shows
// different content on each. Instead, report which block sits at a fixed line
// of the viewport (and how far through it), so the other panes can bring the
// same block to the same line.
const ANCHOR_LINE = 0.3;
function scrollAnchor() {
  const y = window.innerHeight * ANCHOR_LINE;
  let el = document.elementFromPoint(window.innerWidth / 2, y);
  if (!el || el === document.documentElement || el === document.body) return null;
  // Small elements move around between layouts; climb to a sizeable block.
  while (el.parentElement && el.parentElement !== document.body
      && el.getBoundingClientRect().height < window.innerHeight * 0.3) {
    el = el.parentElement;
  }
  const r = el.getBoundingClientRect();
  if (!r.height) return null;
  return { path: pathTo(el), frac: (y - r.top) / r.height };
}

ipcRenderer.on('scroll-to', (_event, data) => {
  const el = document.scrollingElement;
  if (!el) return;
  const max = el.scrollHeight - window.innerHeight;
  let top = data.ratio * max;
  // At the very top and bottom every pane should simply reach its own end.
  const target = data.ratio > 0.002 && data.ratio < 0.998 && data.anchor ? find(data.anchor.path) : null;
  if (target) {
    const r = target.getBoundingClientRect();
    if (r.height) top = el.scrollTop + r.top + data.anchor.frac * r.height - window.innerHeight * ANCHOR_LINE;
  }
  applying = true;
  el.scrollTop = Math.max(0, Math.min(max, top));
  clearTimeout(applyTimer);
  applyTimer = setTimeout(() => { applying = false; }, 150);
});

// --- Mirrored clicks and typing -------------------------------------------
// Elements are addressed by a structural CSS path so the same element can be
// found in the other panes. Only real user events (isTrusted) are reported,
// so replayed events never echo back.
function pathTo(el) {
  const parts = [];
  while (el && el.nodeType === 1 && el !== document.documentElement) {
    if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) {
      parts.unshift('#' + CSS.escape(el.id));
      break;
    }
    let index = 1;
    for (let s = el.previousElementSibling; s; s = s.previousElementSibling) {
      if (s.localName === el.localName) index++;
    }
    parts.unshift(`${el.localName}:nth-of-type(${index})`);
    el = el.parentElement;
  }
  return parts.join('>');
}

const find = (selector) => {
  try { return selector ? document.querySelector(selector) : null; } catch { return null; }
};

window.addEventListener('click', (event) => {
  if (!event.isTrusted || !(event.target instanceof Element)) return;
  ipcRenderer.sendToHost('click', pathTo(event.target));
}, { capture: true, passive: true });

window.addEventListener('input', (event) => {
  const el = event.target;
  if (!event.isTrusted || !(el instanceof Element)) return;
  const data = { path: pathTo(el) };
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) data.checked = el.checked;
  else if ('value' in el) data.value = el.value;
  else if (el.isContentEditable) data.text = el.textContent;
  else return;
  ipcRenderer.sendToHost('input', data);
}, { capture: true, passive: true });

// --- Saved login fill -------------------------------------------------------
// Sent by the main process only to pages of the site the login was saved for.
function setFieldValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  setter.set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

ipcRenderer.on('fill-login', (_event, { username, password }) => {
  const visible = (el) => el.getClientRects().length > 0 && !el.disabled && !el.readOnly;
  const inputs = [...document.querySelectorAll('input')].filter(visible);
  const passwordField = inputs.find((i) => i.type === 'password');
  const textFields = inputs.filter((i) => ['text', 'email', 'tel'].includes(i.type));
  let userField;
  if (passwordField) {
    // The username is the last text field that comes before the password.
    const before = textFields.filter((i) => passwordField.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_PRECEDING);
    userField = before[before.length - 1];
  } else {
    userField = textFields.find((i) => /user|email|login/i.test(i.name + i.id + i.autocomplete)) || textFields[0];
  }
  if (userField) setFieldValue(userField, username);
  if (passwordField) setFieldValue(passwordField, password);
});

ipcRenderer.on('click-at', (_event, selector) => {
  const el = find(selector);
  if (el && typeof el.click === 'function') el.click();
});

ipcRenderer.on('input-at', (_event, data) => {
  const el = find(data.path);
  if (!el) return;
  if ('checked' in data) {
    if (el.checked === data.checked) return;
    el.click();
    return;
  }
  if ('value' in data) {
    // Use the native setter so frameworks that wrap `value` still notice.
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (setter && setter.set) setter.set.call(el, data.value); else el.value = data.value;
  } else {
    el.textContent = data.text;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});

// --- Mirrored hover --------------------------------------------------------
// Report which element the mouse is over (and where inside it); other panes
// answer with that element's own position so the host can move a mouse there.
let hoverQueued = false;
window.addEventListener('mousemove', (event) => {
  if (!event.isTrusted || hoverQueued || !(event.target instanceof Element)) return;
  hoverQueued = true;
  const target = event.target, x = event.clientX, y = event.clientY;
  requestAnimationFrame(() => {
    hoverQueued = false;
    const r = target.getBoundingClientRect();
    if (!r.width || !r.height) return;
    ipcRenderer.sendToHost('hover', { path: pathTo(target), fx: (x - r.left) / r.width, fy: (y - r.top) / r.height });
  });
}, { capture: true, passive: true });

ipcRenderer.on('hover-at', (_event, data) => {
  const el = find(data.path);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const x = r.left + data.fx * r.width, y = r.top + data.fy * r.height;
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return;
  ipcRenderer.sendToHost('hover-point', { x, y });
});
