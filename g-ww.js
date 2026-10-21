// KATİL KİM? — Vampir Köylü kurallarıyla. Her odayı bir moderatör yönetir; birden fazla oda aynı anda oynanabilir.
// Gece görevleri ve gündüz oylaması telefondan yapılır. Moderatörün sayfası açıkken gece bilgileri (kâhin sonucu,
// cadıya kurbanın adı, vampirlerin birbirinin seçimini görmesi) kendiliğinden iletilir.
import { S, $, D, C, esc, listen, act, toast, shuffle, fmt, byName, confirmBox, btnRow, clearCol, setDoc, updateDoc, deleteDoc, addDoc,
  writeBatch, db } from "./core.js";
import { WW_ROLES, WW_ORDER, wwDefaultCounts } from "./data.js";

const PHASE = { lobby: "Katılım açık", night: "Gece", day: "Gündüz · Tartışma", vote: "Gündüz · Oylama", result: "Gündüz · Sonuç", ended: "Oyun bitti" };
const roleName = k => (WW_ROLES[k] || {}).name || k;

// Oyuncu tarafı
let ROOMS = [], MYROOM = null, R = null, PL = [], ROLE = null, ACT = null, INBOX = null, VOTES = [];
let mySubs = [], roleShown = false, roleTimer = null, suspects = new Set();
// Moderatör tarafı
const M = { id: null, players: [], roles: {}, actions: {}, votes: [], inbox: {}, subs: [], counts: null, countsFor: 0, reveal: true, override: "", out: "", min: 3 };

export function initWW() {
  $("ww-roles").innerHTML = WW_ORDER.map(k => { const r = WW_ROLES[k];
    return `<div class="rolebox"><div class="row spread"><b class="${r.team === "kotu" ? "bad" : ""}">${esc(r.name)}${r.special ? " · bize özel" : ""}</b><span class="how">${r.team === "kotu" ? "Kötü takım" : "İyi takım"}</span></div><p>${esc(r.desc)}</p></div>`; }).join("");
  listen(C("ww"), s => { ROOMS = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); syncMyRoom(); renderRooms(); renderMine(); if (S.isMod) { auto(); renderMod(); } });
  listen(D("people", S.me.uid), s => { MYROOM = s.exists() ? s.data().wwRoom || null : null; syncMyRoom(); renderRooms(); });
  $("ww-rooms").onclick = e => { const b = e.target.closest("[data-a]"); if (b) roomAction(b.dataset.a, b.dataset.id); };
  $("ww-my").onclick = e => { const b = e.target.closest("[data-a]"); if (b) myAction(b.dataset.a, b.dataset.v); };
  setInterval(tickTimers, 500);
  if (S.isMod) {
    $("ww-create").onclick = () => act(async () => {
      const name = $("ww-newname").value.trim() || `Oda ${ROOMS.length + 1}`;
      await addDoc(C("ww"), { name, modUid: S.me.uid, modName: S.me.name, phase: "lobby", night: 0, revealRoles: true, createdAt: Date.now() });
      $("ww-newname").value = "";
    });
    $("ww-mod").onclick = e => { const b = e.target.closest("[data-a]"); if (b) modAction(b.dataset.a, b.dataset.v); };
    $("ww-mod").onchange = e => {
      const t = e.target;
      if (t.dataset.count) { M.counts = { ...(M.counts || {}), [t.dataset.count]: +t.value }; M.countsEdited = true; renderMod(); }
      if (t.id === "wwm-reveal") M.reveal = t.checked;
      if (t.id === "wwm-override") M.override = t.value;
      if (t.id === "wwm-out") M.out = t.value;
      if (t.id === "wwm-min") M.min = +t.value;
    };
  }
}

/* ======================= OYUNCU ======================= */
function syncMyRoom() {
  const id = MYROOM && ROOMS.some(r => r.id === MYROOM) ? MYROOM : null;
  if (id === (syncMyRoom.cur || null)) { R = id ? ROOMS.find(r => r.id === id) : null; return; }
  syncMyRoom.cur = id; mySubs.forEach(u => u()); mySubs = [];
  R = id ? ROOMS.find(r => r.id === id) : null; PL = []; ROLE = null; ACT = null; INBOX = null; VOTES = []; roleShown = false; suspects = new Set();
  if (!id) { renderMine(); return; }
  mySubs.push(listen(C("ww", id, "players"), s => { PL = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); renderMine(); }));
  mySubs.push(listen(D("ww", id, "roles", S.me.uid), s => { ROLE = s.exists() ? s.data() : null; renderMine(); }));
  mySubs.push(listen(D("ww", id, "actions", S.me.uid), s => { ACT = s.exists() ? s.data() : null; renderMine(); }));
  mySubs.push(listen(D("ww", id, "inbox", S.me.uid), s => { INBOX = s.exists() ? s.data() : null; renderMine(); }));
  mySubs.push(listen(C("ww", id, "votes"), s => { VOTES = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMine(); }));
}

