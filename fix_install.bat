@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"
echo Added Node.js to PATH.

echo Cleaning up previous failed installation...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo Installing dependencies...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Dependencies installed.
    echo You can now run the project using: npm run dev
) else (
    echo.
    echo Installation failed.
)
pause
