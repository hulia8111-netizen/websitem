# ============================================================
# cumleleri-guncelle.ps1
# Açılış cümlelerini Word dosyasından okuyup js/acilis-cumleler.js
# dosyasını yeniden üretir.
#
# KULLANIM (proje klasöründe):
#   powershell -ExecutionPolicy Bypass -File scripts\cumleleri-guncelle.ps1
#
# Word'e ("Açılış cümlelerim\Açılış cümleleri.docx") yeni cümle
# ekleyip bu scripti çalıştırman yeterli; sonra commit/push yap.
# ============================================================

$ErrorActionPreference = "Stop"
$kok    = Split-Path -Parent $PSScriptRoot
$docx   = Join-Path $kok "Açılış cümlelerim\Açılış cümleleri.docx"
$hedef  = Join-Path $kok "js\acilis-cumleler.js"

if (-not (Test-Path $docx)) { Write-Error "Word dosyası bulunamadı: $docx"; exit 1 }

# .docx aslında bir zip; içindeki word/document.xml metni taşır
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tmp = Join-Path $env:TEMP ("docx_" + [guid]::NewGuid())
[System.IO.Compression.ZipFile]::ExtractToDirectory($docx, $tmp)
$xml = [System.IO.File]::ReadAllText((Join-Path $tmp "word\document.xml"), [System.Text.Encoding]::UTF8)
Remove-Item $tmp -Recurse -Force

# Her <w:p> bir paragraf; içindeki <w:t> metinlerini birleştir
$paras = [regex]::Matches($xml, '<w:p[ >].*?</w:p>')
$cumleler = New-Object System.Collections.Generic.List[string]
foreach ($p in $paras) {
  $texts = [regex]::Matches($p.Value, '<w:t[^>]*>(.*?)</w:t>')
  $s = ($texts | ForEach-Object { $_.Groups[1].Value }) -join ''
  $s = [System.Net.WebUtility]::HtmlDecode($s).Trim()
  # baştaki/sondaki tırnakları (düz veya kıvrık) ayıkla
  $s = $s.Trim([char]0x22, [char]0x201C, [char]0x201D, ' ')
  if ($s) { $cumleler.Add($s) }
}

if ($cumleler.Count -eq 0) { Write-Error "Hiç cümle bulunamadı."; exit 1 }

# JS dosyasını oluştur (her cümle JSON ile güvenli şekilde kaçışlanır)
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/* ============================================================")
[void]$sb.AppendLine("   acilis-cumleler.js — Açılış (splash) ilham cümleleri")
[void]$sb.AppendLine("   ------------------------------------------------------------")
[void]$sb.AppendLine("   OTOMATIK ÜRETİLDİ — elle düzenleme. Kaynak:")
[void]$sb.AppendLine("   ""Açılış cümlelerim/Açılış cümleleri.docx""")
[void]$sb.AppendLine("   Güncellemek için: scripts\cumleleri-guncelle.ps1 çalıştır.")
[void]$sb.AppendLine("   Global: window.ACILIS_CUMLELERI")
[void]$sb.AppendLine("   ============================================================ */")
[void]$sb.AppendLine("window.ACILIS_CUMLELERI = [")
for ($i = 0; $i -lt $cumleler.Count; $i++) {
  $json = $cumleler[$i] | ConvertTo-Json   # tırnak + kaçış güvenli
  $virgul = if ($i -lt $cumleler.Count - 1) { "," } else { "" }
  [void]$sb.AppendLine("  $json$virgul")
}
[void]$sb.AppendLine("];")

$enc = New-Object System.Text.UTF8Encoding($false)  # BOM yok
[System.IO.File]::WriteAllText($hedef, $sb.ToString(), $enc)

Write-Host "✓ $($cumleler.Count) cümle yazıldı → js/acilis-cumleler.js"
