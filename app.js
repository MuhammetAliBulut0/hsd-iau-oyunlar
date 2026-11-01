// Giriş, sekmeler, canlı oyun ve moderatör paneli. Oyunların kodu g-*.js dosyalarında.
import { S, $, D, C, auth, esc, listen, toast, act, byName, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut, setDoc, deleteDoc, serverTimestamp, SUPER_ADMIN_EMAIL } from "./core.js";
import { GAMES } from "./data.js";
import { initBingo } from "./g-bingo.js";
import { initSpeed } from "./g-speed.js";
import { initWW } from "./g-ww.js";
import { initDare } from "./g-dare.js";
import { initTabu } from "./g-tabu.js";
import { initLie } from "./g-lie.js";

let booted = false;

/* ---------- giriş ---------- */
function loginErr(e) {
  if (e.code === "auth/unauthorized-domain") return "Bu site adresi Firebase'de izinli değil. Moderatöre haber ver.";
  if (e.code === "auth/network-request-failed") return "İnternet bağlantısı yok gibi görünüyor.";
  return "Giriş yapılamadı (" + (e.code || e.message) + ").";
}
$("login-btn").onclick = async () => {
  $("login-err").textContent = "";
  const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
  try { await signInWithPopup(auth, p); }
  catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") await signInWithRedirect(auth, p);
    else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") $("login-err").textContent = loginErr(e);
  }
};
getRedirectResult(auth).catch(e => { $("login-err").textContent = loginErr(e); });
$("logout").onclick = () => signOut(auth);

onAuthStateChanged(auth, u => {
  if (!u) {
    if (booted) { location.reload(); return; }
    $("login").hidden = false; $("app").hidden = true; return;
  }
  const email = (u.email || "").toLowerCase();
  S.me = { uid: u.uid, name: u.displayName || email.split("@")[0], email, photo: u.photoURL || "" };
  $("login").hidden = true; $("app").hidden = false;
  $("me-name").textContent = S.me.name;
  if (S.me.photo) { $("me-photo").src = S.me.photo; $("me-photo").hidden = false; }
  setDoc(D("users", S.me.uid), { name: S.me.name, email, photo: S.me.photo, lastSeen: serverTimestamp() }, { merge: true }).catch(e => console.warn(e));
  setDoc(D("people", S.me.uid), { name: S.me.name, photo: S.me.photo }, { merge: true }).catch(e => console.warn(e));
  S.isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase();
  let first = true;
  listen(D("mods", email), snap => {
    const m = S.isSuper || snap.exists();
    if (!first && m !== S.isMod) { location.reload(); return; }
    first = false; S.isMod = m; boot();
  });
});

function boot() {
  if (booted) return; booted = true;
  document.body.classList.toggle("is-mod", S.isMod);
  document.body.classList.toggle("is-super", S.isSuper);
  const r = $("me-role");
  r.textContent = S.isSuper ? "Yönetici" : S.isMod ? "Moderatör" : "Katılımcı";
  r.classList.toggle("mod", S.isMod);
  initTabs(); initLive(); initGuide();
  for (const f of [initBingo, initSpeed, initWW, initDare, initTabu, initLie]) {
    try { f(); } catch (e) { console.error(e); toast("Bir oyun yüklenemedi: " + e.message); }
  }
  if (S.isMod) initMod();
  initCodeBox();
}

/* ---------- sekmeler & canlı oyun ---------- */
const TABS = ["bingo", "speed", "murder", "dare", "who", "lie", "mod"];
let LIVE;
export function showTab(t) {
  if (!TABS.includes(t) || (t === "mod" && !S.isMod)) t = "bingo";
  try { localStorage.setItem("hsd-tab", t); } catch (e) {}
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  TABS.forEach(k => $("g-" + k).hidden = k !== t);
  window.scrollTo({ top: 0 });
}
function initTabs() {
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => showTab(b.dataset.tab));
  let t = "bingo"; try { t = localStorage.getItem("hsd-tab") || t; } catch (e) {}
  showTab(t);
}
function initLive() {
  listen(D("state", "current"), s => {
    const live = s.exists() ? s.data().live || null : null;
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("is-live", b.dataset.tab === live));
    const bn = $("live-banner");
    if (live && GAMES[live]) { bn.hidden = false; bn.innerHTML = `Şimdi oynanıyor: <b>${esc(GAMES[live])}</b>`; }
    else bn.hidden = true;
    if (LIVE !== undefined && live && live !== LIVE && !S.isMod) showTab(live);
    LIVE = live;
    renderLiveChips();
  });
}

