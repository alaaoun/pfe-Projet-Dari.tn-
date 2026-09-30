#!/usr/bin/env powershell
# Script d'installation PostgreSQL 16 sur Windows (plus robuste)

Write-Host "================================================" -ForegroundColor Green
Write-Host "Installation de PostgreSQL 16" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Télécharger l'installateur PostgreSQL
$PostGresURL = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe"
$DownloadPath = Join-Path -Path $env:TEMP -ChildPath "postgresql-installer.exe"

Write-Host "`nTéléchargement de PostgreSQL 16..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $PostGresURL -OutFile $DownloadPath -UseBasicParsing -ErrorAction Stop
} catch {
    Write-Host "`n❌ Erreur lors du téléchargement : $_" -ForegroundColor Red
}

if (Test-Path $DownloadPath) {
    Write-Host "Installateur téléchargé : $DownloadPath" -ForegroundColor Green
    Write-Host "Lancement de l'installation (interactive) ..." -ForegroundColor Yellow
    Write-Host "  Choisissez un mot de passe PostgreSQL fort et unique pendant l'installation." -ForegroundColor Cyan
    Write-Host "  Port 5432 (par défaut)" -ForegroundColor Cyan
    Write-Host "  Validez tous les paramètres par défaut" -ForegroundColor Cyan

    try {
        Start-Process -FilePath $DownloadPath -ArgumentList "--install-runtimes 1" -Wait -Verb RunAs
        Write-Host "`nInstallation terminée !" -ForegroundColor Green
        Write-Host "Redémarrez PowerShell et relancez : npm run setup-db" -ForegroundColor Yellow
    } catch {
        Write-Host "`nL'installation a échoué ou a été annulée : $_" -ForegroundColor Red
        Write-Host "Lancez manuellement l'installateur : $DownloadPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "Installateur introuvable après téléchargement" -ForegroundColor Red
    Write-Host "Téléchargez manuellement : $PostGresURL" -ForegroundColor Yellow
}
