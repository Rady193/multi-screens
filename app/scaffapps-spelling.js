'use strict';
// Fix spelling in a SCAFFApps app's text boxes (Smart Snap's comments, Multi Screens' notes): the window's half.
// The same file in every SCAFFApps Electron app that has one (master: SCAFFApps Brand/apps/web); the main process's
// half is scaffapps-spelling-main.js, and DESIGN-LANGUAGE.md says how it looks.
//
// Windows' own spell checker reads the text, the one that underlines the mistakes in red; nothing leaves the
// computer. What it is sure of is fixed at once, as its autocorrect would: "teh" to "the", "i" to "I", a word
// written twice. Capital letters go in at the start of sentences and lines. A word it only has guesses for is
// offered with them, the likeliest first, to choose with a click: its own first guess is often not the word meant
// ("prefere": preferer, prefer, prefers...). The fixes are one step of the box's own undo (Ctrl+Z).
//
// ScaffSpelling.attach({ box, panel, check, changed }) -> { run, clear }    (run: the button, and F7)
//   box      the <textarea>
//   panel    an empty element under it, for what was fixed and the choices
//   check    text -> promise of { mistakes } from the main process, or { error } (window.<app>.spelling)
//   changed  called when the box's text or the panel changes size (optional)
(() => {
  // Words that end in a full stop without ending the sentence.
  const ABBREVIATIONS = new Set(['etc', 'e.g', 'eg', 'i.e', 'ie', 'vs', 'approx', 'incl', 'excl', 'no', 'nos', 'fig', 'cf', 'dept',
    'mr', 'mrs', 'ms', 'dr', 'st', 'ltd', 'co', 'inc', 'ref', 'qty', 'pcs', 'attn', 'tel', 'ext', 'est', 'min', 'max', 'a.m', 'p.m',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec']);
  // A list's bullet or number at the start of a line: the word after it starts the item.
  const LIST_MARK = /^(?:[-*•–—]|\d{1,3}[.)]|[a-z]\))$/i;
  // Words that are right twice in a row ("I know that that works", "had had").
  const TWICE_IS_RIGHT = new Set(['that', 'had']);
  const LOWER = /\p{Ll}/u;

  // The run of text without spaces around [start, end).
  function tokenAt(text, start, end) {
    let s = start, e = end;
    while (s > 0 && !/\s/.test(text[s - 1])) s--;
    while (e < text.length && !/\s/.test(text[e])) e++;
    return text.slice(s, e);
  }

  // Not prose, so never changed: an address, a path, a file name, a code, a
  // number, an acronym (VAT) or a name with capitals inside (SCAFFApps).
  function notProse(token, word) {
    return /[/\\@_#=<>{}|~^`$%&+*]|:\/\/|\d/.test(token)
      || /\p{L}\.\p{L}{2,}/u.test(token)
      || (word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase())
      || /\p{Ll}\p{Lu}/u.test(word);
  }

  // The word written the way the one it replaces was: "Teh" -> "The".
  function matchCase(from, to) {
    if (!to) return to;
    const first = from.charAt(0);
    if (first !== first.toLowerCase() && to === to.toLowerCase()) return to.charAt(0).toUpperCase() + to.slice(1);
    return to;
  }

  // How many letters to add, drop, change or swap to make one word the other.
  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }

  // Windows' guesses, the likeliest first: the closest to what was typed and,
  // among those, the plain word the others are made from ("prefer" before
  // "preferer" and "prefers"); then in Windows' order. Four at most.
  function rank(word, suggestions) {
    const w = word.toLowerCase();
    const list = [...new Set((suggestions || []).map(String).filter((s) => s && s.toLowerCase() !== w))];
    const lower = list.map((s) => s.toLowerCase());
    return list
      .map((s, i) => ({ s, i, d: distance(w, lower[i]), base: lower.filter((o, j) => j !== i && o.startsWith(lower[i])).length }))
      .sort((a, b) => a.d - b.d || b.base - a.base || a.i - b.i)
      .slice(0, 4)
      .map((x) => x.s);
  }

  // Where sentences, lines and list items begin: the index of each one's first word.
  function sentenceStarts(text) {
    const starts = [];
    const re = /\S+/g;
    let fresh = true, last = 0, m;
    while ((m = re.exec(text))) {
      if (text.slice(last, m.index).includes('\n')) fresh = true;
      last = m.index + m[0].length;
      const token = m[0];
      if (fresh && LIST_MARK.test(token)) continue;
      const lead = token.match(/^["'“‘([]*/)[0].length;
      if (fresh) starts.push(m.index + lead);
      const bare = token.replace(/["'”’)\]]+$/, '');
      const word = bare.replace(/[.!?]+$/, '').slice(lead).toLowerCase();
      const ends = /[.!?]$/.test(bare) && !/\.\.$/.test(bare);
      const short = /[^.!?]\.$/.test(bare) && (ABBREVIATIONS.has(word) || /^\p{L}$/u.test(word));
      fresh = ends && !short;
    }
    return starts;
  }

  // A capital letter at the start of each sentence, line and list item.
  function capitals(text) {
    const chars = text.split('');
    let count = 0;
    for (const i of sentenceStarts(text)) {
      const c = text.charAt(i);
      if (!LOWER.test(c)) continue;
      const token = tokenAt(text, i, i + 1);
      if (notProse(token, token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))) continue;
      chars[i] = c.toUpperCase();
      count++;
    }
    return { text: chars.join(''), count };
  }

  // What to do with the mistakes Windows found: { text, fixed (what was
  // changed, in words), caps (capital letters put in), asks (the words to
  // choose for: { start, end, options }, in the new text), caret (old place ->
  // new) }.
  function plan(text, mistakes) {
    const edits = [], asks = [];
    let lastEnd = -1;
    for (const m of [...mistakes].sort((a, b) => a.start - b.start)) {
      const start = m.start | 0, end = start + (m.length | 0);
      if (start < lastEnd || end > text.length || end <= start) continue;
      const word = text.slice(start, end);
      if (notProse(tokenAt(text, start, end), word)) continue;
      // A unit after a number: 16 px, 3 mm, 2 kg.
      if (/\d[ \u00a0]?$/.test(text.slice(Math.max(0, start - 2), start))) continue;
      lastEnd = end;
      if (m.action === 'delete' && !TWICE_IS_RIGHT.has(word.toLowerCase())) {
        // The second of a word written twice, with the space before it.
        let s = start, e = end;
        if (s > 0 && /[ \t]/.test(text[s - 1])) { while (s > 0 && /[ \t]/.test(text[s - 1])) s--; }
        else while (e < text.length && /[ \t]/.test(text[e])) e++;
        edits.push({ start: s, end: e, to: '', label: `${word} ${word} → ${word}` });
      } else if (m.action === 'replace' && m.replacement) {
        const to = matchCase(word, String(m.replacement));
        if (to !== word) edits.push({ start, end, to, label: `${word} → ${to}` });
      } else if (m.action === 'suggest') {
        asks.push({ start, end, options: rank(word, m.suggestions) });
      }
    }
    let out = '', at = 0, shift = 0;
    const items = [...edits.map((e) => ({ e })), ...asks.map((a) => ({ a }))].sort((x, y) => (x.e || x.a).start - (y.e || y.a).start);
    for (const it of items) {
      if (it.e) {
        out += text.slice(at, it.e.start) + it.e.to;
        at = it.e.end;
        shift += it.e.to.length - (it.e.end - it.e.start);
      } else {
        it.a.start += shift;
        it.a.end += shift;
      }
    }
    out += text.slice(at);
    const caps = capitals(out);           // (the same length: places stay)
    const caret = (c) => {
      let s = 0;
      for (const e of edits) {
        if (e.end <= c) s += e.to.length - (e.end - e.start);
        else if (e.start < c) return e.start + s + e.to.length;
        else break;
      }
      return c + s;
    };
    return { text: caps.text, fixed: edits.map((e) => e.label), caps: caps.count, asks, caret };
  }

  // "a", "a and b", "a, b and c"
  function listed(parts) {
    return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  }

  function attach({ box, panel, check, changed = () => {} }) {
    let rows = [];        // the words to choose for: { start, word, options }
    let note = '';        // what the last check did, until the text is typed in
    let ours = false;     // the text is being changed here, not typed
    let busy = false;

    // Replaces [start, end) as one step of the box's undo; the caret stays
    // where it was, moved along by the change.
    function edit(start, end, to) {
      const before = box.value;
      const want = before.slice(0, start) + to + before.slice(end);
      if (want === before) return;
      const caret = box.selectionStart;
      const top = box.scrollTop;
      ours = true;
      box.focus();
      box.setSelectionRange(start, end);
      document.execCommand('insertText', false, to);
      if (box.value !== want) {
        box.value = want;
        box.dispatchEvent(new Event('input', { bubbles: true }));
      }
      ours = false;
      const moved = caret >= end ? caret + to.length - (end - start) : caret > start ? start + to.length : caret;
      box.setSelectionRange(moved, moved);
      box.scrollTop = top;
    }

    // A row's word in the box now: where it was, else the nearest place it is
    // written whole; -1 when it is gone.
    function locate(row) {
      const v = box.value;
      if (v.slice(row.start, row.start + row.word.length) === row.word) return row.start;
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${row.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu');
      let best = -1, m;
      while ((m = re.exec(v))) if (best < 0 || Math.abs(m.index - row.start) < Math.abs(best - row.start)) best = m.index;
      return best;
    }

    function choose(row, to) {
      const at = locate(row);
      rows = rows.filter((r) => r !== row);
      if (at >= 0) {
        edit(at, at + row.word.length, to);
        const delta = to.length - row.word.length;
        for (const r of rows) if (r.start > at) r.start += delta;
      }
      render();
    }

    function render() {
      panel.replaceChildren();
      const ask = !rows.length ? '' : rows.length === 1 ? 'Choose the word meant:' : 'Choose the words meant:';
      const words = [note, ask].filter(Boolean).join(' ');
      if (words) {
        const p = document.createElement('div');
        p.className = 'spell-note';
        p.textContent = words;
        panel.append(p);
      }
      for (const row of rows) {
        const line = document.createElement('div');
        line.className = 'spell-row';
        const w = document.createElement('span');
        w.className = 'spell-word';
        w.textContent = row.word;
        line.append(w);
        row.options.forEach((option, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = i === 0 ? 'first' : '';
          b.textContent = option;
          b.title = `Write “${option}” instead of “${row.word}”`;
          b.onclick = () => choose(row, option);
          line.append(b);
        });
        const leave = document.createElement('button');
        leave.type = 'button';
        leave.className = 'leave';
        leave.textContent = row.options.length ? 'Leave' : 'Not in the dictionary · Leave';
        leave.title = 'Keep the word as it is written';
        leave.onclick = () => { rows = rows.filter((r) => r !== row); render(); box.focus(); };
        line.append(leave);
        panel.append(line);
      }
      panel.hidden = !note && !rows.length;
      changed();
    }

    function say(text) { note = text; render(); }

    async function run(again = 0) {
      if (busy) return;
      const before = box.value;
      if (!before.trim()) { rows = []; say('Nothing to check yet.'); return; }
      busy = true;
      const slow = setTimeout(() => say('Checking the spelling…'), 250);
      let answer = null;
      try { answer = await check(before); } catch { answer = null; }
      clearTimeout(slow);
      busy = false;
      // Typed in meanwhile: checked again.
      if (box.value !== before) return again < 3 ? run(again + 1) : undefined;
      if (!answer || answer.error || !Array.isArray(answer.mistakes)) {
        rows = [];
        say(answer && answer.error ? `${answer.error}.` : 'Windows’ spell checker did not answer. Try again in a moment.');
        return;
      }
      const p = plan(before, answer.mistakes);
      if (p.text !== before) {
        // One change, from the first difference to the last.
        let a = 0;
        while (a < before.length && before[a] === p.text[a]) a++;
        let b = 0;
        while (b < before.length - a && b < p.text.length - a && before[before.length - 1 - b] === p.text[p.text.length - 1 - b]) b++;
        const caret = p.caret(box.selectionStart);
        edit(a, before.length - b, p.text.slice(a, p.text.length - b));
        box.setSelectionRange(caret, caret);
      }
      rows = p.asks.map((x) => {
        const word = p.text.slice(x.start, x.end);
        return { start: x.start, word, options: x.options.map((o) => matchCase(word, o)) };
      });
      const done = p.fixed.slice(0, 4);
      if (p.fixed.length > 4) done.push(`${p.fixed.length - 4} more`);
      if (p.caps) done.push(p.caps === 1 ? 'a capital letter' : `${p.caps} capital letters`);
      // (The words to choose for are asked about under this, in render.)
      say(done.length ? `Fixed ${listed(done)}. Ctrl+Z undoes it.` : rows.length ? '' : 'No spelling mistakes found.');
    }

    // Taking the keyboard: the main process gets its spell checker ready, so the first check is quick.
    box.addEventListener('focus', () => { Promise.resolve(check('')).catch(() => {}); });

    // Typing: the note goes; a word to choose for stays while it is still written.
    box.addEventListener('input', () => {
      if (ours) return;
      const had = !!note || rows.length;
      note = '';
      rows = rows.filter((r) => { const at = locate(r); if (at >= 0) r.start = at; return at >= 0; });
      if (had) render();
    });

    return {
      run: () => run(),
      clear: () => { note = ''; rows = []; render(); },
    };
  }

  window.ScaffSpelling = { attach, plan };
})();
