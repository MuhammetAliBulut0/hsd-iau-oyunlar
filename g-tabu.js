// TABU: katılımcılar grup kurar. Moderatör onaylarken gruptan oyun yöneticisini kendisi seçer.
// Yönetici süreyi, pas hakkını, tur sayısını ve kategorileri ayarlayıp başlatır. İki takım sırayla oynar:
//  - Anlatan: kartı görür, kelimeyi yasaklı kelimeleri kullanmadan anlatır, "Bildi" ve "Pas"a basar.
//  - Takım arkadaşları: kartı görmez, tahmin eder.
//  - Kontrolcü: her turda rakip takımdan rastgele seçilir, kartı görür ve yasaklı kelime duyarsa "Tabu!"ya basar.
import { S, $, D, C, esc, listen, act, toast, shuffle, pick, fmt, byName, confirmBox, clearCol, setDoc, updateDoc, deleteDoc, addDoc,
  runTransaction, writeBatch, db, beep } from "./core.js";
import { TABU_CATS, tabuCard, tabuDeck, tabuCount } from "./data.js";

const DEF = { dur: 90, passes: 3, rounds: 1, cats: TABU_CATS.slice() };
const TEAM = ["A Takımı", "B Takımı"];
let GROUPS = [], MEMBERS = {}, memSubs = {}, MYG = null, lastState = "", ending = false, hostPick = {};

export function initTabu() {
  listen(C("tabu"), s => {
    GROUPS = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const ids = new Set(GROUPS.map(g => g.id));
    GROUPS.forEach(g => { if (!memSubs[g.id]) memSubs[g.id] = listen(C("tabu", g.id, "members"), ms => { MEMBERS[g.id] = ms.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderList(); renderMine(); }); });
    Object.keys(memSubs).forEach(id => { if (!ids.has(id)) { memSubs[id](); delete memSubs[id]; delete MEMBERS[id]; } });
    renderList(); renderMine();
  });
  listen(D("people", S.me.uid), s => { MYG = s.exists() ? s.data().tabuGroup || null : null; renderList(); renderMine(); });
  $("t-create").onclick = () => act(async () => {
    if (myGroup()) { $("t-note").textContent = "Zaten bir gruptasın. Önce ondan ayrıl."; return; }
    const name = $("t-newname").value.trim() || `${S.me.name} ve arkadaşları`;
    const ref = await addDoc(C("tabu"), { name, status: "pending", createdBy: S.me.uid, createdByName: S.me.name, createdAt: Date.now() });
    await join(ref.id); $("t-newname").value = ""; $("t-note").textContent = "";
  });
  $("t-list").onclick = e => { const b = e.target.closest("[data-a]"); if (b) listAction(b.dataset.a, b.dataset.id); };
  $("t-list").onchange = e => { const t = e.target; if (t.dataset.hostFor) hostPick[t.dataset.hostFor] = t.value; };
  $("t-my").onclick = e => { const b = e.target.closest("[data-a]"); if (b) myAction(b.dataset.a, b.dataset.v); };
  $("t-my").onchange = e => { const t = e.target; if (t.dataset.set) setting(t.dataset.set, +t.value); };
  setInterval(tick, 300);
}

const myGroup = () => GROUPS.find(g => g.id === MYG && (MEMBERS[g.id] || []).some(m => m.uid === S.me.uid)) || null;
async function join(id) {
  const b = writeBatch(db);
  b.set(D("tabu", id, "members", S.me.uid), { name: S.me.name, joinedAt: Date.now() });
  b.set(D("people", S.me.uid), { tabuGroup: id }, { merge: true });
  await b.commit();
}
const STATUS = { pending: "Moderatör onayı bekleniyor", approved: "Onaylandı · ayarlar yapılıyor", playing: "Oynanıyor", ended: "Bitti" };

