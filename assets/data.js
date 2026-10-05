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
  // 이미지를 같은 이름으로 교체해도 바로 보이도록 버전 번호를 붙임
  const IMG_V = "v=20261005f";
  const withV = list => (list || []).map(s => (s.includes("?") ? s : `${s}?${IMG_V}`));
  products.forEach(p => {
    p.images = withV(p.images);
    p.long = withV(p.long);
    p.variants.forEach(v => { if (v.images) v.images = withV(v.images); });
  });
  PRODUCTS = products;
  SITE = site;
  MATERIALS = site.materials;
  COMMON_INFO = site.info;
  BEST_ITEMS = site.best.filter(b => findProduct(b.id)?.status === "sale");
})();

const findProduct = id => PRODUCTS.find(p => p.id === id);
const variantImages = (p, v) => (v && v.images && v.images.length ? v.images : p.images);
