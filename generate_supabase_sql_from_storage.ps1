param(
    [Parameter(Mandatory=$true)] [string] $ProjectUrl,
    [Parameter(Mandatory=$true)] [string] $Bucket,
    [Parameter(Mandatory=$true)] [string] $AnonKey
)

# generate_supabase_sql_from_storage.ps1
# Lista objetos del bucket usando la API de Supabase Storage y genera supabase_inserts.sql

$basePath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$api = "$($ProjectUrl.TrimEnd('/'))/storage/v1/object/list/$Bucket"

Write-Host "Solicitando lista de objetos al bucket '$Bucket' en $ProjectUrl ..."

$headers = @{ "apikey" = $AnonKey; "Authorization" = "Bearer $AnonKey" }
$body = @{ prefix = ""; limit = 1000; offset = 0 } | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Method Post -Uri $api -Headers $headers -Body $body -ContentType 'application/json'
} catch {
    Write-Error "Error llamando a la API de Storage: $_"
    exit 1
}

if (-not $resp) {
    Write-Host "No hay objetos listados."
    exit 0
}

$out = @()

foreach ($obj in $resp) {
    $name = $obj.name
    if ($name -match '^(?:images/)?(hombre|hombres)/') {
        $gender = 'M'
    } elseif ($name -match '^(?:images/)?(dama|damas|woman|female)/') {
        $gender = 'F'
    } else {
        continue
    }

    $publicUrl = "$($ProjectUrl.TrimEnd('/'))/storage/v1/object/public/$Bucket/$name"
    $srcEscaped = $publicUrl -replace "'","''"
    $genderEscaped = $gender -replace "'","''"
    $out += "INSERT INTO public.gallery (src, gender) VALUES ('$srcEscaped', '$genderEscaped');"
}

$outPath = Join-Path $basePath "supabase_inserts.sql"
$out -join "`n" | Out-File -FilePath $outPath -Encoding utf8

Write-Host "Generado $outPath con $($out.Count) INSERTs."
