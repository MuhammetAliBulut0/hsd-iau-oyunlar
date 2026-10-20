// 2 DOĞRU 1 YALAN: önce herkes cümlelerini yazar. Moderatör iki moddan birini başlatır:
//  Sahne modu: moderatör birini sahneye çağırır, cümleleri herkesin telefonunda çıkar, herkes oy verir.
//  Avcı modu: herkese başka birinin cümleleri düşer; o kişiyi bulup konuşarak yalanı tahmin eder.
import { S, $, D, C, esc, listen, act, toast, shuffle, pick, sattolo, byName, confirmBox, btnRow, onGame, setGame, clearCol,
  getDoc, getDocs, setDoc, updateDoc, query, where, writeBatch, db } from "./core.js";

let G = { status: "off" }, MINE = null, STAGE = null, HUNT = null, GUESS = null, RESULTS = [];
let SUBS = [], VOTES = [], GUESSES = [], vUnsub = null, vRound = null, myVote = {};

export function initLie() {
  onGame("lie", g => { G = g; render(); renderMod(); });
  listen(D("lieSubs", S.me.uid), s => { MINE = s.exists() ? s.data() : null; fillForm(); render(); });
  listen(D("lieStage", "current"), s => { STAGE = s.exists() ? s.data() : null; if (S.isMod) watchVotes(); render(); renderMod(); });
  listen(D("lieHunt", S.me.uid), s => { HUNT = s.exists() ? s.data() : null; render(); });
  listen(D("lieGuess", S.me.uid), s => { GUESS = s.exists() ? s.data() : null; render(); });
  listen(C("lieResults"), s => { RESULTS = s.docs.map(d => d.data()); render(); });
  $("l-send").onclick = () => act(async () => {
    const s = [0, 1, 2].map(i => $("l-s" + i).value.trim()), r = document.querySelector('input[name="l-lie"]:checked');
    if (s.some(x => !x)) { $("l-note").textContent = "Üç cümleyi de yaz."; return; }
    if (!r) { $("l-note").textContent = "Hangisinin yalan olduğunu işaretle."; return; }
    await setDoc(D("lieSubs", S.me.uid), { name: S.me.name, s, lie: +r.value, status: "ok", played: false, at: Date.now() });
    $("l-note").innerHTML = "Gönderildi. Moderatör oyunu başlatınca <b>oylama</b> başlayacak.";
  });
  $("l-opts").onclick = e => {
    const b = e.target.closest("[data-i]"); if (!b || !STAGE || !STAGE.open || STAGE.uid === S.me.uid) return;
    const round = STAGE.round, choice = +b.dataset.i;
    act(async () => { await setDoc(D("lieVotes", round + "_" + S.me.uid), { round, uid: S.me.uid, choice }); myVote[round] = choice; render(); });
  };
  $("l-hunt").onclick = e => {
    const b = e.target.closest("[data-i]"); if (!b || G.status !== "hunt" || !HUNT) return;
    act(() => setDoc(D("lieGuess", S.me.uid), { choice: +b.dataset.i, targetUid: HUNT.targetUid, at: Date.now() }));
  };
  if (S.isMod) {
    listen(C("lieSubs"), s => { SUBS = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderMod(); });
    listen(C("lieGuess"), s => { GUESSES = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMod(); });
    $("lm-actions").onclick = e => { const b = e.target.closest("[data-act]"); if (b) modAction(b.dataset.act); };
    $("lm-subs").onclick = e => {
      const st = e.target.closest("[data-stage]"); if (st) return stageOne(st.dataset.stage);
      const rm = e.target.closest("[data-rm]"); if (rm) act(() => updateDoc(D("lieSubs", rm.dataset.rm), { status: "removed" }));
    };
  }
}

function fillForm() {
  if (!MINE) { ["l-s0", "l-s1", "l-s2", "l-r0", "l-r1", "l-r2", "l-send"].forEach(id => $(id).disabled = false); return; }
  if (!$("l-s0").value && !$("l-s1").value && !$("l-s2").value && MINE.status === "ok") {
    [0, 1, 2].forEach(i => $("l-s" + i).value = MINE.s[i] || ""); const r = $("l-r" + MINE.lie); if (r) r.checked = true;
  }
  const lock = !!MINE.played;
  ["l-s0", "l-s1", "l-s2", "l-r0", "l-r1", "l-r2", "l-send"].forEach(id => $(id).disabled = lock);
}

