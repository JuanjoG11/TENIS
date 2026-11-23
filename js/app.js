// KICKS Catalog Application Logic

// Application State
let products = [];
let filteredProducts = [];
let activeCategory = 'all';
let searchQuery = '';
let activeBrands = new Set();
let activeSizes = new Set();

// Modal & Carousel State
let currentProduct = null;
let currentSlideIndex = 0;
let carouselImages = [];
let selectedSize = null;

// Touch Sweep support for Mobile Carousel
let touchStartX = 0;
let touchEndX = 0;

// WhatsApp configuration
const WHATSAPP_PHONE = '573204961453';

// ── CART ────────────────────────────────────────────────────────────────────
// Map of product id -> product object
const cart = new Map();

// DOM Elements
const productGrid = document.getElementById('product-grid');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const logoBtn = document.getElementById('logo-btn');

// Modal DOM Elements
const productModal = document.getElementById('product-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBrand = document.getElementById('modal-brand');
const modalTitle = document.getElementById('modal-title');
const modalGender = document.getElementById('modal-gender');
const modalDescription = document.getElementById('modal-description');
const modalSizesContainer = document.getElementById('modal-sizes');
const sizeErrorMsg = document.getElementById('size-error');
const whatsappOrderBtn = document.getElementById('whatsapp-order-btn');

// Carousel DOM Elements
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// 1. Initial Load & Database Parsing
// ── MAINTENANCE MODE ─────────────────────────────────────────────────────────
// Set to true to force the server-error screen for all visitors.
// Change back to false when the server is back up.
const MAINTENANCE_MODE = true;
// ─────────────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
    // Show error screen immediately if maintenance mode is on
    if (MAINTENANCE_MODE) {
        const errorScreen = document.getElementById('server-error-screen');
        if (errorScreen) errorScreen.style.display = 'flex';
        return;
    }

    await loadProducts();

    // If nothing loaded at all, show the server-error screen instead of an empty catalog
    if (products.length === 0) {
        const errorScreen = document.getElementById('server-error-screen');
        if (errorScreen) errorScreen.style.display = 'flex';
        return;
    }

    renderProducts();
    setupEventListeners();
});

// Intercala productos por género: H, D, H, D, H, D …
// Los sobrantes de la categoría más larga van al final.
function interleaveByGender(list) {
    const hombres = list.filter(p => p.genero === 'Hombre');
    const damas   = list.filter(p => p.genero === 'Dama');
    const others  = list.filter(p => p.genero !== 'Hombre' && p.genero !== 'Dama');
    const result  = [];
    const maxLen  = Math.max(hombres.length, damas.length);
    for (let i = 0; i < maxLen; i++) {
        if (i < hombres.length) result.push(hombres[i]);
        if (i < damas.length)   result.push(damas[i]);
    }
    return result.concat(others);
}

