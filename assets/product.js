// Product detail page — product.html?id=premi&v=4
DATA_READY.then(() => {

const params = new URLSearchParams(location.search);
const product = findProduct(params.get("id")) || PRODUCTS[0];
const state = {
  variant: product.variants.find(v => v.key === params.get("v")) || product.variants.find(v => v.key === product.defaultVariant) || product.variants[0],
  material: product.baseMaterial,
  color: MATERIALS[product.baseMaterial].colors[0].name,
  qty: 1,
};

// 모듈 소파: 같은 세트의 모듈(코너·고이스 등)을 개수별로 골라 구성
const moduleSet = (SITE.moduleSets || []).find(m => m.items.includes(product.id));
const modules = moduleSet ? moduleSet.items.map(findProduct).filter(p => p && p.status === "sale") : [];
const modVariant = p => p.variants.find(v => v.key === p.defaultVariant) || p.variants[0];
// 판매중인 모듈만으로 만들 수 있는 빠른 선택만 보여줌 (예: 스툴이 숨김이면 '4인용 + 스툴' 숨김)
const presets = moduleSet ? (moduleSet.presets || []).filter(pr =>
  Object.entries(pr.qty).every(([id, n]) => !n || modules.some(m => m.id === id))) : [];
const applyPreset = pr => modules.forEach(m => (state.mods[m.id] = pr.qty[m.id] || 0));
if (moduleSet) {
  state.mods = Object.fromEntries(modules.map(m => [m.id, m.id === product.id ? 1 : 0]));
  const pick = presets.find(pr => pr.label === params.get("preset"));
  if (pick) applyPreset(pick);
}

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
    $("pdMain").onload = () => fillMargins($("pdMain"));
    $("pdMain").src = src;
    $("pdMain").alt = product.name;
    $("pdThumbs").querySelectorAll("button").forEach(b => b.classList.toggle("is-on", b.dataset.src === src));
  };
  $("pdThumbs").innerHTML = pics.map(src => `<li><button type="button" data-src="${src}"><img src="${src}" alt="" loading="lazy"></button></li>`).join("");
  $("pdThumbs").querySelectorAll("button").forEach(b => b.addEventListener("click", () => show(b.dataset.src)));
  show(pics[0]);
}

// 가로 사진은 원본을 그대로 보여주고 남는 여백을 사진 가장자리 색으로 채움
function fillMargins(img) {
  const box = img.parentElement;
  const w = img.naturalWidth, h = img.naturalHeight;
  img.style.objectFit = ""; img.style.objectPosition = "";
  if (!w || !h || Math.abs(w - h) < 4) { box.style.background = ""; return; }
  // 관리자에서 사진별로 정한 방식(꽉 채우기/전체 보기)이 있으면 우선, 없으면
  // 세로 사진은 가로 100%로 채우고(위아래만 살짝 잘림), 가로 사진은 전체 보기
  const set = (product.fit || {})[img.getAttribute("src").split("?")[0]];
  const cover = set ? set === "cover" : h > w;
  if (cover) { img.style.objectFit = "cover"; img.style.objectPosition = h > w ? "center 60%" : "center"; box.style.background = ""; return; }
  try {
    const c = document.createElement("canvas");
    const k = 64 / Math.max(w, h);
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const avg = (x, y, cw, ch) => {
      const d = ctx.getImageData(x, y, cw, ch).data; let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
    };
    const wide = w > h, t = 2;
    const a = wide ? avg(0, 0, c.width, t) : avg(0, 0, t, c.height);
    const z = wide ? avg(0, c.height - t, c.width, t) : avg(c.width - t, 0, t, c.height);
    box.style.background = `linear-gradient(${wide ? "to bottom" : "to right"}, ${a} 0 50%, ${z} 50% 100%)`;
  } catch { box.style.background = ""; }
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

function renderModules() {
  const box = $("optModules");
  const count = Object.values(state.mods).reduce((a, b) => a + b, 0);
  box.innerHTML = `
    <p class="opt-label">${moduleSet.title} <small>${moduleSet.desc || ""}</small></p>
    ${presets.length ? `<div class="mod-presets">${presets.map((pr, i) => {
      const on = modules.every(m => (pr.qty[m.id] || 0) === state.mods[m.id]);
      return `<button type="button" class="chip${on ? " is-on" : ""}" data-preset="${i}">${pr.label}${pr.desc ? ` <small>${pr.desc}</small>` : ""}</button>`;
    }).join("")}</div>` : ""}
    <ul class="mods">
      ${modules.map(m => { const v = modVariant(m); return `
      <li class="mod${m.id === product.id ? " is-current" : ""}">
        <a class="mod-thumb" href="product.html?id=${m.id}"><img src="${m.images[0]}" alt=""></a>
        <div class="mod-info">
          <a class="mod-name" href="product.html?id=${m.id}">${m.name}</a>
          <span class="mod-meta">${v.size}</span>
          ${priceHTML(v, "mod-price")}
        </div>
        <div class="qty qty--sm">
          <button type="button" data-mod="${m.id}" data-d="-1" aria-label="${m.name} 수량 감소">−</button>
          <input type="number" value="${state.mods[m.id]}" readonly aria-label="${m.name} 수량">
          <button type="button" data-mod="${m.id}" data-d="1" aria-label="${m.name} 수량 증가">+</button>
        </div>
      </li>`; }).join("")}
    </ul>
    <p class="mod-sum">${modules.filter(m => state.mods[m.id]).map(m => `${modVariant(m).label} ${state.mods[m.id]}개`).join(" + ") || "모듈을 선택해 주세요"}${count ? ` · 총 ${count}개 모듈` : ""}</p>`;
  box.querySelectorAll("[data-mod]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.mod;
    state.mods[id] = Math.max(0, Math.min(20, state.mods[id] + Number(b.dataset.d)));
    render();
  }));
  box.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
    applyPreset(presets[b.dataset.preset]);
    render();
  }));
}

const moduleTotal = () => modules.reduce((sum, m) => sum + modVariant(m).price * state.mods[m.id], 0);

function render() {
  renderOptions();
  $("pdPrice").innerHTML = priceHTML(state.variant, "price--lg");
  if (moduleSet) {
    renderModules();
    const total = moduleTotal();
    $("pdTotal").textContent = won(total);
    $("addCart").disabled = $("buyNow").disabled = total === 0;
    return;
  }
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

// 모듈 소파는 선택한 모듈마다 한 줄씩 담음 (소재·컬러는 같게)
const orderItems = () => !moduleSet ? [currentItem()] : modules.filter(m => state.mods[m.id] > 0).map(m => {
  const v = modVariant(m);
  return { ...currentItem(), id: m.id, name: m.name, variant: v.key, variantLabel: v.label, price: v.price, qty: state.mods[m.id], image: m.images[0] };
});

$("addCart").addEventListener("click", () => {
  const items = orderItems();
  if (!items.length) return;
  items.forEach(i => Cart.add(i));
  toast(`장바구니에 담았습니다. <a href="cart.html">장바구니 보기 →</a>`);
});
$("buyNow").addEventListener("click", () => { const items = orderItems(); if (items.length) checkout(items); });

if (moduleSet) {
  $("optModules").hidden = false;
  $("optSizeWrap").hidden = true;
  document.querySelector(".pd-buy .qty").style.display = "none";
}

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
});
