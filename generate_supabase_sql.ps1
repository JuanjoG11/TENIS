param(
    [Parameter(Mandatory=$true)] [string] $ProjectUrl,
    [Parameter(Mandatory=$true)] [string] $Bucket
)

# generate_supabase_sql.ps1
# Lee gallery.json y genera supabase_inserts.sql con INSERTs usando la URL pública de Storage

$basePath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$galleryPath = Join-Path $basePath "gallery.json"
if (-not (Test-Path $galleryPath)) {
    Write-Error "No se encontró gallery.json en $galleryPath"
    exit 1
}

$json = Get-Content $galleryPath -Raw | ConvertFrom-Json
$out = @()

foreach ($item in $json) {
    # item.src expected: images/hombres/xxx.jpg
    $rel = $item.src -replace '^images/',''
    $publicUrl = "$($ProjectUrl.TrimEnd('/'))/storage/v1/object/public/$Bucket/$rel"
    $srcEscaped = $publicUrl -replace "'","''"
    $genderEscaped = $item.gender -replace "'","''"
    $out += "INSERT INTO public.gallery (src, gender) VALUES ('$srcEscaped', '$genderEscaped');"
}

$outPath = Join-Path $basePath "supabase_inserts.sql"
$out -join "`n" | Out-File -FilePath $outPath -Encoding utf8

Write-Host "Generado $outPath con $($out.Count) INSERTs."
