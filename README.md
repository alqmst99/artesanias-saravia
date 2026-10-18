# Artesanías Saravia (versión completa)

Sitio multi-página para **Emiliano Saravia** — mimbre y fibras naturales.  
Arquitectura inspirada en el e-commerce de **Mundo Bebé SF**.

## Características

- **Home** con hero, destacados automáticos, catálogo resumido, nosotros y contacto
- **Catálogo multi-página** (`pages/catalogo.html`) con filtros, búsqueda y paginación
- **Ficha de producto** (`pages/producto.html?id=...`) con galería multi-foto, cantidad, carrito y WhatsApp
- **Carrito** en localStorage → pedido prearmado por WhatsApp
- Productos con `price: 0` = “Consultar” (ideal para trabajo a medida)
- Store robusto: cache, `catalogVersion`, `featured`, `images[]`, placeholders
- SEO: Open Graph, robots.txt, sitemap.xml, llms.txt

## Estructura

```
artesanias-saravia/
├── index.html
├── privacy.html
├── terms.html
├── robots.txt
├── sitemap.xml
├── llms.txt
├── css/style.css
├── data/catalog.json
├── img/                 ← fotos de productos
├── js/
│   ├── config.js        ← WhatsApp, IG, email, horarios
│   ├── store.js         ← capa de datos
│   ├── main.js          ← home + catálogo + carrito
│   └── product.js       ← ficha de producto
└── pages/
    ├── catalogo.html
    └── producto.html
```

## Configuración

1. `js/config.js` → número de WhatsApp real (código país, sin + ni espacios).
2. `data/catalog.json` → productos. Subí el `catalogVersion` cuando cambies el stock.
3. Al publicar, actualizá el dominio en sitemap, robots, llms y canonical.

## Cómo probar

```bash
cd artesanias-saravia
python3 -m http.server 8000
```

Abrí http://localhost:8000

## Notas

- Las tarjetas del catálogo abren la ficha de producto; el botón “+” agrega al carrito sin salir.
- La galería usa `images[]` del JSON (hasta 3 fotos por pieza en esta versión).
- Destacados se toman de `featured: true` en el catálogo.
