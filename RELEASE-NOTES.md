# Release notes

## 1.6.1 — 13 November 2026

The first public release. Same features as 1.6.0; the installer is fixed and the program now carries its publisher's name.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.6.1.exe` | 78.1 MB | `7E86127C2D06F0A9083B576C6035390A6F16853E8B47133BADDAA579FC370EB3` |
| `Multi-Screens-1.6.1-portable.exe` | 77.8 MB | `D6B884288798692510CA56EB0F3166BCE266F93FA9BF286089374BB16FDF97BB` |

Both are for 64-bit Windows 10 and 11 and are not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **Installs into Program Files.** The installer now installs for everyone on the computer, in `C:\Program Files\Multi Screens` by default, and asks for administrator permission once at the start. Choosing another folder works too. Before, an "Only for me" install pointed at Program Files stopped with "Error opening file for writing".
- **Sharp text on scaled screens.** The installer and uninstaller were drawn blurry on screens set to 125% or 150%; they are now crisp.
- **Publisher SCAFFApps.** Windows Settings, file properties and the installer show SCAFFApps as the publisher.
- The output-folder page still suggests your own `Documents\Multi Screens`, not the shared Public Documents.

### Tested

- The installer, the portable file and the installed program report publisher SCAFFApps and version 1.6.1 in their file properties.
- The installer asks Windows for administrator rights and declares itself sharp on scaled screens.

### Not tested

- Clicking through the new installer and uninstaller by hand.
- Updating over an earlier "Only for me" install. Remove the old copy from Windows Settings first, otherwise both stay installed.

