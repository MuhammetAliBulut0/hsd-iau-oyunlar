import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, onSnapshot, writeBatch, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, SUPER_ADMIN_EMAIL } from "./firebase-config.js";
import { GAMES, BINGO, QS, CATS, K_ATTR, genMystery } from "./data.js";

const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = getFirestore(fb);

/* ---------- yardımcılar ---------- */
const $ = id => document.getElementById(id);
const D = (...p) => doc(db, ...p);
const C = name => collection(db, name);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const ms = t => (t && t.toMillis) ? t.toMillis() : (typeof t === "number" ? t : Date.now());
const byName = (a, b) => (a.name || "").localeCompare(b.name || "", "tr");
const pick = a => a[Math.floor(Math.random() * a.length)];

let ME = null, IS_MOD = false, IS_SUPER = false, booted = false;
const subs = [];
function listen(ref, cb) {
  const u = onSnapshot(ref, cb, e => { console.warn(e); if (e.code === "permission-denied") toast("Bu bilgiyi görme yetkin yok. Kurallar yüklendi mi?"); });
  subs.push(u); return u;
}
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 3800); }
async function act(fn) {
  try { return await fn(); }
  catch (e) { console.error(e); toast(e.code === "permission-denied" ? "Bu işlem için yetkin yok." : "Bir hata oldu: " + (e.message || e)); }
}
async function clearCol(name) {
  const s = await getDocs(C(name));
  let b = writeBatch(db), n = 0;
  for (const d of s.docs) { b.delete(d.ref); if (++n % 400 === 0) { await b.commit(); b = writeBatch(db); } }
  await b.commit();
}
function confirmBox(boxId, yesId, noId, onYes) {
  $(boxId).hidden = false;
  $(noId).onclick = () => { $(boxId).hidden = true; };
  $(yesId).onclick = async () => { $(boxId).hidden = true; await act(onYes); };
}
let wakeLock = null;
function keepAwake() { try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => {}); } catch (e) {} }
function releaseAwake() { try { wakeLock && wakeLock.release(); wakeLock = null; } catch (e) {} }
let audio = null;
function initAudio() { try { if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } audio && audio.resume && audio.resume(); } catch (e) {} }
function beep(freq, len) {
  try { if (!audio) return; const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(.25, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + len); o.start(); o.stop(audio.currentTime + len); } catch (e) {}
}
document.addEventListener("click", initAudio, { once: true });

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
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") { await signInWithRedirect(auth, p); }
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
  ME = { uid: u.uid, name: u.displayName || email.split("@")[0], email, photo: u.photoURL || "" };
  $("login").hidden = true; $("app").hidden = false;
  $("me-name").textContent = ME.name;
  if (ME.photo) { $("me-photo").src = ME.photo; $("me-photo").hidden = false; }
  setDoc(D("users", ME.uid), { name: ME.name, email, photo: ME.photo, lastSeen: serverTimestamp() }, { merge: true }).catch(e => console.warn(e));
  IS_SUPER = email === SUPER_ADMIN_EMAIL.toLowerCase();
  let first = true;
  listen(D("mods", email), snap => {
    const m = IS_SUPER || snap.exists();
    if (!first && m !== IS_MOD) { location.reload(); return; }
    first = false; IS_MOD = m; boot();
  });
});

function boot() {
  if (booted) return; booted = true;
  document.body.classList.toggle("is-mod", IS_MOD);
  document.body.classList.toggle("is-super", IS_SUPER);
  const r = $("me-role");
  r.textContent = IS_SUPER ? "Yönetici" : IS_MOD ? "Moderatör" : "Katılımcı";
  r.classList.toggle("mod", IS_MOD);
  if (IS_MOD) listen(C("users"), s => { USERS = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderUsers(); renderDareMod(); });
  initTabs(); initLive(); initBingo(); initSpeed(); initMurder(); initDare(); initWho(); initLie();
  if (IS_MOD) initMod();
}

/* ---------- sekmeler & canlı oyun ---------- */
const TABS = ["bingo", "speed", "murder", "dare", "who", "lie", "mod"];
let LIVE = undefined, USERS = [];
function showTab(t) {
  if (!TABS.includes(t) || (t === "mod" && !IS_MOD)) t = "bingo";
  try { localStorage.setItem("hsd-tab", t); } catch (e) {}
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  TABS.forEach(k => $("g-" + k).hidden = k !== t);
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
    if (LIVE !== undefined && live && live !== LIVE && !IS_MOD) showTab(live);
    LIVE = live;
    renderLiveChips();
  });
}

/* =====================================================================
   TECH BINGO
   ===================================================================== */
const LINES = [];
for (let i = 0; i < 4; i++) { LINES.push([0, 1, 2, 3].map(k => i * 4 + k)); LINES.push([0, 1, 2, 3].map(k => k * 4 + i)); }
LINES.push([0, 5, 10, 15], [3, 6, 9, 12]);
let BG = null, bSel = -1, bCreating = false, BM = [], bmView = null;