async function loadProducts() {
    // Attempt to load images directly from Supabase Storage first (using supabase-js client)
    try {
        const SUPABASE_URL = 'https://vomghggqwtbwcvjfroev.supabase.co';
        const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbWdoZ2dxd3Rid2N2amZyb2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjIyNjksImV4cCI6MjA5NTk5ODI2OX0.0f1p00Lsi6EG9izXVmw_awAgIxXs2XOl_GPd5SnFlV4';
        const BUCKET = 'tennis';

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('Supabase client not available');
        }

        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

        async function listFromStorage(prefix) {
            try {
                const options = { limit: 2000, offset: 0, sortBy: { column: 'name', order: 'asc' } };
                const resp = await sb.storage.from(BUCKET).list(prefix || '', options);
                if (resp.error) {
                    console.warn('Supabase list error for', prefix, resp.error.message);
                    return [];
                }
                const data = resp.data || [];
                const items = [];
                for (let i = 0; i < data.length; i++) {
                    const file = data[i];
                    if (file.id === null) continue; // folder
                    if (!file.name || file.name.startsWith('.')) continue;
                    const path = prefix ? (prefix + '/' + file.name) : file.name;
                    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
                    items.push({ name: file.name, src: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodedPath}` });
                }
                return items;
            } catch (err) {
                console.warn('listFromStorage failed', err);
                return [];
            }
        }

        const hombres = await listFromStorage('hombre');
        const hombres2 = hombres.length === 0 ? await listFromStorage('Hombre') : hombres;
        const damas = await listFromStorage('dama');
        const damas2 = damas.length === 0 ? await listFromStorage('Dama') : damas;

        const combined = [];
        let idCounter = 1;
        hombres2.forEach(h => combined.push({ id: `s${idCounter++}`, nombre: '', marca: '', genero: 'Hombre', imagen1: h.src }));
        damas2.forEach(d => combined.push({ id: `s${idCounter++}`, nombre: '', marca: '', genero: 'Dama',   imagen1: d.src }));

        if (combined.length > 0) {
            console.log('Supabase: encontrados', combined.length, 'objetos. Muestra:', combined.slice(0,6));
            products = combined;
            // Merge ImgBB photos from JSONBin, then interleave
            await mergeImgbbPhotos();
            products = interleaveByGender(products);
            filteredProducts = [...products];
            return;
        }
    } catch (e) {
        console.warn('No se pudieron listar imágenes desde Supabase (supabase-js), siguiendo con productos locales.', e.message || e);
    }
    // 1. Tries to read from localStorage first (for real-time editing experience)
    const localData = localStorage.getItem('kicks_products');
    if (localData) {
        try {
            products = JSON.parse(localData);
            await mergeImgbbPhotos();
            products = interleaveByGender(products);
            filteredProducts = [...products];
            return;
        } catch (e) {
            console.error('Error parseando localStorage, recurriendo a archivos de origen.');
        }
    }

    // 2. Tries to fetch dynamic products.json
    try {
        const response = await fetch('products.json');
        if (response.ok) {
            products = await response.json();
        } else {
            throw new Error('No se pudo leer products.json, cargando datos por defecto.');
        }
    } catch (error) {
        console.warn(error.message);
        // Fallback to static seed data loaded from js/default-data.js
        if (typeof DEFAULT_PRODUCTS !== 'undefined') {
            products = DEFAULT_PRODUCTS;
        } else {
            products = [];
        }
    }
    await mergeImgbbPhotos();
    products = interleaveByGender(products);
    filteredProducts = [...products];
}

// Load photos uploaded via ImgBB (subir.html) and merge into products list
async function mergeImgbbPhotos() {
    try {
        const JSONBIN_KEY    = '$2a$10$wQWrp4VBBWuuUfN5akS.u.1M2Q4TrIfX0En42Qh3xg0l5k2tc/OTK';
        const JSONBIN_BIN_ID = '6a456ed2da38895dfe1e15ce';

        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        if (!res.ok) return;
        const json = await res.json();
        const saved = json.record || [];
        if (!saved.length) return;

        let idCounter = Date.now();
        const imgbbProducts = saved.map(item => ({
            id: `imgbb_${idCounter++}`,
            nombre: '',
            marca: '',
            genero: item.genero === 'dama' ? 'Dama' : 'Hombre',
            imagen1: item.url,
            imagen2: '',
            imagen3: '',
            descripcion: '',
            tallas: ''
        }));
        // Prepend so newest ImgBB photos appear first
        products = [...imgbbProducts, ...products];
    } catch(e) {
        console.warn('mergeImgbbPhotos error', e);
    }
}

// Advanced filters UI removed to improve responsiveness

// 3. Render Cards Grid
function renderProducts() {
    productGrid.innerHTML = '';

    // Apply filters
    filteredProducts = products.filter(p => {
        // Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
            p.nombre.toLowerCase().includes(query) ||
            p.marca.toLowerCase().includes(query) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(query));

        // Category (Gender) Filter
        // Note: Unisex matches both Hombre and Dama
        const matchesCategory = activeCategory === 'all' || 
            p.genero === activeCategory || 
            p.genero === 'Unisex';

        // Brand Filter
        const matchesBrand = activeBrands.size === 0 || activeBrands.has(p.marca);

        // Size Filter
        let matchesSize = true;
        if (activeSizes.size > 0) {
            const productSizes = p.tallas ? p.tallas.split(',').map(s => s.trim()) : [];
            matchesSize = [...activeSizes].some(size => productSizes.includes(size));
        }

        return matchesSearch && matchesCategory && matchesBrand && matchesSize;
    });

    // Update Result Text (if element exists)
    if (resultsCount) {
        resultsCount.textContent = `Mostrando ${filteredProducts.length} modelo${filteredProducts.length !== 1 ? 's' : ''}`;
    }

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">👟</span>
                <h3 class="empty-title">No encontramos tenis coincidentes</h3>
                <p class="empty-desc">Prueba limpiando los filtros o realizando otra búsqueda.</p>
                <button class="reset-filters-btn" onclick="clearAllFilters()">Limpiar Filtros</button>
            </div>
        `;
        return;
    }

    // Render items in batches to avoid blocking the main thread when there are many products
    const batchSize = 48; // initial visible items
    const laterBatchSize = 60; // subsequent batches

    function createCardElement(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        if (cart.has(product.id)) card.classList.add('in-cart');

        // Clicking the image area opens the modal
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'card-img-wrapper';
        imgWrapper.addEventListener('click', () => openModal(product));

        const img = document.createElement('img');
        img.className = 'card-img';
        img.loading = 'lazy';
        img.alt = product.nombre || '';
        img.src = product.imagen1 || '';
        img.onerror = () => {
            img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
            img.style.display = 'none';
        };

        imgWrapper.appendChild(img);

        const genderClass = `badge-${(product.genero || '').toLowerCase()}`;
        const badge = document.createElement('span');
        badge.className = `gender-badge ${genderClass}`;
        badge.textContent = product.genero || '';
        imgWrapper.appendChild(badge);

        // Cart toggle button overlay
        const cartBtn = document.createElement('button');
        cartBtn.className = 'card-cart-btn' + (cart.has(product.id) ? ' added' : '');
        cartBtn.setAttribute('aria-label', 'Agregar al pedido');
        cartBtn.innerHTML = cart.has(product.id)
            ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCart(product, card, cartBtn);
        });
        imgWrapper.appendChild(cartBtn);

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        const brandSpan = document.createElement('span');
        brandSpan.className = 'card-brand';
        brandSpan.textContent = product.marca || '';
        const titleH2 = document.createElement('h2');
        titleH2.className = 'card-title';
        titleH2.textContent = product.nombre || '';
        cardBody.appendChild(brandSpan);
        cardBody.appendChild(titleH2);

        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';

        card.appendChild(imgWrapper);
        card.appendChild(cardBody);
        card.appendChild(cardFooter);

        return card;
    }

    // Synchronously render the first small batch for immediate UX
    const initial = filteredProducts.slice(0, batchSize);
    initial.forEach(p => productGrid.appendChild(createCardElement(p)));

    // Schedule remaining items in background batches
    const remaining = filteredProducts.slice(batchSize);
    if (remaining.length > 0) {
        let idx = 0;
        function renderNextBatch() {
            const chunk = remaining.slice(idx, idx + laterBatchSize);
            chunk.forEach(p => productGrid.appendChild(createCardElement(p)));
            idx += laterBatchSize;
            if (idx < remaining.length) {
                // Use requestIdleCallback if available, otherwise fallback to setTimeout
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(renderNextBatch, { timeout: 500 });
                } else {
                    setTimeout(renderNextBatch, 200);
                }
            }
        }
        // kick off next batches after a short delay so initial paint stays snappy
        if ('requestIdleCallback' in window) {
            requestIdleCallback(renderNextBatch, { timeout: 500 });
        } else {
            setTimeout(renderNextBatch, 300);
        }
    }
}