## 1.6.0 — 12 November 2026

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.6.0.exe` | 78.1 MB | `30C5D3A8B63789AED86D3D4A6944B5BF90660019EA835ECDFCEC183BF43EB665` |
| `Multi-Screens-1.6.0-portable.exe` | 77.8 MB | `DBE5CB33C044096C33D9AD2C0EF08E6487ACA3C72C39D641075531A003AD04AA` |

Both are for 64-bit Windows 10 and 11 and are not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Added

- **Actual size.** A third view beside Fit all and Large that draws every screen life-size, at exactly 100%.
- **Record one device.** A record button under each screen, next to the screenshot button, records a video of that device only. The file carries the device's name.
- **Confirmation before recording.** Both record buttons now ask before a recording starts.
- **Blank-recording warning.** If the picture is blank a second into a recording (which happens when the display is asleep or locked), the app says so.

### Tested

- Actual size set the slider and all four screens to 100%; the Samsung S24 Ultra screen measured 72.3 mm by calculation (real 72.4 mm). Moving the slider afterwards deselected it.
- Answering "no" to the confirmation started nothing.
- A recording of the iPhone alone and a recording of the whole window were made three times each. The files were decoded and every sampled frame had real content. One frame of the iPhone recording was checked by eye: it was cut exactly to the phone.

### Seen once, not reproduced

- In one earlier run, both recordings came out as plain white video. It did not happen again in three repeats, and it coincided with the computer being left unattended, so a sleeping or locked display is the likely cause. The blank-recording warning was added because of it.

### Not tested

- The blank-recording warning itself, since the blank condition could not be produced on demand.
- Scrolling the row or changing the zoom during a single-device recording.
- Recordings longer than a few seconds.
- Running the installer end to end, including the output-folder page added in 1.3.0.

## 1.5.0 — 12 November 2026

### Fixed

- **Wrong display size, so wrong scale.** The app asked Windows about the first monitor only, in whole centimetres. With a second monitor connected it could be measuring the wrong one entirely: on a laptop with a 34-inch monitor attached it used the laptop's 12.8 inches for both. It now reads every monitor's own size in millimetres and uses the display the window is on.

### Added

- **Automatic display size, per monitor.** The scale follows the window when it is moved to another monitor, and updates when a monitor is plugged in or removed. Sizes are remembered between starts.
- **Starts on the biggest display.** With several monitors connected, the app opens maximised on the physically largest one.
- **Settings** shows the display's name and the size the monitor reports. A size typed there now applies to that display only, and **Use the detected size** undoes it.

### Changed

- A display size typed in Settings in an earlier version is no longer used. It applied to every display, which is what made the scale wrong on a second monitor.

### Tested

On a laptop with a 34-inch ultrawide monitor attached:

- The app opened maximised on the ultrawide, on a first start and on a second.
- It read 34.0 inches (797 × 334 mm) for the ultrawide and 13.0 inches (274 × 183 mm) for the laptop panel.
- At 100%, the Samsung S24 Ultra screen measured 72.3 mm wide on both displays, by calculation from the drawn size. The real one is 72.4 mm.
- Moving the window to the laptop panel switched the scale to that display's size.
- A typed size applied to one display and was undone again.
- The packaged app read the display size as well.

### Not tested

- Against a real phone held to the screen. The figures above are calculated, so please check by eye.
- Plugging a monitor in or out while the app is running.
- A monitor that reports no size.
- Running the installer end to end, including the output-folder page added in 1.3.0.

## 1.4.4 — 12 November 2026

### Fixed

- **Half-built window at start.** For about four seconds after launch the window showed an unfinished interface: no title strip, no device chips and no screens, with the toolbar sitting under the minimise, maximise and close buttons. Then everything appeared at once and the toolbar jumped down. The cause was the interface waiting for Windows to report the display's physical size, which takes several seconds. Now:
  - The interface no longer waits for that. The size is remembered from the last start and refreshed in the background.
  - The window stays hidden until the interface has been built, and is created at the display's size so nothing re-flows when it appears.
  - The title strip is part of the page from the first frame.

### Good to know

- On the very first start, before a display size has been remembered, the percentages beside the screens may change once a few seconds in (for example from 42% to 34%). The screens themselves barely move. It does not happen on later starts.

### Tested

- The window's start-up was recorded frame by frame before the fix, which showed the half-built interface from 0.8 to 5 seconds.
- After the fix, the layout was measured from the moment the window appears: on three starts it appeared 0.8 to 1.0 seconds after launch, already complete (title strip, four device chips, all screens, nothing off the edge). On the second and third starts nothing changed over the following nine seconds.

### Not tested

- The start-up was measured and sampled, not watched live. Please confirm by eye.
- Running the installer end to end, including the output-folder page added in 1.3.0.

## 1.4.3 — 12 November 2026

### Added

- **Enlarge and zoom a note's picture.** In the review screen, click a picture to open it large with its marker. Zoom with the − and + buttons, by clicking a point, or with Ctrl + mouse wheel, up to six times. Esc closes the picture and leaves the review screen open.

### Fixed

- **Blurry or missing pictures when the app was behind another window.** Windows stops a window from redrawing while another covers it, so a screenshot or note picture taken then could come back small and blurry, or never arrive. The app now keeps drawing when covered, takes the picture again if it comes back too small, and gives up on a capture that does not finish instead of waiting forever.

### Tested

- The enlarged picture opened sharp (842 × 1634 for the Samsung screen), zoomed to 196% with the buttons and to 250% by clicking a point, returned to fit, and Esc closed only the picture. It was checked by eye at 196%.
- The capture fix: before it, two of four runs with the app behind other windows gave a small picture or none. After it, six of six gave a sharp picture in under a second.

### Not tested

- Ctrl + mouse wheel zoom, which the test could not drive.
- The enlarged view for an app-window note.
- Running the installer end to end, including the output-folder page added in 1.3.0.

## 1.4.2 — 12 November 2026

### Fixed

- **Glitch around the minimise, maximise and close buttons while the app starts.** Three things caused it, and all are fixed:
  - The window was always created with the dark colours, then repainted once the interface loaded and asked for light. The appearance last used is now remembered and used from the first frame.
  - The window was shown at a small size and then maximised, so the buttons jumped. It now stays hidden until it is maximised and has drawn its first frame.
  - The interface itself started dark and switched to light late in loading. The saved appearance is now applied before anything is drawn.

### Tested

- After switching to the light appearance and restarting, the window was hidden when created and, at the moment it first appeared, was already maximised, with a white background and the light appearance applied.

### Not tested

- The start-up was measured, not watched. Please confirm by eye that the buttons no longer flicker.
- Running the installer end to end, including the output-folder page added in 1.3.0.

## 1.4.1 — 12 November 2026

### Added

- **Review screen before a report.** The report buttons now open a review screen instead of creating the PDF straight away. It shows each note with its picture and marker. A comment can be reworded and a note discarded there, and the PDF is only created when you choose "Create PDF report".

### Changed

- **Red dot instead of a number.** A report button with notes waiting shows a small red dot, under each screen and on Review notes in the second bar.
- **Comment in a box.** In the report, each comment sits in a tinted box with a red edge.
- **Device count.** A report for all screens now lists every device that was on show, including those with no notes, and the card reads "Devices reviewed". Before, it counted only devices that had notes, so it often read 1. A report for a single screen shows that device's name instead of a count.
- **Larger icons** for the tools at the right of the second bar.
- The report summary is more compact and phone drawings slightly smaller, so the first note fits on page one.
- The Review notes panel is replaced by the review screen. Notes are cleared by discarding them there or by creating the report; the "Clear all" link is gone.

### Tested

- Two notes on one device and one on another: the review screen opened with both pictures and markers and created no file. Rewording one comment and discarding the other left one reworded note, and creating the report cleared it. An all-screens report then listed four devices reviewed.
- The review screen and the first page of each report were checked by eye.

### Not tested

- Running the installer end to end, including the output-folder page added in 1.3.0.
- The review screen with many notes, or with an app-window note.

## 1.4.0 — 12 November 2026

### Added

- **Note anywhere.** A new button in the second bar places a note on the whole app window instead of one device, so a note can span several screens. It covers the app window only, not other programs or the desktop.
- **Loading line.** A thin line runs along the top of a screen while its page loads.

### Changed

- **Top bar order.** The folder, history, logins, record, settings and appearance buttons now sit next to the address bar. The device chips have their own line below.
- **Dark appearance** now uses the colours of VS Code's Dark 2026 theme.
- **Report design.** The report opens with the app name, a row of cards (site, date, devices, notes) and the device table. Each note sits in its own bordered card, and pages are numbered in the footer.
- **Smoother zooming.** Dragging the zoom slider resizes the screens straight away and re-scales the pages once the slider settles, instead of on every step.
- Panels, messages and screens fade in. Motion is switched off when Windows is set to reduce animations.

### Tested

- Top bar positions, dark colours, a note on the iPhone and a note dragged across two screens in the app window, and an all-screens report containing both. The interface in both dark and light, and the first page of the report, were checked by eye.

### Not tested

- Running the installer end to end, including the output-folder page added in 1.3.0.
- The second page of the report, where the app-window note appears.

## 1.3.1 — 11 November 2026

### Changed

- **Creating a report now clears the notes it contains.** A device's report removes that device's notes and their pictures from the app; the all-screens report removes all of them. Notes are only removed after the PDF has been written, and notes that were not part of the report are kept.
- The message shown after a report says how many notes were cleared.

### Good to know

- A report cannot be re-created once its notes are cleared, so check the PDF before moving on.

### Tested

- With two notes on one device and one on another, the first device's report cleared only its two notes; the all-screens report then cleared the rest, including one added in between. Their pictures were removed from disk and both PDFs were present.
- Asking for a report with no notes left created no file.

### Not tested

- Running the installer end to end, including the output-folder page added in 1.3.0.

## 1.3.0 — 11 November 2026

### Added

- **One output folder, chosen when you install.** The installer has a new "Output folder" page. The portable app, which has no installer, asks once on first start.
- **Folder button** in the top bar that opens the output folder.
- **Output folder in Settings**, with buttons to open it and to change it.

### Changed

- Screenshots, videos and review reports are now saved together under the output folder, in `Screenshots`, `Videos` and `Reports`. Before, they went to `Pictures\Multi Screens`, `Videos\Multi Screens` and `Documents\Multi Screens`.
- Files saved by earlier versions are not moved. They stay where they were.

### Tested

- With a folder chosen as the installer would record it (including a name with accented letters), the app used it without asking, and a screenshot, a recording and a report each landed in the right subfolder.
- The folder button is present and Settings shows the folder.
- The installer builds with the new page.

### Not tested

- **The installer page itself has not been seen running.** It compiles into the installer, but nobody has yet clicked through it. Please check that the page appears, that Browse works, and that the app then uses the folder you picked.
- The first-start question in the portable app.
- Changing the folder from Settings, and the folder button actually opening Explorer.
- Installing for all users instead of only yourself; the suggested folder may then be the shared Public Documents.

## 1.2.2 — 11 November 2026

### Changed

- **The report now shows the device, not just the page.** Each note is drawn on the device as it appears in the app: the body, the status bar with its camera cut-out, the Samsung navigation bar or the iPhone address bar, with your marker on top. Before, the report showed only the bare screenshot of the page.
- A note on a landscape screen (the laptop) is sized to fit on one page with its heading.

### Good to know

- Notes made with an earlier version do not have the device drawing recorded, so they still appear as a plain screenshot. Notes made from this version on show the device.

### Tested

- Reports for the iPhone, the Samsung and the laptop were created from test notes and their first pages checked by eye: device drawing, bars, cut-outs, markers, close-ups and comments were correct.

### Not tested

- Running the installer end to end.
- A report for the iPad, or for a phone turned to landscape.
- Reports with many notes or very long comments.

## 1.2.1 — 11 November 2026

### Changed

- **System bars now match the real phones**, measured from screenshots of a real iPhone 16 Pro and Samsung S24 Ultra. The status bar is a strip of its own and the page starts below it; content no longer runs under the camera cut-out.
- **Samsung S24 Ultra:** dark status bar with the punch-hole centred in it, and the dark three-button navigation bar at the bottom. Page area is now 384 × 745.
- **iPhone 16 Pro:** status bar in the page's colour with the camera pill inside it, and the browser's floating address bar over the bottom of the page. Page area is now 402 × 812.
- **iPad:** thin status bar in the page's colour and the home indicator line over the bottom of the page. Page area is now 820 × 1156 (estimated, not measured).

### Tested

- Page areas reported by each screen match the figures above.
- Status bar sits above the page, the cut-outs are centred in it, and the iPhone and iPad status bars take the page's colour on a light and on a dark test page.

### Not tested

- Running the installer end to end.
- An iPad against a real device.

## 1.2.0 — 11 November 2026

### Added

- **Review notes.** Mark a spot (click) or an area (drag) on any screen and attach a comment. A picture of the screen is kept with each note.
- **PDF review report.** A report button under each screen creates a PDF for that device; the Review notes panel creates one for all devices. Each note appears with the full screenshot and a numbered marker, a close-up of the marked spot or area, the comment, and the page address and time.
- **Review notes panel** to see, delete and clear notes.

### Fixed

- **Screenshots were garbled.** Since 1.0.0 the screenshot buttons could save a picture made of repeated tiles instead of the page. Screenshots now show the page correctly.

### Changed

- **Screenshot all** now saves each screen as shown instead of the whole scrolling page. The full-page method was the one producing garbled pictures.

### Tested

On a local test server:

- Spot and area notes placed on three screens, comments saved, counts shown on the report buttons, and Esc cancelling a note in progress.
- A per-device report and an all-devices report created; the first page was rendered and checked by eye: summary table, screenshot with marker, close-up and comment all correct.
- Screenshots from the camera button and Screenshot all had the right proportions for every device, in a maximised window and in a small one.

### Not tested

- Running the installer end to end.
- Later pages of the report were not checked by eye, including the laptop (landscape) layout and area close-ups.
- Reports with many notes or very long comments.

### Known limitations

- Screenshots and note pictures show the visible screen, not the whole scrolling page.
- A screen flickers briefly while a screenshot or note picture is taken.
- All screens use the Chromium engine, so Safari-only bugs do not show.
- Native Android and iOS apps cannot be shown.
- Clicks are not mirrored to a screen whose layout uses different elements.
- Status-bar and home-bar heights are approximations, and safe-area insets are not reported to the page.
- Device emulation for a screen is paused while its developer tools are open.
- The display size is read for the main display only.
- Recordings include the app's toolbars and have no sound.

## 1.1.0 — 11 November 2026

### Changed

- **Scale now means size compared with the real device.** At 100% every screen is drawn life-size on your display. The number is the same for all screens and a screen no longer changes size when others are shown or hidden. Before, the percentage was relative to the largest visible screen, so the same phone showed different figures and sizes depending on what was beside it.
- The zoom slider now runs from 15% to 150%.

### Added

- **Per-screen size.** Type a percentage beside a screen's name to size it on its own while the others follow the slider.
- **History** of visited pages, with titles, plus address suggestions as you type.
- **Saved logins.** Store a username and password for a site and fill them into the sign-in form on every screen. Passwords are encrypted with your Windows account.
- **Video recording** of the app window to a `.webm` file.
- **Settings** panel with the display size used for life-size drawing, read from Windows and adjustable.
- Reload without the cache (Ctrl+Shift+R or Shift-click reload) and Esc to close panels.

### Tested

On local test pages and a local test server:

- Life-size scale: at 100% each screen reported 100% and kept the same width alone and beside others.
- Per-screen size: one screen held its own value while the slider moved the rest, then followed the slider again after reset.
- History: pages recorded with titles, listed newest first, and reopened on all four screens from the list.
- Saved logins: a test login was saved, was not readable in the file on disk, filled the form on all four screens, and was refused for a different site.
- Recording: a three-second recording produced a video file.

### Not tested

- Running the installer end to end (install, shortcuts, uninstall).
- Whether 100% matches a real phone held against the display. This depends on the display size Windows reports; adjust it in Settings if it is off.
- Playing back a recorded video.
- Network throttling, reduced motion, outlines and clear site data.
- macOS and Linux builds, which are configured but have not been built.

### Known limitations

- All screens use the Chromium engine, so Safari-only bugs do not show.
- Native Android and iOS apps cannot be shown.
- Clicks are not mirrored to a screen whose layout uses different elements.
- Status-bar and home-bar heights are approximations, and safe-area insets are not reported to the page.
- Device emulation for a screen is paused while its developer tools are open.
- The display size is read for the main display only.
- Recordings include the app's toolbars and have no sound.

## 1.0.0 — 11 November 2026

First release.

- Four screens side by side: Samsung S24 Ultra, iPhone 16 Pro, iPad and a 15.6-inch laptop, each with its real viewport size, pixel ratio, touch support and browser identity.
- Device bodies with the iPhone and Samsung camera cut-outs, status bars and home bars drawn over a full-screen page.
- Synchronised scrolling (by page section), navigation, clicks, typing and hover.
- One shared login across all screens.
- Fit all, Large and fixed-zoom views that re-fit to any window or display size.
- Page theme, network speed, reduced-motion and touch-input emulation.
- Layout outlines, a sideways-overflow finder and a per-screen error counter.
- Per-screen and full-page screenshots.
- Rotate, reload and developer tools for each screen.
- Light and dark appearance for the app itself.
