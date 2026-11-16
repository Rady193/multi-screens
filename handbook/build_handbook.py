"""Makes the Multi Screens handbook: "Multi Screens Handbook.pdf" in the project folder, and a copy named for the
release in release/ (Multi-Screens-Handbook-<version>.pdf, the name the SCAFFApps Suite looks for).

    python handbook\\build_handbook.py              retake the pictures, then print
    python handbook\\build_handbook.py --no-shots   print with the pictures as they are
    python handbook\\build_handbook.py --preview    also a PNG of every page, in handbook\\preview

The pictures are taken from Multi Screens itself, run from this folder's source in a test profile of its own, showing
the demo site in handbook\\demo (never a real site or the desktop). Needs the app's node_modules (npm install), and
Python with playwright, pillow and pypdfium2, and Microsoft Edge. The layout and every word are in handbook.html, in
the SCAFFApps brochure style (brochure.css, as the SCAFFApps Studio's SCAFFERP brochure).
"""
import argparse
import json
import shutil
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import kit  # noqa: E402

IMG = HERE / "img"
INSTALLED = Path(r"C:\Program Files\SCAFFApps\Multi Screens\Multi Screens.exe")   # for the update offer, as users see it
EXAMPLE_FOLDER = r"C:\Users\Alex\Documents\Multi Screens"                       # shown instead of the test folder
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]


def pad(r, p=14, w=None, h=None):
    """A clip around a rectangle, p CSS pixels larger on each side (or w x h wide, centred on it)."""
    x, y = r["x"] - p, r["y"] - p
    cw, ch = (w or r["w"] + 2 * p), (h or r["h"] + 2 * p)
    if w:
        x = r["x"] + r["w"] / 2 - w / 2
    return {"x": max(x, 0), "y": max(y, 0), "width": cw, "height": ch}


