// Main page: BEST ITEM grid + material swatches
DATA_READY.then(() => {

const list = document.getElementById("products");
list.innerHTML = BEST_ITEMS.map(item => {
  const p = findProduct(item.id);
  const v = p.variants.find(x => x.key === item.variant) || p.variants[0];
  const pics = variantImages(p, v);
  const hover = pics[item.hover];
  return `
  <li class="product reveal">
    <a href="product.html?id=${p.id}&v=${v.key}">
      <div class="thumb">
        <img src="${pics[0]}" alt="${item.title || p.name}" loading="lazy">
        ${hover ? `<img class="hover" src="${hover}" alt="" loading="lazy">` : ""}
      </div>
      <p class="p-name">${item.title || p.name}${p.variants.length > 1 ? ` <small>(${v.label})</small>` : ""}</p>
      ${priceHTML(v, "p-price")}
      <span class="p-badge">TIME SALE</span>
    </a>
  </li>`;
}).join("");

document.querySelectorAll("[data-swatches]").forEach(el => {
  el.innerHTML = MATERIALS[el.dataset.swatches].colors
    .map(c => `<li><span style="background:${c.hex}"></span>${c.name}<small>${c.en}</small></li>`).join("");
});

// Promotion text from site.json
document.querySelectorAll("[data-site]").forEach(el => {
  const v = el.dataset.site.split(".").reduce((o, k) => (o ? o[k] : undefined), SITE);
  if (v) el.textContent = v;
});
// 할인 문구에서 숫자(%)를 뽑아 배지에 크게 표시. 숫자가 없으면 문구만 표시
(() => {
  const off = (SITE.promo && SITE.promo.off) || "";
  const m = off.match(/(\d+)\s*%/);
  const num = document.getElementById("promoNum"), sub = document.getElementById("promoOff");
  if (m) { num.innerHTML = `${m[1]}<small>%</small>`; sub.textContent = "OFF"; }
  else { num.hidden = true; document.querySelector(".promo-badge-top").hidden = true; sub.textContent = off; }
})();

observeReveal();
});