function bingoGrid(cells, interactive, sel) {
  return cells.map((x, i) => `<button class="cell${x.n ? " done" : ""}${i === sel ? " sel" : ""}" data-i="${i}" ${interactive ? "" : "disabled"} aria-label="${esc(x.t)}${x.n ? ", " + esc(x.n) : ""}"><span>${esc(x.t)}</span><span class="nm">${x.n ? esc(x.n) : interactive ? "+ ad yaz" : "–"}</span></button>`).join("");
}
function initBingo() {
  const ref = D("bingo", ME.uid);
  listen(ref, async s => {
    if (!s.exists()) {
      if (!bCreating) { bCreating = true; await act(() => setDoc(ref, { name: ME.name, cells: shuffle(BINGO).slice(0, 16).map(t => ({ t, n: "" })), lines: 0, filled: 0, updatedAt: serverTimestamp() })); bCreating = false; }
      return;
    }
    BG = s.data(); renderBingo();
  });
  $("b-grid").onclick = e => {
    const b = e.target.closest(".cell"); if (!b || !BG) return;
    bSel = +b.dataset.i; $("b-edit").hidden = false; $("b-q").textContent = BG.cells[bSel].t;
    $("b-name").value = BG.cells[bSel].n; $("b-note").textContent = ""; renderBingo(); $("b-name").focus();
  };
  const close = () => { bSel = -1; $("b-edit").hidden = true; renderBingo(); };
  $("b-save").onclick = () => {
    if (bSel < 0) return; const n = $("b-name").value.trim();
    if (!n) { $("b-note").textContent = "Bu kutuya uyan kişinin adını yaz."; return; }
    const low = n.toLocaleLowerCase("tr");
    if (low === ME.name.toLocaleLowerCase("tr")) { $("b-note").textContent = "Kendi adını yazamazsın."; return; }
    if (BG.cells.some((x, i) => i !== bSel && x.n.toLocaleLowerCase("tr") === low)) { $("b-note").innerHTML = `<b>${esc(n)}</b> zaten başka bir kutuda. Her kutuya farklı biri.`; return; }
    const cells = BG.cells.map((x, i) => i === bSel ? { ...x, n } : x); close(); saveBingo(cells);
  };
  $("b-name").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); $("b-save").click(); } };
  $("b-clear").onclick = () => { if (bSel < 0) return; const cells = BG.cells.map((x, i) => i === bSel ? { ...x, n: "" } : x); close(); saveBingo(cells); };
  $("b-close").onclick = close;

  listen(C("bingoWinners"), s => {
    const w = s.docs.map(d => d.data()).sort((a, b) => ms(a.at) - ms(b.at));
    $("b-winners").innerHTML = w.length ? w.map((x, i) => `<li><span><b>${i + 1}. ${esc(x.name)}</b></span><span class="r">${x.filled === 16 ? "Tam kart" : x.lines + " bingo"}</span></li>`).join("") : "<li>İlk bingo yapan burada görünecek.</li>";
  });

  if (IS_MOD) {
    listen(C("bingo"), s => { BM = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderBingoMod(); });
    $("bm-rows").onclick = e => { const tr = e.target.closest("tr[data-uid]"); if (!tr) return; bmView = bmView === tr.dataset.uid ? null : tr.dataset.uid; renderBingoMod(); };
    $("bm-reset").onclick = () => confirmBox("bm-confirm", "bm-yes", "bm-no", async () => { await clearCol("bingoWinners"); await clearCol("bingo"); bmView = null; toast("Bingo kartları sıfırlandı."); });
  }
}
async function saveBingo(cells) {
  const lines = LINES.filter(l => l.every(i => cells[i].n)).length, filled = cells.filter(c => c.n).length;
  const prevLines = BG ? BG.lines || 0 : 0;
  await act(async () => {
    await setDoc(D("bingo", ME.uid), { name: ME.name, cells, lines, filled, updatedAt: serverTimestamp() });
    if (lines > 0 && prevLines === 0) await setDoc(D("bingoWinners", ME.uid), { name: ME.name, lines, filled, at: serverTimestamp() });
    else if (lines > 0) await updateDoc(D("bingoWinners", ME.uid), { lines, filled });
    else if (prevLines > 0) await deleteDoc(D("bingoWinners", ME.uid));
  });
}
function renderBingo() {
  if (!BG) return;
  $("b-grid").innerHTML = bingoGrid(BG.cells, true, bSel);
  const filled = BG.cells.filter(x => x.n).length; $("b-count").textContent = filled;
  const lines = LINES.filter(l => l.every(i => BG.cells[i].n)).length, m = $("b-msg");
  if (filled === 16) { m.hidden = false; m.textContent = "Tam kart! Moderatöre koş."; }
  else if (lines > 0) { m.hidden = false; m.textContent = lines === 1 ? "BİNGO! Moderatöre göster." : "BİNGO × " + lines; }
  else m.hidden = true;
}
function renderBingoMod() {
  const rows = BM.slice().sort((a, b) => (b.lines || 0) - (a.lines || 0) || (b.filled || 0) - (a.filled || 0) || byName(a, b));
  $("bm-count").textContent = rows.length;
  $("bm-rows").innerHTML = rows.length ? rows.map(r => `<tr class="click" data-uid="${esc(r.uid)}"><td>${esc(r.name)}</td><td>${r.filled || 0}/16</td><td class="${r.lines ? "bad" : ""}">${r.lines ? (r.filled === 16 ? "Tam kart" : r.lines) : "–"}</td></tr>`).join("") : `<tr><td colspan="3">Henüz kimse bingo sekmesini açmadı.</td></tr>`;
  const v = BM.find(x => x.uid === bmView), box = $("bm-view");
  if (v) { box.hidden = false; box.innerHTML = `<p class="how"><strong>${esc(v.name)}</strong> adlı kişinin kartı</p><div class="bingo">${bingoGrid(v.cells || [], false, -1)}</div>`; }
  else box.hidden = true;
}

/* =====================================================================
   HIZ TANIŞMASI
   ===================================================================== */
