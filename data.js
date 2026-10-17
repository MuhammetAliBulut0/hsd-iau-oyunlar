// Oyun içerikleri: buradaki listeleri düzenleyerek soru, kelime ve bingo maddelerini değiştirebilirsiniz.

export const GAMES = {
  bingo: "Tech Bingo",
  speed: "Hız Tanışması",
  murder: "Katil Kim?",
  dare: "Cesaret",
  who: "Ben Kimim",
  lie: "2 Doğru 1 Yalan"
};

export const BINGO = ["Linux kullanan biri","Hiç hackathon'a katılmış biri","İstanbul dışından gelen biri","Gece 3'te kod yazmış biri","İlk programlama dili Python olan","Bir oyun geliştirmiş biri","Mobil uygulama yapmış biri","Kendi web sitesi olan biri","3 dil konuşan biri","Seninle aynı ay doğmuş biri","Kampüse 1 saatten uzun yoldan gelen","Kahve yerine çay içen biri","Stack Overflow'a soru sormuş biri","GitHub'da 10'dan fazla reposu olan","Bir enstrüman çalan biri","Evcil hayvanı olan biri","Dark mode kullanmayan biri","Mekanik klavyesi olan biri","Vim'den çıkamamış biri","Yapay zekâyla proje yapmış biri","Bir kulüpte yönetici olmuş biri","Freelance iş yapmış biri","Sabah 7'den önce kalkan biri","Kendi bilgisayarını toplamış biri","Bir yarışmada derece almış biri","Siber güvenliğe ilgi duyan biri","Blockchain'i tek cümlede anlatabilen","Figma kullanmış biri","Bir CTF sorusu çözmüş biri","Mac kullanan biri","Bir spor takımında oynayan biri","HSD'yi bugün ilk kez duyan biri","Bilgisayarına isim koymuş biri","Telefonunda 100'den fazla uygulama olan","YouTube kanalı olan biri","Staj yapmış biri","Bir diziyi bir günde bitirmiş biri","Hiç uçağa binmemiş biri","Seninle aynı bölümde olmayan biri","Bugün 3'ten fazla kahve içmiş biri"];

export const QS = {
  "Isınma": ["Adının bir hikâyesi var mı?","Bugün buraya gelmeden önce ne yapıyordun?","Hangi bölümdesin ve neden onu seçtin?","Son dinlediğin şarkı neydi?","Hafta sonunu nasıl geçirdin?","Seni en iyi anlatan üç emoji hangisi?","Sabah insanı mısın, gece insanı mı?"],
  "Teknoloji": ["İlk yazdığın kod neydi?","Bir uygulamayı dünyadan silme hakkın olsa hangisini silerdin?","Hayatını kolaylaştıran bir uygulama öner.","Tab mı boşluk mu? Savun.","Yapay zekâya hangi işini devretmek isterdin?","Bir hackathon'da 24 saatte ne yapardın?","Başına gelen en saçma bug neydi?","Telefonunda en çok vakit geçirdiğin uygulama hangisi?","Hangi teknoloji şirketinde bir gün çalışmak isterdin?"],
  "Kampüs": ["Kampüste en sevdiğin yer neresi?","Kampüste tek bir şeyi değiştirebilsen ne olurdu?","Yemekhanenin en iyi yemeği hangisi?","Hiç derste uyuyakaldın mı?","Bir kulüp kurabilsen ne kulübü olurdu?","Mezun olunca nerede olmak istiyorsun?","Bu dönem en çok hangi derse hazırsın, hangisinden korkuyorsun?"],
  "Hayal gücü": ["Bir süper gücün olsa hangisini seçerdin?","Zaman makinesiyle bir güne gidebilsen hangisine giderdin?","Hayatın bir film olsa adı ne olurdu?","10 yıl sonraki LinkedIn başlığını söyle.","Issız bir adaya götüreceğin 3 şey ne?","Kimsenin bilmediği tuhaf bir yeteneğin var mı?","Bir gün başka biri olabilsen kim olurdun?","Sınırsız bütçeyle bir uygulama yapsan ne olurdu?"]
};

