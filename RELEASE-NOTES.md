# Release notes

## 1.11.1 — 21 November 2026

**The output folder chosen in the installer** is the one the app uses.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.11.1.exe` | 71.1 MB | `7A8B09ED9EDD5E6FC966DA022E11343F5DB173B1702AF6DF128753225E0FED6B` |
| `Multi-Screens-Handbook-1.11.1.pdf` | 4.7 MB | `ED9DEF53BEA75B840E95C651F5A666A9B6FC5CB093E29AA7F5EBA4C1AB8EED20` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Fixed

- The folder chosen on the installer's **Output folder** page was not picked up: the app asked again on its first start. It now uses the installer's choice. A folder changed later in Settings is kept until the installer is run again with another folder.
- Installing again, the **Output folder** page shows the folder in use instead of always `Documents\Multi Screens`, so clicking through a reinstall keeps it.
- Updating from 1.11.0 or earlier keeps the folder answered on that first start. Settings, saved logins and review notes stay where they are.

### Changed

- **The handbook**, `Multi-Screens-Handbook-1.11.1.pdf`: Install and start says the installer shows the folder in use when installing again; the window pictures retaken.

### Updating from 1.11.0 or earlier

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite. These update without the installer's pages, so the output folder stays as it is.

### Tested

- From this installer's build (the unpacked app), in test profiles: a new profile took the installer's folder; a folder answered on first start was kept, and replaced when the installer had run since; a folder changed in Settings was kept, and replaced when the installer wrote the same folder again; a folder forced for automated runs won over the installer's. Each start left the folder in use for the installer, and a test build of the installer's own reading code read it back word for word (also with non-Latin letters, and with and without a byte-order mark).
- On the developer's laptop, the 1.11.0 profile kept every setting and recorded the installer's choice.
- The SCAFFApps design-language check passes. Microsoft Defender finds nothing in the installer or the handbook.

### Not tested

- Running this installer itself (new, or over 1.11.0), its Output folder page included, and updating from Settings or the Suite.

## 1.11.0 — 20 November 2026

**Fix spelling** in the note boxes, with Windows' own spell checker, on this computer.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.11.0.exe` | 71.1 MB | `93845C06151F7086A6F6580391E74CE776E2F7B8CB54FB6E05A15E3EBADF83A7` |
| `Multi-Screens-Handbook-1.11.0.pdf` | 4.6 MB | `1ABEDC2CF1A5AAA2E6896CAAEBA9DA3B59667158AF44D2637279D7F25FD2D8AD` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### New

- **Fix spelling**, at the top right of the box that opens for a new note (also for Note anywhere) and beside each note's name on the review screen, or **F7** as in Word. Windows' own spell checker reads the comment, the one that underlines mistakes in red; nothing leaves the computer. What it is sure of is fixed at once: a typing slip on its autocorrect list ("teh" to "the", "i" to "I"), a word written twice, and a capital letter at the start of each sentence and line. A word it only has guesses for is shown under the text with them, the likeliest first, to click; **Leave** keeps it. Ctrl + Z undoes the fixes. Addresses, file paths, codes, units after a number and words in capitals are left as they are. It fixes spelling, not grammar.
- On the review screen, what Fix spelling changes is saved at once, so closing the screen straight after keeps it.
- Smart Snap 1.4.0 has the same Fix spelling in its comment boxes, from the same code.

### Changed

- **The handbook**, `Multi-Screens-Handbook-1.11.0.pdf`: Review notes, The report and The keys say how to fix the spelling; the window pictures retaken.

