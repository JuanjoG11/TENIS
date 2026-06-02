# generate_gallery.ps1
# This script scans the folders 'images\hombres' and 'images\damas'
# and creates a JSON manifest (gallery.json) that the web page consumes.
# Each entry contains:
#   src    – relative URL to the image (e.g., images/hombres/zapato1.jpg)
#   gender – 'M' for hombres, 'F' for damas

$basePath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$imgRoot  = Join-Path $basePath "images"
$maleDir  = Join-Path $imgRoot "hombres"
$femaleDir= Join-Path $imgRoot "damas"

$gallery = @()

if (Test-Path $maleDir) {
    Get-ChildItem -Path $maleDir -File -Include *.jpg, *.jpeg, *.png, *.gif | ForEach-Object {
        $rel = "images/hombres/$($_.Name)"
        $gallery += [pscustomobject]@{src = $rel; gender = "M"}
    }
}

if (Test-Path $femaleDir) {
    Get-ChildItem -Path $femaleDir -File -Include *.jpg, *.jpeg, *.png, *.gif | ForEach-Object {
        $rel = "images/damas/$($_.Name)"
        $gallery += [pscustomobject]@{src = $rel; gender = "F"}
    }
}

# Write JSON (compact, UTF8)
$gallery | ConvertTo-Json -Depth 3 -Compress | Out-File -FilePath (Join-Path $basePath "gallery.json") -Encoding utf8

Write-Host "gallery.json generated with $($gallery.Count) items."