let SPS = null, spAdvancing = false, spLastKey = "", spCats = Object.keys(QS);
function spLeft() { if (!SPS || !SPS.running) return 0; return SPS.paused ? (SPS.leftMs || 0) / 1000 : (SPS.endsAt - Date.now()) / 1000; }
function pickQ(s) {
  const pool = (s.cats || []).flatMap(c => (QS[c] || []).map(q => ({ q, c })));
  let used = s.used || [], avail = pool.filter(x => !used.includes(x.q));
  if (!avail.length) { avail = pool; used = []; }
  const x = pick(avail); return { q: x.q, cat: x.c, used: [...used, x.q] };
}
function nextSpeed(s) {
  const now = Date.now();
  if (s.phase === "talk") {
    if (s.round >= s.total) return { ...s, running: false, phase: "done", paused: false };
    return { ...s, phase: "switch", endsAt: now + s.sw * 1000, paused: false, leftMs: 0 };
  }
  const p = pickQ(s);
  return { ...s, phase: "talk", round: s.round + 1, endsAt: now + s.dur * 1000, paused: false, leftMs: 0, q: p.q, cat: p.cat, used: p.used };
}
async function advanceSpeed(force) {
  if (spAdvancing || !SPS) return; spAdvancing = true;
  const round = SPS.round, phase = SPS.phase;
  try {
    await runTransaction(db, async tx => {
      const ref = D("speed", "state"); const snap = await tx.get(ref); if (!snap.exists()) return;
      const s = snap.data();
      if (!s.running || s.round !== round || s.phase !== phase) return;
      if (!force && (s.paused || Date.now() < s.endsAt)) return;
      tx.set(ref, nextSpeed(s));
    });
  } catch (e) { console.warn(e); }
  spAdvancing = false;
}
function renderSpeed() {
  const s = SPS;
  let round = "Bekleniyor", cat = "", q = "Moderatör başlatınca soru burada çıkacak.", sw = false;
  if (s && s.running) {
    round = `Tur ${s.round}/${s.total}`;
    if (s.phase === "talk") { cat = s.cat || ""; q = s.q || ""; }
    else { sw = true; q = "Değiş! Dış halka bir kişi sağa kaysın."; cat = `Sıradaki: Tur ${s.round + 1}`; }
    if (s.paused) round += " · Duraklatıldı";
  } else if (s && s.phase === "done") { round = "Bitti"; q = `Hız tanışması bitti. ${s.round} tur oynandı, sağ olun!`; }
  $("sp-round").textContent = round; $("so-round").textContent = round;
  $("sp-cat").textContent = cat; $("so-cat").textContent = cat;
  $("sp-q").textContent = q; $("so-q").textContent = q;
  $("sp-q").className = "sq" + (sw ? " switch" : ""); $("so-q").className = "word q" + (sw ? " switch" : "");
  const pl = s && s.paused ? "Devam" : "Duraklat"; $("s-pause").textContent = pl; $("so-pause").textContent = pl;
  const key = s ? `${s.round}|${s.phase}` : "";
  if (key !== spLastKey) { if (spLastKey && s && s.running) beep(s.phase === "talk" ? 880 : 520, .35); else if (spLastKey && s && s.phase === "done") beep(660, .6); spLastKey = key; }
  speedTick();
}
function speedTick() {
  const s = SPS, left = spLeft();
  const t = s && s.running ? fmt(left) : "–:––";
  const len = s && s.running ? (s.phase === "talk" ? s.dur : s.sw) : 1;
  const low = s && s.running && s.phase === "talk" && left <= 10;
  for (const id of ["sp-timer", "so-timer"]) { $(id).textContent = t; $(id).classList.toggle("low", !!low); }
  const sc = `scaleX(${s && s.running ? Math.max(0, Math.min(1, left / len)) : 0})`;
  $("sp-bar").style.transform = sc; $("so-bar").style.transform = sc;
  if (IS_MOD && s && s.running && !s.paused && Date.now() >= s.endsAt) advanceSpeed(false);
}
function initSpeed() {
  listen(D("speed", "state"), s => { SPS = s.exists() ? s.data() : null; renderSpeed(); });
  setInterval(speedTick, 250);
  $("sp-full").onclick = () => { $("s-stage").hidden = false; keepAwake(); };
  $("so-close").onclick = () => { $("s-stage").hidden = true; releaseAwake(); };
  if (!IS_MOD) return;
  const renderCats = () => { $("s-cats").innerHTML = Object.keys(QS).map(c => `<button class="chip" aria-pressed="${spCats.includes(c)}" data-cat="${esc(c)}">${esc(c)} · ${QS[c].length}</button>`).join(""); };
  $("s-cats").onclick = e => { const b = e.target.closest("[data-cat]"); if (!b) return; const c = b.dataset.cat; spCats = spCats.includes(c) ? spCats.filter(x => x !== c) : [...spCats, c]; renderCats(); };
  renderCats();
  $("s-start").onclick = () => act(async () => {
    if (!spCats.length) { toast("En az bir soru türü seç."); return; }
    initAudio();
    const base = { running: true, round: 0, total: +$("s-rounds").value, dur: +$("s-dur").value, sw: +$("s-switch").value, cats: spCats, used: [], phase: "switch", paused: false, leftMs: 0, endsAt: 0 };
    await setDoc(D("speed", "state"), nextSpeed(base));
    keepAwake();
  });
  const pause = () => act(async () => {
    if (!SPS || !SPS.running) return;
    if (SPS.paused) await updateDoc(D("speed", "state"), { paused: false, endsAt: Date.now() + (SPS.leftMs || 0) });
    else await updateDoc(D("speed", "state"), { paused: true, leftMs: Math.max(0, SPS.endsAt - Date.now()) });
  });
  const skip = () => act(async () => { if (!SPS || !SPS.running || SPS.phase !== "talk") return; const p = pickQ(SPS); await updateDoc(D("speed", "state"), { q: p.q, cat: p.cat, used: p.used }); });
  const next = () => { if (SPS && SPS.running) advanceSpeed(true); };
  $("s-pause").onclick = pause; $("so-pause").onclick = pause;
  $("s-skip").onclick = skip; $("so-skip").onclick = skip;
  $("s-next").onclick = next; $("so-next").onclick = next;
  $("s-stop").onclick = () => act(() => SPS && updateDoc(D("speed", "state"), { running: false, phase: "done", paused: false }));
}

/* =====================================================================
   KATİL KİM?
   ===================================================================== */
