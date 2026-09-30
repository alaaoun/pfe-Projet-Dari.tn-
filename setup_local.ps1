#!/usr/bin/env powershell
# ============================================================
# Configuration locale de Dari.tn
# ============================================================

$ScriptRoot = $PSScriptRoot
if (-not $ScriptRoot) {
    $ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$BackendDir = Join-Path $ScriptRoot "dari-tn-fullstack\dari-tn-backend"
$FrontendDir = Join-Path $ScriptRoot "dari-tn-fullstack\dari-tn-frontend"
$DbSetupSql = Join-Path $ScriptRoot "setup_db.sql"

Write-Host "================================================" -ForegroundColor Green
Write-Host "DARI.TN - Configuration développement local" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Étape 1 : Vérifier PostgreSQL
Write-Host "`n[1/4] Vérification de PostgreSQL..." -ForegroundColor Yellow

$hasPostgres = $false
try {
    $postgresPath = @(
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($postgresPath) {
        $hasPostgres = $true
        Write-Host "✅ PostgreSQL trouvé : $postgresPath" -ForegroundColor Green
    }
} catch {}

if (-not $hasPostgres) {
    Write-Host "❌ PostgreSQL n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION 1 : Installation automatique (Windows)" -ForegroundColor Cyan
    Write-Host "  Exécutez : powershell -ExecutionPolicy Bypass -File ./install_postgres.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "SOLUTION 2 : Téléchargement manuel" -ForegroundColor Cyan
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  Version recommandée : PostgreSQL 16 LTS" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Après installation, redémarrez PowerShell et relancez ce script." -ForegroundColor Yellow
    exit 1
}

# Étape 2 : Créer la base de données
Write-Host "`n[2/4] Création de la base de données PostgreSQL..." -ForegroundColor Yellow

& $postgresPath -U postgres -h localhost -d postgres -w -v ON_ERROR_STOP=1 -f $DbSetupSql 2>&1 | ForEach-Object {
    Write-Host "  $_"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de données prête" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vérification manuelle nécessaire" -ForegroundColor Yellow
}

# Étape 3 : Migrations et seed
Write-Host "`n[3/4] Exécution des migrations..." -ForegroundColor Yellow
Set-Location $BackendDir
node src/config/migrate.js 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host "`n[3b/4] Insertion des données de test..." -ForegroundColor Yellow
node src/config/seed.js 2>&1 | ForEach-Object { Write-Host "  $_" }

# Étape 4 : Instructions de lancement
Write-Host "`n[4/4] Configuration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "🚀 Pour lancer l'application :" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Cyan
Write-Host "  cd $BackendDir" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Cyan
Write-Host "  cd $FrontendDir" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Accès : http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Configurez SEED_ADMIN_PASSWORD, SEED_AGENT_PASSWORD et SEED_USER_PASSWORD dans le .env du backend avant de lancer le seed." -ForegroundColor Cyan
Write-Host ""