def union(*rs, p=14):
    x1, y1 = min(r["x"] for r in rs), min(r["y"] for r in rs)
    x2, y2 = max(r["x"] + r["w"] for r in rs), max(r["y"] + r["h"] for r in rs)
    return pad({"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1}, p)


def go(w, url, wait=4.5):
    w.js(f"(() => {{ const u = document.querySelector('#url'); u.value = {json.dumps(url)};"
         f" u.dispatchEvent(new Event('input', {{bubbles: true}})); u.closest('form').requestSubmit(); }})()")
    time.sleep(wait)


def theme(w, name):
    if w.js("document.documentElement.dataset.theme || 'dark'") != name:
        w.click("#theme-toggle")
        time.sleep(0.8)


def escape(w):
    w.key("Escape", keycode=27)
    time.sleep(0.4)


def pane(w, i):
    """The i-th device screen's note layer (0 Samsung, 1 iPhone, 2 iPad, 3 laptop) and its pane, as rectangles."""
    return w.js(f"""(() => {{ const p = document.querySelectorAll('.note-layer')[{i}], b = document.querySelectorAll('.note-btn')[{i}];
      const r = e => {{ const x = e.getBoundingClientRect(); return {{x: x.left, y: x.top, w: x.width, h: x.height}} }};
      return {{layer: r(p.closest('.screen') || p), pane: r(b.closest('.pane, .device') || p.closest('.screen').parentElement.parentElement)}} }})()""")


def note(w, i, text, area=None, point=None):
    """A note on the i-th screen: an area (fractions x1, y1, x2, y2 of the screen) or a point, with its comment."""
    w.js(f"document.querySelectorAll('.note-btn')[{i}].click()")
    time.sleep(0.6)
    s = pane(w, i)["layer"]
    at = lambda fx, fy: (s["x"] + s["w"] * fx, s["y"] + s["h"] * fy)  # noqa: E731
    if area:
        w.drag(*at(area[0], area[1]), *at(area[2], area[3]))
    else:
        w.click_at(*at(*point))
    w.wait("!document.getElementById('note-editor').hidden")
    time.sleep(0.3)
    w.js("document.querySelector('#note-editor textarea').focus()")
    w.type(text)
    time.sleep(0.3)


def save_note(w):
    w.js("[...document.querySelectorAll('#note-editor button')].find(b => b.textContent === 'Save note').click()")
    time.sleep(1.2)


def quiet(w):
    """No message, and no panel, left on screen from the step before."""
    w.js("document.getElementById('toast').hidden = true")
    if w.js("!document.getElementById('popover').hidden"):
        print(f"   (a panel was open: {w.js('document.getElementById(\"popover\").dataset.for')}; closed)")
        escape(w)


def main_session(work, demo, api):
    env = kit.registration(work / "registration.json", "multi-screens", VERSION)
    env.update(MULTI_SCREENS_OUTPUT_DIR=str(work / "out"), MULTI_SCREENS_UPDATE_API=api)
    port = kit.free_port()
    proc = kit.start_electron(ROOT, work / "profile", port, env)
    try:
        w = kit.window(port, "index.html")
        w.front()
        time.sleep(1.5)
        go(w, demo + "orders.html", 2.5)
        go(w, demo)
        quiet(w)
        w.shot(IMG / "main-dark.png")
        stage = w.rect("#stage")
        w.shot(IMG / "devices.png", pad(stage, 0))
        phones = union(pane(w, 0)["pane"], pane(w, 1)["pane"], p=10)
        w.shot(IMG / "phones.png", phones)
        theme(w, "light")
        quiet(w)
        w.shot(IMG / "main-light.png")
        theme(w, "dark")
        w.click("#outline")
        time.sleep(1)
        w.shot(IMG / "outlines.png", union(pane(w, 0)["pane"], pane(w, 1)["pane"], p=10))
        w.click("#outline")
        time.sleep(0.6)

        # close-ups: the two bars, the view buttons, the buttons under a screen
        top = w.rect("#stage")["y"]
        quiet(w)
        w.shot(IMG / "bars.png", {"x": 0, "y": 0, "width": w.js("innerWidth"), "height": top - 6})
        w.shot(IMG / "views.png", union(w.rect("#fit"), w.rect("#zoom-label"), p=8))
        w.shot(IMG / "tools.png", pad(w.js("""(() => { const r = document.querySelectorAll('.pane-actions')[3].getBoundingClientRect();
            return {x: r.left, y: r.top, w: r.width, h: r.height} })()"""), 8))
        w.click("#fit-each")                       # the Large view
        time.sleep(1.5)
        quiet(w)
        w.shot(IMG / "large.png")
        w.click("#fit")
        time.sleep(1.5)

        # a note: an area on the iPhone, its box open
        note(w, 1, "The cards are too close to the edge on the iPhone: add some room on the left and right.",
             area=(0.06, 0.52, 0.94, 0.80))
        ed = w.rect("#note-editor")
        w.shot(IMG / "note.png", union(pane(w, 1)["pane"], ed, p=18))
        save_note(w)
        note(w, 3, "Sign in: make the button larger, it is easy to miss on the laptop.", point=(0.92, 0.08))
        save_note(w)
        note(w, 0, "The heading is cut on the Samsung: let it wrap onto two lines.", area=(0.05, 0.22, 0.98, 0.40))
        save_note(w)

        # Note anywhere: one area across the two phones
        w.click("#window-note-btn")
        time.sleep(0.8)
        a, b = pane(w, 0)["layer"], pane(w, 1)["layer"]
        w.drag(a["x"] + a["w"] * 0.04, a["y"] + a["h"] * 0.06, b["x"] + b["w"] * 0.96, b["y"] + b["h"] * 0.24)
        w.wait("!document.getElementById('note-editor').hidden")
        time.sleep(0.3)
        w.js("document.querySelector('#note-editor textarea').focus()")
        w.type("The header sits at different heights on the two phones: make them match.")
        time.sleep(0.4)
        w.shot(IMG / "note-anywhere.png", union(pane(w, 0)["pane"], pane(w, 1)["pane"], w.rect("#note-editor"), p=14))
        save_note(w)

        # the review screen, an enlarged picture, the report
        quiet(w)
        w.click("#notes-btn")
        w.wait("!document.getElementById('review-modal').hidden")
        time.sleep(1.5)
        w.shot(IMG / "review.png")
        w.js("document.querySelector('#review-modal img').click()")
        time.sleep(1)
        if w.js("!document.getElementById('zoom-view').hidden"):
            w.shot(IMG / "zoom.png")
        escape(w)
        w.js("[...document.querySelectorAll('#review-modal button')].find(b => /Create PDF report/.test(b.textContent)).click()")
        end = time.time() + 40
        reports = []
        while time.time() < end and not reports:
            time.sleep(1)
            reports = sorted((work / "out" / "Reports").glob("*.pdf")) if (work / "out" / "Reports").exists() else []
        if reports:
            time.sleep(1.5)
            kit.pdf_page_png(reports[-1], IMG / "report.png", 0, 1400)
        else:
            print("!! no report was made")
        escape(w)

        # settings, history, saved logins
        w.click("#settings-btn")
        w.wait("!document.getElementById('popover').hidden")
        time.sleep(1)
        w.replace_text(str(work / "out"), EXAMPLE_FOLDER, "document.getElementById('popover')")
        w.shot(IMG / "settings.png", pad(w.rect("#popover"), 6))
        escape(w)
        w.click("#history-btn")
        time.sleep(0.8)
        w.shot(IMG / "history.png", pad(w.rect("#popover"), 6))
        escape(w)
        go(w, demo + "signin.html", 3)
        w.click("#logins-btn")
        time.sleep(0.8)
        w.js("(() => { const f = document.querySelector('#popover form'); const [s, u, p] = f.querySelectorAll('input');"
             " u.value = 'alex@example.com'; p.value = 'handbook-sample'; f.requestSubmit(); })()")
        time.sleep(1.2)
        w.shot(IMG / "logins.png", pad(w.rect("#popover"), 6))
        escape(w)

        # the layout checks: the orders table is too wide for the phones
        go(w, demo + "orders.html", 3)
        quiet(w)
        w.click("#overflow")
        time.sleep(1.5)
        w.shot(IMG / "overflow.png")
        w.close()
    finally:
        kit.stop(proc)


def update_session(work):
    """A newer version on a stand-in for GitHub: what Settings shows when an update is waiting."""
    # The example offer: the next minor version, newer than the installed copy even when this release is
    # installed already (a fixed number, or this version, would then read "You have the latest version").
    major, minor = VERSION.split(".")[:2]
    example = f"{major}.{int(minor) + 1}.0"
    rel = kit.release(work / "release", example, "Multi Screens", f"Multi-Screens-Setup-{example}.exe")
    with kit.Serve(rel) as api:
        env = kit.registration(work / "registration.json", "multi-screens", VERSION)
        env.update(MULTI_SCREENS_OUTPUT_DIR=str(work / "out"), MULTI_SCREENS_UPDATE_API=api.url + "latest")
        port = kit.free_port()
        if INSTALLED.exists():        # the copy users have: it offers Update now (one run from source cannot)
            proc = kit.start_exe(INSTALLED, work / "profile-update", port, env)
        else:
            print("!! Multi Screens is not installed: the update picture shows the copy run from source")
            proc = kit.start_electron(ROOT, work / "profile-update", port, env)
        try:
            w = kit.window(port, "index.html")
            w.front()
            time.sleep(8)
            w.click("#settings-btn")
            w.wait("!document.getElementById('popover').hidden")
            time.sleep(1.2)
            box = w.rect("#popover .update-box")
            w.js("document.querySelector('#popover .update-box').scrollIntoView()")
            time.sleep(0.5)
            box = w.rect("#popover .update-box")
            w.shot(IMG / "updates.png", pad(box, 12))
            w.shot(IMG / "settings-dot.png", pad(w.rect("#settings-btn"), 10))
            w.close()
        finally:
            kit.stop(proc)


def signup_session(work):
    """The first start on a Windows account: the sign-up window."""
    env = kit.registration(work / "registration-new.json", "multi-screens", VERSION, registered=False)
    env.update(MULTI_SCREENS_OUTPUT_DIR=str(work / "out"), MULTI_SCREENS_UPDATE_API="http://127.0.0.1:9/")
    port = kit.free_port()
    proc = kit.start_electron(ROOT, work / "profile-new", port, env)
    try:
        w = kit.window(port, "registration.html")
        w.front()
        time.sleep(1)
        w.shot(IMG / "signup.png")
        w.close()
    finally:
        kit.stop(proc)


def shots(only=None):
    work = Path(tempfile.mkdtemp(prefix="ms-handbook-"))
    try:
        current = kit.release(work / "current", VERSION, "Multi Screens")       # GitHub, saying this is the newest
        with kit.Serve(HERE / "demo", 3000) as demo, kit.Serve(current) as api:
            for name, run in [("main", lambda: main_session(work, demo.url, api.url + "latest")), ("update", lambda: update_session(work)),
                              ("signup", lambda: signup_session(work)),
                              # the back cover, the same in every SCAFFApps handbook: the apps' icons, the Suite's views
                              ("family", lambda: (kit.family_icons(IMG, ROOT.parent), kit.suite_pictures(IMG, ROOT.parent)))]:
                if only and name not in only:
                    continue
                print(f"pictures: {name}", flush=True)
                run()
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-shots", action="store_true")
    ap.add_argument("--only", nargs="*", help="main, update, signup, family")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--chromium", help="a Chromium to print with, instead of Edge")
    a = ap.parse_args()
    if not a.no_shots:
        shots(a.only)
    # printed in handbook/build (never open anywhere), then copied: beside the source and, named for the release, in
    # release/; a copy a PDF reader has open is left as it is, and said so
    (HERE / "build").mkdir(exist_ok=True)
    pdf = kit.print_pdf(HERE / "handbook.html", HERE / "build" / "Multi Screens Handbook.pdf",
                        HERE / "preview" if a.preview else None, chromium=a.chromium)
    print(f"{pdf} ({pdf.stat().st_size // 1024} KB)")
    (ROOT / "release").mkdir(exist_ok=True)
    for target in (ROOT / "Multi Screens Handbook.pdf", ROOT / "release" / f"Multi-Screens-Handbook-{VERSION}.pdf"):
        try:
            shutil.copy2(pdf, target)
            print(f"and {target}")
        except PermissionError:
            print(f"!! {target} is open in another program: close it and build again to replace it")
    # release/ keeps only the newest handbook; the earlier ones stay on their GitHub releases
    newest = tuple(int(x) for x in VERSION.split("."))
    for old in (ROOT / "release").glob("Multi-Screens-Handbook-*.pdf"):
        v = old.stem.rsplit("-", 1)[-1]
        if v.replace(".", "").isdigit() and tuple(int(x) for x in v.split(".")) < newest:
            old.unlink(missing_ok=True)
            print(f"removed the older {old.name}")


if __name__ == "__main__":
    main()
