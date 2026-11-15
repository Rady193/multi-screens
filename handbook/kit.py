"""The SCAFFApps handbooks' shared kit: the same file in every app's handbook folder (Multi Screens, Smart Snap,
Instant Share, the SCAFFApps Suite).

It starts an app in a test profile of its own (its own settings, a registration that is never sent), connects to its
window to take the pictures, serves the demo page the pictures show, and prints handbook.html to PDF the way the
SCAFFApps Studio prints its brochure (Edge, A4, after the fonts have loaded). The pictures only ever show the demo
page and made-up content: never the desktop or anyone's real data.

Needs: pip install playwright pillow pypdfium2, and Microsoft Edge (or --chromium PATH).
"""
import base64
import functools
import http.server
import json
import os
import socket
import struct
import subprocess
import threading
import time
import urllib.request
from pathlib import Path


# What a picture must never show, and what shows instead: this Windows user's folder, the computer's name.
PRIVATE = [(p, r) for p, r in [(str(Path.home()), r"C:\Users\Alex"), (os.environ.get("COMPUTERNAME", ""), "OFFICE-PC")] if p]


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Serve:
    """A folder over http on 127.0.0.1 (the demo page), for as long as the 'with' block runs."""

    def __init__(self, folder, port=0):
        """port: the one to use if free (3000 reads as an ordinary local web app: http://localhost:3000/)."""
        handler = functools.partial(Quiet, directory=str(folder))
        try:
            self.server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
        except OSError:
            self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.server.handle_error = lambda *a: None          # a page that closes its connection early is no error
        self.url = f"http://{'localhost' if port else '127.0.0.1'}:{self.server.server_address[1]}/"

    def __enter__(self):
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        return self

    def __exit__(self, *exc):
        self.server.shutdown()


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def registration(file, app_id, version, registered=True):
    """The shared SCAFFApps registration, in the test profile: filled in and already reported (nothing is sent), or
    absent so the sign-up window shows."""
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    if registered:
        file.write_text(json.dumps({"install_id": "handbook-0000-0000", "name": "Alex Morgan", "email": "alex@example.com",
                                    "reported": {f"{app_id}@{version}": int(time.time() * 1000)}}), encoding="utf-8")
    else:
        file.unlink(missing_ok=True)
    return {"SCAFFAPPS_REGISTRATION_FILE": str(file), "SCAFFAPPS_REGISTER_URL": "http://127.0.0.1:9/"}


def start_electron(app_dir, profile, port, env=None, args=()):
    """The Electron app in app_dir, from its source, with its own profile folder and its window open to CDP."""
    app_dir = Path(app_dir)
    exe = app_dir / "node_modules" / "electron" / "dist" / "electron.exe"
    e = dict(os.environ)
    e.pop("ELECTRON_RUN_AS_NODE", None)
    e.update(env or {})
    return subprocess.Popen([str(exe), ".", f"--user-data-dir={profile}", f"--remote-debugging-port={port}", *args],
                            cwd=app_dir, env=e)


def start_exe(exe, profile, port, env=None, args=()):
    """An installed copy of an Electron app (as users have it), with its own profile folder and CDP open."""
    e = dict(os.environ)
    e.pop("ELECTRON_RUN_AS_NODE", None)
    e.update(env or {})
    return subprocess.Popen([str(exe), f"--user-data-dir={profile}", f"--remote-debugging-port={port}", *args], env=e)


def release(folder, version, name, setup=None, size=78 * 1048576):
    """A stand-in for GitHub's latest release, in folder/latest (serve the folder with Serve): version, notes, and
    optionally an installer with a made-up checksum (it is never downloaded)."""
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    digest = "a" * 64
    notes = (f"## {version}\n\nAn example of the notes shown with an update.\n\n| File | Size | SHA-256 |\n|---|---|---|\n"
             f"| `{setup}` | 78.0 MB | `{digest.upper()}` |\n\n### Changed\n\n- **Faster start**: it opens sooner.\n"
             "- **Small fixes** across the app.\n") if setup else f"## {version}\n\nThe version you have.\n"
    (folder / "latest").write_text(json.dumps({
        "tag_name": f"v{version}", "name": f"{name} {version}", "body": notes, "published_at": "2026-12-01T09:00:00Z",
        "html_url": f"https://github.com/Rady193/{name.lower().replace(' ', '-')}/releases/tag/v{version}",
        "assets": [{"name": setup, "size": size, "digest": f"sha256:{digest}",
                    "browser_download_url": f"https://github.com/Rady193/x/releases/download/v{version}/{setup}"}] if setup else []}),
        encoding="utf-8")
    return folder


def stop(proc):
    if proc and proc.poll() is None:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        time.sleep(1)