let MM = { status: "off" }, MPL = [], MYCARD = null, MYVOTE = null, MCARDS = [], MVOTES = [], MSOL = null;
const M_STATUS = {
  off: "Oyun henüz açılmadı. Moderatör açınca buradan katılacaksın.",
  lobby: "Katılım açık. Oyuna katıl ve kartların dağıtılmasını bekle.",
  running: "Sorgu başladı. Kartına bak, odada dolaş, ipucu topla.",
  voting: "Oylama açık. Pixel'i kim kapattı?",
  ended: "Oyun bitti. Sonuç aşağıda."
};
function cardHTML(c, owner) {
  return `<div class="mcard flip"><div class="top"><span class="no">${esc(owner || "")}</span><span class="no">Pixel Dosyası</span></div>
  <div class="role${c.bad ? " bad" : ""}">${esc(c.role)}</div><p class="desc">${esc(c.desc)}</p>
  <div class="sec"><span class="lab">Kimliğin · sorana doğru söyle</span><dl>${K_ATTR.map((a, i) => `<dt>${esc(a.k)}</dt><dd>${esc(a.v[c.traits[i]])}</dd>`).join("")}</dl></div>
  ${c.clues && c.clues.length ? `<div class="sec"><span class="lab">${c.clues.length > 1 ? "İpuçların" : "İpucun"}</span>${c.clues.map(x => `<p><b>${esc(x)}</b></p>`).join("")}</div>` : ""}
  ${c.fake ? `<div class="sec"><span class="lab">Yaymak için uydurma ipucun</span><p><b>${esc(c.fake)}</b></p></div>` : ""}
  <div class="sec"><span class="lab">Sırrın</span><p>${esc(c.secret)}</p></div>
  <div class="sec"><span class="lab">Hedefin</span><p>${esc(c.goal)}</p></div></div>`;
}
function initMurder() {
  listen(D("murder", "meta"), s => { MM = s.exists() ? s.data() : { status: "off" }; renderMurder(); });
  listen(C("murderPlayers"), s => { MPL = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderMurder(); });
  listen(D("murderCards", ME.uid), s => { MYCARD = s.exists() ? s.data() : null; renderMurder(); });
  listen(D("murderVotes", ME.uid), s => { MYVOTE = s.exists() ? s.data() : null; renderMurder(); });
  $("m-join").onclick = () => act(() => setDoc(D("murderPlayers", ME.uid), { name: ME.name, joinedAt: serverTimestamp() }));
  $("m-leave").onclick = () => act(() => deleteDoc(D("murderPlayers", ME.uid)));
  $("m-votes").onclick = e => {
    const b = e.target.closest("[data-uid]"); if (!b) return;
    const t = MPL.find(p => p.uid === b.dataset.uid); if (!t) return;
    act(() => setDoc(D("murderVotes", ME.uid), { target: t.uid, targetName: t.name, at: serverTimestamp() }));
  };
  setInterval(murderClock, 500);
  if (IS_MOD) {
    listen(C("murderCards"), s => { MCARDS = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMurder(); });
    listen(C("murderVotes"), s => { MVOTES = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMurder(); });
    listen(D("murderSecret", "solution"), s => { MSOL = s.exists() ? s.data() : null; renderMurder(); });
    $("mm-actions").onclick = e => { const b = e.target.closest("[data-act]"); if (b) murderAction(b.dataset.act); };
  }
}
function murderClock() {
  const run = MM.status === "running" && MM.endsAt;
  $("m-clockrow").hidden = !run; if (!run) return;
  const l = (MM.endsAt - Date.now()) / 1000;
  $("m-clock").textContent = l > 0 ? fmt(l) : "Süre doldu"; $("m-clock").classList.toggle("low", l <= 120);
}
function tally() {
  const t = {}; MVOTES.forEach(v => { t[v.target] = t[v.target] || { uid: v.target, name: v.targetName, votes: 0 }; t[v.target].votes++; });
  return Object.values(t).sort((a, b) => b.votes - a.votes);
}
function renderMurder() {
  const st = MM.status || "off", inGame = MPL.some(p => p.uid === ME.uid);
  $("m-status").textContent = M_STATUS[st] || M_STATUS.off;
  $("m-joinrow").hidden = st !== "lobby";
  $("m-join").hidden = inGame; $("m-leave").hidden = !inGame;
  $("m-count").textContent = MPL.length;
  $("m-names").innerHTML = MPL.map(p => `<span class="chip static">${esc(p.name)}${p.uid === ME.uid ? " (sen)" : ""}</span>`).join("");
  const showCard = MYCARD && ["running", "voting", "ended"].includes(st);
  $("m-card").hidden = !showCard;
  if (showCard) { const html = cardHTML(MYCARD, ME.name); if ($("m-card").dataset.k !== html) { $("m-card").innerHTML = html; $("m-card").dataset.k = html; } }
  else if (["running", "voting"].includes(st) && !MYCARD) $("m-status").textContent += " Bu tura katılmadın, sonraki turu bekle.";
  const vb = $("m-votebox"); vb.hidden = !(st === "voting" && MYCARD);
  if (!vb.hidden) $("m-votes").innerHTML = MPL.filter(p => p.uid !== ME.uid).map(p => `<button class="vbtn" data-uid="${esc(p.uid)}" aria-pressed="${MYVOTE && MYVOTE.target === p.uid}">${esc(p.name)}</button>`).join("");
  const rv = $("m-reveal"), R = MM.reveal;
  rv.hidden = !(st === "ended" && R);
  if (!rv.hidden) rv.innerHTML = `<span class="step">Sonuç</span><p class="big-status">${R.winner === "masum" ? "Masumlar kazandı!" : "Katil kaçtı!"}</p>
    <p class="story">Pixel'i kapatan: <b style="color:var(--red)">${esc(R.killer)}</b>${R.accomplice ? `. Suç ortağı: <b style="color:var(--red)">${esc(R.accomplice)}</b>` : ""}.</p>
    <p class="how">Uydurma ipucu <strong>${esc(R.herring)}</strong> adlı masumu gösteriyordu, Kimliği katilinkinden yalnızca bir özellikte farklıydı.</p>
    <ul class="list">${(R.tally || []).map(t => `<li><b>${esc(t.name)}</b><span>${t.votes} oy</span></li>`).join("") || "<li>Kimse oy vermedi.</li>"}</ul>`;
  if (IS_MOD) renderMurderMod();
}
function renderMurderMod() {
  const st = MM.status || "off";
  const A = {
    off: [["lobby", "Katılımı aç", ""]],
    lobby: [["start", `Kartları dağıt ve başlat (${MPL.length} kişi)`, ""], ["close", "Oyunu kapat", "ghost"]],
    running: [["voting", "Oylamayı başlat", ""], ["extend", "+5 dakika", "ghost"], ["close", "Oyunu kapat", "ghost"]],
    voting: [["reveal", "Sonucu açıkla", ""], ["close", "Oyunu kapat", "ghost"]],
    ended: [["lobby", "Yeni oyun aç", ""], ["close", "Oyunu kapat", "ghost"]]
  }[st] || [];
  $("mm-actions").innerHTML = A.map(([a, l, c]) => `<button class="btn small ${c}" data-act="${a}">${esc(l)}</button>`).join("");
  $("mm-note").textContent = st === "lobby" && MPL.length < 6 ? `En az 6 kişi gerekli, şu an ${MPL.length}.` : st === "voting" ? `${MVOTES.length} / ${MCARDS.length} kişi oy verdi.` : "";
  const sol = $("mm-sol");
  if (MSOL && st !== "off" && st !== "lobby") { sol.hidden = false; sol.innerHTML = `<p class="note">Katil: <b>${esc(MSOL.killer)}</b>${MSOL.accomplice ? ` · Suç ortağı: <b>${esc(MSOL.accomplice)}</b>` : ""} · Şaşırtmaca: ${esc(MSOL.herring)}</p>`; }
  else sol.hidden = true;
  const tw = $("mm-tablewrap"); tw.hidden = !MCARDS.length || st === "lobby" || st === "off";
  if (!tw.hidden) {
    const votesFor = {}; MVOTES.forEach(v => votesFor[v.target] = (votesFor[v.target] || 0) + 1);
    const voteOf = {}; MVOTES.forEach(v => voteOf[v.uid] = v.targetName);
    const order = { "Katil": 0, "Suç Ortağı": 1, "Dedektif": 2, "Tanık": 3, "Masum": 4 };
    $("mm-rows").innerHTML = MCARDS.slice().sort((a, b) => (order[a.role] - order[b.role]) || byName(a, b)).map(c => `<tr><td>${esc(c.name)}</td><td class="${c.bad ? "bad" : ""}">${esc(c.role)}</td><td>${esc(voteOf[c.uid] || "–")}</td><td>${votesFor[c.uid] || 0}</td></tr>`).join("");
  }
}
function murderAction(a) {
  const ask = (text, fn) => { $("mm-confirm-text").textContent = text; confirmBox("mm-confirm", "mm-yes", "mm-no", fn); };
  const resetAll = async () => { await clearCol("murderVotes"); await clearCol("murderCards"); await clearCol("murderPlayers"); await clearCol("murderSecret"); };
  if (a === "lobby") return ask("Önceki oyunun kartları ve oyları silinecek, katılım açılacak.", async () => { await resetAll(); await setDoc(D("murder", "meta"), { status: "lobby", at: Date.now() }); });
  if (a === "close") return ask("Oyun kapanacak ve tüm kartlar silinecek.", async () => { await setDoc(D("murder", "meta"), { status: "off" }); await resetAll(); });
  if (a === "start") {
    if (MPL.length < 6) { toast("En az 6 kişi katılmalı."); return; }
    return ask(`${MPL.length} kişiye kart dağıtılacak ve süre başlayacak.`, async () => {
      const players = MPL.slice(), g = genMystery(players.map(p => p.name));
      const b = writeBatch(db);
      players.forEach((p, i) => b.set(D("murderCards", p.uid), { ...g.cards[i], name: p.name }));
      b.set(D("murderSecret", "solution"), { killer: players[g.killer].name, killerUid: players[g.killer].uid, accomplice: g.accomplice >= 0 ? players[g.accomplice].name : null, herring: players[g.herring].name });
      b.set(D("murder", "meta"), { status: "running", N: players.length, endsAt: Date.now() + (+$("mm-min").value) * 60000 });
      await b.commit();
    });
  }
  if (a === "extend") return act(() => updateDoc(D("murder", "meta"), { endsAt: Math.max(Date.now(), MM.endsAt || 0) + 5 * 60000 }));
  if (a === "voting") return act(() => updateDoc(D("murder", "meta"), { status: "voting" }));
  if (a === "reveal") return ask("Sonuç herkesin ekranında açıklanacak.", async () => {
    const sol = (await getDoc(D("murderSecret", "solution"))).data();
    const t = tally(), top = t[0], tie = t.length > 1 && t[1].votes === (top && top.votes);
    const winner = top && !tie && top.uid === sol.killerUid ? "masum" : "katil";
    await updateDoc(D("murder", "meta"), { status: "ended", reveal: { killer: sol.killer, accomplice: sol.accomplice, herring: sol.herring, tally: t.map(x => ({ name: x.name, votes: x.votes })), winner } });
  });
}