function render() {
  const st = G.status || "off";
  $("l-status").textContent = {
    off: "Oyun henüz açılmadı. Moderatör açınca 2 doğru 1 yalan yazacaksın.",
    collect: "Cümleler toplanıyor. Kendin hakkında 2 doğru 1 yalan yaz ve oyunun başlamasını bekle.",
    stage: "Sahne modu: moderatör sırayla birini sahneye çağırıyor. Cümleler çıkınca yalanı oyla.",
    hunt: "Avcı modu: hedefindeki kişiyi bul, onunla konuş ve yalanını tahmin et.",
    huntDone: "Avcı modu bitti. Sonuçlar aşağıda.",
    ended: "Oyun bitti. Teşekkürler!"
  }[st] || "";
  const canWrite = st === "collect" || st === "stage";
  $("l-form").hidden = !canWrite;
  const ms = $("l-minesub");
  ms.innerHTML = !MINE ? (canWrite ? `<p class="how">Oyuna katılmak için cümlelerini gönder.</p>` : "")
    : MINE.status === "removed" ? `<p class="note"><b>Moderatör cümlelerini kaldırdı.</b> Lütfen başka cümleler yaz.</p>`
    : MINE.played ? `<p class="how">${MINE.played === "stage" ? "Şu an <b>sahnedesin</b>!" : "Senin turun oynandı."}</p>`
    : `<p class="how">Cümlelerin gönderildi.${st === "collect" ? " İstersen değiştirebilirsin." : ""}</p>`;
  $("l-stagebox").hidden = st !== "stage";
  if (st === "stage") renderStage();
  $("l-huntbox").hidden = !(st === "hunt" || st === "huntDone");
  if (!$("l-huntbox").hidden) renderHunt();
  renderBoard();
}

function renderStage() {
  const s = STAGE;
  if (!s || !s.round) { $("l-who").textContent = "Sahne boş. Moderatör birini çağıracak."; $("l-opts").innerHTML = ""; $("l-result").textContent = ""; return; }
  const mine = s.uid === S.me.uid, rev = s.revealed != null, my = myVote[s.round];
  $("l-who").innerHTML = `<b>${esc(s.name)}</b> sahnede${mine ? " (sen!)" : ""}`;
  const counts = rev ? (s.tally || [0, 0, 0]) : S.isMod ? [0, 1, 2].map(i => VOTES.filter(v => v.choice === i).length) : null;
  $("l-opts").innerHTML = s.items.map((t, i) => `<button class="opt${rev && i !== s.revealed ? " dim" : ""}" data-i="${i}" aria-pressed="${my === i}" ${!s.open || mine ? "disabled" : ""}>
    <span class="letter">${"ABC"[i]}</span><p>${esc(t)}${rev ? `<span class="tag ${i === s.revealed ? "lie" : "truth"}">${i === s.revealed ? "Yalan" : "Doğru"}</span>` : ""}</p><span class="cnt">${counts ? counts[i] : ""}</span></button>`).join("");
  let msg;
  if (rev) { const total = (s.tally || []).reduce((a, b) => a + b, 0), fooled = total - (s.tally ? s.tally[s.revealed] : 0); msg = total ? `Oy verenlerin <b>%${Math.round(fooled / total * 100)}</b>'i kandırıldı (${fooled}/${total}).` : "Kimse oy vermedi."; }
  else if (mine) msg = "Herkes senin yalanını arıyor. Poker yüzünü tak!";
  else if (my != null) msg = `Oyun: <b>${"ABC"[my]}</b>. Moderatör açıklayana kadar değiştirebilirsin.`;
  else msg = `${esc(s.name)} kişisine bak, dinle ve hangisinin yalan olduğunu oyla.`;
  if (S.isMod && !rev) msg += ` · ${VOTES.length} oy geldi`;
  $("l-result").innerHTML = msg;
}

function renderHunt() {
  const st = G.status, el = $("l-hunt");
  if (!HUNT) { el.innerHTML = `<p class="how">Bu tura katılmadın. Bir sonraki turda cümlelerini erkenden gönder.</p>`; return; }
  const rev = HUNT.revealed != null, g = GUESS && GUESS.targetUid === HUNT.targetUid ? GUESS.choice : null;
  let h = `<p class="big-status">Hedefin: <b>${esc(HUNT.targetName)}</b></p>`;
  if (!rev) h += `<p class="how">${esc(HUNT.targetName)} kişisini bul, kendini tanıt ve sohbet et. Doğrudan "hangisi yalan" diye sorma, konuşarak anlamaya çalış. Sonra tahminini işaretle, istediğin zaman değiştirebilirsin.</p>`;
  h += `<div class="opts">${HUNT.items.map((t, i) => `<button class="opt${rev && i !== HUNT.revealed ? " dim" : ""}" data-i="${i}" aria-pressed="${g === i}" ${st !== "hunt" ? "disabled" : ""}><span class="letter">${"ABC"[i]}</span><p>${esc(t)}${rev ? `<span class="tag ${i === HUNT.revealed ? "lie" : "truth"}">${i === HUNT.revealed ? "Yalan" : "Doğru"}</span>` : ""}</p><span class="cnt">${g === i ? "Tahminin" : ""}</span></button>`).join("")}</div>`;
  if (rev) h += `<p class="note">${HUNT.correct ? "<b>Doğru bildin!</b> Tam bir dedektifsin." : g == null ? "Tahmin yapmadın." : "Bilemedin, iyi kandırdı!"}</p>`;
  const row = st === "huntDone" && G.hunt ? (G.hunt.rows || []).find(r => r.uid === S.me.uid) : null;
  if (row) h += `<p class="how">Seni <b>${esc(row.hunterName)}</b> avladı ve yalanını ${row.correct ? "buldu." : "bulamadı. Tebrikler!"}</p>`;
  el.innerHTML = h;
}

