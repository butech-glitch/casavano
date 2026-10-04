// Product detail page — product.html?id=premi&v=4
const params = new URLSearchParams(location.search);
const product = findProduct(params.get("id")) || PRODUCTS[0];
const state = {
  variant: product.variants.find(v => v.key === params.get("v")) || product.variants.find(v => v.key === product.defaultVariant) || product.variants[0],
  material: product.baseMaterial,
  color: MATERIALS[product.baseMaterial].colors[0].name,
  qty: 1,
};

const $ = id => document.getElementById(id);
document.title = `${product.name} : casavano 까사바노`;
$("pdCrumb").textContent = product.name;
$("pdName").textContent = product.name;
$("pdTagline").textContent = product.tagline;
$("pdLead").textContent = COMMON_INFO.leadTime;
$("pdDelivery").textContent = COMMON_INFO.delivery;
$("pdStoryTitle").textContent = product.tagline;
$("pdDesc").textContent = product.description;
$("pdFeatures").innerHTML = product.features.map(f => `<li>${f}</li>`).join("");

// ---------- Gallery ----------
function renderGallery() {
  const pics = variantImages(product, state.variant);
  const show = src => {
    $("pdMain").src = src;
    $("pdMain").alt = product.name;
    $("pdThumbs").querySelectorAll("button").forEach(b => b.classList.toggle("is-on", b.dataset.src === src));
  };
  $("pdThumbs").innerHTML = pics.map(src => `<li><button type="button" data-src="${src}"><img src="${src}" alt="" loading="lazy"></button></li>`).join("");
  $("pdThumbs").querySelectorAll("button").forEach(b => b.addEventListener("click", () => show(b.dataset.src)));
  show(pics[0]);
}

// ---------- Options ----------
function chips(el, items, isOn, onPick) {
  el.innerHTML = items.map((it, i) => `<button type="button" class="chip${isOn(it) ? " is-on" : ""}" data-i="${i}">${it.label}</button>`).join("");
  el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => onPick(items[b.dataset.i])));
}

function renderOptions() {
  chips($("optSize"), product.variants, v => v === state.variant, v => {
    state.variant = v;
    history.replaceState(null, "", `?id=${product.id}&v=${v.key}`);
    renderGallery();
    render();
  });
  $("optSizeNote").textContent = `${state.variant.size} · ${state.variant.set}`;

  const mats = Object.entries(MATERIALS).map(([key, m]) => ({ key, label: m.label }));
  chips($("optMaterial"), mats, m => m.key === state.material, m => {
    state.material = m.key;
    state.color = MATERIALS[m.key].colors[0].name;
    render();
  });
  $("optMaterialNote").textContent = MATERIALS[state.material].desc;

  const colors = MATERIALS[state.material].colors;
  $("optColor").innerHTML = colors.map(c => `
    <button type="button" class="swatch${c.name === state.color ? " is-on" : ""}" data-name="${c.name}" title="${c.name} (${c.en})" aria-label="${c.name}">
      <span style="background:${c.hex}"></span>
    </button>`).join("");
  $("optColor").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { state.color = b.dataset.name; render(); }));
  const c = colors.find(x => x.name === state.color);
  $("optColorName").textContent = `: ${c.name} (${c.en})`;
}

function render() {
  renderOptions();
  $("pdPrice").innerHTML = priceHTML(state.variant, "price--lg");
  $("qty").value = state.qty;
  $("pdTotal").textContent = won(state.variant.price * state.qty);
}

// ---------- Quantity ----------
const setQty = n => { state.qty = Math.max(1, Math.min(99, n || 1)); render(); };
$("qtyMinus").addEventListener("click", () => setQty(state.qty - 1));
$("qtyPlus").addEventListener("click", () => setQty(state.qty + 1));
$("qty").addEventListener("change", e => setQty(parseInt(e.target.value, 10)));

// ---------- Cart / buy ----------
const currentItem = () => ({
  id: product.id,
  name: product.name,
  variant: state.variant.key,
  variantLabel: state.variant.label,
  material: state.material,
  materialLabel: MATERIALS[state.material].label.split(" ")[0],
  color: state.color,
  price: state.variant.price,
  qty: state.qty,
  image: variantImages(product, state.variant)[0],
});

$("addCart").addEventListener("click", () => {
  Cart.add(currentItem());
  toast(`장바구니에 담았습니다. <a href="cart.html">장바구니 보기 →</a>`);
});
$("buyNow").addEventListener("click", () => checkout([currentItem()]));

// ---------- Spec table & long images ----------
$("specBody").innerHTML = product.variants.map(v => `
  <tr><td>${v.label}</td><td>${v.size}</td><td>${v.set}</td><td>${priceHTML(v)}</td></tr>`).join("");

$("pdLong").innerHTML = product.long.length
  ? product.long.map(src => `<img src="${src}" alt="" loading="lazy">`).join("")
  : product.images.slice(1).map(src => `<img class="wide-pic" src="${src}" alt="" loading="lazy">`).join("");

// ---------- Sticky tabs ----------
const tabs = [...document.querySelectorAll("#pdTabs a")];
const tabObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) tabs.forEach(t => t.classList.toggle("is-on", t.getAttribute("href") === `#${e.target.id}`));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll(".pd-section").forEach(s => tabObserver.observe(s));

renderGallery();
render();