// Advanced filter interaction removed (brand/size pills no longer rendered)

function clearAllFilters() {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    activeBrands.clear();
    activeSizes.clear();
    activeCategory = 'all';
    
    // Reset Category Tabs styling: make 'Todos' active by default
    document.querySelectorAll('.gender-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    const firstBtn = document.querySelector('.gender-tabs .tab-btn[data-category="all"]');
    if (firstBtn) firstBtn.classList.add('active');

    // Clear Pill styling
    document.querySelectorAll('.brand-pill').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.size-pill').forEach(p => p.classList.remove('remove', 'active'));
    
    renderProducts();
}
// Attach to global window scope so HTML onclick can call it
window.clearAllFilters = clearAllFilters;

// 5. Setup Modal & Multi-Image Carousel
function openModal(product) {
    currentProduct = product;
    selectedSize = null;
    currentSlideIndex = 0;
    sizeErrorMsg.style.display = 'none';

    // Text & Details bindings
    modalBrand.textContent = product.marca;
    modalTitle.textContent = product.nombre;
    // Replace full description with a concise prompt asking for the buyer's size
    modalDescription.textContent = '¿Cuál es tu talla? Responde con la talla que deseas para que confirmemos disponibilidad.';
    
    // Gender badge inside modal
    modalGender.textContent = product.genero;
    modalGender.className = `gender-badge modal-gender badge-${product.genero.toLowerCase()}`;

    // Extract dynamic images (filters out blank/undefined values)
    carouselImages = [product.imagen1, product.imagen2, product.imagen3].filter(img => img && img.trim() !== '');
    
    // Create Carousel elements
    setupCarousel();

    // Render Sizes Buttons
    modalSizesContainer.innerHTML = '';
    if (product.tallas) {
        const sizesList = product.tallas.split(',').map(s => s.trim());
        sizesList.forEach(size => {
            if (!size) return;
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'modal-size-btn';
            sizeBtn.textContent = size;
            sizeBtn.addEventListener('click', () => {
                // Remove active class from other buttons
                document.querySelectorAll('.modal-size-btn').forEach(b => b.classList.remove('active'));
                sizeBtn.classList.add('active');
                selectedSize = size;
                sizeErrorMsg.style.display = 'none';
            });
            modalSizesContainer.appendChild(sizeBtn);
        });
    }

    // Display overlay
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Stop body scrolling

    // Sync "Agregar" button state
    const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
    if (addToCartModalBtn) {
        addToCartModalBtn.onclick = () => {
            if (cart.has(currentProduct.id)) {
                // Already in cart – remove it
                cart.delete(currentProduct.id);
                syncCartStateToGrid();
                updateCartBadge();
                addToCartModalBtn.classList.remove('added');
                addToCartModalBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Agregar al pedido`;
            } else {
                cart.set(currentProduct.id, currentProduct);
                syncCartStateToGrid();
                updateCartBadge();
                addToCartModalBtn.classList.add('added');
                addToCartModalBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Agregado ✓`;
            }
        };
        // Reflect current state
        if (cart.has(currentProduct.id)) {
            addToCartModalBtn.classList.add('added');
            addToCartModalBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Agregado ✓`;
        } else {
            addToCartModalBtn.classList.remove('added');
            addToCartModalBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Agregar al pedido`;
        }
    }
}

function closeModal() {
    productModal.classList.remove('open');
    document.body.style.overflow = ''; // Restore body scrolling
    currentProduct = null;
}

// Setup slides and indicators based on active images list
function setupCarousel() {
    carouselTrack.innerHTML = '';
    carouselDots.innerHTML = '';

    carouselImages.forEach((imgUrl, idx) => {
        // Build slide item
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `<img src="${imgUrl}" alt="${currentProduct.nombre} - Foto ${idx+1}" class="carousel-img" loading="lazy">`;
        carouselTrack.appendChild(slide);

        // Build dot indicator
        const dot = document.createElement('span');
        dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(idx));
        carouselDots.appendChild(dot);
    });

    // Hide/show navigation arrows depending on number of images
    if (carouselImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        carouselDots.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        carouselDots.style.display = 'flex';
    }

    updateCarouselPosition();
}

