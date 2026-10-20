// TECH BINGO: moderatör başlatır, herkes kendi kartını doldurur. Kutulara sadece giriş yapmış katılımcılar yazılabilir.
// İlk üç bingo yapan sabit kazanandır (sıra sunucu saatine göre).
import { S, $, D, C, esc, listen, act, shuffle, ms, byName, lower, confirmBox, btnRow, onPeople, PEOPLE, onGame, setGame, clearCol,
  writeBatch, db, serverTimestamp } from "./core.js";
import { BINGO } from "./data.js";

const LINES = [];
for (let i = 0; i < 4; i++) { LINES.push([0, 1, 2, 3].map(k => i * 4 + k)); LINES.push([0, 1, 2, 3].map(k => k * 4 + i)); }
LINES.push([0, 5, 10, 15], [3, 6, 9, 12]);
const countLines = cells => LINES.filter(l => l.every(i => cells[i] && cells[i].u)).length;

let G = { status: "off" }, CARD = null, cardLoaded = false, WINS = [], sel = -1, creating = false, ALL = [], view = null;

export function initBingo() {
  onGame("bingo", g => { G = g; ensureCard(); render(); renderMod(); });
  listen(D("bingoCards", S.me.uid), s => { CARD = s.exists() ? s.data() : null; cardLoaded = true; ensureCard(); render(); });
  listen(C("bingoWins"), s => { WINS = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => ms(a.at) - ms(b.at)); renderWins(); renderMod(); });
  onPeople(() => { if (sel >= 0) renderPicker(); });

  $("b-grid").onclick = e => {
    const b = e.target.closest(".cell"); if (!b || G.status !== "running" || !CARD) return;
    sel = +b.dataset.i; $("b-search").value = ""; $("b-note").textContent = "";
    $("b-pick").hidden = false; renderPicker(); render(); $("b-search").focus();
  };
  $("b-search").oninput = renderPicker;
  $("b-opts").onclick = e => { const b = e.target.closest("[data-uid]"); if (b) choose(b.dataset.uid); };
  $("b-clear").onclick = () => { if (sel < 0) return; const cells = CARD.cells.map((x, i) => i === sel ? { ...x, n: "", u: "" } : x); closePicker(); save(cells); };
  $("b-close").onclick = closePicker;

  if (S.isMod) {
    $("bm-actions").onclick = e => { const b = e.target.closest("[data-act]"); if (b) modAction(b.dataset.act); };
    $("bm-rows").onclick = e => { const tr = e.target.closest("tr[data-uid]"); if (!tr) return; view = view === tr.dataset.uid ? null : tr.dataset.uid; renderMod(); };
    listen(C("bingoCards"), s => { ALL = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMod(); });
  }
}

async function ensureCard() {
  if (G.status !== "running" || creating || !cardLoaded) return;
  if (CARD && CARD.round === G.round) return;
  creating = true;
  await act(() => writeBatch(db).set(D("bingoCards", S.me.uid), {
    name: S.me.name, round: G.round || 0, cells: shuffle(BINGO).slice(0, 16).map(t => ({ t, n: "", u: "" })), lines: 0, filled: 0, updatedAt: serverTimestamp()
  }).commit());
  creating = false;
}
function closePicker() { sel = -1; $("b-pick").hidden = true; render(); }
function renderPicker() {
  if (sel < 0 || !CARD) return;
  $("b-q").textContent = CARD.cells[sel].t;
  const used = new Set(CARD.cells.filter((x, i) => i !== sel && x.u).map(x => x.u));
  const q = lower($("b-search").value.trim());
  const list = PEOPLE.filter(p => p.uid !== S.me.uid && !used.has(p.uid) && (!q || lower(p.name).includes(q)));
  $("b-opts").innerHTML = list.length
    ? list.slice(0, 60).map(p => `<button class="pbtn" data-uid="${esc(p.uid)}">${esc(p.name)}</button>`).join("")
    : `<p class="empty">${q ? "Bu adla giriş yapmış kimse yok. Kişiden siteye giriş yapmasını iste." : "Henüz başka katılımcı yok."}</p>`;
}
function choose(uid) {
  const p = PEOPLE.find(x => x.uid === uid); if (!p || sel < 0) return;
  if (CARD.cells.some((x, i) => i !== sel && x.u === uid)) { $("b-note").textContent = "Bu kişi zaten başka bir kutuda. Her kutuya farklı biri."; return; }
  const cells = CARD.cells.map((x, i) => i === sel ? { ...x, n: p.name, u: p.uid } : x);
  closePicker(); save(cells);
}
function save(cells) {
  const lines = countLines(cells), filled = cells.filter(c => c.u).length;
  const won = WINS.some(w => w.uid === S.me.uid);
  act(async () => {
    const b = writeBatch(db);
    b.set(D("bingoCards", S.me.uid), { name: S.me.name, round: G.round || 0, cells, lines, filled, updatedAt: serverTimestamp() });
    if (lines > 0 && !won) b.set(D("bingoWins", S.me.uid), { name: S.me.name, round: G.round || 0, at: serverTimestamp() });
    await b.commit();
  });
}

