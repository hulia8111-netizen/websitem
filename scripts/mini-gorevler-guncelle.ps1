# ============================================================
# mini-gorevler-guncelle.ps1
# Mini görevleri Word dosyasından okuyup js/mini-gorevler.js
# dosyasını yeniden üretir. Görevler 3 kategoriye ayrılır:
# Fiziksel / Zihinsel / Ruhsal.
#
# Word satır biçimi (emoji + kategori + iki nokta + görev):
#   🌿 Fiziksel: 10 dakika yürüyüş yap.
#   🧠 Zihinsel: 5 sayfa kitap oku.
#   🌙 Ruhsal: Şükrettiğin 3 şeyi yaz.
#
# KULLANIM (proje klasöründe):
#   powershell -ExecutionPolicy Bypass -File scripts\mini-gorevler-guncelle.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$kok   = Split-Path -Parent $PSScriptRoot
$docx  = Join-Path $kok "Mini Görevlerim\Mini Görevlerim.docx"
$hedef = Join-Path $kok "js\mini-gorevler.js"

if (-not (Test-Path $docx)) { Write-Error "Word dosyası bulunamadı: $docx"; exit 1 }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$tmp = Join-Path $env:TEMP ("docx_" + [guid]::NewGuid())
[System.IO.Compression.ZipFile]::ExtractToDirectory($docx, $tmp)
$xml = [System.IO.File]::ReadAllText((Join-Path $tmp "word\document.xml"), [System.Text.Encoding]::UTF8)
Remove-Item $tmp -Recurse -Force

$fiziksel = New-Object System.Collections.Generic.List[string]
$zihinsel = New-Object System.Collections.Generic.List[string]
$ruhsal   = New-Object System.Collections.Generic.List[string]

$paras = [regex]::Matches($xml, '<w:p[ >].*?</w:p>')
foreach ($p in $paras) {
  $texts = [regex]::Matches($p.Value, '<w:t[^>]*>(.*?)</w:t>')
  $s = ($texts | ForEach-Object { $_.Groups[1].Value }) -join ''
  $s = [System.Net.WebUtility]::HtmlDecode($s).Trim()
  if (-not $s) { continue }

  # kategoriyi belirle
  $kat = $null
  if ($s -match 'Fiziksel') { $kat = 'fiziksel' }
  elseif ($s -match 'Zihinsel') { $kat = 'zihinsel' }
  elseif ($s -match 'Ruhsal') { $kat = 'ruhsal' }
  if (-not $kat) { continue }

  # "emoji Kategori:" önekini ayıkla → ilk iki noktadan sonrası
  $idx = $s.IndexOf(':')
  $gorev = if ($idx -ge 0) { $s.Substring($idx + 1).Trim() } else { $s.Trim() }
  $gorev = $gorev.Trim([char]0x22, [char]0x201C, [char]0x201D, ' ')
  if (-not $gorev) { continue }

  switch ($kat) {
    'fiziksel' { $fiziksel.Add($gorev) }
    'zihinsel' { $zihinsel.Add($gorev) }
    'ruhsal'   { $ruhsal.Add($gorev) }
  }
}

if (($fiziksel.Count + $zihinsel.Count + $ruhsal.Count) -eq 0) { Write-Error "Hiç görev bulunamadı."; exit 1 }

function YazDizi($sb, $ad, $liste, $sonMu) {
  [void]$sb.AppendLine("  ""$ad"": [")
  for ($i = 0; $i -lt $liste.Count; $i++) {
    $json = $liste[$i] | ConvertTo-Json
    $virgul = if ($i -lt $liste.Count - 1) { "," } else { "" }
    [void]$sb.AppendLine("    $json$virgul")
  }
  $kapanis = if ($sonMu) { "  ]" } else { "  ]," }
  [void]$sb.AppendLine($kapanis)
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/* ============================================================")
[void]$sb.AppendLine("   mini-gorevler.js — Günün Mini Görevleri (3 kategori)")
[void]$sb.AppendLine("   ------------------------------------------------------------")
[void]$sb.AppendLine("   OTOMATIK ÜRETİLDİ — elle düzenlemeyin. Kaynak:")
[void]$sb.AppendLine("   ""Mini Görevlerim/Mini Görevlerim.docx""")
[void]$sb.AppendLine("   Güncellemek için: scripts\mini-gorevler-guncelle.ps1 çalıştır.")
[void]$sb.AppendLine("   Global: window.MINI_GOREVLER { fiziksel, ruhsal, zihinsel }")
[void]$sb.AppendLine("   ============================================================ */")
[void]$sb.AppendLine("window.MINI_GOREVLER = {")
YazDizi $sb "fiziksel" $fiziksel $false
YazDizi $sb "ruhsal"   $ruhsal   $false
YazDizi $sb "zihinsel" $zihinsel $true
[void]$sb.AppendLine("};")

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($hedef, $sb.ToString(), $enc)

Write-Host "✓ Fiziksel:$($fiziksel.Count) Ruhsal:$($ruhsal.Count) Zihinsel:$($zihinsel.Count) → js/mini-gorevler.js"