/* ---------- moderatör paneli ---------- */
let MODS = [], USERS = [];
function initMod() {
  listen(C("users"), s => { USERS = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderUsers(); });
  listen(C("mods"), s => { MODS = s.docs.map(d => ({ email: d.id, ...d.data() })); renderMods(); renderUsers(); });
  $("mod-live").onclick = e => { const b = e.target.closest("[data-live]"); if (b) act(() => setDoc(D("state", "current"), { live: b.dataset.live || null, at: Date.now() })); };
  const addMod = email => act(async () => {
    email = (email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("mod-note").textContent = "Geçerli bir e-posta adresi yaz."; return; }
    await setDoc(D("mods", email), { addedBy: S.me.email, at: Date.now() });
    $("mod-email").value = ""; $("mod-note").innerHTML = `<b>${esc(email)}</b> artık moderatör. Sayfayı yenilemesi yeterli.`;
  });
  $("mod-add").onclick = () => addMod($("mod-email").value);
  $("mod-bulk").oninput = null;
  $("mod-bulk-add").onclick = () => act(async () => {
    const list = [...new Set(($("mod-bulk").value || "").split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(x => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)))];
    if (!list.length) { $("mod-note").textContent = "Listede geçerli bir e-posta adresi bulunamadı."; return; }
    for (const em of list) await setDoc(D("mods", em), { addedBy: S.me.email, at: Date.now() });
    $("mod-bulk").value = ""; $("mod-note").innerHTML = `<b>${list.length}</b> kişi moderatör yapıldı. Sayfalarını yenilemeleri yeterli.`;
  });
  if (S.isSuper) {
    listen(D("config", "modCode"), s => {
      const c = s.exists() ? s.data() : null;
      $("mod-code-state").innerHTML = c && c.active ? `Kod açık: <b>${esc(c.code)}</b>` : "Şu an açık bir moderatör kodu yok.";
      if (c && !$("mod-code").value) $("mod-code").value = c.code || "";
    });
    $("mod-code-save").onclick = () => act(async () => {
      const code = $("mod-code").value.trim();
      if (code.length < 6) { $("mod-code-state").textContent = "Kod en az 6 karakter olsun, tahmin edilmesi zor olsun."; return; }
      await setDoc(D("config", "modCode"), { code, active: true, at: Date.now() });
      toast("Moderatör kodu açıldı.");
    });
    $("mod-code-off").onclick = () => act(() => setDoc(D("config", "modCode"), { active: false, at: Date.now() }, { merge: true }));
  }
  $("mod-list").onclick = e => { const b = e.target.closest("[data-unmod]"); if (b) act(() => deleteDoc(D("mods", b.dataset.unmod))); };
  $("mod-users").onclick = e => { const b = e.target.closest("[data-mod]"); if (b) addMod(b.dataset.mod); };
  renderLiveChips();
}
function renderLiveChips() {
  if (!S.isMod) return;
  $("mod-live").innerHTML = [["", "Hiçbiri"], ...Object.entries(GAMES)].map(([k, l]) => `<button class="chip" data-live="${k}" aria-pressed="${(LIVE || "") === k}">${esc(l)}</button>`).join("");
}
function renderMods() {
  const sup = `<li><span><b>${esc(SUPER_ADMIN_EMAIL)}</b></span><span class="r">Yönetici</span></li>`;
  $("mod-list").innerHTML = sup + MODS.filter(m => m.email !== SUPER_ADMIN_EMAIL.toLowerCase()).map(m => `<li><span>${esc(m.email)}</span>${S.isSuper ? `<button class="btn ghost small" data-unmod="${esc(m.email)}">Çıkar</button>` : `<span>Moderatör</span>`}</li>`).join("");
}
function renderUsers() {
  $("mod-ucount").textContent = USERS.length;
  const modSet = new Set(MODS.map(m => m.email)); modSet.add(SUPER_ADMIN_EMAIL.toLowerCase());
  $("mod-users").innerHTML = USERS.length ? USERS.map(u => `<li><span><b>${esc(u.name)}</b><br><span class="small">${esc(u.email)}</span></span>${modSet.has(u.email) ? `<span class="r">Moderatör</span>` : S.isSuper ? `<button class="btn ghost small" data-mod="${esc(u.email)}">Moderatör yap</button>` : ""}</li>`).join("") : "<li>Henüz kimse giriş yapmadı.</li>";
}

