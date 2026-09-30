@echo off
REM ============================================================
REM Dari.tn - Démarrage rapide (Windows)
REM ============================================================

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%dari-tn-fullstack"

set "NODE_DIR="
for %%D in (
    "C:\Users\21652\Downloads\node-v24.16.0-win-x64\node-v24.16.0-win-x64"
    "C:\Program Files\nodejs"
) do (
    if not defined NODE_DIR if exist %%~D\node.exe set "NODE_DIR=%%~D"
)

if not defined NODE_DIR (
    echo.
    echo ERREUR : Node.js introuvable.
    echo Installez Node.js ou ajoutez-le au PATH, puis relancez ce script.
    pause
    exit /b 1
)

set PATH=%NODE_DIR%;%PATH%

set "BACKEND_DIR=%PROJECT_DIR%\dari-tn-backend"
set "FRONTEND_DIR=%PROJECT_DIR%\dari-tn-frontend"

if not exist "%BACKEND_DIR%" (
    echo.
    echo ERREUR : dossier backend introuvable.
    echo %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo.
    echo ERREUR : dossier frontend introuvable.
    echo %FRONTEND_DIR%
    pause
    exit /b 1
)

echo.
echo ================================================
echo DARI.TN - Lancement local
echo ================================================
echo.
echo Choix :
echo [1] Lancer BACKEND (API sur port 3000)
echo [2] Lancer FRONTEND (UI sur port 5173)
echo [3] Lancer les DEUX (2 fenêtres)
echo.

set /p CHOICE="Entrez votre choix [1-3] : "

if "%CHOICE%"=="1" (
    echo.
    echo Lancement du backend...
    start cmd /k "set PATH=%NODE_DIR%;%PATH% && cd /d "%BACKEND_DIR%" && npm run dev"
    echo ✅ Backend en cours de démarrage...
    echo 🌐 API : http://localhost:3000
    timeout /t 3 /nobreak
) else if "%CHOICE%"=="2" (
    echo.
    echo Lancement du frontend...
    start cmd /k "set PATH=%NODE_DIR%;%PATH% && cd /d "%FRONTEND_DIR%" && npm run dev"
    echo ✅ Frontend en cours de démarrage...
    echo 🌐 Interface : http://localhost:5173
    timeout /t 3 /nobreak
) else if "%CHOICE%"=="3" (
    echo.
    echo Lancement de BACKEND + FRONTEND...
    start cmd /k "set PATH=%NODE_DIR%;%PATH% && cd /d "%BACKEND_DIR%" && echo Lancement du backend... && npm run dev"
    timeout /t 2
    start cmd /k "set PATH=%NODE_DIR%;%PATH% && cd /d "%FRONTEND_DIR%" && echo Lancement du frontend... && npm run dev"
    echo.
    echo ✅ Backend : http://localhost:3000
    echo ✅ Frontend : http://localhost:5173
    echo.
    echo Les deux terminaux se sont lancés. Attendez que les deux disent "ready".
    timeout /t 5 /nobreak
) else (
    echo Choix invalide.
)

echo.
pause
