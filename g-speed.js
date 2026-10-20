// HIZ TANIŞMASI: soru ve süre herkesin ekranında aynı anda görünür. Turları moderatörün sayfası ilerletir.
import { S, $, D, esc, listen, act, fmt, pick, keepAwake, releaseAwake, initAudio, beep, setDoc, updateDoc, runTransaction, db } from "./core.js";
import { QS } from "./data.js";

let SPS = null, advancing = false, lastKey = "", cats = Object.keys(QS);

const HINT = {
  idle: "Moderatör başlatınca ilk soru burada çıkacak. Şimdilik halkanı bul: iç halka mı, dış halka mı?",
  talk: "Önce adlarınızı söyleyin. Sonra soruyu ikiniz de cevaplayın. Süre bitene kadar sohbet edin.",
  switch: "Dış halkadaysan bir kişi sağına kay. İç halkadaysan yerinde kal. Yeni eşine merhaba de!",
  done: "Bitti! Konuştuğun kişilerden aklında kalanları bir düşün."
};

function left() { if (!SPS || !SPS.running) return 0; return SPS.paused ? (SPS.leftMs || 0) / 1000 : (SPS.endsAt - Date.now()) / 1000; }
function pickQ(s) {
  const pool = (s.cats || []).flatMap(c => (QS[c] || []).map(q => ({ q, c })));
  let used = s.used || [], avail = pool.filter(x => !used.includes(x.q));
  if (!avail.length) { avail = pool; used = []; }
  const x = pick(avail); return { q: x.q, cat: x.c, used: [...used, x.q] };
}
function next(s) {
  const now = Date.now();
  if (s.phase === "talk") {
    if (s.round >= s.total) return { ...s, running: false, phase: "done", paused: false };
    return { ...s, phase: "switch", endsAt: now + s.sw * 1000, paused: false, leftMs: 0 };
  }
  const p = pickQ(s);
  return { ...s, phase: "talk", round: s.round + 1, endsAt: now + s.dur * 1000, paused: false, leftMs: 0, q: p.q, cat: p.cat, used: p.used };
}
async function advance(force) {
  if (advancing || !SPS) return; advancing = true;
  const round = SPS.round, phase = SPS.phase;
  try {
    await runTransaction(db, async tx => {
      const ref = D("speed", "state"); const snap = await tx.get(ref); if (!snap.exists()) return;
      const s = snap.data();
      if (!s.running || s.round !== round || s.phase !== phase) return;
      if (!force && (s.paused || Date.now() < s.endsAt)) return;
      tx.set(ref, next(s));
    });
  } catch (e) { console.warn(e); }
  advancing = false;
}

function render() {
  const s = SPS;
  let round = "Bekleniyor", cat = "", q = "Moderatör başlatınca soru burada çıkacak.", sw = false, hint = HINT.idle;
  if (s && s.running) {
    round = `Tur ${s.round}/${s.total}`;
    if (s.phase === "talk") { cat = s.cat || ""; q = s.q || ""; hint = HINT.talk; }
    else { sw = true; q = "Değiş! Dış halka bir kişi sağa kaysın."; cat = `Sıradaki: Tur ${s.round + 1}`; hint = HINT.switch; }
    if (s.paused) round += " · Duraklatıldı";
  } else if (s && s.phase === "done") { round = "Bitti"; q = `Hız tanışması bitti. ${s.round} tur oynandı, sağ olun!`; hint = HINT.done; }
  for (const [a, b] of [["sp-round", "so-round"], ["sp-cat", "so-cat"], ["sp-hint", "so-hint"]]) {
    const v = a === "sp-round" ? round : a === "sp-cat" ? cat : hint; $(a).textContent = v; $(b).textContent = v;
  }
  $("sp-q").textContent = q; $("so-q").textContent = q;
  $("sp-q").className = "sq" + (sw ? " switch" : ""); $("so-q").className = "word q" + (sw ? " switch" : "");
  const pl = s && s.paused ? "Devam" : "Duraklat"; $("s-pause").textContent = pl; $("so-pause").textContent = pl;
  const key = s ? `${s.round}|${s.phase}` : "";
  if (key !== lastKey) { if (lastKey && s && s.running) beep(s.phase === "talk" ? 880 : 520, .35); else if (lastKey && s && s.phase === "done") beep(660, .6); lastKey = key; }
  tick();
}
function tick() {
  const s = SPS, l = left();
  const t = s && s.running ? fmt(l) : "–:––";
  const len = s && s.running ? (s.phase === "talk" ? s.dur : s.sw) : 1;
  const low = !!(s && s.running && s.phase === "talk" && l <= 10);
  for (const id of ["sp-timer", "so-timer"]) { $(id).textContent = t; $(id).classList.toggle("low", low); }
  const sc = `scaleX(${s && s.running ? Math.max(0, Math.min(1, l / len)) : 0})`;
  $("sp-bar").style.transform = sc; $("so-bar").style.transform = sc;
  if (S.isMod && s && s.running && !s.paused && Date.now() >= s.endsAt) advance(false);
}

export function initSpeed() {
  listen(D("speed", "state"), s => { SPS = s.exists() ? s.data() : null; render(); });
  setInterval(tick, 250);
  $("sp-full").onclick = () => { $("s-stage").hidden = false; keepAwake(); };
  $("so-close").onclick = () => { $("s-stage").hidden = true; releaseAwake(); };
  if (!S.isMod) return;
  const renderCats = () => { $("s-cats").innerHTML = Object.keys(QS).map(c => `<button class="chip" aria-pressed="${cats.includes(c)}" data-cat="${esc(c)}">${esc(c)} · ${QS[c].length}</button>`).join(""); };
  $("s-cats").onclick = e => { const b = e.target.closest("[data-cat]"); if (!b) return; const c = b.dataset.cat; cats = cats.includes(c) ? cats.filter(x => x !== c) : [...cats, c]; renderCats(); };
  renderCats();
  $("s-start").onclick = () => act(async () => {
    if (!cats.length) { $("s-note").textContent = "En az bir soru türü seç."; return; }
    initAudio(); $("s-note").textContent = "";
    const base = { running: true, round: 0, total: +$("s-rounds").value, dur: +$("s-dur").value, sw: +$("s-switch").value, cats, used: [], phase: "switch", paused: false, leftMs: 0, endsAt: 0 };
    await setDoc(D("speed", "state"), next(base));
    keepAwake();
  });
  const pause = () => act(async () => {
    if (!SPS || !SPS.running) return;
    if (SPS.paused) await updateDoc(D("speed", "state"), { paused: false, endsAt: Date.now() + (SPS.leftMs || 0) });
    else await updateDoc(D("speed", "state"), { paused: true, leftMs: Math.max(0, SPS.endsAt - Date.now()) });
  });
  const skip = () => act(async () => { if (!SPS || !SPS.running || SPS.phase !== "talk") return; const p = pickQ(SPS); await updateDoc(D("speed", "state"), { q: p.q, cat: p.cat, used: p.used }); });
  const nxt = () => { if (SPS && SPS.running) advance(true); };
  $("s-pause").onclick = pause; $("so-pause").onclick = pause;
  $("s-skip").onclick = skip; $("so-skip").onclick = skip;
  $("s-next").onclick = nxt; $("so-next").onclick = nxt;
  $("s-stop").onclick = () => act(() => SPS && updateDoc(D("speed", "state"), { running: false, phase: "done", paused: false }));
}