/* =====================================================================
   CESARET
   ===================================================================== */
let MYDARES = [], DSTAGE = null, DASSIGN = null, ALLDARES = [];
function initDare() {
  listen(query(C("dares"), where("authorUid", "==", ME.uid)), s => { MYDARES = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(a.createdAt) - ms(b.createdAt)); renderDare(); });
  listen(D("dareAssigned", ME.uid), s => { DASSIGN = s.exists() ? s.data() : null; renderDare(); });
  listen(D("dareStage", "current"), s => { DSTAGE = s.exists() ? s.data() : null; renderDare(); });
  $("d-add").onclick = () => act(async () => {
    const text = $("d-text").value.trim();
    if (!text) { $("d-note").textContent = "Önce bir görev yaz."; return; }
    if (MYDARES.length >= 3) { $("d-note").textContent = "En fazla 3 görev yazabilirsin."; return; }
    await addDoc(C("dares"), { authorUid: ME.uid, authorName: ME.name, text, drawnBy: null, drawnByName: null, result: null, createdAt: serverTimestamp() });
    $("d-text").value = ""; $("d-note").innerHTML = "Eklendi. Kimin çekeceği <b>sürpriz</b>.";
  });
  $("d-my").onclick = e => { const b = e.target.closest("[data-del]"); if (b) act(() => deleteDoc(D("dares", b.dataset.del))); };
  if (!IS_MOD) return;
  listen(C("dares"), s => { ALLDARES = s.docs.map(d => ({ id: d.id, ...d.data() })); renderDareMod(); });
  $("dm-random").onclick = () => {
    const done = new Set(ALLDARES.filter(d => d.drawnBy).map(d => d.drawnBy));
    const cand = USERS.filter(u => !done.has(u.uid)); if (!cand.length) { toast("Herkes kart çekti."); return; }
    $("dm-player").value = pick(cand).uid;
  };
  $("dm-draw").onclick = () => act(async () => {
    const uid = $("dm-player").value, u = USERS.find(x => x.uid === uid);
    if (!u) { $("dm-note").textContent = "Önce kart çekecek kişiyi seç."; return; }
    const pool = ALLDARES.filter(d => !d.drawnBy && d.authorUid !== uid);
    if (!pool.length) { $("dm-note").textContent = ALLDARES.some(d => !d.drawnBy) ? "Kalan kartları bu kişi yazmış. Başka birini seç." : "Destede kart kalmadı."; return; }
    const d = pick(pool), b = writeBatch(db);
    b.update(D("dares", d.id), { drawnBy: uid, drawnByName: u.name, drawnAt: Date.now() });
    b.set(D("dareAssigned", uid), { text: d.text, result: null, at: Date.now() });
    b.set(D("dareStage", "current"), { name: u.name, uid, text: d.text, dareId: d.id, result: null, at: Date.now() });
    await b.commit(); $("dm-note").textContent = "";
  });
  const result = r => act(async () => {
    if (!DSTAGE || !DSTAGE.dareId) return; const b = writeBatch(db);
    b.update(D("dares", DSTAGE.dareId), { result: r }); b.update(D("dareStage", "current"), { result: r });
    b.set(D("dareAssigned", DSTAGE.uid), { result: r }, { merge: true }); await b.commit();
  });
  $("dm-done").onclick = () => result("Yaptı"); $("dm-pass").onclick = () => result("Pas");
  $("dm-reset").onclick = () => confirmBox("dm-confirm", "dm-yes", "dm-no", async () => { await clearCol("dareAssigned"); await clearCol("dareStage"); await clearCol("dares"); toast("Deste sıfırlandı."); });
}
function renderDare() {
  const st = $("d-stage");
  if (DSTAGE && DSTAGE.text) {
    const html = `<span class="kicker">${esc(DSTAGE.name)} için cesaret kartı</span><div class="big">${esc(DSTAGE.text)}</div><div class="who">${DSTAGE.result ? esc(DSTAGE.result) : "Yazan kişi gizli"}</div>`;
    if (st.dataset.k !== DSTAGE.dareId) { st.className = "card flip"; st.dataset.k = DSTAGE.dareId; }
    st.innerHTML = html;
  } else { st.className = "card back"; st.dataset.k = ""; st.innerHTML = `<span class="kicker">Cesaret kartı</span><div class="big">Moderatör kart çekince burada görünecek</div>`; }
  $("d-minebox").hidden = !DASSIGN;
  if (DASSIGN) $("d-mine").innerHTML = `<div class="card"><span class="kicker">Senin görevin</span><div class="big">${esc(DASSIGN.text)}</div><div class="who">${DASSIGN.result ? esc(DASSIGN.result) : "Hadi bakalım!"}</div></div>`;
  $("d-my").innerHTML = MYDARES.length ? MYDARES.map(d => `<li><span>${esc(d.text)}</span>${d.drawnBy ? `<span class="r">Çekildi</span>` : `<button class="btn ghost small" data-del="${esc(d.id)}">Sil</button>`}</li>`).join("") : "<li>Henüz görev yazmadın. En fazla 3 görev yazabilirsin.</li>";
  if (IS_MOD) $("dm-after").hidden = !(DSTAGE && DSTAGE.dareId && !DSTAGE.result);
}
function renderDareMod() {
  if (!IS_MOD) return;
  const sel = $("dm-player"), prev = sel.value, done = new Set(ALLDARES.filter(d => d.drawnBy).map(d => d.drawnBy));
  sel.innerHTML = '<option value="">Kişi seç</option>' + USERS.map(u => `<option value="${esc(u.uid)}">${esc(u.name)}${done.has(u.uid) ? " ✓" : ""}</option>`).join("");
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  $("dm-total").textContent = ALLDARES.length; $("dm-left").textContent = ALLDARES.filter(d => !d.drawnBy).length;
  const drawn = ALLDARES.filter(d => d.drawnBy).sort((a, b) => (b.drawnAt || 0) - (a.drawnAt || 0));
  $("dm-hist").innerHTML = drawn.length ? drawn.map(d => `<li><span><b>${esc(d.drawnByName)}</b> · ${esc(d.text)} <span style="opacity:.7">(yazan: ${esc(d.authorName)})</span></span><span>${esc(d.result || "…")}</span></li>`).join("") : "<li>Henüz kart çekilmedi.</li>";
}