export const CATS = {
  "Teknoloji": ["Steve Jobs","Bill Gates","Ada Lovelace","Linus Torvalds","Alan Turing","Elon Musk","Mark Zuckerberg","Cahit Arf","Aziz Sancar","Nikola Tesla","Grace Hopper","Tim Berners-Lee"],
  "Uygulamalar": ["WhatsApp","Instagram","Spotify","YouTube","Google Maps","Trendyol","Getir","Discord","LinkedIn","TikTok","ChatGPT","GitHub"],
  "Hayvanlar": ["Penguen","Zürafa","Ahtapot","Kaplumbağa","Yarasa","Kanguru","Flamingo","Tembel hayvan","Sokak kedisi","Arı","Yunus","Baykuş"],
  "Meslekler": ["Diş hekimi","Pilot","Aşçı","Yazılımcı","Futbol hakemi","Ebe","İtfaiyeci","Barista","Astronot","Kuaför","Avukat","DJ"],
  "Türkiye": ["Simit","Çay bardağı","Kapalıçarşı","Kapadokya","Lokum","Nazar boncuğu","Vapur","Döner","Pamukkale","Kız Kulesi","Tavla","Ayran"],
  "Kampüs hayatı": ["Final haftası","Yemekhane","Kütüphane","Devamsızlık","Ring servisi","Proje teslimi","Büt sınavı","Kulüp standı","Erasmus","Staj","Laptop şarjı","Ders notu"]
};

export const K_ATTR = [
  { k: "Ekip", gen: "ekibi", v: ["Frontend","Backend","Tasarım","Siber Güvenlik"] },
  { k: "İçecek", gen: "içeceği", v: ["Çay","Kahve","Enerji içeceği","Ayran"] },
  { k: "03:00'te görüldüğü yer", gen: "03:00'te görüldüğü yer", v: ["Laboratuvar","Kantin","Kütüphane","Bahçe"] },
  { k: "Bilgisayar", gen: "bilgisayarı", v: ["Mac","Windows","Linux","Tablet"] }
];

export const K_SECRETS = ["Geçen hafta Pixel'e şaka olarak \"seni silerim\" yazdın. Ekran görüntüsü grupta dolaşıyor.","Demo sunumu sendeydi ve bitmemişti. Pixel'in kapanması biraz işine geldi.","Gece iki kez laboratuvardan çıktın. Nereye gittiğini kimseye söylemedin.","Pixel'in admin şifresini biliyorsun. Herkes bilmediğini sanıyor.","Kahve makinesini bozan sendin, suçu Pixel'e attın.","02:45'te sunucu odasının önünde görüldün. Sadece şarj aleti arıyordun.","Pixel'in log dosyalarından birini sildin. Başka bir sebeple, yemin edersin.","Pixel geçen ay kodunu herkesin önünde \"verimsiz\" diye eleştirdi.","Rakip okulun hackathon takımıyla gizlice mesajlaşıyorsun.","Pixel'e adını sen koydun. Onu en çok sen özleyeceksin.","Projende Pixel'in yerini alacak bir bot yazıyordun.","Gece boyunca hiç kod yazmadın, dizi izledin.","Pixel'in kablosuna takılıp düştün ama kimseye söylemedin.","Hackathon ödülü için her şeyi yaparsın. Herkes bunu biliyor.","Pixel'in kamerasında senin bir görüntün var ve silinmesini istiyordun.","Pixel'in sabah jüriye sunacağı raporda senin adın geçiyordu."];

export const K_GOALS = ["Seninle aynı ekipten 2 kişi bul ve adlarını öğren.","Senden farklı bölümde okuyan 3 kişiyle tanış.","Odada kampüse en uzaktan gelen kişiyi bul.","Aynı içeceği seçen biriyle gerçek hayatta ortak bir şey bul.","Oyun bitene kadar en az 6 kişinin adını ezberle.","Bugün ilk kez gördüğün 3 kişiye ipucunu anlat.","Seninle aynı ay doğmuş birini bul.","Bir kişiyi ikna et, seninle ortak dedektiflik yapsın.","Hiç hackathon'a katılmamış birini bul ve ona Pixel'i anlat.","Gerçek hayatta Linux kullanan birini bul.","3 kişiden en sevdikleri uygulamayı öğren.","En az 5 farklı kişinin Kimliğini not al.","Odadaki en sessiz kişiyle konuş ve ondan bir ipucu al.","2 kişiye sırrını anlat, karşılığında onların sırrını öğren."];

