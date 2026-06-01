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

// DOM Elements
const productGrid = document.getElementById('product-grid');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const filterToggleBtn = document.getElementById('filter-toggle-btn');
const filtersDrawer = document.getElementById('filters-drawer');
const brandsContainer = document.getElementById('brands-container');
const sizesContainer = document.getElementById('sizes-container');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
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
window.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    initFilterUI();
    renderProducts();
    setupEventListeners();
});

async function loadProducts() {
    // 1. Tries to read from localStorage first (for real-time editing experience)
    const localData = localStorage.getItem('kicks_products');
    if (localData) {
        try {
            products = JSON.parse(localData);
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
    filteredProducts = [...products];
}

// 2. Generate Filter UI elements dynamically
function initFilterUI() {
    // Extract unique brands
    const brands = [...new Set(products.map(p => p.marca))].sort();
    brandsContainer.innerHTML = '';
    brands.forEach(brand => {
        const pill = document.createElement('span');
        pill.className = 'brand-pill';
        pill.textContent = brand;
        pill.dataset.brand = brand;
        pill.addEventListener('click', () => toggleBrandFilter(brand, pill));
        brandsContainer.appendChild(pill);
    });

    // Extract and sort unique sizes
    const allSizesSet = new Set();
    products.forEach(p => {
        if (p.tallas) {
            p.tallas.split(',').forEach(s => {
                const cleanSize = s.trim();
                if (cleanSize) allSizesSet.add(cleanSize);
            });
        }
    });
    
    // Sort sizes numerically
    const sortedSizes = [...allSizesSet].sort((a, b) => parseFloat(a) - parseFloat(b));
    
    sizesContainer.innerHTML = '';
    sortedSizes.forEach(size => {
        const pill = document.createElement('span');
        pill.className = 'size-pill';
        pill.textContent = size;
        pill.dataset.size = size;
        pill.addEventListener('click', () => toggleSizeFilter(size, pill));
        sizesContainer.appendChild(pill);
    });
}

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

    // Update Result Text
    resultsCount.textContent = `Mostrando ${filteredProducts.length} modelo${filteredProducts.length !== 1 ? 's' : ''}`;

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

    // Render each item
    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.addEventListener('click', () => openModal(product));

        // Gender Badge CSS Class
        const genderClass = `badge-${product.genero.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${product.imagen1}" alt="${product.nombre}" class="card-img" loading="lazy">
                <span class="gender-badge ${genderClass}">${product.genero}</span>
            </div>
            <div class="card-body">
                <span class="card-brand">${product.marca}</span>
                <h2 class="card-title">${product.nombre}</h2>
            </div>
            <div class="card-footer">
                <button class="card-action-btn">
                    Ver Detalles
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// 4. Filters Interaction Logic
function toggleBrandFilter(brand, element) {
    if (activeBrands.has(brand)) {
        activeBrands.delete(brand);
        element.classList.remove('active');
    } else {
        activeBrands.add(brand);
        element.classList.add('active');
    }
    renderProducts();
}

function toggleSizeFilter(size, element) {
    if (activeSizes.has(size)) {
        activeSizes.delete(size);
        element.classList.remove('active');
    } else {
        activeSizes.add(size);
        element.classList.add('active');
    }
    renderProducts();
}

function clearAllFilters() {
    searchQuery = '';
    searchInput.value = '';
    activeBrands.clear();
    activeSizes.clear();
    activeCategory = 'all';
    
    // Clear Category Tabs styling
    document.querySelectorAll('.gender-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'all');
    });

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
    modalDescription.textContent = product.descripcion || 'Sin descripción detallada por el momento.';
    
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

// 6. WhatsApp Link Generation
function processWhatsAppOrder() {
    // Format custom message text
    const textMessage = `Hola KICKS! Me interesa mucho este modelo de tenis:\n\n` + 
                       `👟 *Modelo*: ${currentProduct.nombre}\n` +
                       `🏷️ *Marca*: ${currentProduct.marca}\n` +
                       `🚻 *Género*: ${currentProduct.genero}\n\n` +
                       `¿Me confirmas precio, disponibilidad y métodos de entrega por favor? ⚡`;
    
    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodedText}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
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

    // Real-time Text Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderProducts();
    });

    // Filter drawer toggle
    filterToggleBtn.addEventListener('click', () => {
        const isOpen = filtersDrawer.classList.toggle('open');
        filterToggleBtn.classList.toggle('active', isOpen);
    });

    // Clear filters button click
    resetFiltersBtn.addEventListener('click', clearAllFilters);

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
}
