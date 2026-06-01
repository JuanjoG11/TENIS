// KICKS Admin Dashboard Logic

let adminProducts = [];

// DOM Elements
const adminTableBody = document.getElementById('admin-table-body');
const tableHeaderTitle = document.getElementById('table-header-title');
const dropzone = document.getElementById('dropzone');
const csvFileInput = document.getElementById('csv-file-input');
const exportJsonBtn = document.getElementById('export-json-btn');
const resetDbBtn = document.getElementById('reset-db-btn');
const toastContainer = document.getElementById('toast-container');

// Form Modal Elements
const productFormModal = document.getElementById('product-form-modal');
const closeFormBtn = document.getElementById('close-form-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const addProductBtn = document.getElementById('add-product-btn');
const adminProductForm = document.getElementById('admin-product-form');
const formModalTitle = document.getElementById('form-modal-title');

// Form Input Fields
const formProductId = document.getElementById('form-product-id');
const formNombre = document.getElementById('form-nombre');
const formMarca = document.getElementById('form-marca');
const formGenero = document.getElementById('form-genero');
const formTallas = document.getElementById('form-tallas');
const formImagen1 = document.getElementById('form-imagen1');
const formImagen2 = document.getElementById('form-imagen2');
const formImagen3 = document.getElementById('form-imagen3');
const formDescripcion = document.getElementById('form-descripcion');

// 1. Initial Data Loading
window.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupAdminEventListeners();
});

async function loadProducts() {
    const localData = localStorage.getItem('kicks_products');
    
    if (localData) {
        try {
            adminProducts = JSON.parse(localData);
        } catch (e) {
            console.error('Error parseando localStorage, recargando de default.');
            adminProducts = [];
        }
    }

    if (adminProducts.length === 0) {
        // Tries to read from products.json first, then default-data
        try {
            const response = await fetch('products.json');
            if (response.ok) {
                adminProducts = await response.json();
            } else {
                throw new Error();
            }
        } catch (error) {
            if (typeof DEFAULT_PRODUCTS !== 'undefined') {
                adminProducts = DEFAULT_PRODUCTS;
            }
        }
        saveToLocalStorage();
    }

    renderTable();
}

function saveToLocalStorage() {
    localStorage.setItem('kicks_products', JSON.stringify(adminProducts));
}

// 2. Render Products Table
function renderTable() {
    adminTableBody.innerHTML = '';
    tableHeaderTitle.textContent = `Tenis en el Catálogo (${adminProducts.length})`;

    if (adminProducts.length === 0) {
        adminTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    No hay tenis en el catálogo. Usa el botón "Agregar Tenis" o sube un archivo CSV masivo.
                </td>
            </tr>
        `;
        return;
    }

    adminProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        
        // Gender Styling
        let genderColor = 'var(--color-unisex)';
        if (product.genero === 'Hombre') genderColor = 'var(--color-hombre)';
        if (product.genero === 'Dama') genderColor = 'var(--color-dama)';

        row.innerHTML = `
            <td>
                <img src="${product.imagen1}" alt="${product.nombre}" onerror="this.src='https://images.unsplash.com/photo-1556906781-9a412961c28c?w=100'">
            </td>
            <td>
                <div class="model-name">${product.nombre}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                    ${product.descripcion || 'Sin descripción'}
                </div>
            </td>
            <td style="font-weight: 500;">${product.marca}</td>
            <td>
                <span style="color: ${genderColor}; font-weight: bold; font-size: 0.8rem; text-transform: uppercase;">
                    ${product.genero}
                </span>
            </td>
            <td style="display: none;">
                <div class="sizes-list">${product.tallas}</div>
            </td>
            <td>
                <div class="action-cell">
                    <button class="icon-btn" onclick="editProduct('${product.id}')" title="Editar Tenis">
                        ✏️
                    </button>
                    <button class="icon-btn icon-btn-danger" onclick="deleteProduct('${product.id}')" title="Eliminar Tenis">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        adminTableBody.appendChild(row);
    });
}

// 3. Notification Toasts
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✅' : '⚠️';
    
    toast.innerHTML = `
        <span>${icon}</span>
        <div>${message}</div>
    `;
    
    toastContainer.appendChild(toast);

    // Auto-remove toast after 3.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// 4. Manual Product CRUD
function openAddForm() {
    formModalTitle.textContent = 'Agregar Nuevo Tenis';
    formProductId.value = '';
    adminProductForm.reset();
    
    productFormModal.classList.add('open');
}

window.editProduct = function(id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;

    formModalTitle.textContent = 'Editar Tenis';
    formProductId.value = product.id;
    formNombre.value = product.nombre;
    formMarca.value = product.marca;
    formGenero.value = product.genero;
    formTallas.value = product.tallas;
    formImagen1.value = product.imagen1 || '';
    formImagen2.value = product.imagen2 || '';
    formImagen3.value = product.imagen3 || '';
    formDescripcion.value = product.descripcion || '';

    productFormModal.classList.add('open');
};

window.deleteProduct = function(id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;

    if (confirm(`¿Estás seguro de eliminar el modelo "${product.nombre}"?`)) {
        adminProducts = adminProducts.filter(p => p.id !== id);
        saveToLocalStorage();
        renderTable();
        showToast('Tenis eliminado del catálogo.', 'success');
    }
};

