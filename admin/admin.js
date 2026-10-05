// ─────────────────────────────────────────────────────────────
// 까사바노 관리자
// 사이트 데이터(assets/data/*.json)와 이미지를 GitHub 저장소에 직접 저장합니다.
// 저장하면 GitHub Pages가 1~2분 안에 사이트를 다시 배포합니다.
// ─────────────────────────────────────────────────────────────

const CFG = { owner: "butech-glitch", repo: "casavano", branch: "main" };
const PATHS = { products: "assets/data/products.json", site: "assets/data/site.json" };
const TOKEN_KEY = "casavano_admin_token";

const S = { token: "", products: [], productsSha: "", site: {}, siteSha: "", dirty: false };

// ---------- Utils ----------
const $ = sel => document.querySelector(sel);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const won = n => (n || n === 0 ? `${Number(n).toLocaleString("ko-KR")}원` : "-");
const clone = o => JSON.parse(JSON.stringify(o));
const siteUrl = path => (path.startsWith("http") ? path : `../${path}`);

function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

function toast(msg, isErr) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("err", !!isErr);
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), isErr ? 6000 : 3000);
}
function busy(on, text = "저장 중…") {
  $("#busyText").textContent = text;
  $("#busy").hidden = !on;
}

// ---------- GitHub API ----------
async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${S.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try { msg += " " + (await res.json()).message; } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}
const contentsPath = p => `/repos/${CFG.owner}/${CFG.repo}/contents/${encodeURI(p)}`;

async function readJSON(path) {
  const r = await gh(`${contentsPath(path)}?ref=${CFG.branch}&t=${Date.now()}`);
  return { data: JSON.parse(b64ToUtf8(r.content)), sha: r.sha };
}
async function putFile(path, b64, message, sha) {
  const r = await gh(contentsPath(path), {
    method: "PUT",
    body: JSON.stringify({ message, content: b64, branch: CFG.branch, ...(sha ? { sha } : {}) }),
  });
  return r.content.sha;
}

async function loadData() {
  const [p, s] = await Promise.all([readJSON(PATHS.products), readJSON(PATHS.site)]);
  S.products = p.data; S.productsSha = p.sha;
  S.site = s.data; S.siteSha = s.sha;
}

async function saveProducts(message) {
  try {
    S.productsSha = await putFile(PATHS.products, utf8ToB64(JSON.stringify(S.products, null, 2) + "\n"), message, S.productsSha);
  } catch (e) {
    if (e.status === 409) throw new Error("다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 시도해 주세요.");
    throw e;
  }
}
async function saveSite(message) {
  try {
    S.siteSha = await putFile(PATHS.site, utf8ToB64(JSON.stringify(S.site, null, 2) + "\n"), message, S.siteSha);
  } catch (e) {
    if (e.status === 409) throw new Error("다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 시도해 주세요.");
    throw e;
  }
}

// Resize & upload an image file → returns site-relative path
async function uploadImage(file, folder) {
  const bmp = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, "image/webp", 0.82));
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const path = `assets/img/${folder}/u${Date.now()}${Math.random().toString(36).slice(2, 6)}.webp`;
  await putFile(path, btoa(bin), `관리자: 이미지 업로드 (${folder})`);
  return path;
}

// ---------- Auth ----------
async function login(token) {
  S.token = token.trim();
  const repo = await gh(`/repos/${CFG.owner}/${CFG.repo}`);
  if (!repo.permissions || !repo.permissions.push) throw new Error("이 토큰에는 저장(쓰기) 권한이 없습니다. Contents: Read and write 권한으로 만들어 주세요.");
  try { localStorage.setItem(TOKEN_KEY, S.token); } catch {}
}
function logout() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
  location.hash = "";
  location.reload();
}

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("#loginError").textContent = "";
  busy(true, "확인 중…");
  try {
    await login($("#tokenInput").value);
    await start();
  } catch (err) {
    $("#loginError").textContent = err.status === 401 ? "토큰이 올바르지 않거나 만료되었습니다." : err.message;
  } finally { busy(false); }
});
$("#logoutBtn").addEventListener("click", logout);
$("#menuToggle").addEventListener("click", () => $("#app").classList.toggle("menu-open"));

