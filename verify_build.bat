@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"
echo Running build verification...
call npm run build
if %errorlevel% equ 0 (
    echo BUILD SUCCESSFUL
) else (
    echo BUILD FAILED
)
pause
