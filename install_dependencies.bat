@echo off
echo Attempting to install Node.js dependencies...
echo.

REM Try common Node.js installation paths
set NODE_PATHS="C:\Program Files\nodejs" "C:\Program Files (x86)\nodejs" "%APPDATA%\npm" "%LOCALAPPDATA%\Programs\nodejs"

for %%p in (%NODE_PATHS%) do (
    if exist %%p\node.exe (
        echo Found Node.js at %%p
        set "PATH=%PATH%;%%~p"
        goto :install
    )
)

echo ERROR: Could not find Node.js installation.
echo Please install Node.js from https://nodejs.org/
echo After installation, run this script again.
pause
exit /b 1

:install
echo Installing dependencies...
node --version
npm --version
npm install

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Dependencies installed.
    echo You can now run: npm run dev
) else (
    echo.
    echo Installation failed. Please check the errors above.
)

pause