function grid(cells, interactive, s) {
  return cells.map((x, i) => `<button class="cell${x.u ? " done" : ""}${i === s ? " sel" : ""}" data-i="${i}" ${interactive ? "" : "disabled"}>
    <span>${esc(x.t)}</span><span class="nm">${x.u ? esc(x.n) : interactive ? "+ kişi seç" : "–"}</span></button>`).join("");
}
function render() {
  const st = G.status || "off", show = (st === "running" || st === "ended") && CARD && CARD.round === G.round;
  $("b-status").innerHTML = st === "off" ? "Oyun henüz başlamadı. Moderatör başlatınca kartın burada açılacak."
    : st === "ended" ? "Oyun bitti. Kazananlar aşağıda." : show ? "Oyun başladı! Odayı dolaş, kutulara uyan kişileri bul." : "Kartın hazırlanıyor…";
  $("b-cardwrap").hidden = !show;
  if (!show) { $("b-pick").hidden = true; sel = -1; return; }
  $("b-grid").innerHTML = grid(CARD.cells, st === "running", sel);
  const filled = CARD.cells.filter(x => x.u).length, lines = countLines(CARD.cells);
  $("b-count").textContent = filled;
  const m = $("b-msg"), rank = WINS.findIndex(w => w.uid === S.me.uid);
  if (rank >= 0 && rank < 3) { m.hidden = false; m.textContent = `BİNGO! ${rank + 1}. oldun, ödülün seni bekliyor.`; }
  else if (rank >= 3) { m.hidden = false; m.textContent = "BİNGO! İlk üç doldu ama tebrikler."; }
  else if (lines > 0) { m.hidden = false; m.textContent = "BİNGO!"; }
  else m.hidden = true;
}
function renderWins() {
  const top = WINS.slice(0, 3), rest = WINS.slice(3);
  $("b-podium").innerHTML = top.length
    ? top.map((w, i) => `<li><span class="place">${i + 1}.</span><b>${esc(w.name)}</b>${w.uid === S.me.uid ? `<span class="r">sen</span>` : ""}</li>`).join("")
    : `<li class="empty">İlk üç bingo yapan kazanır. Henüz kimse yapmadı.</li>`;
  $("b-others").innerHTML = rest.length ? `<p class="how">Ardından bingo yapanlar</p><ul class="list">${rest.map((w, i) => `<li><span>${i + 4}. ${esc(w.name)}</span></li>`).join("")}</ul>` : "";
  render();
}

function modAction(a) {
  const box = $("bm-confirm");
  if (a === "start") return confirmBox(box, "Bingo başlasın mı? Herkesin kartı açılacak.", async () => {
    await clearCol("bingoWins"); await clearCol("bingoCards"); await setGame("bingo", { status: "running", round: Date.now(), startedAt: Date.now() });
  });
  if (a === "end") return confirmBox(box, "Oyun bitsin mi? Kartlar kilitlenecek.", () => setGame("bingo", { status: "ended" }));
  if (a === "resume") return act(() => setGame("bingo", { status: "running" }));
  if (a === "off") return confirmBox(box, "Oyun kapanacak ve tüm kartlar silinecek.", async () => {
    await setGame("bingo", { status: "off" }); await clearCol("bingoWins"); await clearCol("bingoCards");
  });
}
function renderMod() {
  if (!S.isMod) return;
  const st = G.status || "off";
  $("bm-actions").innerHTML = btnRow(st === "off" ? [["start", "Bingoyu başlat"]]
    : st === "running" ? [["end", "Oyunu bitir"], ["start", "Baştan başlat", "ghost"], ["off", "Kapat", "ghost"]]
    : [["resume", "Devam ettir"], ["start", "Yeni oyun başlat", "ghost"], ["off", "Kapat", "ghost"]]);
  const cards = ALL.filter(c => c.round === G.round);
  const winRank = {}; WINS.forEach((w, i) => winRank[w.uid] = i + 1);
  const rows = cards.slice().sort((a, b) => (winRank[a.uid] || 999) - (winRank[b.uid] || 999) || (b.filled || 0) - (a.filled || 0) || byName(a, b));
  $("bm-count").textContent = cards.length;
  $("bm-rows").innerHTML = rows.length ? rows.map(r => `<tr class="click" data-uid="${esc(r.uid)}"><td>${esc(r.name)}</td><td>${r.filled || 0}/16</td><td class="${winRank[r.uid] ? "bad" : ""}">${winRank[r.uid] ? winRank[r.uid] + ". bingo" : "–"}</td></tr>`).join("")
    : `<tr><td colspan="3">${st === "off" ? "Oyun başlamadı." : "Henüz kimse kartını açmadı."}</td></tr>`;
  const v = cards.find(x => x.uid === view), box = $("bm-view");
  if (v) { box.hidden = false; box.innerHTML = `<p class="how"><strong>${esc(v.name)}</strong> adlı kişinin kartı</p><div class="bingo">${grid(v.cells || [], false, -1)}</div>`; }
  else box.hidden = true;
}
