# casavano 까사바노

까사바노 공식 홈페이지(casavano.kr) 메인 페이지를 정적 HTML/CSS/JS로 재구성한 사이트입니다.

- `index.html` — 페이지 구조
- `assets/style.css` — 스타일 (색상·폰트는 상단 `:root` 변수에서 수정)
- `assets/script.js` — BEST ITEM 상품 목록(상단 `products` 배열), 헤더/메뉴 동작
- `assets/img/` — 이미지

온라인 결제 기능은 없으며, 상품을 누르면 하단 연락처(전화·이메일)로 이동합니다.

## 호스팅
GitHub Pages로 배포되며 도메인은 https://casavano.kr 입니다 (`CNAME` 파일).
`main` 브랜치에 push하면 자동으로 반영됩니다.

가비아 DNS 설정:
- `@` A 레코드: 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
- `www` CNAME: butech-glitch.github.io.
