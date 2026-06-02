# Guía rápida para subir 400 imágenes de tenis (1 por producto)

## 📁 Estructura de carpetas
```
C:\Users\Juanjo\Documents\tenis\
│   upload_script.ps1   # Script PowerShell (ya creado)
│   README.md           # Esta guía
└── images\            # Carpeta donde colocar tus imágenes
        product1.jpg
        product2.png
        ...
```

1. **Nombra cada archivo con el ID del producto** (números) para que el script extraiga el ID automáticamente. Ejemplos válidos:
   - `123.jpg`
   - `product456.png`
   - `789_product.jpeg`
   El script toma el primer número que encuentre en el nombre del archivo.

## ⚙️ Configuración del script
Abre `upload_script.ps1` y modifica las siguientes variables al inicio del archivo:
```powershell
$ImageFolder = "C:\Users\Juanjo\Documents\tenis\images"
$UploadUrl   = "https://example.com/api/uploadProductImage"   # ← Cambia por tu endpoint real
$AuthToken   = "Bearer TU_TOKEN_AQUI"                         # ← Si tu API requiere autenticación
```
* **$UploadUrl**: URL del endpoint que recibe `multipart/form-data` con los campos `productId` y `file`.
* **$AuthToken** (opcional): token de autorización (Bearer, Basic, etc.). Déjalo vacío si no es necesario.

## ▶️ Ejecutar el script
1. Abre PowerShell **como administrador** (o con permisos de ejecución de scripts).  
2. Navega a la carpeta del script:
```powershell
cd C:\Users\Juanjo\Documents\tenis
```
3. Ejecuta:
```powershell
.\\upload_script.ps1
```
El script recorrerá todos los archivos `*.jpg, *.jpeg, *.png, *.gif` dentro de `images/` y enviará cada uno al endpoint, mostrando el progreso en la consola.

## ✅ Verificación
- En la salida verás `Uploading <file> for product ID <id>...` y después `Success: ...` o `Failed to upload ...`.
- Al final se mostrará `All done. Uploaded X images.` donde **X** debería ser `400` si todas las imágenes fueron encontradas.

## 🛠️ Solución de problemas comunes
| Problema | Acción recomendada |
|---|---|
| `Image folder does not exist` | Verifica que la ruta `$ImageFolder` sea correcta y que la carpeta `images` exista. |
| `Could not extract product ID` | Asegúrate de que el nombre del archivo contenga al menos un número (ej. `123.jpg`). |
| Error de autenticación (401) | Revisa que `$AuthToken` sea válido y esté bien formateado (`Bearer <token>`). |
| Respuesta de la API no contiene `message` | Cambia la línea `Write-Host "Success: $($Response.message)"` por `Write-Host "Success: $Response"` o inspecciona el contenido de `$Response`. |

## 📦 Exportar a otros entornos
Si tu tienda usa una plataforma con herramienta de importación (Shopify, WooCommerce, etc.), puedes adaptar este script enviando los mismos campos a su API de **bulk media**. Solo cambia `$UploadUrl` y el cuerpo del `Invoke-RestMethod` según la documentación del proveedor.

---
*Esta guía está pensada para usuarios con conocimientos básicos de PowerShell y acceso a la API de upload.*
