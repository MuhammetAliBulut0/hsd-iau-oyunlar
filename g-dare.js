// CESARET: herkes önce bir görev yazar. Moderatör uygunsuz olanı kaldırır (yazan kişiden yenisi istenir).
// Moderatör başlatınca herkese kendi yazdığı dışında bir görev düşer.
import { S, $, D, C, esc, listen, act, pick, sattolo, shuffle, byName, confirmBox, btnRow, onGame, setGame, clearCol, setDoc, updateDoc, writeBatch, db } from "./core.js";

let G = { status: "off" }, MINE = null, GOT = null, SUBS = [], GOTS = [];

export function initDare() {
  onGame("dare", g => { G = g; render(); renderMod(); });
  listen(D("dareSubs", S.me.uid), s => { MINE = s.exists() ? s.data() : null; render(); });
  listen(D("dareGot", S.me.uid), s => { GOT = s.exists() ? s.data() : null; render(); });
  $("d-send").onclick = () => act(async () => {
    const text = $("d-text").value.trim();
    if (!text) { $("d-note").textContent = "Önce bir görev yaz."; return; }
    if (text.length > 200) { $("d-note").textContent = "Görev en fazla 200 karakter olabilir."; return; }
    await setDoc(D("dareSubs", S.me.uid), { name: S.me.name, text, status: "ok", at: Date.now() });
    $("d-text").value = ""; $("d-note").innerHTML = "Görevin alındı. Kime düşeceği <b>sürpriz</b>.";
  });
  $("d-got").onclick = e => { const b = e.target.closest("[data-r]"); if (b) act(() => updateDoc(D("dareGot", S.me.uid), { result: b.dataset.r, resultAt: Date.now() })); };
  $("d-mine").onclick = e => { if (e.target.closest("[data-edit]")) { $("d-text").value = MINE ? MINE.text : ""; $("d-text").focus(); } };
  if (S.isMod) {
    listen(C("dareSubs"), s => { SUBS = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderMod(); });
    listen(C("dareGot"), s => { GOTS = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMod(); });
    $("dm-actions").onclick = e => { const b = e.target.closest("[data-act]"); if (b) modAction(b.dataset.act); };
    $("dm-subs").onclick = e => { const b = e.target.closest("[data-rm]"); if (b) act(() => updateDoc(D("dareSubs", b.dataset.rm), { status: "removed", removedAt: Date.now() })); };
  }
}

function render() {
  const st = G.status || "off", open = st === "collect" || st === "running";
  $("d-status").textContent = st === "off" ? "Oyun henüz açılmadı. Moderatör açınca buraya bir cesaret görevi yazacaksın."
    : st === "collect" ? "Görevler toplanıyor. Bir görev yaz ve oyunun başlamasını bekle."
    : st === "running" ? "Oyun başladı! Görevin aşağıda." : "Oyun bitti. Katıldığın için teşekkürler!";
  $("d-form").hidden = !open || (MINE && MINE.status === "ok" && st === "running");
  const m = $("d-mine");
  if (!MINE) m.innerHTML = open ? `<p class="how">Henüz görev yazmadın. Oyuna katılmak için bir görev yaz.</p>` : "";
  else if (MINE.status === "removed") m.innerHTML = `<p class="note"><b>Moderatör görevini kaldırdı.</b> Lütfen herkesin rahatça yapabileceği başka bir görev yaz.</p><p class="small">Kaldırılan: ${esc(MINE.text)}</p>`;
  else m.innerHTML = `<p class="how">Yazdığın görev: <strong>${esc(MINE.text)}</strong></p>${st === "collect" ? `<button class="btn ghost small" data-edit>Değiştir</button>` : ""}`;
  $("d-send").textContent = MINE && MINE.status === "ok" ? "Görevi güncelle" : "Görevi gönder";
  const gb = $("d-gotbox");
  gb.hidden = !(st === "running" || st === "ended");
  if (!gb.hidden) {
    if (GOT) $("d-got").innerHTML = `<div class="card flip"><span class="kicker">Senin cesaret görevin</span><div class="big">${esc(GOT.text)}</div><div class="who">${GOT.result ? esc(GOT.result) : "Yazan kişi gizli"}</div></div>
      ${st === "running" && !GOT.result ? `<div class="row"><button class="btn" data-r="Yaptı">Yaptım!</button><button class="btn ghost" data-r="Pas">Pas geçiyorum</button></div>` : ""}`;
    else $("d-got").innerHTML = `<div class="card back"><span class="kicker">Cesaret kartı</span><div class="big">${MINE && MINE.status === "ok" ? "Görevin dağıtılınca burada çıkacak" : "Görev yazanlar oyuna katılır. Önce bir görev yaz."}</div></div>`;
  }
}

