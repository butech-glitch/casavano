// Product data — edit here to update the BEST ITEM list.
const SHOP = "https://casavano.kr/shop_view/?idx=";
const products = [
  { idx: 12, name: "[마레] 다크 패브릭 코너소파", price: 3800000, img: "p-8bd98109c6965.webp", hover: "p-bd6322ef8e26b.webp" },
  { idx: 4, name: "[프리미]이태리 내추럴 가죽 모듈소파(4인용)", price: 4300000, img: "p-61019b2ad3f7d.webp", hover: "p-f84748a467466.webp" },
  { idx: 13, name: "[나나] 화이트 패브릭 코너소파", price: 3650000, img: "p-f08fefdedc044.webp" },
  { idx: 16, name: "[윈느] 스윙팔걸이 4인용 소파", price: 3830000, img: "p-c9508337df547.webp" },
  { idx: 15, name: "[프리미] 모듈소파 코너형", price: 1500000, img: "p-52682b58c9874.webp", hover: "p-c79fc82434f71.webp" },
];

const list = document.getElementById("products");
list.innerHTML = products.map(p => `
  <li class="product reveal">
    <a href="${SHOP}${p.idx}">
      <div class="thumb">
        <img src="assets/img/${p.img}" alt="${p.name}" loading="lazy">
        ${p.hover ? `<img class="hover" src="assets/img/${p.hover}" alt="" loading="lazy">` : ""}
      </div>
      <p class="p-name">${p.name}</p>
      <p class="p-price">${p.price.toLocaleString("ko-KR")}원</p>
      <span class="p-badge">TIME SALE</span>
    </a>
  </li>`).join("");

// Header background on scroll
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Side drawer
const setDrawer = open => {
  document.body.classList.toggle("drawer-open", open);
  document.getElementById("drawer").setAttribute("aria-hidden", String(!open));
};
document.getElementById("menuBtn").addEventListener("click", () => setDrawer(true));
document.getElementById("drawerClose").addEventListener("click", () => setDrawer(false));
document.getElementById("drawerDim").addEventListener("click", () => setDrawer(false));
document.querySelectorAll(".drawer a").forEach(a => a.addEventListener("click", () => setDrawer(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setDrawer(false); });

// Fade-in on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
