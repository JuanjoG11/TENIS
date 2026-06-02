Integración con Supabase (Guía rápida)

Sigue estos pasos para usar Supabase como almacenamiento de imágenes y como fuente de la metadata (`gallery`). La idea: subir las imágenes a un bucket público y poblar una tabla `gallery` con las URLs públicas. Después puedes servir la web estática desde cualquier host (o desde el propio Storage si quieres usar la URL pública de un objeto `index.html`).

1) Crear proyecto Supabase
- Ve a https://app.supabase.com y crea un proyecto (hay plan gratuito). Anota el `Project URL` (p. ej. `https://abcd1234.supabase.co`).

2) Crear bucket público
- En el panel de Supabase, ve a `Storage` → `Buckets` → `New bucket`.
- Nombre recomendado: `tenis`.
- Marca la opción `Public` para que los objetos sean accesibles sin autenticación.

3) Subir las imágenes
- Dentro del bucket `tenis`, crea la estructura de carpetas `images/hombres` y `images/damas` y sube allí las fotos (puedes arrastrar y soltar con el panel web).

4) Generar las sentencias SQL para poblar la tabla `gallery`
- En tu máquina local, primero genera o actualiza `gallery.json` (script incluido):
```powershell
cd "C:\Users\Juanjo\Documents\tenis"
powershell -NoProfile -ExecutionPolicy Bypass -File .\generate_gallery.ps1
```
- Ejecuta el script `generate_supabase_sql.ps1` que está en este repo para convertir `gallery.json` en sentencias `INSERT` usando la URL pública de tu proyecto. Ejemplo:
```powershell
cd "C:\Users\Juanjo\Documents\tenis"
powershell -NoProfile -ExecutionPolicy Bypass -File .\generate_supabase_sql.ps1 -ProjectUrl "https://abcd1234.supabase.co" -Bucket "tenis"
```
- El script generará un archivo `supabase_inserts.sql` con muchas líneas `INSERT INTO gallery (src, gender) VALUES (...)`.

5) Crear la tabla `gallery` en Supabase
- En Supabase, ve a `SQL Editor` y ejecuta esta consulta para crear la tabla:
```sql
create table if not exists public.gallery (
  id serial primary key,
  src text not null,
  gender text not null
);
```

6) Pegar las sentencias SQL generadas
- En la misma `SQL Editor`, pega el contenido de `supabase_inserts.sql` y ejecútalo. Esto insertará todas las filas con las URLs públicas.

7) Probar desde la web
- `script.js` del proyecto ya consume `gallery.json` localmente. Si prefieres leer directamente de la tabla Supabase desde el navegador, necesitarás `supabase-js` y una `anon key` expuesta en el cliente (o crear una función/endpoint). Para simplicidad, usa `gallery.json` con URLs públicas o sube también `gallery.json` al bucket y sirve el sitio estático desde el mismo bucket o desde Netlify.

Notas y opciones
- Si quieres que yo genere `supabase_inserts.sql` por ti, dime tu `Project URL` (no el key) y confirmaré la plantilla; aún deberás pegar y ejecutar las sentencias en el SQL Editor (por razones de seguridad solo tú con tu cuenta puede ejecutar SQL de escritura).
- Subir imágenes con la UI web es lo más sencillo. Si prefieres automatizar la subida desde PowerShell o Node, puedo añadir un script que use la API (necesitará una `service_role` key; no compartas esa key públicamente).

Fin.
