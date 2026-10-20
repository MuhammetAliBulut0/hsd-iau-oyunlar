// Ortak altyapı: Firebase bağlantısı ve tüm oyunların kullandığı yardımcılar.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, onSnapshot, writeBatch, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, SUPER_ADMIN_EMAIL } from "./firebase-config.js";

export { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
  getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, writeBatch, runTransaction, serverTimestamp, SUPER_ADMIN_EMAIL };

export const fbApp = initializeApp(firebaseConfig);
export const auth = getAuth(fbApp);
export const db = getFirestore(fbApp);
export const D = (...p) => doc(db, ...p);
export const C = (...p) => collection(db, ...p);

// Oturumdaki kullanıcı
export const S = { me: null, isMod: false, isSuper: false };

/* ---------- küçük yardımcılar ---------- */
export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
export const ms = t => (t && t.toMillis) ? t.toMillis() : (typeof t === "number" ? t : Date.now());
export const byName = (a, b) => (a.name || "").localeCompare(b.name || "", "tr");
export const lower = s => String(s || "").toLocaleLowerCase("tr");
// Sattolo: herkesin başka birine eşlendiği (kimsenin kendine düşmediği) tek döngülü karışım
export function sattolo(n) {
  const p = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); [p[i], p[j]] = [p[j], p[i]]; }
  return p;
}

export function listen(ref, cb) {
  return onSnapshot(ref, cb, e => {
    console.warn(e);
    if (e.code === "permission-denied") toast("Bu bilgiyi görme yetkin yok. Güvenlik kuralları güncel mi?");
  });
}
export function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 4000);
}
export async function act(fn) {
  try { return await fn(); }
  catch (e) { console.error(e); toast(e.code === "permission-denied" ? "Bu işlem için yetkin yok ya da oyun şu an buna izin vermiyor." : "Bir hata oldu: " + (e.message || e)); }
}
// Bir koleksiyondaki tüm belgeleri sil (alt koleksiyonlar dahil yol verilebilir)
export async function clearCol(...path) {
  const s = await getDocs(C(...path));
  let b = writeBatch(db), n = 0;
  for (const d of s.docs) { b.delete(d.ref); if (++n % 400 === 0) { await b.commit(); b = writeBatch(db); } }
  await b.commit();
}
// Sayfa içi onay kutusu: confirmBox(kutuElemanı, "metin", async () => {...})
export function confirmBox(box, text, onYes) {
  box.hidden = false;
  box.innerHTML = `<span>${text}</span><button class="btn small" data-c="yes">Evet</button><button class="btn ghost small" data-c="no">Vazgeç</button>`;
  box.onclick = async e => {
    const b = e.target.closest("[data-c]"); if (!b) return;
    box.hidden = true; box.onclick = null;
    if (b.dataset.c === "yes") await act(onYes);
  };
}
// Moderatör düğme satırı: [[eylem, etiket, "ghost"?], ...]
export const btnRow = list => list.map(([a, l, c]) => `<button class="btn small ${c || ""}" data-act="${a}">${esc(l)}</button>`).join("");

/* ---------- ekran açık kalsın, ses ---------- */
let wakeLock = null;
export function keepAwake() { try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => {}); } catch (e) {} }
export function releaseAwake() { try { wakeLock && wakeLock.release(); wakeLock = null; } catch (e) {} }
let audio = null;
export function initAudio() { try { if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } audio && audio.resume && audio.resume(); } catch (e) {} }
export function beep(freq, len) {
  try {
    if (!audio) return; const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(.25, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + len);
    o.start(); o.stop(audio.currentTime + len);
  } catch (e) {}
}
document.addEventListener("click", initAudio, { once: true });

/* ---------- herkesin görebildiği katılımcı adları ---------- */
export const PEOPLE = [];
const peopleSubs = []; let peopleOn = false;
export function onPeople(cb) {
  peopleSubs.push(cb);
  if (!peopleOn) {
    peopleOn = true;
    listen(C("people"), s => {
      PEOPLE.length = 0;
      s.docs.forEach(d => PEOPLE.push({ uid: d.id, ...d.data() }));
      PEOPLE.sort(byName);
      peopleSubs.forEach(f => f(PEOPLE));
    });
  } else cb(PEOPLE);
}

/* ---------- oyun durumları: games/{oyun} ---------- */
const GS = {}, gSubs = {};
export function onGame(id, cb) {
  (gSubs[id] = gSubs[id] || []).push(cb);
  if (!(id in GS)) {
    GS[id] = undefined;
    listen(D("games", id), s => { GS[id] = s.exists() ? s.data() : { status: "off" }; gSubs[id].forEach(f => f(GS[id])); });
  } else if (GS[id]) cb(GS[id]);
}
export const gameNow = id => GS[id] || { status: "off" };
export const setGame = (id, data) => setDoc(D("games", id), data, { merge: true });
