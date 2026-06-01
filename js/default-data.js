const DEFAULT_PRODUCTS = [
    {
        "id": "1",
        "nombre": "Air Jordan 1 High OG 'Chicago'",
        "marca": "Jordan",
        "genero": "Hombre",
        "imagen1": "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
        "tallas": "38,39,40,41,42,43",
        "descripcion": "El icónico diseño que inició la revolución sneaker. Confeccionado en cuero premium con los colores clásicos de los Chicago Bulls y amortiguación Air encapsulada."
    },
    {
        "id": "2",
        "nombre": "Nike Air Force 1 'All White'",
        "marca": "Nike",
        "genero": "Unisex",
        "imagen1": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=600&auto=format&fit=crop&q=80",
        "tallas": "35,36,37,38,39,40,41,42,43,44",
        "descripcion": "La silueta más vendida de la historia. Cuero blanco puro, entresuela de espuma gruesa y el estilo urbano atemporal que combina con absolutamente todo."
    },
    {
        "id": "3",
        "nombre": "New Balance 550 'White Green'",
        "marca": "New Balance",
        "genero": "Hombre",
        "imagen1": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
        "tallas": "39,40,41,42,43",
        "descripcion": "Estilo retro-basket de finales de los 80. Construido con paneles de cuero perforado, detalles verdes vintage y una suela duradera de goma cosida."
    },
    {
        "id": "4",
        "nombre": "Adidas Forum Low 'Pink Glow'",
        "marca": "Adidas",
        "genero": "Dama",
        "imagen1": "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        "tallas": "35,36,37,38,39",
        "descripcion": "Silueta clásica de básquetbol adaptada al estilo urbano moderno. Cuenta con correa de tobillo ajustable y hermosos detalles en tono rosa pastel."
    },
    {
        "id": "5",
        "nombre": "Nike Dunk Low 'Panda'",
        "marca": "Nike",
        "genero": "Unisex",
        "imagen1": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
        "tallas": "35,36,37,38,39,40,41,42,43",
        "descripcion": "El esquema de color blanco y negro definitivo. Bloques de colores contrastantes que añaden un impacto audaz a cualquier atuendo diario."
    },
    {
        "id": "6",
        "nombre": "Air Jordan 4 Retro 'Military Black'",
        "marca": "Jordan",
        "genero": "Hombre",
        "imagen1": "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80",
        "tallas": "39,40,41,42,43,44",
        "descripcion": "Uno de los diseños más queridos de Tinker Hatfield. Combina cuero premium blanco, detalles de malla negra y gamuza gris claro en la puntera para un toque refinado."
    },
    {
        "id": "7",
        "nombre": "New Balance 9060 'Rain Cloud'",
        "marca": "New Balance",
        "genero": "Unisex",
        "imagen1": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600&auto=format&fit=crop&q=80",
        "tallas": "36,37,38,39,40,41,42,43",
        "descripcion": "Diseño futurista y de silueta abultada. Inspirado en la era Y2K, ofrece una entresuela ondulada exagerada equipada con amortiguación ABZORB premium."
    },
    {
        "id": "8",
        "nombre": "Nike Air Max 90 'Rose Gold'",
        "marca": "Nike",
        "genero": "Dama",
        "imagen1": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
        "imagen2": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        "imagen3": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80",
        "tallas": "35,36,37,38,39,40",
        "descripcion": "Amortiguación Max Air icónica. Esta edición femenina combina gamuza sintética y malla en un elegante esquema de color oro rosa y crema."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_PRODUCTS };
}
