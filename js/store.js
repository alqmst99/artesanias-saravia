/**
 * CAPA DE DATOS — localStorage + catálogo JSON
 * Adaptado de la arquitectura robusta de Mundo Bebé SF / Pet_Shop.
 * Soporta: cache con versionado, normalizeProduct, featured, active,
 * múltiples imágenes, path-aware, placeholders por categoría.
 */
const DB_KEY = "artesanias_saravia_db_v2";
const CONFIG_OVERRIDE_KEY = "artesanias_saravia_config_v1";

// Detecta si estamos en /pages/ y ajusta la ruta del catálogo
const CATALOG_URL =
  typeof location !== "undefined" && location.pathname.includes("/pages/")
    ? "../data/catalog.json"
    : "data/catalog.json";

const CATEGORY_ICONS = {
  materos: "🧉",
  bandoleras: "👜",
  organizadores: "📦",
  decoracion: "✨",
  mobiliario: "🪑",
  personalizados: "✏️",
};

const CATEGORY_COLORS = {
  materos: "#C4A574",
  bandoleras: "#A67C52",
  organizadores: "#8B7355",
  decoracion: "#D4C4A8",
  mobiliario: "#6B5344",
  personalizados: "#B8956A",
};

const DEFAULT_CATEGORIES = [
  { id: "materos", name: "Canastos materos" },
  { id: "bandoleras", name: "Bandoleras" },
  { id: "organizadores", name: "Organizadores" },
  { id: "decoracion", name: "Decoración" },
  { id: "mobiliario", name: "Mobiliario" },
  { id: "personalizados", name: "A medida" },
];

const SEED_PRODUCTS = [
  {
    id: "seed-1",
    name: "Canasto matero clásico",
    category: "materos",
    price: 0,
    stock: 1,
    description: "Pieza de ejemplo. Reemplazá el catálogo real.",
    image: "",
    active: true,
    featured: true,
  },
];

let _dbCache = null;
let _catalogPromise = null;

function loadDB() {
  if (_dbCache) return _dbCache;
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      _dbCache = JSON.parse(raw);
      return _dbCache;
    } catch (e) {}
  }
  _dbCache = { categories: DEFAULT_CATEGORIES, products: [] };
  return _dbCache;
}

function saveDB(db) {
  _dbCache = db;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function normalizeProduct(p) {
  const images =
    Array.isArray(p.images) && p.images.length
      ? p.images
      : p.image
        ? [p.image]
        : [];
  return {
    id: String(p.id || "p" + Date.now()),
    name: p.name || "Sin nombre",
    category: p.category || "decoracion",
    price: Number(p.price) || 0,
    stock: typeof p.stock === "number" ? p.stock : p.stock ? 10 : 0,
    description: p.description || "",
    image: p.image || images[0] || "",
    images,
    active: p.active !== false,
    featured: !!p.featured,
    sku: p.sku || null,
    material: p.material || "Mimbre y fibras naturales",
    details: p.details || "",
    care: p.care || "",
  };
}

async function initCatalog(forceReload = false) {
  let existingDB = null;
  if (!forceReload) {
    const existing = localStorage.getItem(DB_KEY);
    if (existing) {
      try {
        existingDB = JSON.parse(existing);
      } catch (e) {}
    }
  }

  if (_catalogPromise && !forceReload) return _catalogPromise;

  _catalogPromise = (async () => {
    try {
      const res = await fetch(CATALOG_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      // Si la versión en cache coincide y hay productos suficientes, usamos cache
      if (
        existingDB &&
        existingDB.catalogVersion === data.catalogVersion &&
        existingDB.products?.length >= 4
      ) {
        _dbCache = existingDB;
        return existingDB;
      }

      const categories =
        data.categories && data.categories.length
          ? data.categories
          : DEFAULT_CATEGORIES;
      const products = (data.products || []).map(normalizeProduct);
      const db = {
        catalogVersion: data.catalogVersion || 1,
        categories,
        products,
      };
      saveDB(db);
      console.info("[Store] Catálogo cargado:", products.length, "productos");
      return db;
    } catch (err) {
      console.warn("[Store] No se pudo cargar catalog.json, usando seed/cache.", err);
      if (existingDB && existingDB.products?.length) {
        _dbCache = existingDB;
        return existingDB;
      }
      const db = {
        catalogVersion: 0,
        categories: DEFAULT_CATEGORIES,
        products: SEED_PRODUCTS.map(normalizeProduct),
      };
      saveDB(db);
      return db;
    }
  })();

  return _catalogPromise;
}

function placeholderImage(category, name) {
  const color = CATEGORY_COLORS[category] || "#C4A574";
  const icon = CATEGORY_ICONS[category] || "🌿";
  const label = (name || "Foto próximamente").slice(0, 28);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect width="400" height="400" fill="${color}" opacity="0.22"/>
      <circle cx="200" cy="155" r="68" fill="${color}" opacity="0.35"/>
      <text x="200" y="180" font-size="64" text-anchor="middle">${icon}</text>
      <text x="200" y="270" font-size="14" fill="#5a4a3a" text-anchor="middle" font-family="system-ui,sans-serif" opacity="0.8">${label}</text>
    </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const Store = {
  init: initCatalog,

  getCategories() {
    return loadDB().categories;
  },

  getCategoryName(id) {
    const c = this.getCategories().find((c) => c.id === id);
    return c ? c.name : id;
  },

  getCategoryIcon(id) {
    return CATEGORY_ICONS[id] || "🌿";
  },

  getProducts({ onlyActive = true } = {}) {
    const db = loadDB();
    return onlyActive ? db.products.filter((p) => p.active) : db.products;
  },

  getProduct(id) {
    return this.getProducts({ onlyActive: false }).find(
      (p) => String(p.id) === String(id)
    );
  },

  getFeatured(limit = 6) {
    const featured = this.getProducts().filter((p) => p.featured);
    if (featured.length) return featured.slice(0, limit);
    // Fallback: primeros con stock
    return this.getProducts()
      .filter((p) => p.stock > 0)
      .slice(0, limit);
  },

  getConfig() {
    const raw = localStorage.getItem(CONFIG_OVERRIDE_KEY);
    let override = {};
    if (raw) {
      try {
        override = JSON.parse(raw);
      } catch (e) {}
    }
    return { ...(typeof SITE_CONFIG !== "undefined" ? SITE_CONFIG : {}), ...override };
  },

  setConfig(partial) {
    const current = this.getConfig();
    const updated = { ...current, ...partial };
    localStorage.setItem(CONFIG_OVERRIDE_KEY, JSON.stringify(updated));
  },

  placeholderImage,

  async resetToCatalog() {
    localStorage.removeItem(DB_KEY);
    _dbCache = null;
    _catalogPromise = null;
    return initCatalog(true);
  },

  exportJSON() {
    return JSON.stringify(loadDB(), null, 2);
  },
};
