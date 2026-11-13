; Extra installer page: asks where Multi Screens should save its output
; (screenshots, video recordings and review reports).
;
; The chosen folder is written to "%APPDATA%\Multi Screens\install-output.txt",
; which the app reads the next time it starts.

; Crisp text on a scaled screen (125%, 150%...): without this Windows draws the
; installer and uninstaller at 100% and stretches them, which blurs them.
ManifestDPIAware true

!ifndef BUILD_UNINSTALLER

!include nsDialogs.nsh
!include LogicLib.nsh
!include WinMessages.nsh

Var OutputDirInput
Var OutputDir

!macro customPageAfterChangeDir
  Page custom OutputPageCreate OutputPageLeave
!macroend

Function OutputPageCreate
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
  ; Empty when the installer runs silently: the app then asks on first start.
  ${If} $OutputDir != ""
    ReadEnvStr $1 APPDATA
    CreateDirectory "$1\Multi Screens"
    FileOpen $0 "$1\Multi Screens\install-output.txt" w
    FileWriteUTF16LE /BOM $0 "$OutputDir"
    FileClose $0
    CreateDirectory "$OutputDir"
  ${EndIf}
!macroend

!endif