/* =====================================================================
   BEN KİMİM (tek telefon, yerel)
   ===================================================================== */
function initWho() {
  let cats = ["Teknoloji", "Hayvanlar"];
  try { cats = JSON.parse(localStorage.getItem("hsd-who-cats")) || cats; } catch (e) {}
  const renderCats = () => { $("w-cats").innerHTML = Object.keys(CATS).map(c => `<button class="chip" aria-pressed="${cats.includes(c)}" data-cat="${esc(c)}">${esc(c)}</button>`).join(""); };
  $("w-cats").onclick = e => { const b = e.target.closest("[data-cat]"); if (!b) return; const c = b.dataset.cat; cats = cats.includes(c) ? cats.filter(x => x !== c) : [...cats, c]; try { localStorage.setItem("hsd-who-cats", JSON.stringify(cats)); } catch (e) {} renderCats(); };
  renderCats();
  let deck = [], idx = 0, score = 0, left = 0, tick = null, log = [];
  const show = () => { if (idx >= deck.length) deck = deck.concat(shuffle(deck)); $("w-word").textContent = deck[idx].w; $("w-cat").textContent = deck[idx].c; $("w-score").textContent = score; };
  const upd = () => { $("w-timer").textContent = Math.max(0, left); $("w-timer").classList.toggle("low", left <= 10); };
  const end = () => { clearInterval(tick); tick = null; $("w-stage").hidden = true; releaseAwake();
    $("w-last").hidden = false; $("w-result").innerHTML = `<b>${score}</b> doğru, ${log.length - score} pas.`;
    $("w-list").innerHTML = log.map(l => `<li><b>${esc(l.w)}</b><span>${l.ok ? "Bildi" : "Pas"}</span></li>`).join("") || "<li>Bu turda kelime geçmedi.</li>"; };
  const answer = ok => { log.push({ w: deck[idx].w, ok }); if (ok) score++; idx++; show(); };
  $("w-start").onclick = () => {
    const custom = $("w-custom").value.split("\n").map(s => s.trim()).filter(Boolean).map(w => ({ w, c: "Özel" }));
    deck = shuffle(cats.flatMap(c => (CATS[c] || []).map(w => ({ w, c }))).concat(custom));
    if (!deck.length) { $("w-note").textContent = "En az bir kategori seç ya da kendi kelimeni yaz."; return; }
    $("w-note").textContent = ""; idx = 0; score = 0; log = []; left = +$("w-time").value;
    $("w-stage").hidden = false; show(); upd(); keepAwake();
    clearInterval(tick); tick = setInterval(() => { left--; upd(); if (left <= 0) end(); }, 1000);
  };
  $("w-ok").onclick = () => answer(true); $("w-pass").onclick = () => answer(false); $("w-stop").onclick = end;
}

