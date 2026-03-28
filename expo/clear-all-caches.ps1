# Complete cache clearing script for Expo/React Native
Write-Host "Clearing all caches..." -ForegroundColor Yellow

# Metro bundler caches
Write-Host "Clearing Metro bundler cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "$PSScriptRoot\node_modules\.cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$PSScriptRoot\.expo" -ErrorAction SilentlyContinue

# Temp caches
Write-Host "Clearing temp caches..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "$env:TEMP\metro-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:TEMP\haste-map-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:TEMP\react-*" -ErrorAction SilentlyContinue

# Watchman cache (if exists)
Write-Host "Clearing watchman cache..." -ForegroundColor Cyan
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all
}

Write-Host "`nAll caches cleared!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: bun start -- --clear --reset-cache" -ForegroundColor White
Write-Host "2. Open browser in Incognito mode" -ForegroundColor White
Write-Host "3. Navigate to http://localhost:8081" -ForegroundColor White