/* ---------- ilk giriş rehberi ---------- */
const GUIDE_KEY = "hsd-guide-v1";
function guideSteps() {
  const steps = [
    { t: "Hoş geldin!", b: `<p>Burası HSD İAÜ tanışma oyunlarının sitesi. Bütün oyunlar telefonundan oynanır, hiçbir şey indirmene gerek yok.</p><p>Bu kısa rehber 1 dakika sürer.</p>` },
    { t: "Oyunlar üstteki sekmelerde", b: `<p>Sayfanın üstünde altı oyun var: <b>Tech Bingo, Hız Tanışması, Katil Kim?, Cesaret, Tabu</b> ve <b>2 Doğru 1 Yalan</b>.</p><p>Bir sekmeye dokununca o oyunun ekranı açılır.</p>` },
    { t: "Oyunu moderatör başlatır", b: `<p>Oyunlar kendi kendine başlamaz. Moderatörler hangi oyunun oynanacağını seçer ve başlatır.</p><p>O sırada oynanan oyunun sekmesinde <span class="hl">● CANLI</span> yazar ve ekranın otomatik oraya geçer. Sen sadece ekrandaki yönergeleri izle.</p>` },
    { t: "Gizli olanlar sende kalır", b: `<ul><li>Bingo kartın, cesaret görevin, Katil Kim rolün gibi bilgileri <b>sadece sen</b> görürsün.</li><li>Katil Kim rolün kapalı durur, görmek için karta dokun. 10 saniye sonra kendiliğinden kapanır.</li><li>Telefonunu başkalarına gösterme, oyunun tadı kaçar!</li></ul>` },
    { t: "Takılırsan", b: `<ul><li>Her oyunun altında <b>"Nasıl oynanır?"</b> bölümü var.</li><li>Bu rehbere sağ üstteki <b>Rehber</b> düğmesiyle istediğin an dönebilirsin.</li><li>Bir şey çalışmazsa yanındaki HSD ekibinden birine sor.</li></ul>` }
  ];
  if (S.isMod) steps.push({ t: "Moderatör olarak", b: `<ul><li>En alttaki <b>Moderatör Paneli</b>'nden "Canlı oyun" seçerek herkesi bir oyuna yönlendirirsin.</li><li>Her oyunun altındaki kesik çizgili kutu sadece moderatörlere görünür: oyunu başlatma, bitirme ve sıfırlama düğmeleri orada.</li><li>Katil Kim yönetirken sayfayı kapatma, gece bilgileri senin sayfandan iletilir.</li></ul>` });
  return steps;
}
let gIdx = 0;
function renderGuide() {
  const st = guideSteps(), s = st[gIdx];
  $("guide-step").textContent = `${gIdx + 1} / ${st.length}`;
  $("guide-title").textContent = s.t;
  $("guide-body").innerHTML = s.b;
  $("guide-dots").innerHTML = st.map((_, i) => `<i class="${i === gIdx ? "on" : ""}"></i>`).join("");
  $("guide-prev").disabled = gIdx === 0;
  $("guide-next").textContent = gIdx === st.length - 1 ? "Başlayalım" : "İleri";
}
function openGuide() { gIdx = 0; renderGuide(); $("guide").hidden = false; $("guide-next").focus(); }
function closeGuide() { $("guide").hidden = true; try { localStorage.setItem(GUIDE_KEY, "1"); } catch (e) {} }
function initGuide() {
  $("guide-open").onclick = openGuide;
  $("guide-skip").onclick = closeGuide;
  $("guide-prev").onclick = () => { if (gIdx > 0) { gIdx--; renderGuide(); } };
  $("guide-next").onclick = () => { if (gIdx < guideSteps().length - 1) { gIdx++; renderGuide(); } else closeGuide(); };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("guide").hidden) closeGuide(); });
  let seen = false; try { seen = localStorage.getItem(GUIDE_KEY) === "1"; } catch (e) {}
  if (!seen) openGuide();
}

/* ---------- moderatör kodu ile moderatör olma ---------- */
function initCodeBox() {
  if (S.isMod) return;
  $("code-box").hidden = false;
  $("code-send").onclick = async () => {
    const code = $("code-input").value.trim();
    if (!code) { $("code-note").textContent = "Önce kodu yaz."; return; }
    try {
      await setDoc(D("mods", S.me.email), { code, name: S.me.name, via: "code", at: Date.now() });
      $("code-note").innerHTML = "Kod doğru! <b>Moderatör oldun</b>, sayfa yenileniyor…";
    } catch (e) {
      $("code-note").innerHTML = e.code === "permission-denied" ? "<b>Kod yanlış</b> ya da şu an kapalı. Yöneticiye sor." : "Bir hata oldu: " + (e.message || e);
    }
  };
}
