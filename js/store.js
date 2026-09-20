/**
 * Store — carga catálogo y config
 */
const Store = (function () {
  let products = [];
  let categories = [];
  let config = typeof SITE_CONFIG !== "undefined" ? SITE_CONFIG : {};

  async function init() {
    try {
      const res = await fetch("./data/catalog.json");
      const data = await res.json();
      products = data.products || [];
      categories = data.categories || [];
    } catch (e) {
      console.warn("No se pudo cargar catalog.json, usando datos vacíos", e);
      products = [];
      categories = [];
    }
  }

  function getConfig() {
    return config;
  }

  function getProducts() {
    return products;
  }

  function getProduct(id) {
    return products.find((p) => p.id === id);
  }

  function getCategories() {
    return categories;
  }

  function getCategoryName(id) {
    const c = categories.find((x) => x.id === id);
    return c ? c.name : id;
  }

  return {
    init,
    getConfig,
    getProducts,
    getProduct,
    getCategories,
    getCategoryName,
  };
})();