function renderList() {
  const mine = myGroup();
  $("t-createbox").hidden = !!mine;
  $("t-list").innerHTML = GROUPS.length ? GROUPS.map(g => {
    const mem = MEMBERS[g.id] || [], isMine = mine && mine.id === g.id, btns = [];
    if (!mine && (g.status === "pending" || g.status === "approved")) btns.push(`<button class="btn small" data-a="join" data-id="${esc(g.id)}">Katıl</button>`);
    let approve = "";
    if (S.isMod && g.status === "pending") {
      const chosen = hostPick[g.id] && mem.some(m => m.uid === hostPick[g.id]) ? hostPick[g.id] : "";
      approve = `<div class="row" style="margin-top:8px"><select data-host-for="${esc(g.id)}" aria-label="Oyun yöneticisi" style="width:auto;flex:1;min-width:150px"><option value="">Oyun yöneticisini seç</option>${mem.map(m => `<option value="${esc(m.uid)}" ${chosen === m.uid ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select><button class="btn small" data-a="approve" data-id="${esc(g.id)}">Onayla</button></div>`;
    }
    if (S.isMod) btns.push(`<button class="btn ghost small" data-a="del" data-id="${esc(g.id)}">Sil</button>`);
    return `<li class="roomrow"><span style="flex:1"><b>${esc(g.name)}</b>${isMine ? ` <span class="r">senin grubun</span>` : ""}<br><span class="small">${esc(STATUS[g.status] || g.status)} · ${mem.length} kişi: ${esc(mem.map(m => m.name).join(", ") || "–")}${g.hostName ? ` · Yönetici: ${esc(g.hostName)}` : ""}</span>${approve}</span><span class="row">${btns.join("")}</span></li>`;
  }).join("") : `<li class="empty">Henüz grup yok. 4 ile 12 kişilik bir grup kurun.</li>`;
}
function listAction(a, id) {
  const g = GROUPS.find(x => x.id === id); if (!g) return;
  if (a === "join") return act(() => join(id));
  if (a === "approve") return act(async () => {
    const mem = MEMBERS[id] || [];
    if (mem.length < 4) { toast("Tabu iki takımla oynanır, grupta en az 4 kişi olmalı."); return; }
    const h = mem.find(m => m.uid === hostPick[id]);
    if (!h) { toast("Önce listeden oyun yöneticisini seç."); return; }
    await updateDoc(D("tabu", id), { status: "approved", hostUid: h.uid, hostName: h.name, approvedBy: S.me.name, settings: DEF });
  });
  if (a === "del") return confirmBox($("t-confirm"), `"${esc(g.name)}" grubu silinsin mi?`, async () => { await clearCol("tabu", id, "members"); await deleteDoc(D("tabu", id)); });
}

function setting(k, v) {
  const g = myGroup(); if (!g || g.hostUid !== S.me.uid) return;
  act(() => updateDoc(D("tabu", g.id), { settings: { ...DEF, ...(g.settings || {}), [k]: v } }));
}
// Takımları kur ve anlatma sırasını oluştur: A, B, A, B...
function buildOrder(mem) {
  const ps = shuffle(mem), A = ps.filter((_, i) => i % 2 === 0), B = ps.filter((_, i) => i % 2 === 1), out = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) { out.push({ ...A[i % A.length], team: 0 }); out.push({ ...B[i % B.length], team: 1 }); }
  return out.map(p => ({ uid: p.uid, name: p.name, team: p.team }));
}
const cur = g => g.order && g.order.length ? g.order[g.turnIdx % g.order.length] : null;
const teamOf = (g, uid) => { const o = (g.order || []).find(x => x.uid === uid); return o ? o.team : null; };
const teamMembers = (g, t) => { const seen = new Set(); return (g.order || []).filter(o => o.team === t && !seen.has(o.uid) && seen.add(o.uid)); };

function myAction(a, v) {
  const g = myGroup(); if (!g) return;
  const ref = D("tabu", g.id), st = { ...DEF, ...(g.settings || {}) };
  if (a === "leave") return act(async () => { await setDoc(D("people", S.me.uid), { tabuGroup: null }, { merge: true }); await deleteDoc(D("tabu", g.id, "members", S.me.uid)); });
  if (a === "cat") { const cats = st.cats.includes(v) ? st.cats.filter(c => c !== v) : [...st.cats, v]; return act(() => updateDoc(ref, { settings: { ...st, cats } })); }
  if (a === "shuffle") return act(() => updateDoc(ref, { order: buildOrder(MEMBERS[g.id] || []) }));
  if (a === "start") return act(async () => {
    const mem = MEMBERS[g.id] || [];
    if (mem.length < 4) { toast("Tabu için en az 4 kişi gerekli."); return; }
    if (!st.cats.length) { toast("En az bir kategori seç."); return; }
    const same = g.order && g.order.length && g.order.every(o => mem.some(m => m.uid === o.uid)) && mem.every(m => g.order.some(o => o.uid === m.uid));
    const order = same ? g.order : buildOrder(mem);
    await updateDoc(ref, { status: "playing", order, turnIdx: 0, totalTurns: order.length * st.rounds, scores: [0, 0], points: {},
      deck: shuffle(tabuDeck(st.cats)), pos: 0, turn: { state: "ready" } });
  });
  if (a === "go") return act(() => runTransaction(db, async tx => {
    const s = (await tx.get(ref)).data(); if (!s || s.status !== "playing" || s.turn.state !== "ready") return;
    const t = { ...DEF, ...(s.settings || {}) }, c = cur(s), checker = pick(teamMembers(s, 1 - c.team));
    tx.update(ref, { turn: { state: "live", endsAt: Date.now() + t.dur * 1000, passesLeft: t.passes, correct: 0, taboo: 0, skipped: 0, log: [],
      checkerUid: checker ? checker.uid : null, checkerName: checker ? checker.name : null } });
  }));
  if (a === "ok" || a === "pass" || a === "taboo") return act(() => runTransaction(db, async tx => {
    const s = (await tx.get(ref)).data(); if (!s || s.status !== "playing" || s.turn.state !== "live" || s.pos !== +v || Date.now() > s.turn.endsAt + 1500) return;
    const t = { ...s.turn, log: [...(s.turn.log || [])] }, c = cur(s), scores = [...(s.scores || [0, 0])], points = { ...(s.points || {}) };
    const card = tabuCard(s.deck[s.pos]);
    if (a === "pass") { if (t.passesLeft <= 0) return; t.passesLeft--; t.skipped++; }
    if (a === "ok") { t.correct++; scores[c.team]++; points[c.uid] = (points[c.uid] || 0) + 1; }
    if (a === "taboo") { t.taboo++; scores[c.team]--; }
    t.log.push({ w: card ? card.word : "?", r: a });
    let pos = s.pos + 1, deck = s.deck;
    if (pos >= deck.length) { deck = shuffle(deck); pos = 0; }
    tx.update(ref, { turn: t, scores, points, pos, deck });
  }));
  if (a === "next") return act(() => runTransaction(db, async tx => {
    const s = (await tx.get(ref)).data(); if (!s || s.status !== "playing" || s.turn.state !== "done") return;
    const idx = s.turnIdx + 1;
    if (idx >= s.totalTurns) tx.update(ref, { status: "ended", turn: { state: "done" } });
    else tx.update(ref, { turnIdx: idx, turn: { state: "ready" } });
  }));
  if (a === "again") return act(() => updateDoc(ref, { status: "approved", turn: null, order: null }));
}

function tick() {
  const g = myGroup(); if (!g || g.status !== "playing" || !g.turn) return;
  const el = $("t-timer");
  if (g.turn.state === "live") {
    const l = (g.turn.endsAt - Date.now()) / 1000;
    if (el) { el.textContent = fmt(l); el.classList.toggle("low", l <= 10); }
    if (l <= 0 && !ending) {
      ending = true;
      runTransaction(db, async tx => {
        const ref = D("tabu", g.id), s = (await tx.get(ref)).data();
        if (s && s.turn && s.turn.state === "live" && Date.now() >= s.turn.endsAt) tx.update(ref, { turn: { ...s.turn, state: "done" } });
      }).catch(e => console.warn(e)).finally(() => { ending = false; });
    }
  }
}

function cardHTML(card) {
  return `<div class="tcard"><span class="kicker">${esc(card.cat)}</span><div class="tword">${esc(card.word)}</div><span class="kicker">Yasaklı kelimeler</span><ul>${card.taboo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
}
function renderMine() {
  const box = $("t-my"), g = myGroup();
  if (!g) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  const mem = MEMBERS[g.id] || [], st = { ...DEF, ...(g.settings || {}) }, host = g.hostUid === S.me.uid;
  let h = `<div class="row spread"><span class="step">Grubun · ${esc(g.name)}</span>${g.hostName ? `<span class="how">Oyun yöneticisi: ${esc(g.hostName)}${host ? " (sen)" : ""}</span>` : ""}</div>`;
  if (g.status === "pending") {
    h += `<p class="big-status">Moderatör onayı bekleniyor</p><p class="how">Grubunuz toplanınca (en az 4 kişi) bir moderatöre haber verin. Moderatör onaylarken içinizden birini oyun yöneticisi yapacak.</p>`;
    h += `<div class="chips">${mem.map(m => `<span class="chip static">${esc(m.name)}</span>`).join("")}</div><button class="btn ghost small" data-a="leave">Gruptan ayrıl</button>`;
  }
  if (g.status === "approved") {
    h += `<p class="big-status">${host ? "Sen oyun yöneticisisin! Ayarları yap ve başlat." : `Ayarları <b>${esc(g.hostName)}</b> yapıyor.`}</p>`;
    const sel = (k, label, opts) => `<label>${label}<select data-set="${k}" ${host ? "" : "disabled"}>${opts.map(([v, l]) => `<option value="${v}" ${st[k] === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
    h += `<div class="two">${sel("dur", "Tur süresi", [[60, "60 saniye"], [90, "90 saniye"], [120, "120 saniye"], [150, "150 saniye"], [180, "180 saniye"]])}${sel("passes", "Pas hakkı (her tur)", [[0, "Yok"], [1, "1"], [2, "2"], [3, "3"], [5, "5"], [99, "Sınırsız"]])}</div>`;
    h += sel("rounds", "Herkes kaç kez anlatsın", [[1, "1 kez"], [2, "2 kez"], [3, "3 kez"]]);
    h += `<span class="how">Kategoriler</span><div class="chips">${TABU_CATS.map(c => `<button class="chip" data-a="cat" data-v="${esc(c)}" aria-pressed="${st.cats.includes(c)}" ${host ? "" : "disabled"}>${esc(c)} · ${tabuCount(c)}</button>`).join("")}</div>`;
    h += g.order ? `<div class="two">${[0, 1].map(t => `<div><b>${TEAM[t]}</b><p class="small">${esc(teamMembers(g, t).map(o => o.name).join(", "))}</p></div>`).join("")}</div>` : `<p class="how">Takımlar başlatınca rastgele kurulur. Önceden görmek için "Takımları karıştır"a bas.</p>`;
    h += `<div class="chips">${mem.map(m => `<span class="chip static">${esc(m.name)}</span>`).join("")}</div>`;
    if (host) h += `<div class="row"><button class="btn" data-a="start">Oyunu başlat</button><button class="btn ghost small" data-a="shuffle">Takımları karıştır</button></div>`;
    h += `<button class="btn ghost small" data-a="leave">Gruptan ayrıl</button>`;
  }
  if (g.status === "playing" && g.turn) {
    const c = cur(g), t = g.turn, myTeam = teamOf(g, S.me.uid), isTeller = c && c.uid === S.me.uid, isChecker = t.checkerUid === S.me.uid;
    h += `<div class="score2">${[0, 1].map(i => `<div class="${c && c.team === i ? "on" : ""}"><span class="small">${TEAM[i]}${myTeam === i ? " (sen)" : ""}</span><b>${(g.scores || [0, 0])[i]}</b></div>`).join("")}</div>`;
    h += `<p class="how">Tur ${g.turnIdx + 1}/${g.totalTurns}</p>`;
    if (t.state === "ready") {
      h += `<p class="big-status">Sıradaki anlatıcı: <b>${esc(c.name)}</b> (${TEAM[c.team]})</p>`;
      h += isTeller ? `<p class="how">Hazır olunca başlat. Kart sadece sende ve rakip takımdan bir kontrolcüde görünecek.</p>`
        : myTeam === c.team ? `<p class="how">${esc(c.name)} anlatacak, sen tahmin edeceksin.</p>` : `<p class="how">Rakip takım oynayacak. Kontrolcü olarak seçilirsen kartı göreceksin.</p>`;
      if (isTeller || host) h += `<button class="btn wide" data-a="go">Turu başlat</button>`;
    }
    if (t.state === "live") {
      const card = tabuCard(g.deck[g.pos]);
      h += `<div class="row spread"><span class="how">Bu tur: ${t.correct} doğru · ${t.taboo} tabu · pas ${t.passesLeft >= 99 ? "sınırsız" : t.passesLeft}</span><span class="clock" id="t-timer"></span></div>`;
      if (isTeller && card) {
        h += cardHTML(card) + `<p class="how">Kelimeyi takımına anlat ama yasaklı kelimeleri ve kelimenin kendisini söyleme. Bilince "Bildi"ye bas.</p>`;
        h += `<div class="stage-actions"><button class="btn ghost" data-a="pass" data-v="${g.pos}" ${t.passesLeft <= 0 ? "disabled" : ""}>Pas</button><button class="btn" data-a="ok" data-v="${g.pos}">Bildi</button></div>`;
      } else if (isChecker && card) {
        h += `<p class="note"><b>Kontrolcü sensin!</b> ${esc(c.name)} yasaklı bir kelime söylerse "Tabu!"ya bas.</p>` + cardHTML(card);
        h += `<div class="stage-actions" style="grid-template-columns:1fr"><button class="btn taboo" data-a="taboo" data-v="${g.pos}">Tabu!</button></div>`;
      } else if (myTeam === c.team) {
        h += `<div class="card back"><span class="kicker">Tahmin et</span><div class="big">${esc(c.name)} anlatıyor. Dinle ve kelimeyi bul!</div></div>`;
      } else {
        h += `<div class="card back"><span class="kicker">Rakip takım oynuyor</span><div class="big">${esc(c.name)} anlatıyor.</div><div class="who">Kontrolcü: ${esc(t.checkerName || "–")}</div></div>`;
      }
    }
    if (t.state === "done") {
      h += `<p class="big-status">Süre doldu!</p><p class="how">${esc(c.name)} bu turda ${t.correct || 0} kelime anlattı${t.taboo ? `, ${t.taboo} tabu` : ""}${t.skipped ? `, ${t.skipped} pas` : ""}.</p>`;
      h += `<ul class="list">${(t.log || []).map(x => `<li><span>${esc(x.w)}</span><span class="${x.r === "taboo" ? "r" : ""}">${x.r === "ok" ? "Bildi" : x.r === "pass" ? "Pas" : "Tabu"}</span></li>`).join("")}</ul>`;
      h += `<button class="btn wide" data-a="next">${g.turnIdx + 1 >= g.totalTurns ? "Sonuçları göster" : "Sıradaki tur"}</button>`;
    }
    if (lastState && lastState !== t.state) beep(t.state === "done" ? 520 : 880, .3);
    lastState = t.state;
  }
  if (g.status === "ended") {
    const sc = g.scores || [0, 0], pts = Object.entries(g.points || {}).map(([uid, p]) => ({ name: ((g.order || []).find(o => o.uid === uid) || {}).name || "?", p })).sort((a, b) => b.p - a.p);
    h += `<p class="big-status">${sc[0] === sc[1] ? `Berabere! (${sc[0]} - ${sc[1]})` : `<b>${TEAM[sc[0] > sc[1] ? 0 : 1]}</b> kazandı! (${sc[0]} - ${sc[1]})`}</p>`;
    h += `<span class="how">En iyi anlatanlar</span><ul class="list">${pts.map(x => `<li><span>${esc(x.name)}</span><span>${x.p} kelime</span></li>`).join("") || "<li>Kimse kelime anlatamadı.</li>"}</ul>`;
    h += `<div class="row">${host ? `<button class="btn" data-a="again">Yeniden oyna</button>` : ""}<button class="btn ghost small" data-a="leave">Gruptan ayrıl</button></div>`;
  }
  box.innerHTML = h; tick();
}