function renderRooms() {
  const inRoom = !!syncMyRoom.cur;
  $("ww-rooms").innerHTML = ROOMS.length ? ROOMS.map(r => {
    const mine = syncMyRoom.cur === r.id, n = r.id === M.id ? M.players.length : null;
    const btns = [];
    if (!inRoom && r.phase === "lobby") btns.push(`<button class="btn small" data-a="join" data-id="${esc(r.id)}">Katıl</button>`);
    if (S.isMod) btns.push(`<button class="btn ghost small" data-a="manage" data-id="${esc(r.id)}">${M.id === r.id ? "Açık" : "Yönet"}</button>`);
    return `<li class="roomrow"><span><b>${esc(r.name)}</b>${mine ? ` <span class="r">senin odan</span>` : ""}<br><span class="small">${esc(PHASE[r.phase] || r.phase)}${["night", "day", "vote", "result"].includes(r.phase) && r.night ? " " + r.night : ""} · Moderatör: ${esc(r.modName || "–")}${n != null ? ` · ${n} kişi` : ""}</span></span><span class="row">${btns.join("")}</span></li>`;
  }).join("") : `<li class="empty">Henüz oda yok. ${S.isMod ? "Aşağıdan bir oda aç." : "Moderatör oda açınca burada görünecek."}</li>`;
}

function roomAction(a, id) {
  if (a === "join") return act(async () => {
    const b = writeBatch(db);
    b.set(D("ww", id, "players", S.me.uid), { name: S.me.name, alive: true, joinedAt: Date.now() });
    b.set(D("people", S.me.uid), { wwRoom: id }, { merge: true });
    await b.commit();
  });
  if (a === "manage") { if (M.id === id) return; manage(id); }
}

function myAction(a, v) {
  const n = R ? R.night : 0;
  if (a === "leave") return act(async () => {
    await setDoc(D("people", S.me.uid), { wwRoom: null }, { merge: true });
    if (R && R.phase === "lobby") await deleteDoc(D("ww", R.id, "players", S.me.uid)).catch(() => {});
  });
  if (a === "show") { roleShown = true; clearTimeout(roleTimer); roleTimer = setTimeout(() => { roleShown = false; renderMine(); }, 10000); return renderMine(); }
  if (a === "hide") { roleShown = false; clearTimeout(roleTimer); return renderMine(); }
  if (a === "suspect") { suspects.has(v) ? suspects.delete(v) : suspects.add(v); return renderMine(); }
  const p = PL.find(x => x.uid === v);
  const ref = D("ww", R.id, "actions", S.me.uid);
  if (a === "night") return act(() => {
    const role = ROLE.role, data = { night: n, kind: role, target: v, targetName: p ? p.name : "" };
    if (role === "doktor") data.last = ACT && ACT.night !== n ? { night: ACT.night, target: ACT.target } : (ACT && ACT.last) || null;
    return setDoc(ref, data);
  });
  if (a === "heal" || a === "poison" || a === "nopoison") return act(() => {
    const cur = ACT && ACT.night === n && ACT.kind === "cadi" ? ACT : { night: n, kind: "cadi", heal: false, poison: null, poisonName: null };
    const d = { ...cur };
    if (a === "heal") d.heal = !cur.heal;
    if (a === "poison") { d.poison = v; d.poisonName = p ? p.name : ""; }
    if (a === "nopoison") { d.poison = null; d.poisonName = null; }
    return setDoc(ref, d);
  });
  if (a === "vote") return act(() => setDoc(D("ww", R.id, "votes", S.me.uid), { day: n, target: v, targetName: p ? p.name : "", name: S.me.name }));
  if (a === "ctrlz") return act(() => setDoc(ref, { kind: "ctrlz", day: n, night: n }));
}

function tally(votes, players) {
  const alive = new Set(players.filter(p => p.alive).map(p => p.uid)), t = {};
  votes.forEach(v => { if (!alive.has(v.uid) || !v.target) return; t[v.target] = t[v.target] || { uid: v.target, name: v.targetName, votes: 0, by: [] }; t[v.target].votes++; t[v.target].by.push(v.name || ""); });
  return Object.values(t).sort((a, b) => b.votes - a.votes);
}
const plist = (arr, act, sel, disabled) => `<div class="votes">${arr.map(p => `<button class="vbtn" data-a="${act}" data-v="${esc(p.uid)}" aria-pressed="${sel === p.uid}" ${disabled ? "disabled" : ""}>${esc(p.name)}</button>`).join("")}</div>`;