### Updating from 1.10.3 or earlier

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- The note box and the review screen, from the source and from this installer's build, in a hidden test window with Windows' real spell checker (British English, as on the developer's laptop), the notes from a stand-in: "the save button is to close to the edge. i would prefere more room, e.g. 16 px." became "The save button … I would prefere …", with "prefer" offered first and "16 px" left alone; choosing it wrote "prefer". On the review screen "teh button … i would prefere it bigger." was fixed and saved at once, and saved again after the choice. A note box grown by the choices near the window's foot moved up to stay inside the window.
- The SCAFFApps design-language check passes, the new shared files included. Microsoft Defender finds nothing in the installer or the handbook.

### Not tested

- With a real keyboard and mouse (the tests type and click from code), and a spell checker in another language than English.
- This installer over 1.10.3.

## 1.10.3 — 18 November 2026

The Page theme and Network lists in the SCAFFApps colours.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.10.3.exe` | 71.1 MB | `117E7EB9784BF14D8B676C013852F487D8E27A1F2A7224B71291203C3537959A` |
| `Multi-Screens-Handbook-1.10.3.pdf` | 4.6 MB | `354B1F658C65B9BA7D6EB09E8453AF996C60170C9332FD317E0AA8FF5CBBFA76` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **The Page theme and Network lists** open in the SCAFFApps colours: a card in the window's own colours, the chosen item in gold (purple in the light appearance) with a tick, the one under the pointer lit in grey, as in every SCAFFApps menu. It was the list Windows draws, in its own blue with a grey frame. The arrow keys, Enter and Esc work as before, and nothing beside the list moves. Smart Snap 1.3.1 has the same lists, from the same code.
- **The handbook**, `Multi-Screens-Handbook-1.10.3.pdf`: 1.10.2's pages and pictures, with the new version.

### Updating from 1.10.2 or earlier

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- The packaged program in a test profile: both lists are the new ones, as wide and as high as before; choosing Slow 4G sets the network and saves it, and after a restart the Network list shows Slow 4G again.
- The window in Edge: both lists open in the dark and the light appearance, their words whole.
- The SCAFFApps design-language check passes, the new shared files included. Microsoft Defender finds nothing in the installer.

### Not tested

- This installer over 1.10.2.

## 1.10.2 — 16 November 2026

The Print Screen key is left to Smart Snap.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.10.2.exe` | 78.0 MB | `7A86DC64DC17219804508E5EC90731DEC5831B8AB0E9CDA16FEFC0B393BCD78F` |
| `Multi-Screens-Handbook-1.10.2.pdf` | 4.6 MB | `0E68E147BE9B093CC66422ABF65C8AE5DACEF97E09547D7752DA4E7125A6BE50` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **Print Screen no longer starts Note anywhere.** Windows 11 gives the key to its Snipping Tool before any app sees it, and Smart Snap 1.2 now takes it for an area snap in every program, Multi Screens included. **Alt+N** still starts Note anywhere.
- **The handbook**, `Multi-Screens-Handbook-1.10.2.pdf`, with the Keys page to match. Replaced the same day: its pictures retaken, mixed between the dark and light appearance, and the SCAFFApps Suite on the back page as it is in 1.0.3.

### Updating from 1.10.1

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- This installer over 1.10.1 on a working computer, silently with Windows' permission: installed in 4 seconds, Windows lists 1.10.2. The installed app has no Print Screen shortcut left in it.
- Microsoft Defender finds nothing in the installer.

## 1.10.1 — 16 November 2026

Enter saves a note.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.10.1.exe` | 78.0 MB | `113D34038B1921CB1E82B30BB5461A5490CAAD6CB99B1B034D95AF95EC4A81FD` |
| `Multi-Screens-Handbook-1.10.1.pdf` | 4.1 MB | `81424EB83272BAB4D42682E98857C6318A062BB950C22F90893C0E1DB9D30AA0` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **Enter saves the note** being written; **Shift+Enter** starts a new line (Ctrl+Enter still saves too). The same in Smart Snap's comment box.
- **The handbook**, `Multi-Screens-Handbook-1.10.1.pdf`, with Enter on the Notes and Keys pages.

### Updating from 1.10.0

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- The packaged app, in a test profile with the handbook's sample site: a note typed over two lines with Shift+Enter stays open, and Enter saves it with both lines.
- 1.10.0 installed offers this version (the handbook's update picture).
- Microsoft Defender finds nothing in the installer.

## 1.10.0 — 16 November 2026

Shortcuts for the tools, Print Screen for Note anywhere, and window buttons that dim with the review screen.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.10.0.exe` | 78.0 MB | `B8682BF13693EC4AA03F5926FEF132C34C1E0E0A199417290FD4622F37AC51D0` |
| `Multi-Screens-Handbook-1.10.0.pdf` | 4.3 MB | `09F171D9AE5804504B5481FB742556028400B713DCB780D340DCF835CB11F30F` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Added

- **Shortcuts for the tools**: **Alt+N** Note anywhere, **Alt+R** Review notes, **Alt+O** Find overflow, **Alt+S** Screenshot all. They also work while you are in a device screen, and with any keyboard layout. They wait while the review screen, an enlarged picture or a comment being written is open.
- **The Print Screen key starts Note anywhere** while the Multi Screens window is in front. In every other program it does what it did before.

### Fixed

- **The window buttons** (minimise, maximise, close) dim with the review screen, an enlarged picture and Note anywhere, instead of staying bright on top of them.

### Changed

- **The handbook**, `Multi-Screens-Handbook-1.10.0.pdf`, with the shortcuts on the Keys page.

### Updating from 1.9.0

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- Alt+N, R, O and S pressed on a keyboard (sent through Windows) in the interface and inside a device screen: each runs its tool; the page does not get them, other keys such as Alt+X still reach it.
- Print Screen is claimed when the window gets the focus and given back when it loses it.
- The window buttons in both appearances under the review screen, an enlarged picture and Note anywhere: the same colour as the page beside them, back to normal when each closes.
- 1.9.0 installed offers this version (the handbook's update picture), and this installer over 1.9.0 as Update now runs it: installed in 7 seconds, Windows lists 1.10.0, and it opens.
- Microsoft Defender finds nothing in the installer.

### Not tested

- **Print Screen with another screenshot program that also watches the key** (here Adobe Photoshop Express): both may answer it while Multi Screens is in front.

## 1.9.0 — 16 November 2026

Copy a review report as a picture, and the tools beside the device chips.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.9.0.exe` | 78.0 MB | `3760F183E96A78C419F38E741542AE8DFF9E14B5AD0C078E3B3156A108595958` |
| `Multi-Screens-Handbook-1.9.0.pdf` | 4.3 MB | `CAB1F4601B296F6B1368050D99A953CBD6D8C6DB924AD84A15D4310BCC1A0D77` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Added

- **Copy as picture**, in the review screen: the whole report on the clipboard as one tall picture, to paste into a chat, an email or a document. It is the PDF's report on one page, twice as sharp as the screen. Nothing is saved and the notes stay, so the PDF can still be made afterwards.

### Changed

- **The tools beside the device chips**: Note anywhere, Review notes, Find overflow, Screenshot all and Clear site data move from the second bar to the devices' line.
- **The handbook**, `Multi-Screens-Handbook-1.9.0.pdf`, with its pictures retaken from this version.

### Updating from 1.8.2

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- Copy as picture from the source code, on a sample site with notes on two phones: a 1588 × 3152 picture on the clipboard in under a second, both notes still in the review screen. Create PDF report still saves the PDF and clears its notes.
- The tools beside the device chips in the dark and light appearances, and as icons only on a narrower window.
- 1.8.2 installed, then this installer over it as Update now runs it (silent, with Windows' permission): installed in 8 seconds, Windows lists 1.9.0, and it opens.
- Microsoft Defender finds nothing in the installer.

## 1.8.2 — 16 November 2026

The handbook in the SCAFFApps style, scrollbars in the SCAFFApps colours, and panels that fit the window.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.8.2.exe` | 78.0 MB | `AD1FC40AB3225AD666F21DEA54273F4542327934003CAA45CEF09031A077A6B7` |
| `Multi-Screens-Handbook-1.8.2.pdf` | 4.3 MB | `0FA3603C1558A23CEABE3952F521A2F2A140C97386770002CE6BE551FBF76C99` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **The handbook**, `Multi-Screens-Handbook-1.8.2.pdf`: 15 pages with pictures in the SCAFFApps brochure style, from installing to troubleshooting. The SCAFFApps Suite opens it from Handbooks.
- **"Published by SCAFFApps - www.scaffapps.com"** at the end of Settings and of the sign-up window.
- **Scrollbars in the SCAFFApps style**: a slim purple bar on no track, wider under the pointer; never the grey Windows bar with its arrows.
- **No scrolling where it can be helped**: Settings, history and saved logins use the window's height, so they scroll only on a short window.

### Updating from 1.8.1

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite.

### Tested

- Updated from 1.8.1 by the installed SCAFFApps Suite 1.0.1, against a stand-in for GitHub offering this installer: downloaded, checked against both published checksums, Windows' permission, installed in 9 seconds; Windows lists 1.8.2.
- Microsoft Defender finds nothing in the installer.
- The handbook's pictures were taken from this version, in a test profile, on a sample site.

## 1.8.1 — 16 November 2026

A shorter sign-up window, and "Published by SCAFFApps" at the end of Settings.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.8.1.exe` | 78.0 MB | `D3867F58A68DE181DD9564BF7D085DF578E3E19E405D376974C78EFBE5794AC4` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **The sign-up window** (your name and e-mail, asked once) ends with "Published by **SCAFFApps** · www.scaffapps.com", without the paragraph above it.
- **Settings** ends with the same line.

### Updating from 1.8.0

- Settings > Updates > **Update now**, or **Update** in the SCAFFApps Suite. Windows asks for permission; Multi Screens closes, is updated and opens again.

### Tested

- The SCAFFApps Suite 1.0.0 updated Multi Screens 1.8.0 to 1.8.1 with its own button, against a stand-in for GitHub offering this installer: downloaded, checked against both checksums, Windows' permission, installed in 10 seconds; Windows lists 1.8.1. Microsoft Defender finds nothing in the installer.
- Settings in the new build: the line at the end, SCAFFApps in bold.

## 1.8.0 — 16 November 2026

Installed, not portable, in the SCAFFApps folder; the SCAFFApps colours; your name and e-mail asked once.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.8.0.exe` | 78.0 MB | `58AE05371E9E762E9B35A9826CD90FA6550490682728A28638B7618C6122B49E` |

For 64-bit Windows 10 and 11. Not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **Installed only.** One installer, no portable file. New installs go to `C:\Program Files\SCAFFApps\Multi Screens`, with the Start menu shortcut in a **SCAFFApps** folder. A copy in `C:\Program Files\Multi Screens` moves there when it updates (Settings > Update now included); the old folder is removed.
- **The SCAFFApps colours.** No more blue: buttons and switches in SCAFFApps purple, the active screen, its chip and the update dot in gold. The light appearance is white, with cream only behind the screens. The review report uses purple.
- **Your name and e-mail, once.** The first SCAFFApps app to start on a Windows account asks for them; the others (the SCAFFApps Suite, Smart Snap, Instant Share) do not ask again. They are sent to SCAFFApps (`www.scaffapps.com`) with the app's name and version, the Windows version and a random number made for the Windows account. Nothing else is sent.
- **The SCAFFApps Suite** installs, opens and updates Multi Screens.

### Updating from 1.7

- **Installed copy:** Settings > Updates > **Update now**. Windows asks for permission; the new version is installed in `C:\Program Files\SCAFFApps\Multi Screens` and opens.
- **Portable copy:** there is no 1.8.0 portable file, so it offers only the release page. Run the installer once, then delete the portable file.

### Tested

- 1.7.1 installed, then 1.8.0 over it without pages, as Update now runs it: 1.8.0 in `C:\Program Files\SCAFFApps\Multi Screens`, the old folder and Start menu shortcut gone, Windows lists 1.8.0. Microsoft Defender finds nothing in the installer or the program.
- From the source code with a fresh profile: the registration window first (empty details and a bad e-mail address refused), then the app; the registration reached a local copy of the website and the console's collector; Smart Snap, started next, did not ask again.
- The dark and light appearances, looked over for any blue left.

### Not tested

- **Update now** from an installed 1.7 copy through Windows' permission prompt (the same installer run as above, started by hand).

## 1.7.1 — 15 November 2026

A new icon in the SCAFFApps colours. Nothing else has changed.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.7.1.exe` | 77.9 MB | `FA39DBED772F9A3C269705EA1C02DE7B506465CF5AEC051FAAD5230CD4FD2F72` |
| `Multi-Screens-1.7.1-portable.exe` | 77.8 MB | `C25457D300EC363A0B2220B9AC7F476545E9795BE80A6D0F2556A0DF365CFB88` |
| `Multi-Screens-Handbook-1.7.1.pdf` | 2.8 MB | `4E84C297AC1CE2755BAF8272B0966785CC2465168F4129410019EB5D7C545AE6` |

Both programs are for 64-bit Windows 10 and 11 and are not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Changed

- **New icon.** The same picture, a phone, a tablet and a laptop, now in the SCAFFApps colours: a purple tile with cream and gold, like Instant Share and Smart Snap. It shows on the window, the taskbar, the Start menu and desktop shortcuts, the installer and the review report.
- The handbook shows the new icon on its cover and in its pictures.
- `build/make-icon.js` draws the icon files from `build/icon.svg`, as in Smart Snap.

### Tested

- The installer, the portable file and the program inside them carry the new icon (read back from the built files).
- The portable file started with a fresh profile and showed the new icon in its window.

### Not tested

- Installing with the installer, and updating to this version from 1.7.0 in Settings.

### Updating from 1.7.0

Settings > Updates offers this version, and the daily check announces it. A shortcut pinned to the taskbar may keep the old picture until Windows refreshes its icons; unpinning it and pinning it again shows the new one.

## 1.7.0 — 15 November 2026

Multi Screens can now check for a newer version and install it. Version 1.6.1 cannot update itself, so install this version by hand once; later versions can be installed from Settings.

### Downloads

| File | Size | SHA-256 |
|---|---|---|
| `Multi-Screens-Setup-1.7.0.exe` | 78.1 MB | `4D46161DA4D1CC156AD4801E7E5AD395C44938489FA1E969CC98824034415740` |
| `Multi-Screens-1.7.0-portable.exe` | 77.8 MB | `5B91F481B493B6EF34F5D5EAB08CE74CFCD0268831972D657BC176B96938A9D8` |

Both are for 64-bit Windows 10 and 11 and are not code-signed, so Windows SmartScreen may ask for confirmation on first run.

### Added

- **Check for updates.** Settings has a new Updates part showing the version you have. **Check for updates** asks GitHub for the latest release. When there is a newer one, its release notes are shown with an **Update now** button and a link to the release page.
- **Update now.** Downloads the new version and checks it against the SHA-256 checksums published with it (GitHub's own and the one in these notes); a file that does not match is discarded. An installed copy asks Windows for permission, closes, installs the new version in the same folder and opens again. A portable file saves the new version beside itself and opens it, and the new version moves the old file to the Recycle Bin once the old copy has closed. A shortcut to the old file stops working.
- **Automatic checks.** The app checks a few seconds after it starts and once a day while it stays open. A newer version is announced once, and a blue dot on the Settings button stays until you update. **Check for updates automatically** in Settings turns this off; the app then contacts GitHub only when asked.
- After an update, the app says which version it has been updated to.

### Tested

- Against a local stand-in for GitHub: a newer version was found on start, announced once, shown with its notes, and marked by the dot. "You have the latest version", the error shown when GitHub cannot be reached, and turning automatic checks off and on (saved between starts) were each seen.
- Portable copy, built as 1.7.0: the download showed its progress, **Cancel** stopped it and left no partial file, a completed download was checked, saved beside the running file and started with `--updated` and the old file's path, and the running copy closed.
- The new portable version, given the old file while that file was still running, waited until it had closed (8 seconds), then moved it to the Recycle Bin and said so. It left alone an older file in another folder, a newer version's file, and a file that is not a Multi Screens portable file.
- A download whose content did not match its checksum was discarded with a message. A release whose two checksums disagreed offered only the release page.
- The command that starts the installer passed a path with spaces and the arguments `--updated /S --force-run` correctly (tried without the administrator prompt), and reported a file that could not be started.
- Starting with `--updated` showed "Multi Screens has been updated to version 1.7.0".
- Against the real GitHub, the built 1.7.0 read the latest release (1.6.1) and reported "You have the latest version".

### Not tested

- **Updating an installed copy end to end**: the Windows permission prompt, the installer running without its pages, and the app reopening. This needs a person to approve the prompt, and a published release newer than the installed one.
- Saving the portable update to Downloads when the portable file's folder cannot be written to.
- Downloading a real update from GitHub, which needs a release after 1.7.0.

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