function goToSlide(index) {
    if (index < 0) {
        currentSlideIndex = carouselImages.length - 1;
    } else if (index >= carouselImages.length) {
        currentSlideIndex = 0;
    } else {
        currentSlideIndex = index;
    }
    updateCarouselPosition();
}

function updateCarouselPosition() {
    carouselTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    
    // Update dots indicator state
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlideIndex);
    });
}

// Swipe Guestures for mobile
function handleGesture() {
    if (carouselImages.length <= 1) return;
    const diff = touchEndX - touchStartX;
    if (diff > 50) {
        // Swiped right -> Previous image
        goToSlide(currentSlideIndex - 1);
    } else if (diff < -50) {
        // Swiped left -> Next image
        goToSlide(currentSlideIndex + 1);
    }
}

// 6. WhatsApp Link Generation – single product from modal
function processWhatsAppOrder() {
    if (cart.size > 0) {
        // Customer already built a cart – send all at once
        sendCartToWhatsApp();
        return;
    }
    const greeting = 'Hola Tennis y Más! Me interesa este producto.';
    const generoPart = currentProduct && currentProduct.genero ? `Género: ${currentProduct.genero}` : '';
    const imagenPart = currentProduct && currentProduct.imagen1 ? `Imagen: ${currentProduct.imagen1}` : '';
    const textMessage = [greeting, generoPart, imagenPart, 'Gracias!'].filter(Boolean).join(' ');
    const encodedText = encodeURIComponent(textMessage);
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodedText}`, '_blank');
}

// ── CART LOGIC ──────────────────────────────────────────────────────────────

function toggleCart(product, cardEl, btnEl) {
    if (cart.has(product.id)) {
        cart.delete(product.id);
        cardEl.classList.remove('in-cart');
        btnEl.classList.remove('added');
        btnEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
    } else {
        cart.set(product.id, product);
        cardEl.classList.add('in-cart');
        btnEl.classList.add('added');
        btnEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
    }
    updateCartBadge();
}

function updateCartBadge() {
    const fab = document.getElementById('cart-fab');
    const count = document.getElementById('cart-count');
    if (!fab || !count) return;
    const n = cart.size;
    count.textContent = n;
    fab.style.display = n > 0 ? 'flex' : 'none';
}

function openCartPanel() {
    const panel = document.getElementById('cart-panel');
    if (!panel) return;
    renderCartPanel();
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartPanel() {
    const panel = document.getElementById('cart-panel');
    if (!panel) return;
    panel.classList.remove('open');
    document.body.style.overflow = '';
}

function renderCartPanel() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;
    list.innerHTML = '';
    cart.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'cart-item';

        const img = document.createElement('img');
        img.src = product.imagen1 || '';
        img.alt = product.nombre || '';
        img.className = 'cart-item-img';

        const info = document.createElement('div');
        info.className = 'cart-item-info';

        const name = document.createElement('span');
        name.className = 'cart-item-name';
        name.textContent = product.nombre || product.marca || `Tenis ${product.genero}`;

        const gen = document.createElement('span');
        gen.className = 'cart-item-gen';
        gen.textContent = product.genero;

        // Talla input
        const tallaRow = document.createElement('div');
        tallaRow.className = 'cart-item-talla-row';

        const tallaLabel = document.createElement('label');
        tallaLabel.className = 'cart-item-talla-label';
        tallaLabel.textContent = 'Talla:';

        const tallaInput = document.createElement('input');
        tallaInput.type = 'text';
        tallaInput.className = 'cart-item-talla-input';
        tallaInput.placeholder = 'ej. 42';
        tallaInput.maxLength = 6;
        // Restore saved value if any
        tallaInput.value = product._talla || '';
        tallaInput.addEventListener('input', () => {
            product._talla = tallaInput.value.trim();
            tallaInput.classList.remove('talla-required');
            const warn = document.getElementById('cart-talla-warn');
            if (warn) warn.style.display = 'none';
        });

        tallaRow.appendChild(tallaLabel);
        tallaRow.appendChild(tallaInput);

        info.appendChild(name);
        info.appendChild(gen);
        info.appendChild(tallaRow);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'cart-item-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('aria-label', 'Quitar');
        removeBtn.addEventListener('click', () => {
            cart.delete(product.id);
            updateCartBadge();
            renderCartPanel();
            syncCartStateToGrid();
            if (cart.size === 0) closeCartPanel();
        });

        item.appendChild(img);
        item.appendChild(info);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
}

function syncCartStateToGrid() {
    const allCards = document.querySelectorAll('.product-card');
    allCards.forEach(card => {
        const img = card.querySelector('.card-img');
        const btn = card.querySelector('.card-cart-btn');
        if (!img || !btn) return;
        let matched = false;
        cart.forEach(p => { if (p.imagen1 === img.src) matched = true; });
        if (matched) {
            card.classList.add('in-cart');
            btn.classList.add('added');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
        } else {
            card.classList.remove('in-cart');
            btn.classList.remove('added');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
        }
    });
}

function sendCartToWhatsApp() {
    if (cart.size === 0) return;

    // Check for missing tallas and highlight them
    let missingTalla = false;
    cart.forEach(p => { if (!p._talla) missingTalla = true; });
    if (missingTalla) {
        // Highlight empty inputs
        document.querySelectorAll('.cart-item-talla-input').forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('talla-required');
                input.focus();
            } else {
                input.classList.remove('talla-required');
            }
        });
        const warn = document.getElementById('cart-talla-warn');
        if (warn) warn.style.display = 'block';
        return;
    }

    const lines = ['Hola Tennis y Más! Me interesan estos tenis 👟'];
    let idx = 1;
    cart.forEach(p => {
        const label = p.nombre || p.marca || `Tenis ${p.genero}`;
        lines.push(`\n*${idx}.* ${label} – ${p.genero}`);
        lines.push(`📏 Talla: ${p._talla}`);
        lines.push(`📸 ${p.imagen1}`);
        idx++;
    });
    lines.push('\n¿Me pueden confirmar disponibilidad? Gracias!');
    const encodedText = encodeURIComponent(lines.join('\n'));
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodedText}`, '_blank');
}