function renderMine() {
  const box = $("ww-my");
  if (!R) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  const n = R.night || 0, me = PL.find(p => p.uid === S.me.uid), alive = me ? me.alive : false, inGame = R.phase !== "lobby";
  const aliveOthers = PL.filter(p => p.alive && p.uid !== S.me.uid);
  let h = `<div class="row spread"><span class="step">Oda · ${esc(R.name)}</span><span class="how">Moderatör: ${esc(R.modName || "–")}</span></div>`;
  h += `<p class="big-status phase-${R.phase}">${esc(PHASE[R.phase] || "")}${["night", "day", "vote", "result"].includes(R.phase) ? " " + n : ""}</p>`;
  if (["day", "vote"].includes(R.phase) && R.timerEnd) h += `<div class="row spread"><span class="how">Kalan süre</span><span class="clock" id="ww-timer"></span></div>`;
  if (R.announce && inGame) h += `<div class="announce"><b>${esc(R.announce.title || "")}</b>${(R.announce.lines || []).map(l => `<p>${esc(l)}</p>`).join("")}</div>`;

  if (R.phase === "lobby") {
    h += `<p class="how">Moderatör başlatınca rolün burada çıkacak. Rolünü kimseye gösterme!</p>`;
    h += `<div class="chips">${PL.map(p => `<span class="chip static">${esc(p.name)}${p.uid === S.me.uid ? " (sen)" : ""}</span>`).join("")}</div>`;
    h += `<div class="meta"><span>Katılan <b>${PL.length}</b> kişi · en az 6 kişi gerekir</span></div>`;
    h += `<button class="btn ghost small" data-a="leave">Odadan ayrıl</button>`;
  }
  if (inGame && !me) h += `<p class="note">Bu oyuna katılmadın. Oyun bitince yeni tura katılabilirsin.</p><button class="btn ghost small" data-a="leave">Odadan çık</button>`;

  if (inGame && me && ROLE) {
    const r = WW_ROLES[ROLE.role] || {};
    h += roleShown
      ? `<div class="rcard"><span class="kicker">Rolün · kimseye gösterme</span><div class="rname ${r.team === "kotu" ? "bad" : ""}">${esc(r.name)}</div>
         <span class="how">${r.team === "kotu" ? "Kötü takım" : "İyi takım"}</span><p>${esc(r.desc)}</p>
         ${ROLE.partners && ROLE.partners.length ? `<p><b>Diğer vampirler:</b> ${esc(ROLE.partners.join(", "))}</p>` : ""}
         ${ROLE.role === "cadi" ? `<p><b>İksirler:</b> Hayat ${ROLE.healUsed ? "kullanıldı" : "hazır"} · Ölüm ${ROLE.poisonUsed ? "kullanıldı" : "hazır"}</p>` : ""}
         ${ROLE.role === "yazilimci" ? `<p><b>Ctrl+Z:</b> ${ROLE.ctrlzUsed ? "kullanıldı" : "hazır"}</p>` : ""}
         <p class="small">${esc(r.win || "")}</p><button class="btn small" data-a="hide">Gizle</button></div>`
      : `<button class="rcard back" data-a="show"><span class="kicker">Rol kartın</span><span class="rname">Görmek için dokun</span><span class="small">10 saniye sonra kendiliğinden gizlenir</span></button>`;
    if (!alive && R.phase !== "ended") h += `<p class="note">Elendin. Artık konuşmadan izliyorsun, rolünü söyleme.</p>`;
  }

  // Gece görevi
  if (R.phase === "night" && me && alive && ROLE) {
    h += `<div class="panel inner"><span class="step">Gece görevin</span>`;
    const role = ROLE.role, mine = ACT && ACT.night === n ? ACT : null;
    if (role === "vampir") {
      const partners = new Set(ROLE.partnerUids || []);
      h += `<p class="how">Bu gece kimi ısıracaksınız? Vampirler aynı kişide anlaşırsa iş kolaylaşır.</p>` + plist(aliveOthers.filter(p => !partners.has(p.uid)), "night", mine && mine.target);
      const pack = INBOX && INBOX.pack && INBOX.pack.night === n ? INBOX.pack.picks : [];
      if (pack.length) h += `<p class="small">Vampirlerin seçimleri: ${pack.map(x => `${esc(x.by)} → ${esc(x.target || "henüz seçmedi")}`).join(" · ")}</p>`;
    } else if (role === "kahin") {
      const res = INBOX && INBOX.seer && INBOX.seer.night === n ? INBOX.seer.text : null;
      if (res) h += `<p class="reveal-line">${esc(res)}</p><p class="how">Bu gecelik bakışın bitti.</p>`;
      else h += `<p class="how">Kimin rolüne bakacaksın?</p>` + plist(aliveOthers, "night", mine && mine.target) + (mine ? `<p class="small">Sonuç bekleniyor…</p>` : "");
    } else if (role === "doktor") {
      const last = ACT ? (ACT.night === n ? ACT.last : { night: ACT.night, target: ACT.target }) : null;
      const blocked = last && last.night === n - 1 ? last.target : null;
      const opts = PL.filter(p => p.alive && p.uid !== blocked);
      h += `<p class="how">Bu gece kimi koruyacaksın?${blocked ? " Dün gece koruduğun kişiyi bu gece koruyamazsın." : ""}</p>` + plist(opts, "night", mine && mine.target);
    } else if (role === "cadi") {
      const v = INBOX && INBOX.victim && INBOX.victim.night === n ? INBOX.victim.name : null;
      const c = mine && mine.kind === "cadi" ? mine : { heal: false, poison: null };
      h += `<p class="how">${v ? `Vampirler bu gece <b>${esc(v)}</b> kişisini seçti.` : "Vampirler henüz anlaşmadı. Bekle, seçim burada görünecek."}</p>`;
      if (!ROLE.healUsed && v) h += `<button class="btn small ${c.heal ? "" : "ghost"}" data-a="heal">${c.heal ? "Hayat iksiri kullanılacak (geri al)" : "Hayat iksirini kullan"}</button>`;
      if (!ROLE.poisonUsed) h += `<p class="how">Ölüm iksiri: birini seç ya da kullanma.</p>` + plist(aliveOthers, "poison", c.poison) + `<button class="btn ghost small" data-a="nopoison" ${c.poison ? "" : "disabled"}>Ölüm iksirini kullanma</button>`;
      if (ROLE.healUsed && ROLE.poisonUsed) h += `<p class="how">İki iksirini de kullandın. Sabahı bekle.</p>`;
    } else {
      h += `<p class="how">Bu gece görevin yok. Telefonuna bakman bir şey belli etmesin diye şüphelendiklerini işaretle (sadece sen görürsün).</p>`;
      h += `<div class="chips">${aliveOthers.map(p => `<button class="chip" data-a="suspect" data-v="${esc(p.uid)}" aria-pressed="${suspects.has(p.uid)}">${esc(p.name)}</button>`).join("")}</div>`;
    }
    h += `</div>`;
  }

  // Oylama
  if (R.phase === "vote") {
    const dayVotes = VOTES.filter(v => v.day === n), my = dayVotes.find(v => v.uid === S.me.uid);
    if (me && alive) h += `<div class="panel inner"><span class="step">Oylama</span><p class="how">Kimin elenmesini istiyorsun? Moderatör kapatana kadar değiştirebilirsin.</p>${plist(aliveOthers, "vote", my && my.target)}</div>`;
    const t = tally(dayVotes, PL);
    h += `<ul class="list">${t.map(x => `<li><span><b>${esc(x.name)}</b> <span class="small">${esc(x.by.join(", "))}</span></span><span class="r">${x.votes} oy</span></li>`).join("") || "<li>Henüz oy yok.</li>"}</ul>`;
  }
  // Ctrl+Z
  if (R.phase === "result" && me && alive && ROLE && ROLE.role === "yazilimci" && !ROLE.ctrlzUsed && R.lastOut) {
    h += ACT && ACT.kind === "ctrlz" && ACT.day === n ? `<p class="note">Ctrl+Z isteğin moderatöre iletildi.</p>`
      : `<button class="btn" data-a="ctrlz">Ctrl+Z: ${esc(R.lastOut.name)} geri gelsin</button>`;
  }
  // Bitiş
  if (R.phase === "ended") {
    const myTeam = ROLE ? (WW_ROLES[ROLE.role] || {}).team : null, won = R.winnerTeam && myTeam === R.winnerTeam;
    h += `<div class="winbox"><span class="kicker">Oyun bitti</span><div class="rname">${R.winnerTeam === "kotu" ? "Vampirler kazandı!" : R.winnerTeam === "iyi" ? "Köylüler kazandı!" : "Oyun bitti"}</div>
      <p>${esc(R.winner || "")}</p>${R.winnerTeam && myTeam ? `<p><b>${won ? "Tebrikler, takımın kazandı!" : "Bu sefer takımın kaybetti."}</b></p>` : ""}</div>`;
    h += `<span class="step">Herkesin rolü</span><ul class="list">${(R.revealList || []).map(x => `<li><span>${esc(x.name)}${R.winnerTeam && x.team === R.winnerTeam ? " · kazandı" : ""}</span><span class="${x.team === "kotu" ? "r" : ""}">${esc(x.role)}</span></li>`).join("")}</ul>`;
    h += `<button class="btn ghost small" data-a="leave">Odadan çık</button>`;
  }
  // Oyuncular
  if (inGame && R.phase !== "ended") h += `<span class="step">Oyuncular</span><ul class="list">${PL.map(p => `<li><span${p.alive ? "" : ` class="dead"`}>${esc(p.name)}${p.uid === S.me.uid ? " (sen)" : ""}</span><span>${p.alive ? "Hayatta" : "Elendi" + (p.roleShown ? " · " + esc(p.roleShown) : "")}</span></li>`).join("")}</ul>`;
  box.innerHTML = h;
  tickTimers();
}

