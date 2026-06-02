# comprimir_imagenes.ps1
# Comprime y redimensiona todas las fotos antes de subirlas a Supabase.
# NO necesita instalar nada extra, usa .NET integrado en Windows.
#
# USO:
#   .\comprimir_imagenes.ps1
#
# Lee de:   images\hombre\  e  images\dama\
# Escribe en: images_comprimidas\hombre\  e  images_comprimidas\dama\

Add-Type -AssemblyName System.Drawing

# ── Configuración ───────────────────────────────────
$MaxWidth   = 800      # px máximo del lado más largo
$Quality    = 70       # calidad JPEG (1-100). 70 = buena calidad, archivos pequeños
$InputRoot  = Join-Path $PSScriptRoot "images"
$OutputRoot = Join-Path $PSScriptRoot "images_comprimidas"
# ────────────────────────────────────────────────────

function Compress-Image {
    param([string]$InputPath, [string]$OutputPath)

    try {
        $img = [System.Drawing.Image]::FromFile($InputPath)

        # Calcular nuevas dimensiones manteniendo proporción
        $ratio = 1
        if ($img.Width -gt $MaxWidth -or $img.Height -gt $MaxWidth) {
            if ($img.Width -ge $img.Height) {
                $ratio = $MaxWidth / $img.Width
            } else {
                $ratio = $MaxWidth / $img.Height
            }
        }

        $newW = [math]::Round($img.Width  * $ratio)
        $newH = [math]::Round($img.Height * $ratio)

        # Crear bitmap redimensionado
        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        $graphics = [System.Drawing.Graphics]::FromImage($bmp)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($img, 0, 0, $newW, $newH)

        # Encoder JPEG con calidad configurable
        $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                     Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
            [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality
        )

        # Guardar siempre como .jpg
        $outFile = [System.IO.Path]::ChangeExtension($OutputPath, '.jpg')
        $bmp.Save($outFile, $jpegCodec, $encoderParams)

        # Limpiar memoria
        $graphics.Dispose()
        $bmp.Dispose()
        $img.Dispose()

        # Reportar ahorro
        $originalKB   = [math]::Round((Get-Item $InputPath).Length / 1KB)
        $compressedKB = [math]::Round((Get-Item $outFile).Length / 1KB)
        $saved        = [math]::Round((1 - $compressedKB / $originalKB) * 100)
        Write-Host "  $($originalKB)KB -> $($compressedKB)KB  (-${saved}%)  $([System.IO.Path]::GetFileName($InputPath))"
    }
    catch {
        Write-Warning "Error con $InputPath : $_"
    }
}

# ── Procesar carpetas ──────────────────────────────
$folders = @("hombre", "dama")
$totalOriginal   = 0
$totalCompressed = 0
$totalFiles      = 0

foreach ($folder in $folders) {
    $inDir  = Join-Path $InputRoot  $folder
    $outDir = Join-Path $OutputRoot $folder

    if (-not (Test-Path $inDir)) {
        Write-Warning "No existe la carpeta: $inDir  (saltando)"
        continue
    }

    if (-not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    Write-Host ""
    Write-Host "=== Comprimiendo: $folder ===" -ForegroundColor Cyan

    $files = Get-ChildItem -Path $inDir -File -Recurse |
             Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|bmp|webp)$' }

    foreach ($file in $files) {
        $outPath = Join-Path $outDir $file.Name
        Compress-Image -InputPath $file.FullName -OutputPath $outPath
        $totalOriginal   += $file.Length
        $totalCompressed += (Get-Item ([System.IO.Path]::ChangeExtension($outPath, '.jpg'))).Length
        $totalFiles++
    }
}

# ── Resumen ────────────────────────────────────────
$origMB = [math]::Round($totalOriginal   / 1MB, 1)
$compMB = [math]::Round($totalCompressed / 1MB, 1)
$savedP = if ($totalOriginal -gt 0) { [math]::Round((1 - $totalCompressed / $totalOriginal) * 100) } else { 0 }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Archivos procesados: $totalFiles"
Write-Host "  Original total:      ${origMB} MB"
Write-Host "  Comprimido total:    ${compMB} MB"
Write-Host "  Ahorro:              ${savedP}%"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Las imagenes comprimidas estan en:" -ForegroundColor Yellow
Write-Host "  $OutputRoot\hombre"
Write-Host "  $OutputRoot\dama"
Write-Host ""
Write-Host "Sube ESTAS carpetas al bucket 'tennis' en Supabase." -ForegroundColor Yellow
