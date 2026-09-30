$installer = Join-Path $env:TEMP 'postgresql-installer.exe'
if (Test-Path $installer) {
    Start-Process -FilePath $installer -Verb RunAs -Wait
    Write-Host 'Installer started (or completed).'
} else {
    Write-Host "Installer not found: $installer"
}