async function deal(onlyNew) {
  const ok = SUBS.filter(s => s.status === "ok");
  const has = new Set(GOTS.map(g => g.uid));
  const b = writeBatch(db);
  if (!onlyNew) {
    if (ok.length < 2) throw new Error("En az 2 kişinin görev yazmış olması gerekiyor.");
    const list = shuffle(ok), p = sattolo(list.length);
    list.forEach((s, i) => { const from = list[p[i]]; b.set(D("dareGot", s.uid), { text: from.text, fromUid: from.uid, fromName: from.name, toName: s.name, result: null, at: Date.now() }); });
  } else {
    const news = ok.filter(s => !has.has(s.uid));
    if (!news.length) throw new Error("Görevi olmayan yeni katılımcı yok.");
    news.forEach(s => { const from = pick(ok.filter(x => x.uid !== s.uid)); b.set(D("dareGot", s.uid), { text: from.text, fromUid: from.uid, fromName: from.name, toName: s.name, result: null, at: Date.now() }); });
  }
  await b.commit();
}
function modAction(a) {
  const box = $("dm-confirm");
  if (a === "collect") return act(() => setGame("dare", { status: "collect" }));
  if (a === "start") return confirmBox(box, `${SUBS.filter(s => s.status === "ok").length} kişiye görev dağıtılsın mı?`, async () => { await clearCol("dareGot"); await deal(false); await setGame("dare", { status: "running" }); });
  if (a === "news") return act(() => deal(true));
  if (a === "end") return act(() => setGame("dare", { status: "ended" }));
  if (a === "reset") return confirmBox(box, "Tüm görevler silinecek ve oyun kapanacak.", async () => { await setGame("dare", { status: "off" }); await clearCol("dareGot"); await clearCol("dareSubs"); });
}
function renderMod() {
  if (!S.isMod) return;
  const st = G.status || "off", ok = SUBS.filter(s => s.status === "ok"), rm = SUBS.filter(s => s.status === "removed");
  const newcomers = ok.filter(s => !GOTS.some(g => g.uid === s.uid)).length;
  $("dm-actions").innerHTML = btnRow(st === "off" ? [["collect", "Görev toplamayı aç"]]
    : st === "collect" ? [["start", `Başlat ve dağıt (${ok.length} kişi)`], ["reset", "Sıfırla", "ghost"]]
    : st === "running" ? [...(newcomers ? [["news", `Yeni katılanlara dağıt (${newcomers})`]] : []), ["end", "Oyunu bitir", "ghost"], ["reset", "Sıfırla", "ghost"]]
    : [["collect", "Yeniden aç"], ["reset", "Sıfırla", "ghost"]]);
  $("dm-count").textContent = `${ok.length} görev${rm.length ? `, ${rm.length} kaldırıldı` : ""}`;
  $("dm-subs").innerHTML = SUBS.length ? SUBS.map(s => `<li><span><b>${esc(s.name)}</b><br>${s.status === "removed" ? `<span class="small">Kaldırıldı, yenisini bekliyoruz: ${esc(s.text)}</span>` : esc(s.text)}</span>${s.status === "ok" ? `<button class="btn ghost small" data-rm="${esc(s.uid)}">Kaldır</button>` : `<span class="r">Kaldırıldı</span>`}</li>`).join("") : "<li>Henüz görev yazan yok.</li>";
  $("dm-rows").innerHTML = GOTS.length ? GOTS.slice().sort((a, b) => (a.toName || "").localeCompare(b.toName || "", "tr")).map(g => `<tr><td>${esc(g.toName)}</td><td>${esc(g.text)}</td><td>${esc(g.fromName)}</td><td>${esc(g.result || "…")}</td></tr>`).join("") : `<tr><td colspan="4">Henüz dağıtım yapılmadı.</td></tr>`;
}