class Window:
    """One app window over the Chrome DevTools protocol, talking to that page only. (A tool that attaches to every
    target, as Playwright's connect_over_cdp does, also takes over Multi Screens' device screens and undoes their
    phone emulation.)"""

    def __init__(self, ws_url):
        host, rest = ws_url[len("ws://"):].split("/", 1)
        h, port = host.split(":")
        self.s = socket.create_connection((h, int(port)), timeout=120)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f"GET /{rest} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                        f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.n = 0

    def _recv(self, k):
        b = b""
        while len(b) < k:
            c = self.s.recv(k - len(b))
            if not c:
                raise ConnectionError("the window closed")
            b += c
        return b

    def _frame(self):
        data, op = b"", None
        while True:
            hdr = self._recv(2)
            op = op if op is not None else hdr[0] & 0x0F
            L = hdr[1] & 0x7F
            if L == 126:
                L = struct.unpack(">H", self._recv(2))[0]
            elif L == 127:
                L = struct.unpack(">Q", self._recv(8))[0]
            data += self._recv(L)
            if hdr[0] & 0x80:
                return op, data

    def send(self, method, params=None):
        self.n += 1
        payload = json.dumps({"id": self.n, "method": method, "params": params or {}}).encode()
        mask, L = os.urandom(4), len(payload)
        head = bytes([0x81]) + (bytes([0x80 | L]) if L < 126 else bytes([0x80 | 126]) + struct.pack(">H", L)
                                if L < 65536 else bytes([0x80 | 127]) + struct.pack(">Q", L))
        self.s.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))
        while True:
            op, data = self._frame()
            if op != 1:
                continue
            msg = json.loads(data)
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def js(self, expression):
        r = self.send("Runtime.evaluate", {"expression": expression, "awaitPromise": True, "returnByValue": True})
        if "exceptionDetails" in r:
            raise RuntimeError(r["exceptionDetails"].get("exception", {}).get("description") or r["exceptionDetails"])
        return r.get("result", {}).get("value")

    def wait(self, condition, timeout=20):
        end = time.time() + timeout
        while time.time() < end:
            try:
                if self.js(condition):
                    return True
            except RuntimeError:
                pass
            time.sleep(0.25)
        raise TimeoutError(condition)

    def front(self):
        """A window behind others is not drawn: bring it forward before taking its picture."""
        self.send("Page.bringToFront")
        self.send("Emulation.setFocusEmulationEnabled", {"enabled": True})

    def rect(self, selector):
        r = self.js(f"(() => {{ const e = document.querySelector({json.dumps(selector)}); if (!e) return null;"
                    f" e.scrollIntoView({{block: 'nearest'}}); const r = e.getBoundingClientRect();"
                    f" return {{x: r.left, y: r.top, w: r.width, h: r.height}} }})()")
        if not r:
            raise LookupError(selector)
        return r

    def mouse(self, kind, x, y, buttons=0):
        self.send("Input.dispatchMouseEvent", {"type": kind, "x": x, "y": y, "button": "left" if kind != "mouseMoved" or buttons else "none",
                                               "buttons": buttons, "clickCount": 1 if kind != "mouseMoved" else 0})

    def click_at(self, x, y):
        self.mouse("mouseMoved", x, y)
        self.mouse("mousePressed", x, y, 1)
        self.mouse("mouseReleased", x, y)

    def click(self, selector):
        r = self.rect(selector)
        self.click_at(r["x"] + r["w"] / 2, r["y"] + r["h"] / 2)

    def drag(self, x1, y1, x2, y2, steps=8):
        self.mouse("mouseMoved", x1, y1)
        self.mouse("mousePressed", x1, y1, 1)
        for i in range(1, steps + 1):
            self.mouse("mouseMoved", x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, 1)
        self.mouse("mouseReleased", x2, y2)

    def type(self, text):
        self.send("Input.insertText", {"text": text})

    def key(self, key, code=None, keycode=0, modifiers=0):
        for kind in ("rawKeyDown", "keyUp"):
            self.send("Input.dispatchKeyEvent", {"type": kind, "key": key, "code": code or key,
                                                 "windowsVirtualKeyCode": keycode, "modifiers": modifiers})

    def shot(self, path, clip=None):
        """The window (or the clip, in CSS pixels) as a PNG, at the screen's pixel density. Always the whole window,
        cut afterwards: asking CDP for a clip resizes the page for the capture, and Multi Screens' screens re-scroll.
        Before every picture, the Windows user's own folder and the computer's name, wherever they show, are replaced
        by neutral examples: no picture can show whose computer took it."""
        self.private()
        data = base64.b64decode(self.send("Page.captureScreenshot", {"format": "png"})["data"])
        if not clip:
            Path(path).write_bytes(data)
            return path
        import io
        from PIL import Image
        im = Image.open(io.BytesIO(data))
        k = im.width / self.js("innerWidth")
        box = [round(clip["x"] * k), round(clip["y"] * k), round((clip["x"] + clip["width"]) * k), round((clip["y"] + clip["height"]) * k)]
        box = [max(box[0], 0), max(box[1], 0), min(box[2], im.width), min(box[3], im.height)]
        im.crop(box).save(path)
        return path

    def private(self):
        for old, new in PRIVATE:
            self.replace_text(old, new)

    def replace_text(self, old, new, root="document.body"):
        """Every text on the page that contains old shows new in its place (a path with the user's own name in it,
        for instance, shown as an example path instead)."""
        self.js(f"""(() => {{ const w = document.createTreeWalker({root}, NodeFilter.SHOW_TEXT); let n;
          while ((n = w.nextNode())) if (n.nodeValue.includes({json.dumps(old)})) n.nodeValue = n.nodeValue.split({json.dumps(old)}).join({json.dumps(new)});
          for (const i of document.querySelectorAll('input')) if (i.value.includes({json.dumps(old)})) i.value = i.value.split({json.dumps(old)}).join({json.dumps(new)}); }})()""")

    def close(self):
        try:
            self.s.close()
        except OSError:
            pass