// ---------- Router ----------
const ROUTES = {
  dashboard: { title: "대시보드", render: renderDashboard },
  products: { title: "상품 관리", render: renderProducts },
  product: { title: "상품 편집", render: renderProductEdit },
  main: { title: "메인 화면", render: renderMain },
  materials: { title: "소재 · 컬러", render: renderMaterials },
  help: { title: "도움말", render: renderHelp },
};

function route() {
  if (S.dirty && !confirm("저장하지 않은 변경사항이 있습니다. 이동할까요?")) {
    history.replaceState(null, "", route._last || "#/dashboard");
    return;
  }
  S.dirty = false;
  const [, name = "dashboard", arg] = location.hash.split("/");
  const r = ROUTES[name] || ROUTES.dashboard;
  route._last = location.hash;
  document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("is-on", a.dataset.nav === (name === "product" ? "products" : name)));
  $("#pageTitle").textContent = r.title;
  $("#topActions").innerHTML = "";
  $("#app").classList.remove("menu-open");
  r.render(arg ? decodeURIComponent(arg) : undefined);
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
window.addEventListener("beforeunload", e => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });
const markDirty = () => { S.dirty = true; };

// ---------- Dashboard ----------
async function renderDashboard() {
  const sale = S.products.filter(p => p.status === "sale").length;
  const hidden = S.products.length - sale;
  $("#view").innerHTML = `
    <div class="stats">
      <div class="stat"><span>판매중 상품</span><b>${sale}</b></div>
      <div class="stat"><span>숨김 상품</span><b>${hidden}</b></div>
      <div class="stat"><span>BEST ITEM</span><b>${S.site.best.length}</b></div>
      <div class="stat"><span>주문</span><b>-</b><span>PG 연동 후 제공</span></div>
    </div>
    <div class="card">
      <h2>바로가기</h2><p class="card-sub">자주 쓰는 작업</p>
      <div class="quick">
        <a href="#/product/new"><b>＋ 상품 등록</b><span class="muted">새 상품을 추가합니다</span></a>
        <a href="#/products"><b>상품 관리</b><span class="muted">가격 · 사진 · 판매 상태 수정</span></a>
        <a href="#/main"><b>메인 화면</b><span class="muted">프로모션 문구 · BEST ITEM 순서</span></a>
      </div>
    </div>
    <div class="card">
      <h2>최근 변경 기록</h2><p class="card-sub">저장 후 사이트 반영까지 1~2분 정도 걸립니다.</p>
      <div class="log" id="log"><div class="muted">불러오는 중…</div></div>
    </div>`;
  try {
    const commits = await gh(`/repos/${CFG.owner}/${CFG.repo}/commits?per_page=8&sha=${CFG.branch}`);
    $("#log").innerHTML = commits.map(c => `
      <div><span>${esc(c.commit.message.split("\n")[0])}</span><span class="muted">${new Date(c.commit.author.date).toLocaleString("ko-KR")}</span></div>`).join("");
  } catch { $("#log").innerHTML = `<div class="muted">기록을 불러오지 못했습니다.</div>`; }
}

// ---------- Product list ----------
function priceRange(p) {
  const prices = p.variants.map(v => v.price).filter(n => n || n === 0);
  if (!prices.length) return "-";
  const min = Math.min(...prices), max = Math.max(...prices);
  return min === max ? won(min) : `${won(min)} ~ ${won(max)}`;
}

