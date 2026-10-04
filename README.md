# casavano 까사바노

까사바노 홈페이지 (정적 HTML/CSS/JS, GitHub Pages 배포)

## 페이지
- `index.html` — 메인 (히어로, 프로모션, BEST ITEM, TAILORED SELECTION, ABOUT)
- `product.html?id=상품ID&v=사이즈` — 상품 상세 (사이즈 · 소재 · 컬러 선택, 수량, 장바구니/구매)
- `cart.html` — 장바구니 (브라우저에 저장)

## 수정 방법
- **상품 · 가격 · 사이즈**: `assets/data.js`
  - `price` 판매가, `listPrice` 정가 (넣으면 정가 취소선 + 할인율 자동 표시)
  - 메인 BEST ITEM 순서는 `BEST_ITEMS`
- **소재 · 컬러**: `assets/data.js` 의 `MATERIALS`
- **스타일**: `assets/style.css` (색상 · 폰트는 상단 `:root`)

## 결제 (PG 연동 예정)
현재 구매하기/주문하기는 전화·이메일 상담 안내 창을 띄웁니다.
PG사 연동 시 `assets/common.js` 의 `checkout(items)` 함수에서 결제창을 호출하면 됩니다.

## 도메인
디자인 확정 후 `CNAME` 파일(casavano.kr)을 추가하고 가비아 DNS를 설정합니다.
- `@` A 레코드: 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
- `www` CNAME: butech-glitch.github.io.
