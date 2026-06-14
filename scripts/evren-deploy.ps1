# Evren-mesaji Edge Function dagitimi
# Kullanim:  $env:SUPABASE_ACCESS_TOKEN="sbp_..."; powershell -File scripts\evren-deploy.ps1
$ErrorActionPreference = "Stop"
$ref = "liotmhoyoduwidojwrkd"
if (-not $env:SUPABASE_ACCESS_TOKEN) { Write-Host "HATA: SUPABASE_ACCESS_TOKEN ortam degiskeni gerekli." -ForegroundColor Red; exit 1 }
Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "evren-mesaji dagitiliyor (proje: $ref)..." -ForegroundColor Cyan
npx supabase functions deploy evren-mesaji --no-verify-jwt --project-ref $ref
Write-Host "`nDagitim bitti. Simdi supabase\evren-kurulum.sql icindeki SQL'i Dashboard > SQL Editor'de calistir." -ForegroundColor Green
