// The SCAFFApps drop-down list. Every <select> in the window is shown as a SCAFFApps button and list, in the SCAFFApps
// colours, instead of the list Windows and Chromium draw for it (their blue rows and grey frame). The <select> stays,
// hidden, and holds the value: the app reads select.value and hears its "change" as before, and a value set from code
// shows on the button.
//
// Master copy: SCAFFApps Brand/apps/web/scaffapps-select.js, with its styles in scaffapps-select.css; each app has both,
// word for word (DESIGN-LANGUAGE.md, sections 4 and 8). Load it before the app's own script:
//     <link rel="stylesheet" href="scaffapps-select.css">  ...  <script src="scaffapps-select.js"></script>
// A <select> added later: window.scaffappsSelect(element).
(() => {
  'use strict';
  const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5l5.5 5.5 5.5-5.5"/></svg>';
  const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></svg>';
  const VALUE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  const INDEX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
  let open = null;   // the list on show: { select, button, list, active }

  function upgrade(select) {
    if (!(select instanceof HTMLSelectElement) || select.dataset.scSelect) return;
    select.dataset.scSelect = '1';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sc-select';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    if (select.title) button.title = select.title;
    // As high as the <select> was, and as wide (so nothing beside it moves), or as wide as its longest choice needs.
    const room = select.getBoundingClientRect();
    if (room.height) button.style.height = Math.round(room.height) + 'px';
    button.innerHTML = '<span></span>' + CHEVRON;
    select.after(button);
    let widest = 0;
    for (const o of select.options) { button.firstChild.textContent = o.text; widest = Math.max(widest, button.offsetWidth); }
    if (room.width || widest) button.style.width = Math.ceil(Math.max(room.width, widest)) + 'px';
    select.classList.add('sc-select-native');

    const show = () => {
      const o = select.options[select.selectedIndex];
      button.firstChild.textContent = o ? o.text : '';
      button.disabled = select.disabled;
    };
    Object.defineProperty(select, 'value', { configurable: true, get() { return VALUE.get.call(this); }, set(v) { VALUE.set.call(this, v); show(); } });
    Object.defineProperty(select, 'selectedIndex', { configurable: true, get() { return INDEX.get.call(this); }, set(v) { INDEX.set.call(this, v); show(); } });
    select.addEventListener('change', show);
    new MutationObserver(show).observe(select, { attributes: true, attributeFilter: ['disabled'], childList: true, subtree: true });
    // A <label> around the <select>, or one for it, opens the list.
    select.addEventListener('click', () => { button.focus(); if (!open) openList(select, button); });
    button.addEventListener('click', () => (open && open.select === select ? closeList() : openList(select, button)));
    button.addEventListener('keydown', (e) => {
      if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList(select, button); }
    });
    show();
  }

  function openList(select, button) {
    closeList();
    if (select.disabled || !select.options.length) return;
    const list = document.createElement('ul');
    list.className = 'sc-list';
    list.setAttribute('role', 'listbox');
    [...select.options].forEach((o, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === select.selectedIndex));
      if (i === select.selectedIndex) li.classList.add('on');
      if (o.disabled) li.classList.add('off');
      li.innerHTML = '<span></span>' + TICK;
      li.firstChild.textContent = o.text;
      li.addEventListener('mousemove', () => setActive(i));
      li.addEventListener('mousedown', (e) => e.preventDefault());   // the button keeps the keyboard
      li.addEventListener('click', () => choose(i));
      list.append(li);
    });
    document.body.append(list);
    // Below the button and at least as wide; above it when there is more room there. Never off the window.
    const b = button.getBoundingClientRect();
    list.style.minWidth = b.width + 'px';
    const below = innerHeight - b.bottom - 12;
    const above = b.top - 12;
    const up = list.offsetHeight > below && above > below;
    list.style.maxHeight = Math.max(80, up ? above : below) + 'px';
    list.style.top = (up ? b.top - 4 - list.offsetHeight : b.bottom + 4) + 'px';
    list.style.left = Math.max(8, Math.min(b.left, innerWidth - list.offsetWidth - 8)) + 'px';
    open = { select, button, list, active: -1 };
    button.setAttribute('aria-expanded', 'true');
    setActive(Math.max(0, select.selectedIndex));
  }

  function closeList() {
    if (!open) return;
    open.list.remove();
    open.button.setAttribute('aria-expanded', 'false');
    open = null;
  }

  function setActive(i) {
    if (!open) return;
    const items = open.list.children;
    if (items[open.active]) items[open.active].classList.remove('active');
    open.active = i;
    if (items[i]) { items[i].classList.add('active'); items[i].scrollIntoView({ block: 'nearest' }); }
  }

  function choose(i) {
    if (!open) return;
    const { select, button } = open;
    closeList();
    button.focus();
    const o = select.options[i];
    if (!o || o.disabled || select.selectedIndex === i) return;
    select.selectedIndex = i;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // While the list is open: the arrow keys, Home and End move, Enter or Space chooses, Esc or Tab closes it; so does a
  // click elsewhere, a scroll, a resize or the window losing the focus.
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    const options = open.select.options;
    const move = (from, step) => {
      for (let i = from + step; i >= 0 && i < options.length; i += step) if (!options[i].disabled) return setActive(i);
    };
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') move(open.active, e.key === 'ArrowDown' ? 1 : -1);
    else if (e.key === 'Home') move(-1, 1);
    else if (e.key === 'End') move(options.length, -1);
    else if (e.key === 'Enter' || e.key === ' ') choose(open.active);
    else if (e.key === 'Escape') { const b = open.button; closeList(); b.focus(); }
    else if (e.key === 'Tab') { closeList(); return; }
    else return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  document.addEventListener('mousedown', (e) => {
    if (open && !open.list.contains(e.target) && !open.button.contains(e.target)) closeList();
  }, true);
  document.addEventListener('scroll', (e) => { if (open && !open.list.contains(e.target)) closeList(); }, true);
  addEventListener('resize', closeList);
  addEventListener('blur', closeList);

  const upgradeAll = () => document.querySelectorAll('select').forEach(upgrade);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', upgradeAll);
  else upgradeAll();
  window.scaffappsSelect = upgrade;
})();
