# Artesanías Saravia

Sitio web estático para la marca artesanal de **Emiliano Saravia**, dedicada a piezas tejidas a mano en **mimbre y fibras naturales**. El proyecto presenta un catálogo visual, carrito de compras y flujo de contacto para pedidos por WhatsApp.

## 🌿 Descripción

Artesanías Saravia es una tienda online sencilla y elegante pensada para mostrar productos artesanales como:

- canastos materos
- bandoleras
- organizadores
- artículos decorativos
- mobiliario en mimbre
- trabajos a medida personalizados

La idea del sitio es mantener una experiencia visual cálida, natural y moderna, con un enfoque comercial práctico para vender directamente por WhatsApp.

## ✨ Funcionalidades

- Diseño responsive y adaptable a distintos dispositivos
- Catálogo de productos cargado desde JSON
- Filtros por categorías
- Búsqueda por nombre o descripción
- Carrito de compras con almacenamiento local usando localStorage
- Botones flotantes para WhatsApp y carrito
- Pedido directo desde la web mediante enlaces de WhatsApp
- Contacto y consulta personalizada desde el formulario
- Soporte para trabajos a medida con precio consultado

## 🛠️ Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript vanilla
- JSON para el catálogo
- localStorage para persistencia del carrito
- WhatsApp para pedidos y contacto

## 📁 Estructura del proyecto

```bash
artesanias-saravia/
├── index.html
├── css/
│   └── style.css
├── data/
│   └── catalog.json
├── img/
├── js/
│   ├── config.js
│   ├── main.js
│   └── store.js
├── README.md
└── LICENSE (si se agrega más adelante)
```

## 🚀 Cómo ejecutar el proyecto

### Opción 1: abrir directamente

Simplemente abrí el archivo `index.html` en tu navegador.

### Opción 2: servidor local

Si querés probarlo como un entorno más real:

```bash
cd artesanias-saravia
python -m http.server 8000
```

Luego abrí en el navegador:

```text
http://localhost:8000
```

## ⚙️ Configuración

### WhatsApp

Editá el archivo `js/config.js` y configurá el número real del negocio:

```js
whatsappNumber: "5493420000000"
```

Importante:
- usar el código de país sin `+`
- sin espacios ni guiones
- formato recomendado: `54 + 9 + código de área + número`

### Catálogo de productos

Los productos están definidos en `data/catalog.json`.

Podés modificar:
- nombre
- categoría
- descripción
- precio
- stock
- imagen

Si una imagen no existe o está vacía, el sitio usa un placeholder generado automáticamente.

## 🌐 Redes sociales

- Instagram: https://www.instagram.com/artesanias_saravia/
- Facebook: https://www.facebook.com/profile.php?id=61577900293015

## 📦 Despliegue

Este proyecto puede publicarse en:

- GitHub Pages
- Netlify
- Vercel
- cualquier hosting estático

No requiere backend ni base de datos.

## 📝 Notas

- Los precios pueden ajustarse según el stock real o la temporada.
- Los trabajos personalizados aparecen como “Consultar”.
- Cuando tengas fotos reales de las piezas, reemplazá las imágenes en `data/catalog.json` para que el catálogo quede más auténtico.

## 👤 Autor

Proyecto desarrollado para **Artesanías Saravia**.

Si querés, puedo dejarte también una versión más premium del README con badges, una sección de screenshots y una descripción lista para publicar en GitHub con estilo comercial.