def window(port, match, timeout=40):
    """The app window whose address contains match, once the app has opened it."""
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=2) as r:
                for t in json.loads(r.read()):
                    if t.get("type") == "page" and match in t.get("url", ""):
                        w = Window(t["webSocketDebuggerUrl"])
                        w.wait("document.readyState === 'complete'")
                        return w
        except OSError:
            pass
        time.sleep(0.4)
    raise TimeoutError(f"no window with {match!r} on port {port}")


APPS = (("multi-screens", "Multi Screens"), ("smart-snap", "Smart Snap"), ("instant-share", "Instant Share"),
        ("suite", "SCAFFApps Suite"))


def family_icons(img, tools):
    """The SCAFFApps apps' icons for a handbook's back cover, each cut to its tile: the files draw their tiles with
    different margins, so as they are they would show at different sizes."""
    import re
    for name, folder in APPS:
        src = Path(tools) / folder / "build" / "icon.svg"
        if not src.exists():
            continue
        svg = src.read_text(encoding="utf-8")
        m = re.search(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"', svg)   # a tile inside a margin
        if m:
            svg = re.sub(r'viewBox="[^"]*"', f'viewBox="{m[1]} {m[2]} {m[3]} {m[4]}"', svg, count=1)
        (Path(img) / f"family-{name}.svg").write_text(svg, encoding="utf-8")


def suite_pictures(img, tools):
    """The SCAFFApps Suite's views (home, apps, updates, handbooks) for a handbook's back cover, every handbook's the
    same: from the Suite's source beside this app, in a test profile. Kept as they are when it is not there."""
    import shutil
    import tempfile
    folder = Path(tools) / "SCAFFApps Suite"
    if not (folder / "node_modules" / "electron").exists():
        print("!! the SCAFFApps Suite's source is not beside this app: its pictures are kept as they are")
        return
    work = Path(tempfile.mkdtemp(prefix="suite-pictures-"))
    try:
        env = registration(work / "registration.json", "suite", "0")
        port = free_port()
        proc = start_electron(folder, work / "profile", port, env)
        try:
            w = window(port, "index.html")
            w.front()
            # it reads the installed apps and asks GitHub for the releases: wait until it has the answers
            time.sleep(3)
            try:          # its own status, bottom left: "Up to date · just now" once GitHub has answered
                w.wait("!/Checking/.test(document.body.innerText) && /just now/.test(document.body.innerText)", 60)
            except TimeoutError:
                print("!! the Suite was still checking GitHub")
            time.sleep(1)
            # not "My apps": it shows where each app is installed, which the handbooks leave out
            for view, theme, name in (("home", "dark", "home"), ("updates", "dark", "updates"),
                                      ("settings", "dark", "settings"), ("home", "light", "home-light")):
                if w.js("document.documentElement.dataset.theme") != theme:
                    w.js("document.getElementById('tbTheme').click()")
                    time.sleep(0.8)
                w.js(f"document.querySelector('[data-view=\"{view}\"]').click()")
                time.sleep(1.5)
                w.shot(Path(img) / f"suite-{name}.png")
            w.js("document.documentElement.dataset.theme === 'dark' || document.getElementById('tbTheme').click()")
            w.close()
        finally:
            stop(proc)
    finally:
        shutil.rmtree(work, ignore_errors=True)


def pdf_page_png(pdf, png, page=0, width=1600):
    """A page of a PDF (a report the app made) as a picture."""
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(str(pdf))
    p = doc[page]
    p.render(scale=width / p.get_width()).to_pil().save(png)


def print_pdf(html, pdf, preview=None, channel="msedge", chromium=None):
    """handbook.html to an A4 PDF, as the Studio prints its brochure; with preview, a PNG of every page too."""
    from playwright.sync_api import sync_playwright
    html, pdf = Path(html).resolve(), Path(pdf).resolve()
    with sync_playwright() as p:
        b = p.chromium.launch(channel=None if chromium else channel, executable_path=chromium, headless=True)
        page = b.new_page(viewport={"width": 794, "height": 1123})
        page.goto(html.as_uri(), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(600)
        page.emulate_media(media="print")
        page.pdf(path=str(pdf), prefer_css_page_size=True, print_background=True)
        b.close()
    if preview:
        import pypdfium2 as pdfium
        preview = Path(preview)
        preview.mkdir(parents=True, exist_ok=True)
        for old in preview.glob("page-*.png"):
            old.unlink()
        doc = pdfium.PdfDocument(str(pdf))
        for i, p in enumerate(doc):
            p.render(scale=1.4).to_pil().save(preview / f"page-{i + 1:02d}.png")
    return pdf