function saveProduct(e) {
    e.preventDefault();

    const id = formProductId.value;
    const productData = {
        id: id || Date.now().toString(),
        nombre: formNombre.value.trim(),
        marca: formMarca.value,
        genero: formGenero.value,
        tallas: formTallas.value.trim(),
        imagen1: formImagen1.value.trim(),
        imagen2: formImagen2.value.trim(),
        imagen3: formImagen3.value.trim(),
        descripcion: formDescripcion.value.trim()
    };

    if (id) {
        // Edit mode
        const index = adminProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            adminProducts[index] = productData;
            showToast('Tenis actualizado correctamente.', 'success');
        }
    } else {
        // Create mode
        adminProducts.unshift(productData);
        showToast('Nuevo tenis agregado al catálogo.', 'success');
    }

    saveToLocalStorage();
    renderTable();
    closeFormModal();
}

function closeFormModal() {
    productFormModal.classList.remove('open');
}

// 5. CSV Parsing & Bulk Upload
function handleCSVFile(file) {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        showToast('El archivo debe ser en formato CSV (.csv).', 'error');
        return;
    }

    showToast('Procesando archivo CSV...', 'success');

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const parsedData = results.data;
            
            if (parsedData.length === 0) {
                showToast('El archivo CSV está vacío.', 'error');
                return;
            }

            // Check columns validity (must contain nombre)
            const firstRow = parsedData[0];
            if (!('nombre' in firstRow) || !('marca' in firstRow) || !('tallas' in firstRow)) {
                showToast('CSV no válido. Debe contener las columnas: nombre, marca y tallas.', 'error');
                return;
            }

            // Map and parse items
            const newProducts = parsedData.map((row, idx) => {
                // Ensure gender is exact
                let genero = 'Unisex';
                if (row.genero) {
                    const gLower = row.genero.trim().toLowerCase();
                    if (gLower === 'hombre') genero = 'Hombre';
                    else if (gLower === 'dama') genero = 'Dama';
                }

                // Parse image lists (handles blank cells)
                const img1 = row.imagen1 ? row.imagen1.trim() : 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600';
                const img2 = row.imagen2 ? row.imagen2.trim() : '';
                const img3 = row.imagen3 ? row.imagen3.trim() : '';

                return {
                    id: row.id ? row.id.trim() : (Date.now() + idx).toString(),
                    nombre: row.nombre ? row.nombre.trim() : 'Modelo sin nombre',
                    marca: row.marca ? row.marca.trim() : 'Genérico',
                    genero: genero,
                    tallas: row.tallas ? row.tallas.trim() : '35,36,37,38,39,40',
                    imagen1: img1,
                    imagen2: img2,
                    imagen3: img3,
                    descripcion: row.descripcion ? row.descripcion.trim() : 'Edición premium clásica.'
                };
            });

            // Merge or overwrite? Let's overwrite and append to list
            adminProducts = [...newProducts, ...adminProducts];
            
            // Deduplicate by ID just in case
            const seenIds = new Set();
            adminProducts = adminProducts.filter(p => {
                if (seenIds.has(p.id)) return false;
                seenIds.add(p.id);
                return true;
            });

            saveToLocalStorage();
            renderTable();
            showToast(`Carga masiva exitosa: ¡${newProducts.length} tenis importados!`, 'success');
        },
        error: function(err) {
            showToast('Error al parsear el archivo CSV: ' + err.message, 'error');
        }
    });
}

// 6. JSON Export & Backup Downloader
function downloadJSON() {
    if (adminProducts.length === 0) {
        showToast('No hay datos para exportar.', 'error');
        return;
    }

    const dataStr = JSON.stringify(adminProducts, null, 4);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = 'products.json';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    
    URL.revokeObjectURL(url);
    showToast('Base de datos exportada. Sobrescribe el archivo "products.json" en el proyecto para guardarlo permanentemente.', 'success');
}

// 7. Reset DB to Default seeds
function resetDB() {
    if (confirm('¿Estás seguro de restaurar los tenis predeterminados? Se perderán las cargas actuales no guardadas.')) {
        localStorage.removeItem('kicks_products');
        adminProducts = [];
        loadProducts();
        showToast('Base de datos restaurada a valores iniciales.', 'success');
    }
}

// 8. Event Listeners setups
function setupAdminEventListeners() {
    // Add product opening click
    addProductBtn.addEventListener('click', openAddForm);

    // Form Modal Closes
    closeFormBtn.addEventListener('click', closeFormModal);
    cancelFormBtn.addEventListener('click', closeFormModal);
    productFormModal.addEventListener('click', (e) => {
        if (e.target === productFormModal) closeFormModal();
    });

    // Form submission save
    adminProductForm.addEventListener('submit', saveProduct);

    // Export button click
    exportJsonBtn.addEventListener('click', downloadJSON);

    // Reset DB button click
    resetDbBtn.addEventListener('click', resetDB);

    // Drag and Drop Zone files actions
    dropzone.addEventListener('click', () => csvFileInput.click());

    csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCSVFile(e.target.files[0]);
            csvFileInput.value = ''; // Reset input selection
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleCSVFile(e.dataTransfer.files[0]);
        }
    });
}