function renderProducts() {
  $("#topActions").innerHTML = `<a class="btn btn-primary" href="#/product/new">＋ 상품 등록</a>`;
  $("#view").innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table class="list">
          <thead><tr><th></th><th>상품명</th><th class="hide-m">사이즈</th><th>판매가</th><th>상태</th><th></th></tr></thead>
          <tbody>
            ${S.products.map((p, i) => `
              <tr>
                <td><img class="thumb" src="${esc(siteUrl(p.images[0] || ""))}" alt=""></td>
                <td><a href="#/product/${encodeURIComponent(p.id)}"><b>${esc(p.name)}</b></a><div class="muted" style="font-size:12px;margin-top:2px">${esc(p.id)}</div></td>
                <td class="hide-m">${p.variants.map(v => esc(v.label)).join(", ")}</td>
                <td>${priceRange(p)}</td>
                <td><span class="badge ${p.status === "sale" ? "badge-sale" : "badge-hidden"}">${p.status === "sale" ? "판매중" : "숨김"}</span></td>
                <td><div class="row-actions">
                  <button class="btn btn-sm" data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""} title="위로">↑</button>
                  <button class="btn btn-sm" data-act="toggle" data-i="${i}">${p.status === "sale" ? "숨기기" : "판매하기"}</button>
                  <a class="btn btn-sm" href="#/product/${encodeURIComponent(p.id)}">수정</a>
                </div></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted">순서 변경(↑)은 상품 목록 순서입니다. 메인의 BEST ITEM 순서는 <a class="link" href="#/main">메인 화면</a>에서 바꿉니다.</p>`;

  $("#view").querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", async () => {
    const i = +b.dataset.i;
    const p = S.products[i];
    const before = clone(S.products);
    let msg;
    if (b.dataset.act === "toggle") {
      p.status = p.status === "sale" ? "hidden" : "sale";
      msg = `관리자: ${p.name} ${p.status === "sale" ? "판매 시작" : "숨김"}`;
    } else {
      [S.products[i - 1], S.products[i]] = [S.products[i], S.products[i - 1]];
      msg = "관리자: 상품 순서 변경";
    }
    busy(true);
    try { await saveProducts(msg); toast("저장했습니다. 1~2분 후 사이트에 반영됩니다."); }
    catch (e) { S.products = before; toast(e.message, true); }
    finally { busy(false); renderProducts(); }
  }));
}

// ---------- Image manager component ----------
function imageManager(el, list, folder, opts = {}) {
  const draw = () => {
    el.innerHTML = `<div class="imgs">
      ${list.map((src, i) => `
        <div class="img-item ${opts.tall ? "tall" : ""}">
          <span class="img-no">${i === 0 && opts.mainLabel ? opts.mainLabel : i + 1}</span>
          <img src="${esc(siteUrl(src))}" alt="" loading="lazy">
          <div class="img-tools">
            <button type="button" data-a="left" data-i="${i}" title="앞으로">←</button>
            <button type="button" data-a="right" data-i="${i}" title="뒤로">→</button>
            <button type="button" class="del" data-a="del" data-i="${i}" title="삭제">✕</button>
          </div>
        </div>`).join("")}
      <label class="img-add">＋ 사진 추가<br><span style="font-size:11px">여러 장 선택 가능</span><input type="file" accept="image/*" multiple></label>
    </div>`;
    el.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      if (b.dataset.a === "del") list.splice(i, 1);
      if (b.dataset.a === "left" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (b.dataset.a === "right" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      markDirty(); draw(); opts.onChange?.();
    }));
    el.querySelector("input[type=file]").addEventListener("change", async e => {
      const files = [...e.target.files];
      if (!files.length) return;
      try {
        for (let n = 0; n < files.length; n++) {
          busy(true, `사진 업로드 중… (${n + 1}/${files.length})`);
          list.push(await uploadImage(files[n], folder));
        }
        markDirty();
        toast("사진을 올렸습니다. 아래 저장 버튼을 눌러야 상품에 반영됩니다.");
      } catch (err) { toast("사진 업로드 실패: " + err.message, true); }
      finally { busy(false); draw(); opts.onChange?.(); }
    });
  };
  draw();
}

