// Shared behaviour for every page: header, drawer, reveal, cart store.

const won = n => `${n.toLocaleString("ko-KR")}원`;
const discountRate = v => (v.listPrice && v.listPrice > v.price ? Math.round((1 - v.price / v.listPrice) * 100) : 0);

// Price markup: 정가(취소선) + 할인율 + 판매가 — listPrice 가 없으면 판매가만
function priceHTML(v, cls = "") {
  const rate = discountRate(v);
  return `<span class="price ${cls}">
    ${rate ? `<span class="price-list">${won(v.listPrice)}</span><span class="price-rate">${rate}%</span>` : ""}
    <span class="price-sale">${won(v.price)}</span>
  </span>`;
}

// ---------- Cart (localStorage) ----------
// PG 연동 시 이 데이터를 그대로 주문 정보로 사용합니다.
const Cart = {
  KEY: "casavano_cart",
  read() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; }
  },
  write(items) {
    try { localStorage.setItem(this.KEY, JSON.stringify(items)); } catch {}
    updateCartBadge();
  },
  add(item) {
    const items = this.read();
    const same = items.find(i => i.id === item.id && i.variant === item.variant && i.material === item.material && i.color === item.color);
    if (same) same.qty += item.qty; else items.push(item);
    this.write(items);
  },
  count() { return this.read().reduce((s, i) => s + i.qty, 0); },
};

function updateCartBadge() {
  const n = Cart.count();
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = n;
    el.hidden = n === 0;
  });
}

// ---------- Checkout hook ----------
// TODO(PG): PG사(예: 토스페이먼츠) 연동 시 이 함수 안에서 결제창을 호출하세요.
// items: [{ id, name, variant, variantLabel, material, color, price, qty }]
function checkout(items) {
  openModal(`
    <h3>온라인 결제 준비 중입니다</h3>
    <p>현재 온라인 결제 시스템을 준비하고 있습니다.<br>아래 연락처로 주문 상담을 도와드리겠습니다.</p>
    <div class="modal-order">${items.map(i => `<div><span>${i.name} · ${i.variantLabel} · ${i.materialLabel} ${i.color} × ${i.qty}</span><b>${won(i.price * i.qty)}</b></div>`).join("")}</div>
    <div class="modal-actions">
      <a class="btn btn-solid" href="tel:01027154486">전화 상담 010.2715.4486</a>
      <a class="btn btn-line" href="mailto:now-story@naver.com?subject=${encodeURIComponent("[까사바노] 주문 상담")}">이메일 문의</a>
    </div>`);
}

// ---------- Modal & toast ----------
function openModal(html) {
  let m = document.getElementById("modal");
  if (!m) {
    m = document.createElement("div");
    m.id = "modal";
    m.className = "modal";
    m.innerHTML = `<div class="modal-dim" data-close></div><div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" data-close aria-label="닫기">&times;</button><div class="modal-body"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", e => { if (e.target.closest("[data-close]")) m.classList.remove("is-open"); });
  }
  m.querySelector(".modal-body").innerHTML = html;
  m.classList.add("is-open");
}

function toast(html) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.innerHTML = html;
  t.classList.add("is-show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("is-show"), 3000);
}

// ---------- Header / drawer / reveal ----------
const header = document.getElementById("header");
if (header && !document.body.classList.contains("solid")) {
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

const setDrawer = open => {
  document.body.classList.toggle("drawer-open", open);
  document.getElementById("drawer")?.setAttribute("aria-hidden", String(!open));
};
document.getElementById("menuBtn")?.addEventListener("click", () => setDrawer(true));
document.getElementById("drawerClose")?.addEventListener("click", () => setDrawer(false));
document.getElementById("drawerDim")?.addEventListener("click", () => setDrawer(false));
document.querySelectorAll(".drawer a").forEach(a => a.addEventListener("click", () => setDrawer(false)));
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  setDrawer(false);
  document.getElementById("modal")?.classList.remove("is-open");
});

const revealer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); revealer.unobserve(e.target); } });
}, { threshold: 0.12 });
const observeReveal = (root = document) => root.querySelectorAll(".reveal:not(.is-in)").forEach(el => revealer.observe(el));

updateCartBadge();
