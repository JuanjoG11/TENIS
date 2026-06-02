// upload_script.ps1
# ==== Configuration ==== 
# Set the folder where your product images are stored
$ImageFolder = "C:\Users\Juanjo\Documents\tenis\images"

# Set the API endpoint URL where images will be uploaded
# The API should accept multipart/form-data with fields: productId, file
$UploadUrl = "https://example.com/api/uploadProductImage"

# Optional: If the API requires authentication, set the token here
$AuthToken = "Bearer YOUR_API_TOKEN"

# ==== Helper Functions ==== 
function Get-ProductIdFromFileName($FileName) {
    # Assumes filename pattern like "product123.jpg" or "123_product.jpg"
    # Extract numeric part as product ID
    if ($FileName -match "(\d+)") {
        return $matches[1]
    } else {
        Write-Warning "Could not extract product ID from $FileName"
        return $null
    }
}

function Upload-Image($FilePath) {
    $FileName = [System.IO.Path]::GetFileName($FilePath)
    $ProductId = Get-ProductIdFromFileName $FileName
    if (-not $ProductId) {
        Write-Warning "Skipping $FileName because product ID could not be determined."
        return
    }

    Write-Host "Uploading $FileName for product ID $ProductId..."

    $Headers = @{}
    if ($AuthToken) {
        $Headers.Add("Authorization", $AuthToken)
    }

    try {
        $Response = Invoke-RestMethod -Method Post -Uri $UploadUrl -Headers $Headers -Form @{productId = $ProductId; file = Get-Item $FilePath } -ErrorAction Stop
        Write-Host "Success: $($Response.message)"
    } catch {
        Write-Error "Failed to upload $FileName: $_"
    }
}

# ==== Main Execution ==== 
if (-not (Test-Path $ImageFolder)) {
    Write-Error "Image folder does not exist: $ImageFolder"
    exit 1
}

$ImageFiles = Get-ChildItem -Path $ImageFolder -File -Include *.jpg, *.jpeg, *.png, *.gif
if ($ImageFiles.Count -eq 0) {
    Write-Warning "No image files found in $ImageFolder"
    exit 0
}

foreach ($Img in $ImageFiles) {
    Upload-Image $Img.FullName
}

Write-Host "All done. Uploaded $($ImageFiles.Count) images."