// ---------- Product edit ----------
function renderProductEdit(id) {
  const isNew = id === "new";
  const original = isNew ? null : S.products.find(p => p.id === id);
  if (!isNew && !original) { $("#view").innerHTML = `<div class="card">상품을 찾을 수 없습니다.</div>`; return; }
  const p = isNew
    ? { id: "", status: "hidden", name: "", tagline: "", description: "", baseMaterial: "fabric", features: [], images: [], long: [], defaultVariant: "v1",
        variants: [{ key: "v1", label: "기본", price: 0, listPrice: null, size: "", set: "" }] }
    : clone(original);
  $("#pageTitle").textContent = isNew ? "상품 등록" : "상품 편집";
  const mats = S.site.materials;

  $("#view").innerHTML = `
    <form id="pform">
      <div class="card">
        <h2>기본 정보</h2><p class="card-sub">상품 목록과 상세페이지 상단에 보이는 정보입니다.</p>
        <div class="form-grid">
          <label>판매 상태</label>
          <div class="field"><div class="seg">
            <label><input type="radio" name="status" value="sale" ${p.status === "sale" ? "checked" : ""}><span>판매중</span></label>
            <label><input type="radio" name="status" value="hidden" ${p.status !== "sale" ? "checked" : ""}><span>숨김</span></label>
          </div><p class="help">숨김 상품은 사이트 목록에 보이지 않습니다.</p></div>

          ${isNew ? `<label>상품 주소(ID)</label>
          <div class="field"><input type="text" name="id" placeholder="예: rond" pattern="[a-z0-9]+(-[a-z0-9]+)*" required>
          <p class="help">영문 소문자·숫자·하이픈만 사용. 상품 주소가 됩니다 (product.html?id=<b>rond</b>). 나중에 바꿀 수 없습니다.</p></div>` : ""}

          <label>상품명</label>
          <div class="field"><input type="text" name="name" value="${esc(p.name)}" placeholder="[이름] 상품 설명" required></div>

          <label>한 줄 소개</label>
          <div class="field"><input type="text" name="tagline" value="${esc(p.tagline)}"></div>

          <label>상세 설명</label>
          <div class="field"><textarea name="description" rows="4">${esc(p.description)}</textarea></div>

          <label>특징</label>
          <div class="field"><textarea name="features" rows="3" placeholder="한 줄에 하나씩">${esc(p.features.join("\n"))}</textarea>
          <p class="help">한 줄에 하나씩 입력하면 상세페이지에 태그로 보입니다.</p></div>

          <label>기본 소재</label>
          <div class="field"><div class="seg">
            ${Object.entries(mats).map(([k, m]) => `<label><input type="radio" name="baseMaterial" value="${k}" ${p.baseMaterial === k ? "checked" : ""}><span>${esc(m.label)}</span></label>`).join("")}
          </div><p class="help">상세페이지에서 처음 선택되어 있는 소재입니다.</p></div>
        </div>
      </div>

      <div class="card">
        <h2>상품 사진</h2><p class="card-sub">첫 번째 사진이 대표 사진입니다. 두 번째 사진은 목록에서 마우스를 올렸을 때 보입니다.</p>
        <div id="imgMgr"></div>
      </div>

      <div class="card">
        <h2>사이즈 · 가격</h2>
        <p class="card-sub">정가를 입력하면 사이트에 <s>정가</s> 할인율과 판매가가 함께 표시됩니다. 비워두면 판매가만 표시됩니다.</p>
        <div class="variant-head"><span>기본</span><span>사이즈 이름</span><span>판매가(원)</span><span>정가(원)</span><span>크기</span><span>구성품</span><span></span></div>
        <div class="variants" id="variants"></div>
        <button type="button" class="btn btn-sm" id="addVariant" style="margin-top:10px">＋ 사이즈 추가</button>
      </div>

      <div class="card">
        <h2>상세 이미지</h2><p class="card-sub">상세정보 탭에 위에서부터 순서대로 보이는 긴 이미지입니다. 없으면 상품 사진이 대신 보입니다.</p>
        <div id="longMgr"></div>
      </div>

      ${isNew ? "" : `<div class="card"><h2>상품 삭제</h2><p class="card-sub">삭제하면 되돌릴 수 없습니다. 잠시 내리려면 '숨김'을 사용하세요.</p>
        <button type="button" class="btn btn-danger" id="delProduct">이 상품 삭제</button></div>`}

      <div class="savebar">
        <a class="btn" href="#/products">목록</a>
        ${isNew ? "" : `<a class="btn" href="../product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">사이트에서 보기 ↗</a>`}
        <button class="btn btn-primary" type="submit">저장</button>
      </div>
    </form>`;

  const folder = () => `products/${p.id || "uploads"}`;
  imageManager($("#imgMgr"), p.images, folder(), { mainLabel: "대표", onChange: drawVariants });
  imageManager($("#longMgr"), p.long, `long`, { tall: true });

  function drawVariants() {
    $("#variants").innerHTML = p.variants.map((v, i) => `
      <div class="variant" data-i="${i}">
        <input type="radio" name="defaultVariant" value="${esc(v.key)}" ${p.defaultVariant === v.key ? "checked" : ""} title="처음 선택되는 사이즈">
        <input class="inp" data-f="label" value="${esc(v.label)}" placeholder="예: 3인">
        <input class="inp" data-f="price" type="number" min="0" step="1000" value="${v.price ?? ""}" placeholder="판매가">
        <input class="inp" data-f="listPrice" type="number" min="0" step="1000" value="${v.listPrice ?? ""}" placeholder="정가 (선택)">
        <input class="inp" data-f="size" value="${esc(v.size)}" placeholder="W2380 × D1050 × H730">
        <input class="inp" data-f="set" value="${esc(v.set)}" placeholder="쿠션 1개">
        <button type="button" class="del" data-del="${i}" title="삭제" ${p.variants.length === 1 ? "disabled" : ""}>✕</button>
        <div class="variant-imgs">이 사이즈 전용 사진:
          <select data-vimg="${i}">
            <option value="">상품 사진 사용</option>
            ${p.images.map((src, n) => `<option value="${n}" ${v.images && v.images[0] === src ? "selected" : ""}>${n + 1}번 사진부터</option>`).join("")}
          </select>
          ${v.images && v.images.length ? `<span>(${v.images.length}장 지정됨)</span>` : ""}
        </div>
      </div>`).join("");
    $("#variants").querySelectorAll(".variant").forEach(row => {
      const v = p.variants[+row.dataset.i];
      row.querySelectorAll("[data-f]").forEach(inp => inp.addEventListener("input", () => {
        const f = inp.dataset.f;
        v[f] = f === "price" || f === "listPrice" ? (inp.value === "" ? (f === "listPrice" ? null : 0) : Number(inp.value)) : inp.value;
        markDirty();
      }));
    });
    $("#variants").querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      const [gone] = p.variants.splice(+b.dataset.del, 1);
      if (p.defaultVariant === gone.key) p.defaultVariant = p.variants[0].key;
      markDirty(); drawVariants();
    }));
    $("#variants").querySelectorAll("[data-vimg]").forEach(sel => sel.addEventListener("change", () => {
      const v = p.variants[+sel.dataset.vimg];
      if (sel.value === "") delete v.images;
      else v.images = p.images.slice(+sel.value);
      markDirty(); drawVariants();
    }));
    $("#variants").querySelectorAll("input[name=defaultVariant]").forEach(r => r.addEventListener("change", () => { p.defaultVariant = r.value; markDirty(); }));
  }
  drawVariants();

  $("#addVariant").addEventListener("click", () => {
    let n = p.variants.length + 1;
    while (p.variants.some(v => v.key === `v${n}`)) n++;
    p.variants.push({ key: `v${n}`, label: "", price: 0, listPrice: null, size: "", set: "" });
    markDirty(); drawVariants();
  });

  const form = $("#pform");
  form.addEventListener("input", markDirty);

  $("#delProduct")?.addEventListener("click", async () => {
    if (!confirm(`'${p.name}' 상품을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const beforeP = clone(S.products), beforeS = clone(S.site);
    S.products = S.products.filter(x => x.id !== p.id);
    const hadBest = S.site.best.some(b => b.id === p.id);
    S.site.best = S.site.best.filter(b => b.id !== p.id);
    busy(true);
    try {
      await saveProducts(`관리자: ${p.name} 삭제`);
      if (hadBest) await saveSite("관리자: 삭제된 상품을 BEST ITEM에서 제거");
      S.dirty = false;
      toast("삭제했습니다.");
      location.hash = "#/products";
    } catch (e) { S.products = beforeP; S.site = beforeS; toast(e.message, true); }
    finally { busy(false); }
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(form);
    if (isNew) {
      const newId = String(fd.get("id")).trim();
      if (!/^[a-z0-9-]+$/.test(newId)) return toast("상품 주소(ID)는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.", true);
      if (S.products.some(x => x.id === newId)) return toast("이미 있는 상품 주소(ID)입니다.", true);
      p.id = newId;
    }
    p.status = fd.get("status");
    p.name = String(fd.get("name")).trim();
    p.tagline = String(fd.get("tagline")).trim();
    p.description = String(fd.get("description")).trim();
    p.features = String(fd.get("features")).split("\n").map(s => s.trim()).filter(Boolean);
    p.baseMaterial = fd.get("baseMaterial");
    if (!p.images.length) return toast("상품 사진을 1장 이상 올려 주세요.", true);
    if (p.variants.some(v => !v.label.trim())) return toast("사이즈 이름을 모두 입력해 주세요.", true);
    if (p.variants.some(v => !(v.price > 0))) return toast("판매가를 모두 입력해 주세요.", true);
    if (p.variants.some(v => v.listPrice && v.listPrice <= v.price)) return toast("정가는 판매가보다 커야 합니다. 할인이 없으면 정가를 비워 두세요.", true);

    const before = clone(S.products);
    if (isNew) S.products.push(p);
    else S.products[S.products.findIndex(x => x.id === p.id)] = p;
    busy(true);
    try {
      await saveProducts(`관리자: ${p.name} ${isNew ? "등록" : "수정"}`);
      S.dirty = false;
      toast("저장했습니다. 1~2분 후 사이트에 반영됩니다.");
      if (isNew) location.hash = `#/product/${encodeURIComponent(p.id)}`;
    } catch (err) { S.products = before; toast(err.message, true); }
    finally { busy(false); }
  });
}

