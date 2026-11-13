# Multi Screens

Multi Screens shows one web app side by side on several device screens, so you can review a page on a phone, a tablet and a laptop at the same time. What you do on one screen is repeated on the others.

Version 1.6.1 · Windows 10 and 11 (64-bit) · Published by SCAFFApps

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [The screens](#the-screens)
- [Size and scale](#size-and-scale)
- [Features](#features)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Where things are saved](#where-things-are-saved)
- [What it does not do](#what-it-does-not-do)
- [Building from source](#building-from-source)
- [Project layout](#project-layout)
- [Licence](#licence)

## Install

Download from the [Releases page](https://github.com/Rady193/multi-screens/releases/latest). Two files are offered; use whichever suits you.

| File | What it is |
|---|---|
| `Multi-Screens-Setup-1.6.1.exe` | Installer. Installs for everyone on the computer, in `C:\Program Files\Multi Screens` unless you choose another folder, so Windows asks for administrator permission once. Adds Start menu and desktop shortcuts, and can be removed from Windows Settings. |
| `Multi-Screens-1.6.1-portable.exe` | Single file. Nothing is installed and no administrator permission is needed; copy it anywhere (including a USB stick) and double-click it. |

The release notes list each file's SHA-256 checksum, so you can check a download with `Get-FileHash <file>` in PowerShell.

The app is not code-signed, so the first time you run either file Windows SmartScreen may show "Windows protected your PC". Choose **More info**, then **Run anyway**. To remove that warning for other people you would need to buy a code-signing certificate and sign the files.

No other software is needed. The browser engine is built in.

### Output folder

Everything the app produces goes into one folder that you choose:

- **Installer:** a page titled "Output folder" asks where to save, after you pick the install location. It suggests `Documents\Multi Screens`.
- **Portable file:** there is no installer, so the app asks once, the first time it starts.

Inside that folder the app keeps three subfolders: `Screenshots`, `Videos` and `Reports`.

To open the folder, press the **folder** button in the top bar. To change it, open **Settings** (the sliders icon) and choose **Change…**. Changing the folder does not move files already saved.

## Quick start

1. Open Multi Screens.
2. Type your app's address in the bar at the top and press **Go**. Addresses on your own machine work too, for example `localhost:3000`.
3. With more than one monitor connected, the app opens on the physically largest one.
4. The page loads on every screen. Scroll, click and type on any one of them and the others follow.
5. Sign in once: all screens share the same login.

## The screens

| Screen | Screen size (CSS px) | Page area (CSS px) | Pixel ratio | Identifies as |
|---|---|---|---|---|
| Samsung S24 Ultra | 384 × 832 | 384 × 745 | 3.75 | Chrome on Android, touch |
| iPhone 16 Pro | 402 × 874 | 402 × 812 | 3 | Safari on iPhone, touch |
| iPad | 820 × 1180 | 820 × 1156 | 2 | Safari on iPad, touch |
| Laptop 15.6" | 1536 × 864 | 1536 × 864 | 1.25 | Chrome on Windows |

The system bars are drawn as they appear on the real phones, and the page gets the space between them. The phone measurements were taken from screenshots of a real iPhone 16 Pro and Samsung S24 Ultra.

- **Samsung:** a dark status bar at the top with the camera punch-hole in its centre, and the dark three-button navigation bar at the bottom. The page sits between the two.
- **iPhone:** a status bar at the top that takes the page's colour, with the camera pill inside it. The page starts below it and runs to the bottom of the screen, where the browser's floating address bar sits over it. Content under that bar is covered on the real phone too.
- **iPad:** a thin status bar in the page's colour at the top, and the home indicator line over the bottom of the page.
- The iPad heights are estimates; no real iPad was measured.
- **Laptop** assumes a 1920 × 1080 display at Windows' default 125% scaling. If yours differs, change the numbers above the screen.
- **iPad** is the standard 10.9-inch model.
- Any screen's width and height can be edited in the boxes above it.

## Size and scale

Every percentage in the app means the same thing: **size compared with the real device**. At 100% a screen is drawn life-size on your display, so you can hold the real phone next to it and they match.

- The number is the same for every screen, and a screen keeps its size whether it is shown alone or beside others. A 6.8-inch phone is always drawn larger than a 6.3-inch one.
- **Zoom slider** (15% to 150%) sets the size for all screens together.
- **Fit all** picks the largest size at which every screen fits in the window.
- **Large** sizes each screen separately to fill the window, so the percentages differ in that view.
- **Actual size** draws every screen life-size, at exactly 100%. It stays at 100% when the window moves to another display, where the screens are redrawn to that display's size.
- **One screen on its own:** type a value into the percentage beside a screen's name. That screen keeps its own size while the others follow the slider; its percentage turns blue. Click the small × beside it to make it follow the slider again.

Life-size drawing depends on knowing how big your display is, and this is automatic. Each monitor reports its own physical size in millimetres; the app reads that for every connected display and uses the one its window is on. Move the window to another monitor, or plug one in, and the scale follows. The sizes are remembered, so they are in place from the first moment on later starts.

If a real phone held against the screen at 100% does not match, open **Settings** (the sliders icon). It shows the display's name and what the monitor reports. Type a different diagonal size to override it for that display only; **Use the detected size** undoes the override. A few monitors, some televisions and projectors among them, report no size or a wrong one; the app then estimates and says so.

## Features

### Viewing

| Feature | Where | What it does |
|---|---|---|
| Fit all | Top bar | Shows every screen at once, scaled to the window. This is the default. |
| Large | Top bar | Makes each screen as big as the window allows; scroll sideways between them. |
| Actual size | Top bar | Draws every screen life-size (100%), the same size as the real device. |
| Zoom slider | Top bar | Sets the size of all screens as a percentage of life size. |
| Per-screen size | Beside each screen's name | Sizes that screen on its own. |
| Device chips | Top bar | Show or hide individual screens. |
| Focus | Click a screen's name | Shows only that screen. Click the name again to bring the others back. |
| Wrap | Second bar | Lets screens flow onto several rows instead of one. |
| Light / dark | Sun or moon button | Switches the app's own appearance. |

The layout re-fits itself whenever the window changes size or moves to another display.

### Sync

Three switches under **Sync** in the second bar. All are on by default.

| Switch | What follows on the other screens |
|---|---|
| Scroll | Scrolling. Screens line up on the same section of the page, not the same percentage, because a page is much taller on a phone than on a laptop. |
| Navigation | Following a link or changing page. |
| Clicks, typing & hover | Clicks, text typed into fields, ticked boxes, and mouse hover effects. |

The screen you last used is the leader and is outlined in blue.

### Review notes and PDF report

Write notes on what you see while you review, then turn them into a report.

1. Under the screen you are looking at, press the **note** button (speech bubble with a plus). The screen gets a blue tint and a crosshair.
2. **Click** the spot you mean, or **drag** a rectangle over the area.
3. Type your comment in the box that opens and choose **Save note** (or press Ctrl+Enter). The app takes a picture of that screen as it is at that moment and keeps it with the note.
4. Carry on reviewing. Scroll, move to other pages and add as many notes as you like, on any screen.
5. When you are done, press the **report** button (the page icon) under a screen. A red dot on the button means that screen has notes ready.
6. A **review screen** opens before anything is created. It lists each note with its picture and marker. Here you can:
   - **reword a comment** by typing in it (it saves when you click elsewhere),
   - **discard a note** you no longer want,
   - **enlarge a picture** by clicking it. The picture opens large with its marker. Zoom with the − and + buttons, by clicking a point on the picture, or with Ctrl + mouse wheel, up to six times. **Fit** shows the whole picture again and Esc closes it.
   - then choose **Create PDF report**, or **Close** to carry on reviewing.

The PDF opens with the site, date and counts, a summary table of devices, then one entry per note. Pages are numbered.

- the note's number and your comment,
- a drawing of the device as it appears in the app (body, status bar with its camera cut-out, navigation bar) showing the page, with a numbered marker where you clicked or dragged,
- a close-up of the marked spot or area,
- the page title, address and time.

**Note anywhere** in the second bar works the same way on the whole app window instead of one device. Use it to mark something that spans several screens, for example to compare the same header on two phones side by side. The picture kept with the note is of the app window. It cannot mark other programs or the rest of your desktop.

**Review notes** in the second bar opens the same review screen for every note across all screens, and creates one report covering every device. It also shows a red dot when there are notes waiting. That report lists every device that was on show, including those with no notes, so the "Devices reviewed" figure is the number of devices you looked at.

Things to know:

- While a note is being placed, the page under the crosshair does not react to the mouse. Press Esc, or the note button again, to cancel.
- **Creating a report clears the notes it contains.** A device's report removes that device's notes; the all-screens report removes every note. The notes and their pictures live on in the PDF, and the app is ready for the next review. Notes on other devices are left alone until they are reported too.
- Until they are reported or deleted, notes are kept, including after closing the app, so you can spread a review over several sessions.
- Because the notes are cleared, check the PDF opens before you move on. A report cannot be re-created once its notes are gone.
- A note records the screen you marked. If the same problem shows on another device, add a note on that screen too.

### History

The clock button lists the pages you have opened, newest first, with their titles. Click one to open it on every screen. The address bar also suggests past addresses as you type. **Clear all** empties the list. Up to 300 pages are kept.

### Saved logins

The key button stores sign-in details so you do not retype them while testing.

1. Open the key panel. The **Site** box is filled in with the site you are on.
2. Enter the username and password and choose **Save login**.
3. Later, open the sign-in page, open the key panel and choose **Fill**. The username and password are typed into the form on every screen showing that site. You then press the site's own sign-in button.

How they are protected:

- Passwords are encrypted with your Windows account before they are written to disk, so the file cannot be read by another Windows user or on another computer.
- A login is only filled into pages of the exact site it was saved for.
- Anyone who can use your unlocked Windows account can open the app and fill a saved login. Do not save logins on a shared account.
- Saved logins are separate from "staying signed in". Sites that keep you signed in will do so without this feature.

### Video recording

There are two ways to record:

- **The whole app window:** the round record button in the top bar.
- **One device:** the record button under that screen, next to the screenshot button. The video shows only that device, cut to its body, even if you scroll the row or change the zoom while recording.

Either way, the app first asks you to confirm. While recording, the button turns red and the elapsed time shows in the top bar. Press the button again to stop. Only one recording runs at a time.

The video is saved as a `.webm` file in the `Videos` subfolder of your output folder. A recording of one device carries that device's name. The format plays in browsers, VLC and the Windows Media Player app. There is no sound.

Things to know:

- A whole-window recording includes the toolbars.
- A single device is recorded at the size it is drawn on screen. For a sharper video of one device, switch to **Large** or **Actual size** first.
- If the display is asleep or locked, Windows hands back blank frames and the video would be plain white. The app checks a second into the recording and warns you if the picture is blank.

### Page conditions

| Control | What it does |
|---|---|
| Page theme | Tells the page the user prefers a light or dark theme. |
| Network | Simulates Fast 4G, Slow 4G, Slow 3G or Offline. |
| Reduced motion | Tells the page the user prefers less animation. |
| Touch input | Makes the mouse act as a finger on the phone and tablet screens: drag to scroll, taps send touch events. Shows a round cursor while on. Off by default. |

### Checking a layout

| Tool | What it does |
|---|---|
| Outlines | Draws a line around every element. |
| Find overflow | Highlights elements that make a screen scroll sideways and reports how many pixels too wide each screen is. |
| Error badge | A red number beside a screen's name counts errors the page has logged. Click it to open developer tools. |

### Under each screen

| Button | What it does |
|---|---|
| Rotate | Turns the screen between portrait and landscape. |
| Reload | Reloads that screen only. |
| Screenshot | Saves an image of that screen. |
| Record | Records a video of that screen only. |
| Developer tools | Opens the browser's inspector for that screen. |
| Note | Marks a spot or area on that screen and attaches a comment. |
| Report | Creates a PDF of that screen's notes. |

### Other

- **Screenshot all** saves an image of every visible screen.
- **Review notes** lists all notes and creates a report for all screens.
- **Clear site data** deletes cookies, sign-in sessions and cache for the previewed pages, after asking for confirmation. It does not delete saved logins or history.
- **Output folder** (folder icon in the top bar) opens the folder where screenshots, videos and reports are saved.
- **Settings** (sliders icon) holds the display size used for life-size drawing and the output folder.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| F5 or Ctrl+R | Reload all screens |
| Ctrl+Shift+R, or Shift-click the reload button | Reload all screens without the cache |
| Ctrl+L | Jump to the address bar |
| Esc | Close an open panel or the enlarged picture, or cancel a note being placed |
| Ctrl + mouse wheel | Zoom the enlarged picture of a note |

## Where things are saved

| What | Where |
|---|---|
| Screenshots | `Screenshots` in your output folder |
| Videos | `Videos` in your output folder |
| Review reports (PDF) | `Reports` in your output folder |
| Which folder is the output folder | `%APPDATA%\Multi Screens\settings.json` |
| Review notes and their screenshots | `%APPDATA%\Multi Screens\review` |
| Saved logins (encrypted) | `%APPDATA%\Multi Screens\logins.json` |
| Settings, history, last address, sign-in sessions for previewed sites | `%APPDATA%\Multi Screens` |

Deleting the `%APPDATA%\Multi Screens` folder resets the app completely, including saved logins, history and review notes. Reports already created in Documents are not affected.

## What it does not do

- **It is not Safari.** Every screen uses the same Chromium engine. Sizes, breakpoints, touch and the reported browser identity are accurate, but a bug that only happens in Safari on a real iPhone or iPad will not appear here. Check those on a real device.
- **It cannot run native apps.** Apps installed from an APK or an app store do not run in it. To see a real Android phone on your computer, a screen-mirroring tool such as scrcpy is the usual choice.
- **Mirrored clicks rely on matching page structure.** A click is repeated by finding the same element on the other screens. If the phone layout uses different elements from the desktop one (a menu button instead of a navigation bar, for example), the click is not repeated there.
- **Hover on touch screens.** Many sites only apply hover effects on devices with a mouse. On the phone and tablet screens such effects correctly do not appear.
- **While developer tools are open** for a screen, that screen's device emulation is paused. It returns when you close them.
- **Display size on other systems.** Reading a monitor's physical size works on Windows. On macOS or Linux builds the size is estimated until you type it in Settings.
- **Screenshots show the visible screen.** They capture what the device is showing, not the whole scrolling page. Their sharpness depends on your display: a screen cannot be captured larger than the app window, so tall phones come out slightly below the device's full resolution.
- **A screen flickers for a moment** when a screenshot or note is taken, while it is redrawn at full size for the picture.
- **Login fill is manual.** The app does not offer to save a password when you sign in, and does not fill forms by itself.

## Building from source

You need Node.js 20 or newer.

```bash
npm install
```

```bash
npm start
```

To produce the Windows installer and portable file in the `release` folder:

```bash
npm run dist
```

Notes:

- With recent npm versions, `npm install` may skip Electron's download step. If `npm start` reports that Electron failed to install, run `node node_modules/electron/install.js` once. On Node.js 26 that script can also fail to unpack; in that case unzip the downloaded archive from `%LOCALAPPDATA%\electron\Cache` into `node_modules\electron\dist` and create `node_modules\electron\path.txt` containing `electron.exe`.
- If the project is in a synced folder (OneDrive, Dropbox) and a build fails with a file-in-use error, pause syncing or build to a folder outside it: `npx electron-builder --win -c.directories.output=C:\some\other\folder`.
- macOS and Linux builds are configured (`npm run dist:mac`, `npm run dist:linux`) but must be run on a Mac or a Linux machine respectively. They have not been built or tested. Display-size detection is Windows-only; elsewhere 15.6 inches is assumed until changed in Settings.
- To change the icon, edit `build/icon.svg` and regenerate `build/icon.png`, `build/icon.ico` and `app/icon.png` from it.

## Project layout

| Path | Purpose |
|---|---|
| `main.js` | Starts the window, applies device emulation, saves screenshots and videos, keeps the encrypted logins and review notes, and builds the PDF report. |
| `host-preload.js` | The small, fixed set of functions the app window may call in `main.js`. |
| `monitors.ps1` | Asks Windows for each connected monitor's physical size. Run by `main.js`. |
| `guest-preload.js` | Runs inside each previewed page; reports and replays scroll, clicks, typing and hover, and fills a saved login. |
| `app/index.html`, `app/style.css`, `app/renderer.js` | The app's interface, including the device list at the top of `renderer.js`. |
| `app/start.html` | The "Ready" page shown before an address is entered. |
| `app/theme-early.js` | Applies the saved light or dark appearance before the window is first drawn. |
| `build/` | Icon files, the packaging hook, and `installer.nsh`, the installer page that asks for the output folder. |
| `release/` | Built installers. |

To add or change a device, edit the `DEVICES` list at the top of `app/renderer.js`. Each device's `phys` value is the width of its real screen in millimetres divided by its width in CSS pixels; it is what makes life-size drawing work.

## Licence

Copyright © 2026 SCAFFApps. All rights reserved.

The released program is free to download and use. The source code is published for reference only; it may not be copied, changed or redistributed without written permission from SCAFFApps. See [LICENSE](LICENSE) for the full terms.