/* =====================================================================
   2 DOĞRU 1 YALAN
   ===================================================================== */
let MYLIE = null, LSTAGE = null, LQUEUE = [], LVOTES = [], lVoteUnsub = null, lVoteRound = null, myLieVote = {};
function initLie() {
  listen(D("lies", ME.uid), s => { MYLIE = s.exists() ? s.data() : null; renderLieForm(); });
  listen(D("lieStage", "current"), s => { LSTAGE = s.exists() ? s.data() : null; if (IS_MOD) watchVotes(); renderLie(); });
  listen(C("lieResults"), s => {
    const r = s.docs.map(d => d.data()).sort((a, b) => (b.total ? b.fooled / b.total : 0) - (a.total ? a.fooled / a.total : 0));
    $("l-board").innerHTML = r.length ? r.map(x => `<li><b>${esc(x.name)}</b><span>${x.total ? `%${Math.round(x.fooled / x.total * 100)} kandırdı (${x.fooled}/${x.total})` : "oy yok"}</span></li>`).join("") : "<li>Yalanı açıklanan herkes burada sıralanır.</li>";
  });
  $("l-send").onclick = () => act(async () => {
    const s = [0, 1, 2].map(i => $("l-s" + i).value.trim()), r = document.querySelector('input[name="l-lie"]:checked');
    if (s.some(x => !x)) { $("l-note").textContent = "Üç bilgiyi de yaz."; return; }
    if (!r) { $("l-note").textContent = "Hangisinin yalan olduğunu işaretle."; return; }
    if (MYLIE && MYLIE.status !== "waiting") { $("l-note").textContent = "Senin turun oynandı, bilgilerin artık değiştirilemez."; return; }
    await setDoc(D("lies", ME.uid), { name: ME.name, s, lie: +r.value, status: "waiting", at: Date.now() });
    $("l-note").innerHTML = "Gönderildi. Moderatör seni <b>sahneye</b> çağırınca oylama başlar.";
  });
  $("l-opts").onclick = e => {
    const b = e.target.closest("[data-i]"); if (!b || !LSTAGE || !LSTAGE.open || LSTAGE.uid === ME.uid) return;
    const round = LSTAGE.round, choice = +b.dataset.i;
    act(async () => { await setDoc(D("lieVotes", round + "_" + ME.uid), { round, uid: ME.uid, choice }); myLieVote[round] = choice; renderLie(); });
  };
  if (!IS_MOD) return;
  listen(C("lies"), s => { LQUEUE = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderLieMod(); });
  $("lm-queue").onclick = e => { const b = e.target.closest("[data-stage]"); if (b) stageLie(b.dataset.stage); };
  $("lm-random").onclick = () => { const w = LQUEUE.filter(x => x.status === "waiting"); if (!w.length) { toast("Sırada kimse yok."); return; } stageLie(pick(w).uid); };
  $("lm-clear").onclick = () => act(async () => {
    const b = writeBatch(db);
    if (LSTAGE && LSTAGE.round && LSTAGE.revealed == null && LQUEUE.some(q => q.uid === LSTAGE.uid)) b.update(D("lies", LSTAGE.uid), { status: "waiting" });
    b.set(D("lieStage", "current"), { round: null, open: false });
    await b.commit();
  });
  $("lm-reveal").onclick = () => act(async () => {
    if (!LSTAGE || !LSTAGE.round || LSTAGE.revealed != null) { toast("Sahnede açıklanacak bir tur yok."); return; }
    const sec = (await getDoc(D("lieStageSecret", "current"))).data();
    if (!sec || sec.round !== LSTAGE.round) { toast("Bu turun cevabı bulunamadı."); return; }
    const vs = (await getDocs(query(C("lieVotes"), where("round", "==", LSTAGE.round)))).docs.map(d => d.data());
    const t = [0, 0, 0]; vs.forEach(v => { if (t[v.choice] != null) t[v.choice]++; });
    const total = vs.length, fooled = total - t[sec.lieIdx];
    const b = writeBatch(db);
    b.update(D("lieStage", "current"), { open: false, revealed: sec.lieIdx, tally: t });
    b.set(D("lieResults", LSTAGE.uid), { name: LSTAGE.name, fooled, total });
    b.update(D("lies", LSTAGE.uid), { status: "done" });
    await b.commit();
  });
  $("lm-reset").onclick = () => confirmBox("lm-confirm", "lm-yes", "lm-no", async () => {
    for (const c of ["lieVotes", "lieResults", "lieStageSecret", "lieStage", "lies"]) await clearCol(c); toast("2 Doğru 1 Yalan sıfırlandı.");
  });
}
function stageLie(uid) {
  act(async () => {
    const x = LQUEUE.find(q => q.uid === uid); if (!x) return;
    if (LSTAGE && LSTAGE.round && LSTAGE.revealed == null) { toast("Önce sahnedeki turu açıkla ya da sahneyi boşalt."); return; }
    const order = shuffle([0, 1, 2]), items = order.map(i => x.s[i]), lieIdx = order.indexOf(x.lie), round = Date.now().toString(36);
    const b = writeBatch(db);
    b.set(D("lieStageSecret", "current"), { round, uid, lieIdx });
    b.set(D("lieStage", "current"), { round, uid, name: x.name, items, open: true, revealed: null, tally: null });
    b.update(D("lies", uid), { status: "stage" });
    await b.commit();
  });
}
function watchVotes() {
  const r = LSTAGE && LSTAGE.round;
  if (r === lVoteRound) return; lVoteRound = r;
  if (lVoteUnsub) { lVoteUnsub(); lVoteUnsub = null; } LVOTES = [];
  if (r) lVoteUnsub = listen(query(C("lieVotes"), where("round", "==", r)), s => { LVOTES = s.docs.map(d => d.data()); renderLie(); });
}
function renderLie() {
  const S = LSTAGE;
  if (!S || !S.round) { $("l-who").textContent = "Sahne boş."; $("l-opts").innerHTML = ""; $("l-result").textContent = "Moderatör birini sahneye çağırınca bilgiler burada çıkacak."; return; }
  const mine = S.uid === ME.uid, rev = S.revealed != null, my = myLieVote[S.round];
  $("l-who").innerHTML = `<b>${esc(S.name)}</b> sahnede${mine ? " (sen!)" : ""}`;
  const counts = rev ? (S.tally || [0, 0, 0]) : IS_MOD ? [0, 1, 2].map(i => LVOTES.filter(v => v.choice === i).length) : null;
  $("l-opts").innerHTML = S.items.map((t, i) => `<button class="opt${rev && i !== S.revealed ? " dim" : ""}" data-i="${i}" aria-pressed="${my === i}" ${!S.open || mine ? "disabled" : ""}>
    <span class="letter">${"ABC"[i]}</span><p>${esc(t)}${rev ? `<span class="tag ${i === S.revealed ? "lie" : "truth"}">${i === S.revealed ? "Yalan" : "Doğru"}</span>` : ""}</p>
    <span class="cnt">${counts ? counts[i] : ""}</span></button>`).join("");
  let msg;
  if (rev) { const total = (S.tally || []).reduce((a, b) => a + b, 0), fooled = total - (S.tally ? S.tally[S.revealed] : 0); msg = total ? `Oy verenlerin <b>%${Math.round(fooled / total * 100)}</b>'i kandırıldı (${fooled}/${total}).` : "Kimse oy vermedi."; }
  else if (mine) msg = "Herkes senin yalanını arıyor. Poker yüzünü tak!";
  else if (my != null) msg = `Oyun: <b>${"ABC"[my]}</b>. Moderatör açıklayana kadar değiştirebilirsin.`;
  else msg = "Hangisi yalan? Dokunarak oy ver.";
  if (IS_MOD && !rev) msg += ` · ${LVOTES.length} oy geldi`;
  $("l-result").innerHTML = msg;
}
function renderLieForm() {
  if (!MYLIE) { ["l-s0", "l-s1", "l-s2", "l-r0", "l-r1", "l-r2", "l-send"].forEach(id => $(id).disabled = false); return; }
  if (!$("l-s0").value && !$("l-s1").value && !$("l-s2").value) {
    [0, 1, 2].forEach(i => $("l-s" + i).value = MYLIE.s[i] || "");
    const r = $("l-r" + MYLIE.lie); if (r) r.checked = true;
  }
  const lock = MYLIE.status !== "waiting";
  ["l-s0", "l-s1", "l-s2", "l-r0", "l-r1", "l-r2", "l-send"].forEach(id => $(id).disabled = lock);
  $("l-note").innerHTML = MYLIE.status === "waiting" ? "Gönderildi. Moderatör seni <b>sahneye</b> çağırınca oylama başlar." : MYLIE.status === "stage" ? "Şu an <b>sahnedesin</b>!" : "Senin turun oynandı.";
}
function renderLieMod() {
  const w = LQUEUE.filter(x => x.status === "waiting").sort((a, b) => (a.at || 0) - (b.at || 0));
  const done = LQUEUE.filter(x => x.status !== "waiting").length;
  $("lm-queue").innerHTML = w.length ? w.map(x => `<li><span><b>${esc(x.name)}</b> · yalan: ${esc(x.s[x.lie])}</span><button class="btn ghost small" data-stage="${esc(x.uid)}">Sahneye al</button></li>`).join("") : "<li>Sırada bekleyen yok.</li>";
  $("lm-note").textContent = `${w.length} kişi sırada, ${done} kişi oynadı.`;
}

