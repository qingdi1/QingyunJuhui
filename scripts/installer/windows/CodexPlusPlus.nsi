Unicode true
!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "0.0.0"
!endif
!define ROOT "..\..\.."

Name "青云聚汇"
OutFile "${ROOT}\dist\windows\QingyunJuhui-${VERSION}-windows-x64-setup.exe"
InstallDir "$LOCALAPPDATA\Programs\QingyunJuhui"
InstallDirRegKey HKCU "Software\QingyunJuhui" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

!define MUI_ICON "${ROOT}\apps\codex-plus-manager\src-tauri\icons\icon.ico"
!define MUI_UNICON "${ROOT}\apps\codex-plus-manager\src-tauri\icons\icon.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"

  nsExec::ExecToLog 'taskkill /IM qingyun-juhui.exe /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM qingyun-juhui-manager.exe /F'
  Pop $0

  File "${ROOT}\dist\windows\app\qingyun-juhui.exe"
  File "${ROOT}\dist\windows\app\qingyun-juhui-manager.exe"

  CreateShortcut "$DESKTOP\青云聚汇.lnk" "$INSTDIR\qingyun-juhui.exe" "" "$INSTDIR\qingyun-juhui.exe"
  CreateShortcut "$DESKTOP\青云聚汇管理工具.lnk" "$INSTDIR\qingyun-juhui-manager.exe" "" "$INSTDIR\qingyun-juhui-manager.exe"
  CreateDirectory "$SMPROGRAMS\青云聚汇"
  CreateShortcut "$SMPROGRAMS\青云聚汇\青云聚汇.lnk" "$INSTDIR\qingyun-juhui.exe" "" "$INSTDIR\qingyun-juhui.exe"
  CreateShortcut "$SMPROGRAMS\青云聚汇\青云聚汇管理工具.lnk" "$INSTDIR\qingyun-juhui-manager.exe" "" "$INSTDIR\qingyun-juhui-manager.exe"
  CreateShortcut "$SMPROGRAMS\青云聚汇\卸载 青云聚汇.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\qingyun-juhui-manager.exe"

  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKCU "Software\QingyunJuhui" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui" "DisplayName" "青云聚汇"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui" "Publisher" "青云聚汇"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui" "DisplayIcon" "$INSTDIR\qingyun-juhui-manager.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  nsExec::ExecToLog 'taskkill /IM qingyun-juhui.exe /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM qingyun-juhui-manager.exe /F'
  Pop $0

  Delete "$DESKTOP\青云聚汇.lnk"
  Delete "$DESKTOP\青云聚汇管理工具.lnk"
  Delete "$SMPROGRAMS\青云聚汇\青云聚汇.lnk"
  Delete "$SMPROGRAMS\青云聚汇\青云聚汇管理工具.lnk"
  Delete "$SMPROGRAMS\青云聚汇\卸载 青云聚汇.lnk"
  RMDir "$SMPROGRAMS\青云聚汇"
  Delete "$INSTDIR\qingyun-juhui.exe"
  Delete "$INSTDIR\qingyun-juhui-manager.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QingyunJuhui"
  DeleteRegKey HKCU "Software\QingyunJuhui"
SectionEnd
