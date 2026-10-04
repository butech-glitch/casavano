// Cart page
const body = document.getElementById("cartBody");

function renderCart() {
  const items = Cart.read();
  if (!items.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <p>장바구니에 담긴 상품이 없습니다.</p>
        <a class="btn btn-solid" href="index.html#best">쇼핑 계속하기</a>
      </div>`;
    return;
  }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  body.innerHTML = `
    <ul class="cart-list">
      ${items.map((i, idx) => `
      <li class="cart-item">
        <a href="product.html?id=${i.id}&v=${i.variant}" class="cart-thumb"><img src="${i.image}" alt=""></a>
        <div class="cart-info">
          <a href="product.html?id=${i.id}&v=${i.variant}" class="cart-name">${i.name}</a>
          <p class="cart-opt">${i.variantLabel} / ${i.materialLabel} / ${i.color}</p>
          <div class="qty qty--sm">
            <button type="button" data-act="minus" data-idx="${idx}" aria-label="수량 감소">−</button>
            <input type="number" value="${i.qty}" readonly aria-label="수량">
            <button type="button" data-act="plus" data-idx="${idx}" aria-label="수량 증가">+</button>
          </div>
        </div>
        <div class="cart-price">${won(i.price * i.qty)}</div>
        <button class="cart-del" data-act="del" data-idx="${idx}" aria-label="삭제">&times;</button>
      </li>`).join("")}
    </ul>
    <div class="cart-summary">
      <div><span>상품금액</span><span>${won(total)}</span></div>
      <div><span>배송 · 설치비</span><span>무료</span></div>
      <div class="cart-total"><span>결제예정금액</span><b>${won(total)}</b></div>
      <button class="btn btn-solid btn-block" id="checkoutBtn">주문하기</button>
    </div>`;
  document.getElementById("checkoutBtn").addEventListener("click", () => checkout(Cart.read()));
}

body.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const items = Cart.read();
  const i = items[b.dataset.idx];
  if (b.dataset.act === "plus") i.qty = Math.min(99, i.qty + 1);
  if (b.dataset.act === "minus") i.qty = Math.max(1, i.qty - 1);
  if (b.dataset.act === "del") items.splice(b.dataset.idx, 1);
  Cart.write(items);
  renderCart();
});

renderCart();
