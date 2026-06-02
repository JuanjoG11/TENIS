/* script.js – Galería que lee imágenes del bucket de Supabase */
/* SIN import/export – usa el global window.supabase del CDN */

(async function () {
    // Configuración
    var SUPABASE_URL = 'https://vomghggqwtbwcvjfroev.supabase.co';
    var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbWdoZ2dxd3Rid2N2amZyb2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjIyNjksImV4cCI6MjA5NTk5ODI2OX0.0f1p00Lsi6EG9izXVmw_awAgIxXs2XOl_GPd5SnFlV4';
    var BUCKET = 'tennis';

    // Crear cliente Supabase
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

    // Función para listar imágenes de una carpeta (o raíz si folder es vacío)
    async function listImages(folder) {
        try {
            console.log('Intentando listar bucket "' + BUCKET + '" carpeta "' + folder + '"...');
            
            var options = { limit: 2000, offset: 0, sortBy: { column: 'name', order: 'asc' } };
            var result;

            if (folder === '') {
                result = await sb.storage.from(BUCKET).list('', options);
            } else {
                result = await sb.storage.from(BUCKET).list(folder, options);
            }

            if (result.error) {
                console.error('Error listando "' + folder + '":', result.error.message);
                return [];
            }

            if (!result.data || result.data.length === 0) {
                console.log('Carpeta "' + folder + '" vacía o no existe.');
                return [];
            }

            console.log('Encontrados ' + result.data.length + ' items en "' + folder + '":', result.data.map(function(f){ return f.name; }));

            // Construir URLs públicas
            var images = [];
            for (var i = 0; i < result.data.length; i++) {
                var file = result.data[i];
                // Saltar carpetas (id es null para carpetas) y archivos ocultos
                if (file.id === null) {
                    console.log('  -> "' + file.name + '" es una CARPETA, no un archivo');
                    continue;
                }
                if (file.name.startsWith('.')) continue;

                var path = folder ? (folder + '/' + file.name) : file.name;
                images.push({
                    name: file.name,
                    src: SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + encodeURI(path)
                });
            }
            return images;
        } catch (err) {
            console.error('Error en listImages("' + folder + '"):', err);
            return [];
        }
    }

    // PASO 1: Listar la raíz del bucket para ver qué hay
    console.log('=== DIAGNÓSTICO: Listando raíz del bucket "' + BUCKET + '" ===');
    var raiz = await listImages('');

    // PASO 2: Intentar con carpeta "hombre"
    console.log('=== Intentando carpeta "hombre" ===');
    var hombres = await listImages('hombre');

    // PASO 3: Si "hombre" está vacío, intentar con "Hombre" (mayúscula)
    if (hombres.length === 0) {
        console.log('=== Intentando carpeta "Hombre" (con mayúscula) ===');
        hombres = await listImages('Hombre');
    }

    // PASO 4: Si sigue vacío, usar las imágenes de la raíz
    if (hombres.length === 0 && raiz.length > 0) {
        console.log('=== Usando imágenes de la raíz del bucket ===');
        hombres = raiz;
    }

    console.log('Total imágenes a mostrar:', hombres.length);

    // Combine male + female images into a single list to paginate
    var damas = await listImages('dama');
    if (damas.length === 0) damas = await listImages('Dama');

    var allItems = [];
    if (hombres && hombres.length) allItems = allItems.concat(hombres.map(i => ({src:i.src, name:i.name, gender:'M'})));
    if (damas && damas.length) allItems = allItems.concat(damas.map(i => ({src:i.src, name:i.name, gender:'F'})));

    // Target grid where cards are shown
    var grid = document.getElementById('product-grid') || document.getElementById('gallery-m');
    if (!grid) {
        console.error('No se encontró contenedor para las tarjetas (product-grid o gallery-m)');
        return;
    }

    // create card element matching the CSS styles
    function createProductCard(item) {
        var card = document.createElement('div');
        card.className = 'product-card';

        var imgWrap = document.createElement('div');
        imgWrap.className = 'card-img-wrapper';
        var img = document.createElement('img');
        img.className = 'card-img';
        img.src = item.src;
        img.alt = item.name || '';
        img.loading = 'lazy';
        imgWrap.appendChild(img);

        // optional badge (keep small) — hidden by default in CSS if desired
        var badge = document.createElement('div');
        badge.className = 'gender-badge ' + (item.gender === 'M' ? 'badge-hombre' : 'badge-dama');
        badge.textContent = item.gender === 'M' ? 'HOMBRE' : 'DAMA';
        imgWrap.appendChild(badge);

        card.appendChild(imgWrap);
        return card;
    }

    // Pagination: initial count depends on screen
    var isDesktop = window.matchMedia('(min-width: 900px)').matches;
    var blockSize = isDesktop ? 8 : 4;
    var index = 0;

    // sentinel for infinite loading
    var sentinel = document.createElement('div');
    sentinel.id = 'load-more-sentinel';
    sentinel.style.height = '1px';

    function loadNext() {
        var end = Math.min(index + blockSize, allItems.length);
        for (; index < end; index++) {
            var it = allItems[index];
            grid.appendChild(createProductCard(it));
        }
        if (index >= allItems.length) {
            if (sentinel && sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
            if (observer) observer.disconnect();
        }
    }

    // initial load
    loadNext();
    grid.appendChild(sentinel);

    // IntersectionObserver to load more blocks when sentinel visible
    var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
            if (e.isIntersecting) {
                loadNext();
            }
        });
    }, {root:null, rootMargin:'300px', threshold: 0});
    observer.observe(sentinel);

    // Lightbox
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var closeBtn = document.getElementById('closeBtn');

    function openLightbox(src) {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        lightbox.style.display = 'flex';
    }

    function closeLightbox() {
        if (!lightbox || !lightboxImg) return;
        lightbox.style.display = 'none';
        lightboxImg.src = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

})();