// Katil Kim? kurgusu: names dizisindeki her kişiye bir kart üretir (cards[i] -> names[i]).
export function genMystery(names) {
  const N = names.length;
  const ri = n => Math.floor(Math.random() * n);
  const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const same = (a, b) => a.every((x, i) => x === b[i]);
  const pos = (a, v) => `Katilin ${K_ATTR[a].gen}: ${K_ATTR[a].v[v]}`;
  const neg = (a, v) => `Katilin ${K_ATTR[a].gen} ${K_ATTR[a].v[v]} DEĞİL.`;

  const kT = [ri(4), ri(4), ri(4), ri(4)];
  const order = sh([...Array(N).keys()]);
  const killer = order[0], herring = order[1];
  const j = ri(4);
  const hT = kT.slice(); hT[j] = (kT[j] + 1 + ri(3)) % 4;

  const cards = [];
  for (let i = 0; i < N; i++) {
    let t;
    if (i === killer) t = kT;
    else if (i === herring) t = hT;
    else { do { t = [ri(4), ri(4), ri(4), ri(4)]; } while (same(t, kT) || same(t, hT)); }
    cards[i] = { traits: t, clues: [], fake: null };
  }

  const rest = order.slice(2);
  let p = 0;
  const accomplice = N >= 14 ? rest[p++] : -1;
  const wCount = N >= 30 ? 8 : 4;
  const witnesses = rest.slice(p, p + wCount); p += wCount;
  const dCount = N >= 40 ? 2 : N >= 10 ? 1 : 0;
  const detectives = rest.slice(p, p + dCount); p += dCount;
  const innocents = rest.slice(p).concat([herring]);

  const anti = [j, hT[j]];
  const negs = [];
  for (let a = 0; a < 4; a++) for (let v = 0; v < 4; v++) if (v !== kT[a] && !(a === anti[0] && v === anti[1])) negs.push([a, v]);
  const negList = [anti].concat(sh(negs));
  let ni = 0; const nextNeg = () => negList[ni++ % negList.length];
  const secrets = sh(K_SECRETS), goals = sh(K_GOALS);
  let si = 0, gi = 0;
  const sec = () => secrets[si++ % secrets.length], goal = () => goals[gi++ % goals.length];
  const fake = pos(j, hT[j]);

  Object.assign(cards[killer], {
    role: "Katil", bad: true, fake,
    desc: "Pixel'i sen kapattın. Yakalanmamaya çalış.",
    secret: "Pixel sabahki demoda senin kodundaki hatayı jüriye gösterecekti. 03:00'te fişini sen çektin.",
    goal: "Oylamada en çok oyu sen almazsan kazanırsın. Uydurma ipucunu en az 4 kişiye anlat ve şüpheyi başkasına çevir."
  });
  if (accomplice >= 0) Object.assign(cards[accomplice], {
    role: "Suç Ortağı", bad: true, fake,
    desc: `Katile yardım ettin. Katil: ${names[killer]}. Onu bul ve gizlice tanış.`,
    secret: "Pixel'in kamerasını 02:55'te sen kapattın. Katil senden bunu istedi.",
    goal: "Katil oylamadan kurtulursa sen de kazanırsın. Uydurma ipucunu yay ve masumlar arasında tartışma çıkar."
  });
  witnesses.forEach((w, k) => { const a = k % 4; Object.assign(cards[w], { role: "Tanık", desc: "O gece bir şey gördün. İpucun gerçek ve çok değerli.", clues: [pos(a, kT[a])], secret: sec(), goal: goal() }); });
  detectives.forEach(d => { const n1 = nextNeg(), n2 = nextNeg(); Object.assign(cards[d], { role: "Dedektif", desc: "Oyunda bir kez, istediğin birine \"Kartını göster\" diyebilirsin. O kişi sana kartının Kimlik bölümünü göstermek zorunda.", clues: [neg(n1[0], n1[1]), neg(n2[0], n2[1])], secret: sec(), goal: "Oylamadan önce herkese kimi suçladığını ve nedenini 30 saniyede anlat." }); });
  innocents.forEach(i => { const n = nextNeg(); Object.assign(cards[i], { role: "Masum", desc: "Bir şey yapmadın ama bir şey biliyorsun. İpucun gerçek.", clues: [neg(n[0], n[1])], secret: sec(), goal: goal() }); });

  cards.forEach(c => { c.bad = !!c.bad; });
  return { cards, killer, accomplice, herring };
}
