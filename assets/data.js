// ─────────────────────────────────────────────────────────────
// 까사바노 상품 데이터 — 상품/가격/사이즈는 여기서만 수정하면 됩니다.
//
//  price      : 판매가 (TIME SALE 가격)
//  listPrice  : 정가. 값을 넣으면 정가(취소선) + 할인율 + 판매가가 함께 표시됩니다.
//               null 이면 판매가만 표시됩니다.
//  images     : 해당 사이즈 선택 시 보여줄 사진 (없으면 상품 기본 사진)
// ─────────────────────────────────────────────────────────────

const IMG = "assets/img/products/";
const imgs = (dir, n) => Array.from({ length: n }, (_, i) => `${IMG}${dir}/${i + 1}.webp`);
const longs = list => list.map(f => `assets/img/long/${f}.jpg`);

// 소재 & 컬러 (Tailored Selection)
const MATERIALS = {
  leather: {
    label: "레더 (Leather)",
    desc: "이태리 천연면피 가죽 — 시간이 지날수록 깊어지는 고급스러움",
    colors: [
      { name: "화이트", en: "White", hex: "#ebe4d6" },
      { name: "버본", en: "Bourbon", hex: "#b8682c" },
      { name: "오키", en: "Oky", hex: "#9a5a2e" },
      { name: "블랙", en: "Black", hex: "#2c2624" },
    ],
  },
  fabric: {
    label: "패브릭 (Fabric)",
    desc: "프리미엄 패브릭 — 부드럽고 편안한 일상의 안락함",
    colors: [
      { name: "베이지", en: "Beige", hex: "#cfc5b2" },
      { name: "라이트그레이", en: "Light Grey", hex: "#adacaa" },
      { name: "애쉬", en: "Ash", hex: "#4b4c4f" },
      { name: "워터그린", en: "Water Green", hex: "#9db3ae" },
      { name: "페트롤", en: "Petrol", hex: "#21506b" },
      { name: "옐로우", en: "Yellow", hex: "#c99b3d" },
    ],
  },
};

const COMMON_INFO = {
  leadTime: "주문 후 약 2주 (주문 제작)",
  delivery: "배송비 포함 · 설치 포함",
};

