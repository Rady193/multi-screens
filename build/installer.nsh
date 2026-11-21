; Extra installer page: asks where Multi Screens should save its output
; (screenshots, video recordings and review reports).
;
; The chosen folder is written to "%APPDATA%\Multi Screens\install-output.txt",
; which the app reads the next time it starts. The page suggests the folder in use,
; which the app keeps in "%APPDATA%\multi-screens\output-folder.txt" (its profile,
; named after package.json's "name"), and the file is written only when the folder
; chosen differs from it: clicking through a reinstall or an update changes nothing.

; Crisp text on a scaled screen (125%, 150%...): without this Windows draws the
; installer and uninstaller at 100% and stretches them, which blurs them.
ManifestDPIAware true

!ifndef BUILD_UNINSTALLER

!include nsDialogs.nsh
!include LogicLib.nsh
!include WinMessages.nsh

Var OutputDirInput
Var OutputDir
Var InUse

!macro customPageAfterChangeDir
  Page custom OutputPageCreate OutputPageLeave
!macroend

; Reads the first line of a UTF-16LE text file (with or without a BOM), as the
; installer and the app write them. Takes the path on the stack, leaves the text
; ("" when there is no file) on the stack.
Function ReadText16
  Exch $0
  Push $1
  Push $2
  StrCpy $2 ""
  ClearErrors
  FileOpen $1 $0 r
  ${IfNot} ${Errors}
    FileReadWord $1 $2
    ${If} $2 <> 0xFEFF
      FileSeek $1 0 SET
    ${EndIf}
    StrCpy $2 ""
    FileReadUTF16LE $1 $2
    FileClose $1
  ${EndIf}
  StrCpy $1 $2 1 -1
  ${If} $1 == "$\n"
    StrCpy $2 $2 -1
    StrCpy $1 $2 1 -1
  ${EndIf}
  ${If} $1 == "$\r"
    StrCpy $2 $2 -1
  ${EndIf}
  StrCpy $0 $2
  Pop $2
  Pop $1
  Exch $0
FunctionEnd

Function OutputPageCreate
  ${If} $OutputDir == ""
    ; The folder in use when Multi Screens is installed already, else the
    ; folder chosen at the last install.
    ReadEnvStr $1 APPDATA
    Push "$1\multi-screens\output-folder.txt"
    Call ReadText16
    Pop $InUse
    StrCpy $OutputDir $InUse
    ${If} $OutputDir == ""
      Push "$1\Multi Screens\install-output.txt"
      Call ReadText16
      Pop $OutputDir
    ${EndIf}
  ${EndIf}
  ${If} $OutputDir == ""
    ; The installer installs for all users (Program Files), where $DOCUMENTS
    ; means Public Documents: suggest the user's own Documents instead.
    SetShellVarContext current
    StrCpy $OutputDir "$DOCUMENTS\Multi Screens"
    SetShellVarContext all
  ${EndIf}
  ; Page title and subtitle (the header controls of the installer window).
  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Output folder"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Choose where screenshots, videos and reports are saved."
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 26u "Multi Screens saves screenshots, video recordings and review reports in this folder, each in its own subfolder. You can change it later in the app's Settings."
  Pop $0
  ${NSD_CreateDirRequest} 0 36u 76% 13u "$OutputDir"
  Pop $OutputDirInput
  ${NSD_CreateBrowseButton} 78% 35u 22% 15u "Browse..."
  Pop $0
  ${NSD_OnClick} $0 OutputPageBrowse
  nsDialogs::Show
FunctionEnd

Function OutputPageBrowse
  ${NSD_GetText} $OutputDirInput $1
  nsDialogs::SelectFolderDialog "Choose the output folder" "$1"
  Pop $1
  ${If} $1 != error
    ${NSD_SetText} $OutputDirInput "$1"
  ${EndIf}
FunctionEnd

Function OutputPageLeave
  ${NSD_GetText} $OutputDirInput $OutputDir
  ${If} $OutputDir == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "Please choose a folder."
    Abort
  ${EndIf}
FunctionEnd

!macro customInstall
  ; Empty when the installer runs silently: the app then keeps its folder, or asks on first start.
  ${If} $OutputDir != ""
    ; Kept as it was when the page still shows the folder in use, so the app
    ; does not take an unchanged page for a new choice.
    ${If} $OutputDir != $InUse
      ReadEnvStr $1 APPDATA
      CreateDirectory "$1\Multi Screens"
      FileOpen $0 "$1\Multi Screens\install-output.txt" w
      FileWriteUTF16LE /BOM $0 "$OutputDir"
      FileClose $0
    ${EndIf}
    CreateDirectory "$OutputDir"
  ${EndIf}
  ; Moved from the old default folder (customInit): the old version's uninstaller empties it but leaves the folder.
  ; RMDir without /r removes it only when it is empty.
  ${If} $INSTDIR != "$PROGRAMFILES64\${APP_FILENAME}"
    RMDir "$PROGRAMFILES64\${APP_FILENAME}"
  ${EndIf}
!macroend

!endif

; Every SCAFFApps app lives in "Program Files\SCAFFApps": menuCategory in package.json gives a new install that folder
; (and the SCAFFApps folder in the Start menu). A copy installed in the old default place, "Program Files\<app>",
; moves there at its next update, silent updates from Settings included: the install goes to the new folder, and the
; old version, found through the registry, is uninstalled from where it was (uninstallOldVersion). A folder the user
; chose is left alone.
!ifndef BUILD_UNINSTALLER
!macro customInit
  ${If} $INSTDIR == "$PROGRAMFILES64\${APP_FILENAME}"
  ${OrIf} $INSTDIR == "$PROGRAMFILES\${APP_FILENAME}"
    StrCpy $INSTDIR "$PROGRAMFILES64\SCAFFApps\${APP_FILENAME}"
  ${EndIf}
!macroend
!endif