function tickTimers() {
  const show = (room, id) => {
    const el = $(id); if (!el || !room) return;
    const l = room.timerPaused ? (room.timerLeft || 0) / 1000 : ((room.timerEnd || 0) - Date.now()) / 1000;
    el.textContent = room.timerEnd ? (l > 0 ? fmt(l) : "Süre doldu") + (room.timerPaused ? " (durdu)" : "") : "–:––";
    el.classList.toggle("low", l <= 30);
  };
  show(R, "ww-timer"); show(ROOMS.find(r => r.id === M.id), "wwm-timer");
}

/* ======================= MODERATÖR ======================= */
function manage(id) {
  M.subs.forEach(u => u()); M.subs = [];
  Object.assign(M, { id, players: [], roles: {}, actions: {}, votes: [], inbox: {}, counts: null, countsEdited: false, override: "", out: "" });
  $("wwm-confirm").hidden = true;
  if (!id) { renderMod(); renderRooms(); return; }
  M.subs.push(listen(C("ww", id, "players"), s => { M.players = s.docs.map(d => ({ uid: d.id, ...d.data() })).sort(byName); auto(); renderMod(); renderRooms(); }));
  M.subs.push(listen(C("ww", id, "roles"), s => { M.roles = {}; s.docs.forEach(d => M.roles[d.id] = d.data()); auto(); renderMod(); }));
  M.subs.push(listen(C("ww", id, "actions"), s => { M.actions = {}; s.docs.forEach(d => M.actions[d.id] = d.data()); auto(); renderMod(); }));
  M.subs.push(listen(C("ww", id, "votes"), s => { M.votes = s.docs.map(d => ({ uid: d.id, ...d.data() })); renderMod(); }));
  M.subs.push(listen(C("ww", id, "inbox"), s => { M.inbox = {}; s.docs.forEach(d => M.inbox[d.id] = d.data()); auto(); }));
  renderRooms(); $("ww-mod").scrollIntoView({ behavior: "smooth", block: "start" });
}
const mRoom = () => ROOMS.find(r => r.id === M.id) || null;
const aliveOf = role => M.players.filter(p => p.alive && M.roles[p.uid] && M.roles[p.uid].role === role);