/* =====================================================================
   MODERATÖR PANELİ
   ===================================================================== */
let MODS = [];
function initMod() {
  listen(C("mods"), s => { MODS = s.docs.map(d => ({ email: d.id, ...d.data() })); renderMods(); renderUsers(); });
  $("mod-live").onclick = e => { const b = e.target.closest("[data-live]"); if (!b) return; act(() => setDoc(D("state", "current"), { live: b.dataset.live || null, at: Date.now() })); };
  const addMod = email => act(async () => {
    email = (email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("mod-note").textContent = "Geçerli bir e-posta adresi yaz."; return; }
    await setDoc(D("mods", email), { addedBy: ME.email, at: Date.now() });
    $("mod-email").value = ""; $("mod-note").innerHTML = `<b>${esc(email)}</b> artık moderatör. Sayfayı yenilemesi yeterli.`;
  });
  $("mod-add").onclick = () => addMod($("mod-email").value);
  $("mod-list").onclick = e => { const b = e.target.closest("[data-unmod]"); if (b) act(() => deleteDoc(D("mods", b.dataset.unmod))); };
  $("mod-users").onclick = e => { const b = e.target.closest("[data-mod]"); if (b) addMod(b.dataset.mod); };
}
function renderLiveChips() {
  if (!IS_MOD) return;
  $("mod-live").innerHTML = [["", "Hiçbiri"], ...Object.entries(GAMES)].map(([k, l]) => `<button class="chip" data-live="${k}" aria-pressed="${(LIVE || "") === k}">${esc(l)}</button>`).join("");
}
function renderMods() {
  const sup = `<li><span><b>${esc(SUPER_ADMIN_EMAIL)}</b></span><span class="r">Yönetici</span></li>`;
  $("mod-list").innerHTML = sup + MODS.filter(m => m.email !== SUPER_ADMIN_EMAIL.toLowerCase()).map(m => `<li><span>${esc(m.email)}</span>${IS_SUPER ? `<button class="btn ghost small" data-unmod="${esc(m.email)}">Çıkar</button>` : `<span>Moderatör</span>`}</li>`).join("");
}
function renderUsers() {
  if (!IS_MOD) return;
  $("mod-ucount").textContent = USERS.length;
  const modSet = new Set(MODS.map(m => m.email)); modSet.add(SUPER_ADMIN_EMAIL.toLowerCase());
  $("mod-users").innerHTML = USERS.length ? USERS.map(u => `<li><span><b>${esc(u.name)}</b><br><span style="font-size:12px">${esc(u.email)}</span></span>${modSet.has(u.email) ? `<span class="r">Moderatör</span>` : IS_SUPER ? `<button class="btn ghost small" data-mod="${esc(u.email)}">Moderatör yap</button>` : ""}</li>`).join("") : "<li>Henüz kimse giriş yapmadı.</li>";
}