// ---------- Main screen (promo + BEST) ----------
function renderMain() {
  const site = clone(S.site);
  const sale = S.products.filter(p => p.status === "sale");
  $("#view").innerHTML = `
    <form id="mform">
      <div class="card">
        <h2>프로모션 띠 배너</h2><p class="card-sub">메인 화면 초록색 프로모션 영역의 문구입니다.</p>
        <div class="form-grid">
          <label>제목</label><div class="field"><input type="text" name="title" value="${esc(site.promo.title)}"></div>
          <label>영문 부제</label><div class="field"><input type="text" name="en" value="${esc(site.promo.en)}"></div>
          <label>설명</label><div class="field"><input type="text" name="ko" value="${esc(site.promo.ko)}"></div>
          <label>할인 문구</label><div class="field"><input type="text" name="off" value="${esc(site.promo.off)}">
          <p class="help">실제 할인율과 맞게 적어 주세요. (예: 정가 대비 최대 할인율)</p></div>
        </div>
      </div>

      <div class="card">
        <h2>공통 안내</h2><p class="card-sub">모든 상품 상세페이지에 보이는 안내입니다.</p>
        <div class="form-grid">
          <label>제작기간</label><div class="field"><input type="text" name="leadTime" value="${esc(site.info.leadTime)}"></div>
          <label>배송/설치</label><div class="field"><input type="text" name="delivery" value="${esc(site.info.delivery)}"></div>
        </div>
      </div>

      <div class="card">
        <h2>BEST ITEM</h2><p class="card-sub">메인 화면 BEST ITEM에 보이는 상품과 순서입니다. 숨김 상품은 자동으로 빠집니다.</p>
        <div id="bestList"></div>
        <button type="button" class="btn btn-sm" id="addBest" style="margin-top:12px">＋ 상품 추가</button>
      </div>

      <div class="savebar"><a class="btn" href="../" target="_blank" rel="noopener">메인 보기 ↗</a><button class="btn btn-primary" type="submit">저장</button></div>
    </form>`;

  const drawBest = () => {
    $("#bestList").innerHTML = site.best.map((b, i) => {
      const p = S.products.find(x => x.id === b.id);
      const v = p && (p.variants.find(x => x.key === b.variant) || p.variants[0]);
      const img = p ? ((v && v.images && v.images[0]) || p.images[0]) : "";
      return `<div class="best-row" data-i="${i}">
        <span class="num">${i + 1}</span>
        <img class="thumb" src="${esc(siteUrl(img || ""))}" alt="">
        <select class="inp" data-b="id">${S.products.map(x => `<option value="${esc(x.id)}" ${x.id === b.id ? "selected" : ""}>${esc(x.name)}${x.status !== "sale" ? " (숨김)" : ""}</option>`).join("")}</select>
        <select class="inp" data-b="variant">${(p ? p.variants : []).map(x => `<option value="${esc(x.key)}" ${v && x.key === v.key ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select>
        <input class="inp" data-b="title" value="${esc(b.title || "")}" placeholder="표시 이름 (비우면 상품명)">
        <div class="row-actions">
          <button type="button" class="btn btn-sm" data-m="up" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn btn-sm" data-m="down" ${i === site.best.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn btn-sm btn-danger" data-m="del">삭제</button>
        </div>
      </div>`;
    }).join("") || `<p class="muted">BEST ITEM이 없습니다.</p>`;
    $("#bestList").querySelectorAll(".best-row").forEach(row => {
      const i = +row.dataset.i, b = site.best[i];
      row.querySelector('[data-b="id"]').addEventListener("change", e => { b.id = e.target.value; b.variant = S.products.find(x => x.id === b.id).variants[0].key; markDirty(); drawBest(); });
      row.querySelector('[data-b="variant"]').addEventListener("change", e => { b.variant = e.target.value; markDirty(); drawBest(); });
      row.querySelector('[data-b="title"]').addEventListener("input", e => { if (e.target.value.trim()) b.title = e.target.value; else delete b.title; markDirty(); });
      row.querySelectorAll("[data-m]").forEach(btn => btn.addEventListener("click", () => {
        if (btn.dataset.m === "del") site.best.splice(i, 1);
        if (btn.dataset.m === "up") [site.best[i - 1], site.best[i]] = [site.best[i], site.best[i - 1]];
        if (btn.dataset.m === "down") [site.best[i + 1], site.best[i]] = [site.best[i], site.best[i + 1]];
        markDirty(); drawBest();
      }));
    });
  };
  drawBest();

  $("#addBest").addEventListener("click", () => {
    const p = sale[0] || S.products[0];
    if (!p) return;
    site.best.push({ id: p.id, variant: p.variants[0].key, hover: 1 });
    markDirty(); drawBest();
  });

  const form = $("#mform");
  form.addEventListener("input", markDirty);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(form);
    ["title", "en", "ko", "off"].forEach(k => (site.promo[k] = String(fd.get(k)).trim()));
    site.info.leadTime = String(fd.get("leadTime")).trim();
    site.info.delivery = String(fd.get("delivery")).trim();
    const before = S.site;
    S.site = site;
    busy(true);
    try { await saveSite("관리자: 메인 화면 수정"); S.dirty = false; toast("저장했습니다. 1~2분 후 사이트에 반영됩니다."); }
    catch (err) { S.site = before; toast(err.message, true); }
    finally { busy(false); }
  });
}

// ---------- Materials ----------
function renderMaterials() {
  const mats = clone(S.site.materials);
  $("#view").innerHTML = `
    <form id="matform">
      <div class="notice">컬러 원은 화면에 보이는 색입니다. 실제 원단 색과 최대한 비슷하게 골라 주세요.</div>
      ${Object.entries(mats).map(([k, m]) => `
        <div class="card" data-mat="${k}">
          <h2>${esc(m.label)}</h2>
          <div class="form-grid" style="margin:14px 0 18px">
            <label>설명</label><div class="field"><input type="text" data-desc value="${esc(m.desc)}"></div>
          </div>
          <div class="swatches-edit"></div>
          <button type="button" class="btn btn-sm" data-add>＋ 컬러 추가</button>
        </div>`).join("")}
      <div class="savebar"><button class="btn btn-primary" type="submit">저장</button></div>
    </form>`;

  document.querySelectorAll("[data-mat]").forEach(card => {
    const m = mats[card.dataset.mat];
    const box = card.querySelector(".swatches-edit");
    const draw = () => {
      box.innerHTML = m.colors.map((c, i) => `
        <div class="swatch-row" data-i="${i}">
          <input type="color" data-c="hex" value="${esc(c.hex)}">
          <input class="inp" data-c="name" value="${esc(c.name)}" placeholder="한글 이름">
          <input class="inp" data-c="en" value="${esc(c.en)}" placeholder="영문 이름">
          <input class="inp" data-c="hex" value="${esc(c.hex)}" placeholder="#000000">
          <button type="button" class="btn btn-sm btn-danger" data-x>✕</button>
        </div>`).join("");
      box.querySelectorAll(".swatch-row").forEach(row => {
        const c = m.colors[+row.dataset.i];
        row.querySelectorAll("[data-c]").forEach(inp => inp.addEventListener("input", () => {
          c[inp.dataset.c] = inp.value;
          if (inp.dataset.c === "hex") row.querySelectorAll('[data-c="hex"]').forEach(o => o !== inp && (o.value = inp.value));
          markDirty();
        }));
        row.querySelector("[data-x]").addEventListener("click", () => {
          if (m.colors.length === 1) return toast("컬러는 1개 이상 있어야 합니다.", true);
          m.colors.splice(+row.dataset.i, 1); markDirty(); draw();
        });
      });
    };
    draw();
    card.querySelector("[data-desc]").addEventListener("input", e => { m.desc = e.target.value; markDirty(); });
    card.querySelector("[data-add]").addEventListener("click", () => { m.colors.push({ name: "", en: "", hex: "#cccccc" }); markDirty(); draw(); });
  });

  $("#matform").addEventListener("submit", async e => {
    e.preventDefault();
    for (const m of Object.values(mats)) {
      if (m.colors.some(c => !c.name.trim())) return toast("컬러 이름을 모두 입력해 주세요.", true);
      if (m.colors.some(c => !/^#[0-9a-fA-F]{6}$/.test(c.hex))) return toast("컬러 코드는 #RRGGBB 형식이어야 합니다.", true);
    }
    const before = S.site;
    S.site = { ...clone(S.site), materials: mats };
    busy(true);
    try { await saveSite("관리자: 소재·컬러 수정"); S.dirty = false; toast("저장했습니다. 1~2분 후 사이트에 반영됩니다."); }
    catch (err) { S.site = before; toast(err.message, true); }
    finally { busy(false); }
  });
}

// ---------- Help ----------
function renderHelp() {
  $("#view").innerHTML = `
    <div class="card help-doc">
      <h3>저장하면 어떻게 되나요?</h3>
      <p>저장 버튼을 누르면 GitHub 저장소(<code>${CFG.owner}/${CFG.repo}</code>)에 바로 기록되고, 1~2분 뒤 사이트에 자동 반영됩니다. 반영 후에도 예전 화면이 보이면 새로고침해 주세요.</p>
      <h3>상품 등록 순서</h3>
      <ol>
        <li>상품 관리 → <b>＋ 상품 등록</b></li>
        <li>상품 주소(ID), 상품명, 소개 입력</li>
        <li>상품 사진 올리기 (첫 장이 대표 사진)</li>
        <li>사이즈별 판매가 입력 (할인 중이면 정가도 입력)</li>
        <li>판매 상태를 <b>판매중</b>으로 하고 저장</li>
        <li>메인에 보이게 하려면 메인 화면 → BEST ITEM에 추가</li>
      </ol>
      <h3>상품을 잠시 내리고 싶을 때</h3>
      <p>삭제 대신 <b>숨기기</b>를 쓰세요. 언제든 다시 판매하기로 바꿀 수 있습니다.</p>
      <h3>되돌리고 싶을 때</h3>
      <p>모든 저장 기록이 GitHub에 남아 있어 이전 상태로 되돌릴 수 있습니다. 필요하면 Claude에게 "어제 상태로 되돌려줘"처럼 요청하세요.</p>
      <h3>로그인 토큰이 만료되면</h3>
      <p>로그인 화면의 '토큰 만드는 방법'대로 새 토큰을 만들어 다시 로그인하면 됩니다.</p>
      <h3>주문 관리는요?</h3>
      <p>온라인 결제(PG)를 연결할 때 주문 · 고객 관리 화면을 추가할 예정입니다.</p>
    </div>`;
}

// ---------- Start ----------
async function start() {
  busy(true, "불러오는 중…");
  try { await loadData(); }
  finally { busy(false); }
  $("#login").hidden = true;
  $("#app").hidden = false;
  route();
}

(async () => {
  let saved = "";
  try { saved = localStorage.getItem(TOKEN_KEY) || ""; } catch {}
  if (!saved) { $("#login").hidden = false; return; }
  try {
    S.token = saved;
    await start();
  } catch (err) {
    busy(false);
    $("#login").hidden = false;
    $("#loginError").textContent = err.status === 401 ? "로그인이 만료되었습니다. 토큰을 다시 입력해 주세요." : "불러오기 실패: " + err.message;
  }
})();