function nightInfo() {
  const room = mRoom(), n = room ? room.night : 0, A = M.actions;
  const at = (uid, kind) => { const a = A[uid]; return a && a.night === n && a.kind === kind ? a : null; };
  const picks = aliveOf("vampir").map(v => { const a = at(v.uid, "vampir"); return { by: v.name, byUid: v.uid, target: a ? a.target : null, targetName: a ? a.targetName : null }; });
  const t = {}; picks.forEach(p => { if (p.target) t[p.target] = (t[p.target] || 0) + 1; });
  const sorted = Object.entries(t).sort((a, b) => b[1] - a[1]);
  const top = sorted.length && (sorted.length === 1 || sorted[0][1] > sorted[1][1]) ? sorted[0][0] : null;
  const doc = aliveOf("doktor")[0], witch = aliveOf("cadi")[0], seer = aliveOf("kahin")[0];
  return { n, picks, top, tie: sorted.length > 1 && !top,
    doctor: doc ? at(doc.uid, "doktor") : null, doctorP: doc,
    witch: witch ? at(witch.uid, "cadi") : null, witchP: witch, witchRole: witch ? M.roles[witch.uid] : null,
    seer: seer ? at(seer.uid, "kahin") : null, seerP: seer };
}
const pname = uid => (M.players.find(p => p.uid === uid) || {}).name || "?";

// Moderatörün sayfası açıkken gece bilgilerini ilgili oyunculara iletir
function auto() {
  const room = mRoom();
  if (!room || room.modUid !== S.me.uid || room.phase !== "night") return;
  const I = nightInfo(), n = I.n, writes = [];
  const packPicks = I.picks.map(p => ({ by: p.by, target: p.targetName || null }));
  aliveOf("vampir").forEach(v => { const cur = M.inbox[v.uid]; const want = { night: n, picks: packPicks };
    if (!cur || JSON.stringify(cur.pack) !== JSON.stringify(want)) writes.push([v.uid, { pack: want }]); });
  if (I.witchP) { const want = { night: n, name: I.top ? pname(I.top) : null }; const cur = M.inbox[I.witchP.uid];
    if (!cur || JSON.stringify(cur.victim) !== JSON.stringify(want)) writes.push([I.witchP.uid, { victim: want }]); }
  if (I.seerP && I.seer && I.seer.target) { const cur = M.inbox[I.seerP.uid];
    if (!cur || !cur.seer || cur.seer.night !== n) { const tr = M.roles[I.seer.target];
      writes.push([I.seerP.uid, { seer: { night: n, text: `${pname(I.seer.target)}: ${tr ? roleName(tr.role) : "?"}` } }]); } }
  writes.forEach(([uid, data]) => { M.inbox[uid] = { ...(M.inbox[uid] || {}), ...data }; setDoc(D("ww", M.id, "inbox", uid), data, { merge: true }).catch(e => console.warn(e)); });
}

// dead: bu işlemde ölecekler, revived: geri gelecekler. Kazanan varsa { team, text } döner.
function winCheck(dead = [], revived = []) {
  const isAlive = p => (p.alive || revived.includes(p.uid)) && !dead.includes(p.uid);
  const alive = M.players.filter(p => isAlive(p) && M.roles[p.uid]);
  const v = alive.filter(p => M.roles[p.uid].role === "vampir").length, o = alive.length - v;
  if (!alive.length) return null;
  if (v === 0) return { team: "iyi", text: "Köylüler kazandı! Bütün vampirler elendi." };
  if (v >= o) return { team: "kotu", text: "Vampirler kazandı! Sayıları köylülere yetişti." };
  return null;
}
function endPayload(win, extra) {
  return { phase: "ended", timerEnd: null, lastOut: null, winner: win ? win.text : "Oyun moderatör tarafından bitirildi.", winnerTeam: win ? win.team : null,
    announce: { title: "Oyun bitti", lines: [...(extra || []), win ? win.text : "Oyun moderatör tarafından bitirildi."] },
    revealList: M.players.map(p => ({ name: p.name, role: M.roles[p.uid] ? roleName(M.roles[p.uid].role) : "–", team: M.roles[p.uid] ? (WW_ROLES[M.roles[p.uid].role] || {}).team : "" })) };
}
const deathLine = (uid, reveal) => `${pname(uid)}${reveal && M.roles[uid] ? ` (${roleName(M.roles[uid].role)})` : ""}`;

