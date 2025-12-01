@echo off
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo After installing, restart this script.
    pause
    exit /b
)

echo Node.js found. Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b
)

echo Dependencies installed successfully!
echo You can now run 'run_project.bat' to start the website.
pause
