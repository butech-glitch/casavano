// ─────────────────────────────────────────────────────────────
// 까사바노 상품 · 사이트 데이터 로더
// 데이터는 assets/data/products.json, assets/data/site.json 에 있으며
// 관리자 페이지(/admin)에서 수정합니다.
// ─────────────────────────────────────────────────────────────

let PRODUCTS = [];
let SITE = {};
let MATERIALS = {};
let COMMON_INFO = {};
let BEST_ITEMS = [];

const DATA_READY = (async () => {
  const get = path => fetch(path, { cache: "no-cache" }).then(r => r.json());
  const [products, site] = await Promise.all([get("assets/data/products.json"), get("assets/data/site.json")]);
  PRODUCTS = products;
  SITE = site;
  MATERIALS = site.materials;
  COMMON_INFO = site.info;
  BEST_ITEMS = site.best.filter(b => findProduct(b.id)?.status === "sale");
})();

const findProduct = id => PRODUCTS.find(p => p.id === id);
const variantImages = (p, v) => (v && v.images && v.images.length ? v.images : p.images);