function renderBoard() {
  const st = G.status;
  let h = "";
  if (RESULTS.length) h += `<span class="how">Sahne modu: en iyi kandıranlar</span><ul class="list">${RESULTS.slice().sort((a, b) => (b.total ? b.fooled / b.total : 0) - (a.total ? a.fooled / a.total : 0)).map(x => `<li><b>${esc(x.name)}</b><span>${x.total ? `%${Math.round(x.fooled / x.total * 100)} kandırdı (${x.fooled}/${x.total})` : "oy yok"}</span></li>`).join("")}</ul>`;
  if ((st === "huntDone" || st === "ended") && G.hunt) {
    const rows = G.hunt.rows || [];
    h += `<span class="how">Avcı modu: yalanını bulanlar (${rows.filter(r => r.correct).length}/${rows.length})</span><ul class="list">${rows.map(r => `<li><span>${esc(r.hunterName)} → ${esc(r.name)}</span><span class="${r.correct ? "" : "r"}">${r.correct ? "Buldu" : "Kandırıldı"}</span></li>`).join("")}</ul>`;
  }
  $("l-board").innerHTML = h || `<p class="empty">Sonuçlar oyun ilerledikçe burada görünecek.</p>`;
}

/* ---------- moderatör ---------- */
function watchVotes() {
  const r = STAGE && STAGE.round;
  if (r === vRound) return; vRound = r;
  if (vUnsub) { vUnsub(); vUnsub = null; } VOTES = [];
  if (r) vUnsub = listen(query(C("lieVotes"), where("round", "==", r)), s => { VOTES = s.docs.map(d => d.data()); render(); renderMod(); });
}
function stageOne(uid) {
  act(async () => {
    const x = SUBS.find(q => q.uid === uid); if (!x) return;
    if (STAGE && STAGE.round && STAGE.revealed == null) { toast("Önce sahnedeki kişinin yalanını açıkla ya da sahneyi boşalt."); return; }
    const order = shuffle([0, 1, 2]), items = order.map(i => x.s[i]), lieIdx = order.indexOf(x.lie), round = Date.now().toString(36);
    const b = writeBatch(db);
    b.set(D("lieStageSecret", "current"), { round, uid, lieIdx });
    b.set(D("lieStage", "current"), { round, uid, name: x.name, items, open: true, revealed: null, tally: null });
    b.update(D("lieSubs", uid), { played: "stage" });
    await b.commit();
  });
}
async function startHunt() {
  const ok = shuffle(SUBS.filter(s => s.status === "ok"));
  if (ok.length < 2) throw new Error("En az 2 kişinin cümle göndermiş olması gerekiyor.");
  await clearCol("lieGuess"); await clearCol("lieHunt");
  const p = sattolo(ok.length), b = writeBatch(db);
  ok.forEach((h, i) => { const t = ok[p[i]]; b.set(D("lieHunt", h.uid), { targetUid: t.uid, targetName: t.name, hunterName: h.name, items: shuffle(t.s), revealed: null, correct: null }); });
  await b.commit();
  await setGame("lie", { status: "hunt", hunt: null });
}
async function revealHunt() {
  const hs = (await getDocs(C("lieHunt"))).docs.map(d => ({ uid: d.id, ...d.data() }));
  const subs = {}; SUBS.forEach(s => subs[s.uid] = s);
  const guess = {}; GUESSES.forEach(g => guess[g.uid] = g);
  const b = writeBatch(db), rows = [];
  hs.forEach(h => {
    const t = subs[h.targetUid]; if (!t) return;
    const lieIdx = h.items.indexOf(t.s[t.lie]), g = guess[h.uid] && guess[h.uid].targetUid === h.targetUid ? guess[h.uid].choice : null, correct = g === lieIdx;
    b.update(D("lieHunt", h.uid), { revealed: lieIdx, correct });
    rows.push({ uid: h.targetUid, name: h.targetName, hunterName: h.hunterName, correct });
  });
  await b.commit();
  await setGame("lie", { status: "huntDone", hunt: { rows } });
}
function modAction(a) {
  const box = $("lm-confirm");
  if (a === "collect") return act(() => setGame("lie", { status: "collect" }));
  if (a === "stage") return act(() => setGame("lie", { status: "stage" }));
  if (a === "hunt") return confirmBox(box, `Avcı modu başlasın mı? ${SUBS.filter(s => s.status === "ok").length} kişiye birer hedef verilecek.`, startHunt);
  if (a === "huntreveal") return confirmBox(box, "Tahminler kapanıp sonuçlar açıklansın mı?", revealHunt);
  if (a === "random") { const w = SUBS.filter(x => x.status === "ok" && !x.played); if (!w.length) return toast("Sırada kimse yok."); return stageOne(pick(w).uid); }
  if (a === "reveal") return act(async () => {
    if (!STAGE || !STAGE.round || STAGE.revealed != null) { toast("Sahnede açıklanacak bir tur yok."); return; }
    const sec = (await getDoc(D("lieStageSecret", "current"))).data();
    if (!sec || sec.round !== STAGE.round) { toast("Bu turun cevabı bulunamadı."); return; }
    const vs = (await getDocs(query(C("lieVotes"), where("round", "==", STAGE.round)))).docs.map(d => d.data());
    const t = [0, 0, 0]; vs.forEach(v => { if (t[v.choice] != null) t[v.choice]++; });
    const total = vs.length, fooled = total - t[sec.lieIdx], b = writeBatch(db);
    b.update(D("lieStage", "current"), { open: false, revealed: sec.lieIdx, tally: t });
    b.set(D("lieResults", STAGE.uid), { name: STAGE.name, fooled, total });
    b.update(D("lieSubs", STAGE.uid), { played: "done" });
    await b.commit();
  });
  if (a === "clear") return act(async () => {
    const b = writeBatch(db);
    if (STAGE && STAGE.round && STAGE.revealed == null && SUBS.some(q => q.uid === STAGE.uid)) b.update(D("lieSubs", STAGE.uid), { played: false });
    b.set(D("lieStage", "current"), { round: null, open: false }); await b.commit();
  });
  if (a === "end") return act(() => setGame("lie", { status: "ended" }));
  if (a === "reset") return confirmBox(box, "Tüm cümleler, oylar ve sonuçlar silinecek.", async () => {
    await setGame("lie", { status: "off", hunt: null });
    for (const c of ["lieVotes", "lieResults", "lieStageSecret", "lieStage", "lieGuess", "lieHunt", "lieSubs"]) await clearCol(c);
  });
}
function renderMod() {
  if (!S.isMod) return;
  const st = G.status || "off", ok = SUBS.filter(s => s.status === "ok"), waiting = ok.filter(s => !s.played);
  const stageBusy = STAGE && STAGE.round && STAGE.revealed == null;
  $("lm-actions").innerHTML = btnRow(
    st === "off" ? [["collect", "Cümle toplamayı aç"]]
    : st === "collect" ? [["stage", "Sahne modunu başlat"], ["hunt", "Avcı modunu başlat"], ["reset", "Sıfırla", "ghost"]]
    : st === "stage" ? [stageBusy ? ["reveal", "Oylamayı kapat, yalanı göster"] : ["random", `Rastgele birini çağır (${waiting.length} sırada)`], ["clear", "Sahneyi boşalt", "ghost"], ["hunt", "Avcı moduna geç", "ghost"], ["end", "Bitir", "ghost"], ["reset", "Sıfırla", "ghost"]]
    : st === "hunt" ? [["huntreveal", `Sonuçları açıkla (${GUESSES.length} tahmin)`], ["reset", "Sıfırla", "ghost"]]
    : [["stage", "Sahne moduna geç"], ["end", "Bitir", "ghost"], ["reset", "Sıfırla", "ghost"]]);
  $("lm-count").textContent = `${ok.length} kişi gönderdi${st === "stage" ? `, ${waiting.length} sırada` : ""}`;
  $("lm-subs").innerHTML = SUBS.length ? SUBS.map(x => `<li><span><b>${esc(x.name)}</b>${x.played ? ` <span class="small">(${x.played === "stage" ? "sahnede" : "oynadı"})</span>` : ""}<br><span class="small">${x.s.map((t, i) => (i === x.lie ? "Yalan: " : "") + esc(t)).join(" · ")}</span></span><span class="row">${st === "stage" && x.status === "ok" && !x.played ? `<button class="btn small" data-stage="${esc(x.uid)}">Sahneye al</button>` : ""}${x.status === "ok" ? `<button class="btn ghost small" data-rm="${esc(x.uid)}">Kaldır</button>` : `<span class="r">Kaldırıldı</span>`}</span></li>`).join("") : "<li>Henüz kimse göndermedi.</li>";
}
