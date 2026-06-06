# ============================================================
# sorulari-guncelle.ps1
# Farkındalık sorularını Word dosyasından okuyup
# js/farkindalik-sorulari.js dosyasını yeniden üretir.
#
# KULLANIM (proje klasöründe):
#   powershell -ExecutionPolicy Bypass -File scripts\sorulari-guncelle.ps1
#
# Word'e ("Farkındalık sorularım\Farkındalık soruları.docx") yeni soru
# ekleyip bu scripti çalıştırman yeterli; sonra commit/push yap.
# ============================================================

$ErrorActionPreference = "Stop"
$kok    = Split-Path -Parent $PSScriptRoot
$docx   = Join-Path $kok "Farkındalık sorularım\Farkındalık soruları.docx"
$hedef  = Join-Path $kok "js\farkindalik-sorulari.js"

if (-not (Test-Path $docx)) { Write-Error "Word dosyası bulunamadı: $docx"; exit 1 }

# .docx aslında bir zip; içindeki word/document.xml metni taşır
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tmp = Join-Path $env:TEMP ("docx_" + [guid]::NewGuid())
[System.IO.Compression.ZipFile]::ExtractToDirectory($docx, $tmp)
$xml = [System.IO.File]::ReadAllText((Join-Path $tmp "word\document.xml"), [System.Text.Encoding]::UTF8)
Remove-Item $tmp -Recurse -Force

# Her <w:p> bir paragraf; içindeki <w:t> metinlerini birleştir
$paras = [regex]::Matches($xml, '<w:p[ >].*?</w:p>')
$sorular = New-Object System.Collections.Generic.List[string]
foreach ($p in $paras) {
  $texts = [regex]::Matches($p.Value, '<w:t[^>]*>(.*?)</w:t>')
  $s = ($texts | ForEach-Object { $_.Groups[1].Value }) -join ''
  $s = [System.Net.WebUtility]::HtmlDecode($s).Trim()
  # baştaki/sondaki tırnakları (düz veya kıvrık) ayıkla
  $s = $s.Trim([char]0x22, [char]0x201C, [char]0x201D, ' ')
  if ($s) { $sorular.Add($s) }
}

if ($sorular.Count -eq 0) { Write-Error "Hiç soru bulunamadı."; exit 1 }

# JS dosyasını oluştur (her soru JSON ile güvenli şekilde kaçışlanır)
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/* ============================================================")
[void]$sb.AppendLine("   farkindalik-sorulari.js — Günün Farkındalık Soruları")
[void]$sb.AppendLine("   ------------------------------------------------------------")
[void]$sb.AppendLine("   OTOMATIK ÜRETİLDİ — elle düzenlemeyin. Kaynak:")
[void]$sb.AppendLine("   ""Farkındalık sorularım/Farkındalık soruları.docx""")
[void]$sb.AppendLine("   Güncellemek için: scripts\sorulari-guncelle.ps1 çalıştır.")
[void]$sb.AppendLine("   Global: window.FARKINDALIK_SORULARI")
[void]$sb.AppendLine("   ============================================================ */")
[void]$sb.AppendLine("window.FARKINDALIK_SORULARI = [")
for ($i = 0; $i -lt $sorular.Count; $i++) {
  $json = $sorular[$i] | ConvertTo-Json   # tırnak + kaçış güvenli
  $virgul = if ($i -lt $sorular.Count - 1) { "," } else { "" }
  [void]$sb.AppendLine("  $json$virgul")
}
[void]$sb.AppendLine("];")

$enc = New-Object System.Text.UTF8Encoding($false)  # BOM yok
[System.IO.File]::WriteAllText($hedef, $sb.ToString(), $enc)

Write-Host "✓ $($sorular.Count) soru yazıldı → js/farkindalik-sorulari.js"