// 7. Core Event Listeners
function setupEventListeners() {
    // Categories Tabs Clicking
    const categoryButtons = document.querySelectorAll('.gender-tabs .tab-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            renderProducts();
        });
    });

    // Real-time Text Search input (only if present)
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderProducts();
        });
    }

    // Advanced filters removed: no drawer toggle or reset button listeners

    // Header Logo clicking restores to base state
    logoBtn.addEventListener('click', () => {
        clearAllFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Close Modal actions
    closeModalBtn.addEventListener('click', closeModal);
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal();
    });

    // Keyboard Esc close support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productModal.classList.contains('open')) {
            closeModal();
        }
    });

    // Carousel buttons navigation click listeners
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(currentSlideIndex - 1);
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(currentSlideIndex + 1);
    });

    // WhatsApp Order Action Trigger
    whatsappOrderBtn.addEventListener('click', processWhatsAppOrder);

    // Touch Swipe listeners for dynamic carousel
    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
    }, { passive: true });

    // Cart FAB & Panel
    const cartFab = document.getElementById('cart-fab');
    if (cartFab) cartFab.addEventListener('click', openCartPanel);

    const closeCartBtn = document.getElementById('close-cart-btn');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartPanel);

    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
        cartPanel.addEventListener('click', (e) => {
            if (e.target === cartPanel) closeCartPanel();
        });
    }

    const sendCartBtn = document.getElementById('send-cart-btn');
    if (sendCartBtn) sendCartBtn.addEventListener('click', sendCartToWhatsApp);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartPanel && cartPanel.classList.contains('open')) {
            closeCartPanel();
        }
    });
}