function modAction(a, v) {
  const room = mRoom(); if (!room) return;
  const ref = D("ww", M.id), box = $("wwm-confirm"), n = room.night || 0, reveal = room.revealRoles !== false;
  const kill = (b, uid) => b.update(D("ww", M.id, "players", uid), { alive: false, roleShown: reveal && M.roles[uid] ? roleName(M.roles[uid].role) : null });
  if (a === "close") return manage(null);
  if (a === "takeover") return act(() => updateDoc(ref, { modUid: S.me.uid, modName: S.me.name }));
  if (a === "kick") return act(() => deleteDoc(D("ww", M.id, "players", v)));
  if (a === "start") {
    const N = M.players.length, counts = M.counts || wwDefaultCounts(N);
    const special = WW_ORDER.filter(k => k !== "koylu").reduce((s, k) => s + (counts[k] || 0), 0);
    if (N < 6) return toast("En az 6 oyuncu gerekli.");
    if (!counts.vampir) return toast("En az 1 vampir olmalı.");
    if (special > N) return toast(`Seçilen roller (${special}) oyuncu sayısından (${N}) fazla.`);
    return confirmBox(box, `${N} oyuncuya roller dağıtılsın ve ilk gece başlasın mı?`, async () => {
      const list = []; WW_ORDER.filter(k => k !== "koylu").forEach(k => { for (let i = 0; i < (counts[k] || 0); i++) list.push(k); });
      while (list.length < N) list.push("koylu");
      const ps = shuffle(M.players), vamps = ps.filter((p, i) => list[i] === "vampir");
      const b = writeBatch(db);
      ps.forEach((p, i) => {
        const role = list[i], d = { role, name: p.name };
        if (role === "vampir") { d.partners = vamps.filter(x => x.uid !== p.uid).map(x => x.name); d.partnerUids = vamps.filter(x => x.uid !== p.uid).map(x => x.uid); }
        if (role === "cadi") { d.healUsed = false; d.poisonUsed = false; }
        if (role === "yazilimci") d.ctrlzUsed = false;
        b.set(D("ww", M.id, "roles", p.uid), d);
      });
      b.update(ref, { phase: "night", night: 1, revealRoles: M.reveal, counts, timerEnd: null, lastOut: null, revealList: null, winner: null,
        announce: { title: "Oyun başladı · Gece 1", lines: ["Herkes rolüne baksın ve kimseye göstermesin.", "Gece görevi olanlar seçimini telefondan yapsın. Görevi olmayanlar da telefonuyla oyalansın ki kimse belli olmasın."] } });
      await b.commit();
    });
  }
  if (a === "morning") return act(async () => {
    const I = nightInfo(), victim = M.override || I.top, deaths = [], lines = [];
    const b = writeBatch(db);
    let saved = false;
    if (victim && I.doctor && I.doctor.target === victim) saved = true;
    if (victim && I.witch && I.witch.heal && I.witchRole && !I.witchRole.healUsed) { saved = true; b.update(D("ww", M.id, "roles", I.witchP.uid), { healUsed: true }); }
    if (victim && !saved) deaths.push(victim);
    if (I.witch && I.witch.poison && I.witchRole && !I.witchRole.poisonUsed) {
      b.update(D("ww", M.id, "roles", I.witchP.uid), { poisonUsed: true });
      if (!deaths.includes(I.witch.poison) && M.players.some(p => p.uid === I.witch.poison && p.alive)) deaths.push(I.witch.poison);
    }
    deaths.forEach(uid => kill(b, uid));
    if (deaths.length) deaths.forEach(uid => lines.push(`${deathLine(uid, reveal)} bu gece öldü.`)); else lines.push("Bu gece kimse ölmedi.");
    if (deaths.some(uid => M.roles[uid] && M.roles[uid].role === "avci")) lines.push("Avcı öldü! Son atışını yapacak: moderatöre birini göstersin.");
    const win = winCheck(deaths);
    if (win) b.update(ref, endPayload(win, lines));
    else { lines.push("Tartışma başlasın: vampirler kim?"); b.update(ref, { phase: "day", timerEnd: Date.now() + M.min * 60000, timerPaused: false, timerLeft: 0, announce: { title: `Gece ${n} bitti`, lines } }); }
    await b.commit(); M.override = "";
  });
  if (a === "timer") return act(() => updateDoc(ref, { timerEnd: Date.now() + M.min * 60000, timerPaused: false, timerLeft: 0 }));
  if (a === "plus") return act(() => room.timerPaused ? updateDoc(ref, { timerLeft: (room.timerLeft || 0) + (+v) * 60000 })
    : updateDoc(ref, { timerEnd: Math.max(Date.now(), room.timerEnd || 0) + (+v) * 60000 }));
  if (a === "pause") return act(() => room.timerPaused ? updateDoc(ref, { timerPaused: false, timerEnd: Date.now() + (room.timerLeft || 0) })
    : updateDoc(ref, { timerPaused: true, timerLeft: Math.max(0, (room.timerEnd || 0) - Date.now()) }));
  if (a === "openvote") return act(() => updateDoc(ref, { phase: "vote" }));
  if (a === "closevote") return act(async () => {
    const t = tally(M.votes.filter(x => x.day === n), M.players), top = t.length && (t.length === 1 || t[0].votes > t[1].votes) ? t[0].uid : "";
    const out = M.out === "-" ? "" : (M.out || top), b = writeBatch(db), lines = [];
    if (out) { kill(b, out); lines.push(`${deathLine(out, reveal)} oylamayla elendi.`); if (M.roles[out] && M.roles[out].role === "avci") lines.push("Avcı elendi! Son atışını yapacak: moderatöre birini göstersin."); }
    else lines.push("Bu oylamada kimse elenmedi.");
    const win = out ? winCheck([out]) : null, yaz = aliveOf("yazilimci")[0];
    const canUndo = win && yaz && yaz.uid !== out && !(M.roles[yaz.uid] || {}).ctrlzUsed;
    if (win && !canUndo) b.update(ref, endPayload(win, lines));
    else {
      if (canUndo) lines.push("Yazılımcı Ctrl+Z yapmazsa oyun bitecek!");
      b.update(ref, { phase: "result", lastOut: out ? { uid: out, name: pname(out) } : null, timerEnd: null, announce: { title: `Gündüz ${n} oylaması`, lines } });
    }
    await b.commit(); M.out = "";
  });
  if (a === "ctrlz") return act(async () => {
    const yaz = aliveOf("yazilimci")[0]; if (!yaz || !room.lastOut) return;
    const b = writeBatch(db);
    b.update(D("ww", M.id, "players", room.lastOut.uid), { alive: true, roleShown: null });
    b.update(D("ww", M.id, "roles", yaz.uid), { ctrlzUsed: true });
    b.update(ref, { lastOut: null, announce: { title: "Ctrl+Z!", lines: [`${yaz.name} Yazılımcı çıktı ve oylamayı geri aldı.`, `${room.lastOut.name} oyuna geri döndü.`] } });
    await b.commit();
  });
  if (a === "night") return act(() => { const win = winCheck();
    return updateDoc(ref, win ? endPayload(win) : { phase: "night", night: n + 1, timerEnd: null, lastOut: null,
      announce: { title: `Gece ${n + 1}`, lines: ["Herkes gözlerini kapatsın. Görevi olanlar seçimini telefondan yapsın."] } }); });
  if (a === "kill") return act(() => { const b = writeBatch(db); kill(b, v); const win = winCheck([v]); if (win) b.update(ref, endPayload(win, [`${deathLine(v, reveal)} elendi.`])); return b.commit(); });
  if (a === "revive") return act(() => updateDoc(D("ww", M.id, "players", v), { alive: true, roleShown: null }));
  if (a === "end") return confirmBox(box, "Oyun bitsin ve herkesin rolü açıklansın mı?", () => updateDoc(ref, endPayload(winCheck())));
  if (a === "again") return confirmBox(box, "Aynı oyuncularla yeni oyun kurulsun mu? Roller sıfırlanacak.", async () => {
    for (const c of ["roles", "actions", "inbox", "votes"]) await clearCol("ww", M.id, c);
    const b = writeBatch(db); M.players.forEach(p => b.update(D("ww", M.id, "players", p.uid), { alive: true, roleShown: null }));
    b.update(ref, { phase: "lobby", night: 0, announce: null, winner: null, winnerTeam: null, revealList: null, lastOut: null, timerEnd: null }); await b.commit();
  });
  if (a === "delete") return confirmBox(box, `"${esc(room.name)}" odası tamamen silinsin mi?`, async () => {
    for (const c of ["players", "roles", "actions", "inbox", "votes"]) await clearCol("ww", M.id, c);
    await deleteDoc(ref); manage(null);
  });
}