const PRODUCTS = [
  {
    id: "premi",
    name: "[프리미] 이태리 천연면피 가죽 모듈소파",
    tagline: "원하는 만큼 연결하고, 마음대로 재배치하는 모듈 소파",
    description:
      "이태리 천연면피 가죽을 사용한 프리미 소파는 모듈형 구조로 공간에 맞게 1인부터 코너형까지 구성할 수 있습니다. " +
      "코팅으로 덮어버린 가죽이 아닌, 살아 숨 쉬는 모공의 내추럴 가죽으로 격이 다른 부드러움을 느껴보세요.",
    baseMaterial: "leather",
    features: ["이태리 천연면피(내추럴) 가죽", "모듈형 구조 · 자유로운 재배치", "가죽/패브릭 소재 선택 가능"],
    images: imgs("premi", 9),
    long: longs(["premi-1-1", "premi-2-1", "premi-3-1", "premi-4-1", "premi-5-1", "premi-6-1"]),
    defaultVariant: "4",
    variants: [
      { key: "1", label: "1인 (고이스)", price: 1100000, listPrice: null, size: "W900 × D1050 × H730", set: "쿠션 없음" },
      { key: "3", label: "3인", price: 3200000, listPrice: null, size: "W2380 × D1050 × H730", set: "쿠션 1개", images: imgs("premi3", 6) },
      { key: "4", label: "4인", price: 4300000, listPrice: null, size: "W3260 × D1050 × H730 (방석 깊이 770)", set: "쿠션 2개" },
      { key: "corner", label: "코너", price: 5500000, listPrice: null, size: "W3130 × D1050 × H730", set: "쿠션 3개", images: [`${IMG}premi-corner/1.webp`] },
    ],
  },
  {
    id: "mare",
    name: "[마레] 다크 패브릭 코너소파",
    tagline: "깊이 있는 다크 톤, 공간을 감싸는 넉넉한 코너 소파",
    description:
      "마레 소파는 깊이 있는 다크 패브릭과 넉넉한 방석으로 온 가족이 함께 머무는 거실을 완성합니다. " +
      "1인부터 코너형까지 공간에 맞는 구성으로 선택하세요.",
    baseMaterial: "fabric",
    features: ["프리미엄 다크 패브릭", "넉넉한 방석 깊이 630", "1인 · 3인 · 4인 · 코너 구성"],
    images: imgs("mare", 4),
    long: longs(["mare-1-1", "mare-1-2", "mare-1-3", "mare-1-4"]),
    defaultVariant: "corner",
    variants: [
      { key: "1", label: "1인 (고이스)", price: 800000, listPrice: null, size: "W950 × D980 × H770 (방석 깊이 630)", set: "쿠션 없음" },
      { key: "3", label: "3인", price: 2000000, listPrice: null, size: "W2250 × D980 × H770 (방석 깊이 630)", set: "쿠션 1개" },
      { key: "4", label: "4인", price: 2800000, listPrice: null, size: "W3200 × D980 × H770 (방석 깊이 630)", set: "쿠션 2개" },
      { key: "corner", label: "코너", price: 3800000, listPrice: null, size: "W3000 × 2100 × D980 × H770 (방석 깊이 630)", set: "쿠션 3개" },
    ],
  },
  {
    id: "nana",
    name: "[나나] 화이트 패브릭 코너소파",
    tagline: "밝은 톤의 방수 패브릭, 허리까지 편안한 코너 소파",
    description:
      "나나 소파는 밝은 화이트 톤의 방수 원단으로 오염 걱정을 덜고, 허리 쿠션으로 등까지 편안하게 받쳐줍니다. " +
      "밝고 넓어 보이는 거실을 원하신다면 나나 소파를 추천드립니다.",
    baseMaterial: "fabric",
    features: ["방수 원단", "허리 쿠션 3 + 쿠션 3", "밝고 화사한 화이트 톤"],
    images: imgs("nana", 6),
    long: [],
    defaultVariant: "corner",
    variants: [
      { key: "corner", label: "코너", price: 3650000, listPrice: null, size: "W3200 × 2200 × D1000 × H950 (방석 깊이 630)", set: "허리 쿠션 3개 + 쿠션 3개" },
    ],
  },
  {
    id: "winne",
    name: "[윈느] 스윙팔걸이 4인용 소파",
    tagline: "팔걸이를 움직여 등받이로, 자유롭게 바뀌는 스윙 소파",
    description:
      "윈느 소파는 스윙 팔걸이를 조절해 앉는 깊이와 자세를 자유롭게 바꿀 수 있는 모던 소파입니다. " +
      "방석 깊이 600~870까지, 앉고 기대고 눕는 모든 순간에 맞춰집니다.",
    baseMaterial: "fabric",
    features: ["스윙 팔걸이 각도 조절", "방석 깊이 600~870", "모던 디자인"],
    images: imgs("winne", 4),
    long: [],
    defaultVariant: "4",
    variants: [
      { key: "4", label: "4인", price: 3830000, listPrice: null, size: "W3200 × D1150 × H950 (방석 깊이 600~870)", set: "기본 구성" },
    ],
  },
  {
    id: "green",
    name: "[프리미] 모듈소파 코너형",
    tagline: "원하는 만큼 연결하고, 마음대로 재배치하세요",
    description:
      "프리미 소파는 모듈형으로 형태와 색상을 고르고 제작 가능한 모듈 소파입니다. " +
      "코너 모듈을 더해 원하는 형태의 소파를 완성하세요.",
    baseMaterial: "leather",
    features: ["모듈형 코너 유닛", "형태 · 색상 선택 제작", "이태리 천연가죽"],
    images: imgs("green", 8),
    long: longs(["green-1-1", "green-1-2", "green-1-3", "green-1-4", "green-1-5"]),
    defaultVariant: "corner",
    variants: [
      { key: "corner", label: "코너 모듈", price: 1500000, listPrice: null, size: "상세 이미지 참고", set: "코너 모듈 1개" },
    ],
  },
];

// 메인 BEST ITEM 목록 (상품 id + 기본 선택 사이즈)
const BEST_ITEMS = [
  { id: "mare", variant: "corner", hover: 1 },
  { id: "premi", variant: "4", hover: 1 },
  { id: "premi", variant: "3", hover: 1, title: "[프리미] 이태리 천연면피 가죽 3인 소파" },
  { id: "nana", variant: "corner", hover: 2 },
  { id: "winne", variant: "4", hover: 1 },
  { id: "green", variant: "corner", hover: 1 },
];

const findProduct = id => PRODUCTS.find(p => p.id === id);
const variantImages = (p, v) => (v && v.images) || p.images;