function renderMod() {
  const box = $("ww-mod"); if (!S.isMod) return;
  const room = mRoom();
  if (!M.id || !room) { box.hidden = true; return; }
  box.hidden = false;
  const n = room.night || 0, ph = room.phase, N = M.players.length;
  let h = `<div class="row spread"><span class="step">Moderatör · ${esc(room.name)}</span><button class="btn ghost small" data-a="close">Yönetimi kapat</button></div>`;
  h += `<p class="big-status">${esc(PHASE[ph] || ph)}${["night", "day", "vote", "result"].includes(ph) ? " " + n : ""}</p>`;
  if (room.modUid !== S.me.uid) h += `<p class="note">Bu odayı <b>${esc(room.modName)}</b> yönetiyor. Gece bilgileri onun sayfasından iletiliyor.</p><button class="btn small" data-a="takeover">Yönetimi devral</button>`;

  if (ph === "lobby") {
    if (!M.counts || M.countsFor !== N) { if (!M.countsEdited || !M.counts) M.counts = wwDefaultCounts(N); M.countsFor = N; }
    const c = M.counts, special = WW_ORDER.filter(k => k !== "koylu").reduce((s, k) => s + (c[k] || 0), 0);
    h += `<p class="how">${N} oyuncu katıldı. Roller oyuncu sayısına göre otomatik ayarlandı, istersen değiştir. Kalan herkes Köylü olur.</p>`;
    h += `<div class="counts">${WW_ORDER.filter(k => k !== "koylu").map(k => `<label>${esc(roleName(k))}<select data-count="${k}">${[...Array(k === "vampir" ? 11 : 4).keys()].map(i => `<option ${i === (c[k] || 0) ? "selected" : ""}>${i}</option>`).join("")}</select></label>`).join("")}<label>Köylü<input type="text" value="${Math.max(0, N - special)}" disabled></label></div>`;
    h += `<label class="check"><input type="checkbox" id="wwm-reveal" ${M.reveal ? "checked" : ""}> Elenenlerin rolü herkese açıklansın</label>`;
    h += `<div class="row"><button class="btn" data-a="start" ${N < 6 ? "disabled" : ""}>Rolleri dağıt ve başlat</button></div>`;
  }
  if (ph === "night") {
    const I = nightInfo();
    h += `<div class="panel inner"><span class="step">Gece ${n} özeti</span><ul class="list">
      <li><span>Vampirler</span><span>${I.picks.map(p => `${esc(p.by)} → ${esc(p.targetName || "…")}`).join(" · ") || "vampir kalmadı"}</span></li>
      <li><span>Doktor</span><span>${I.doctorP ? esc(I.doctor ? I.doctor.targetName : "…") : "yok"}</span></li>
      <li><span>Cadı</span><span>${I.witchP ? (I.witch ? `${I.witch.heal ? "hayat iksiri" : "hayat yok"} · ${I.witch.poison ? "ölüm: " + esc(I.witch.poisonName) : "ölüm yok"}` : "…") : "yok"}</span></li>
      <li><span>Kâhin</span><span>${I.seerP ? esc(I.seer ? I.seer.targetName : "…") : "yok"}</span></li></ul>
      <label>Vampirlerin kurbanı${I.tie ? " (oylar eşit, sen seç)" : ""}<select id="wwm-override"><option value="">${I.top ? "Çoğunluk: " + esc(pname(I.top)) : "Kimse"}</option>${M.players.filter(p => p.alive).map(p => `<option value="${esc(p.uid)}" ${M.override === p.uid ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
      ${room.modUid === S.me.uid ? `<p class="small">Kâhin sonucu, cadının bilgisi ve vampirlerin birbirini görmesi senin sayfandan otomatik iletiliyor. Sayfayı kapatma.</p>` : ""}</div>`;
    h += timerRow() + `<div class="row"><button class="btn" data-a="morning">Sabahı getir</button></div>`;
  }
  if (ph === "day") h += timerRow(true) + `<div class="row"><button class="btn" data-a="openvote">Oylamayı aç</button><button class="btn ghost small" data-a="night">Oylamasız geceye geç</button></div>`;
  if (ph === "vote") {
    const t = tally(M.votes.filter(x => x.day === n), M.players), voters = M.players.filter(p => p.alive).length;
    h += timerRow(true) + `<p class="how">${M.votes.filter(x => x.day === n).length} / ${voters} kişi oy verdi.</p><ul class="list">${t.map(x => `<li><span><b>${esc(x.name)}</b> <span class="small">${esc(x.by.join(", "))}</span></span><span class="r">${x.votes} oy</span></li>`).join("") || "<li>Henüz oy yok.</li>"}</ul>`;
    h += `<label>Elenecek kişi<select id="wwm-out"><option value="">${t[0] && (t.length === 1 || t[0].votes > t[1].votes) ? "En çok oy: " + esc(t[0].name) : "Eşitlik var, seç"}</option><option value="-" ${M.out === "-" ? "selected" : ""}>Kimse elenmesin</option>${M.players.filter(p => p.alive).map(p => `<option value="${esc(p.uid)}" ${M.out === p.uid ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>`;
    h += `<div class="row"><button class="btn" data-a="closevote">Oylamayı kapat ve sonucu açıkla</button></div>`;
  }
  if (ph === "result") {
    const yaz = aliveOf("yazilimci")[0], req = yaz && M.actions[yaz.uid] && M.actions[yaz.uid].kind === "ctrlz" && M.actions[yaz.uid].day === n && room.lastOut && !(M.roles[yaz.uid] || {}).ctrlzUsed;
    if (req) h += `<div class="announce"><b>Yazılımcı Ctrl+Z istiyor!</b><p>${esc(yaz.name)}, ${esc(room.lastOut.name)} geri gelsin istiyor.</p><button class="btn small" data-a="ctrlz">Ctrl+Z'yi uygula</button></div>`;
    h += `<div class="row"><button class="btn" data-a="night">${winCheck() ? "Ctrl+Z yapılmadı, oyunu bitir" : "Geceyi başlat"}</button></div>`;
  }
  if (ph === "ended") h += `<div class="announce"><b>${esc(room.winner || "Oyun bitti")}</b><p>Roller herkese açıklandı. Aynı oyuncularla yeniden oynayabilirsin.</p></div>`;

  // Oyuncu tablosu
  h += `<div class="tablewrap"><table><thead><tr><th>Oyuncu</th><th>Rol</th><th>Durum</th><th></th></tr></thead><tbody>${M.players.map(p => {
    const r = M.roles[p.uid], tm = r ? (WW_ROLES[r.role] || {}).team : "";
    const btn = ph === "lobby" ? `<button class="btn ghost small" data-a="kick" data-v="${esc(p.uid)}">Çıkar</button>`
      : ph === "ended" ? "" : p.alive ? `<button class="btn ghost small" data-a="kill" data-v="${esc(p.uid)}">Ele</button>` : `<button class="btn ghost small" data-a="revive" data-v="${esc(p.uid)}">Dirilt</button>`;
    return `<tr><td>${esc(p.name)}</td><td class="${tm === "kotu" ? "bad" : ""}">${r ? esc(roleName(r.role)) : "–"}</td><td>${p.alive ? "Hayatta" : "Elendi"}</td><td>${btn}</td></tr>`;
  }).join("") || `<tr><td colspan="4">Henüz kimse katılmadı.</td></tr>`}</tbody></table></div>`;
  h += `<p class="small">Avcı elendiğinde son atışını sana söyler, "Ele" düğmesiyle uygula.</p>`;
  h += `<div class="row">${ph !== "lobby" && ph !== "ended" ? `<button class="btn ghost small" data-a="end">Oyunu bitir, rolleri açıkla</button>` : ""}${ph !== "lobby" ? `<button class="btn ghost small" data-a="again">Aynı oyuncularla yeni oyun</button>` : ""}<button class="btn ghost small" data-a="delete">Odayı sil</button></div>`;
  box.innerHTML = h;
  tickTimers();
}
function timerRow(main) {
  return `<div class="row spread"><span class="how">Tartışma süresi</span><span class="clock" id="wwm-timer"></span></div>
  <div class="row"><select id="wwm-min" aria-label="Süre">${[1, 2, 3, 5, 8].map(m => `<option value="${m}" ${M.min === m ? "selected" : ""}>${m} dk</option>`).join("")}</select>
  <button class="btn ghost small" data-a="timer">${main ? "Süreyi yeniden başlat" : "Süre başlat"}</button><button class="btn ghost small" data-a="plus" data-v="1">+1 dk</button><button class="btn ghost small" data-a="plus" data-v="2">+2 dk</button><button class="btn ghost small" data-a="pause">Durdur / devam</button></div>`;
}
