// Oyun içerikleri. Soru, kelime ve bingo maddelerini buradan değiştirebilirsiniz.

export const GAMES = {
  bingo: "Tech Bingo",
  speed: "Hız Tanışması",
  murder: "Katil Kim?",
  dare: "Cesaret",
  who: "Ben Kimim",
  lie: "2 Doğru 1 Yalan"
};

/* ---------------- TECH BINGO ---------------- */
export const BINGO = [
  "Kahve yerine çay içen biri", "Seninle aynı ay doğmuş biri", "İstanbul dışından gelmiş biri", "Evcil hayvanı olan biri",
  "Bir enstrüman çalan biri", "Hiç uçağa binmemiş biri", "Yurt dışına çıkmış biri", "3 dil konuşan biri",
  "Solak biri", "Tek çocuk olan biri", "Ehliyeti olan biri", "Yurtta kalan biri",
  "Okula 1 saatten uzun yoldan gelen", "Sabah 7'den önce kalkan biri", "Bir diziyi bir günde bitirmiş biri", "Yemek yapmayı seven biri",
  "Bir spor takımında oynayan biri", "Gözlük takan biri", "Dans edebilen biri", "Bu yıl bir konsere gitmiş biri",
  "Kamp yapmış biri", "Kitap okumayı seven biri", "Fotoğraf çekmeyi seven biri", "Video oyunu oynayan biri",
  "Kod yazmayı bilen biri", "Bir kulübe üye olan biri", "Okula bu yıl başlayan biri", "Seninle aynı bölümde olmayan biri",
  "Bir yarışmada ödül almış biri", "Doğum günü bu ay olan biri", "Kahvaltıyı hiç atlamayan biri", "Kore dizisi izlemiş biri",
  "Stadyumda maç izlemiş biri", "Bu yıl tiyatroya gitmiş biri", "Resim yapmayı seven biri", "Yabancı bir ülkede arkadaşı olan",
  "Kendi saçını kendi kesmiş biri", "Bisiklet sürmeyi seven biri", "Gece kuşu olan biri", "Buraya arkadaşıyla gelmiş biri",
  "Gönüllü bir projede çalışmış biri", "Bir kardeşi kendisinden küçük olan", "Bugün 2'den fazla çay ya da kahve içmiş", "HSD'yi bugün ilk kez duyan biri"
];

/* ---------------- HIZ TANIŞMASI ---------------- */
export const QS = {
  "Isınma": ["Adının bir hikâyesi var mı?", "Bugün buraya gelmeden önce ne yapıyordun?", "Hangi bölümdesin ve neden onu seçtin?", "Son dinlediğin şarkı neydi?", "Hafta sonunu nasıl geçirdin?", "Seni üç kelimeyle anlatır mısın?", "Sabah insanı mısın, gece insanı mı?", "Okulda en sevdiğin yer neresi?"],
  "Hayatın": ["Seni en mutlu eden küçük şey ne?", "Çocukken ne olmak istiyordun?", "Bu yıl öğrendiğin en ilginç şey ne?", "En sevdiğin şehir hangisi, neden?", "Aldığın en iyi tavsiye neydi?", "Unutamadığın bir yolculuğu anlat.", "Seni en iyi anlatan şarkı hangisi?", "Bu yıl kendine koyduğun bir hedef var mı?"],
  "Zevkler": ["En sevdiğin yemek ne?", "Son izleyip beğendiğin film ya da dizi hangisi?", "Kitap mı film mi?", "Deniz mi dağ mı?", "Kedi mi köpek mi?", "Yaz mı kış mı?", "Hangi sanatçının konserine gitmek isterdin?", "Tatlı mı tuzlu mu?"],
  "Ya şöyle olsaydı?": ["Bir süper gücün olsa hangisini seçerdin?", "Zaman makinesiyle hangi güne giderdin?", "Bir milyon lira kazansan ilk ne yapardın?", "Issız bir adaya götüreceğin 3 şey ne?", "Bir gün görünmez olsan ne yapardın?", "Bir hayvan olsaydın hangisi olurdun?", "Bir ünlüyle yemek yiyebilsen kim olurdu?", "Bir dili anında öğrenebilsen hangisi olurdu?"],
  "Okul hayatı": ["Okulda tek bir şeyi değiştirebilsen ne olurdu?", "Yemekhanenin en iyi yemeği hangisi?", "Hiç derste uyuyakaldın mı?", "Bir kulüp kurabilsen ne kulübü olurdu?", "Mezun olunca nerede olmak istiyorsun?", "Bu dönem en çok hangi dersi seviyorsun?", "Sınav haftasında hayatta kalma taktiğin ne?", "Okulda tanıştığın ilk kişi kimdi?"]
};

/* ---------------- BEN KİMİM (TABU) ----------------
   Her satır: "Kelime|yasak1,yasak2,yasak3" */
const T = {
  "Hayvanlar": ["Kedi|miyav,tüy,köpek", "Köpek|havlamak,kemik,sadık", "Aslan|orman kralı,yele,kükremek", "Fil|hortum,büyük,fildişi", "Zürafa|uzun,boyun,benek", "Penguen|kutup,buz,paytak", "Maymun|muz,ağaç,kuyruk", "Tavşan|havuç,kulak,zıplamak", "Kaplumbağa|kabuk,yavaş,deniz", "Yılan|zehir,sürünmek,tıslamak", "Arı|bal,vızıltı,iğne", "Kelebek|kanat,tırtıl,renkli", "Balık|su,yüzmek,akvaryum", "Köpekbalığı|diş,deniz,yüzgeç", "Yunus|zeki,deniz,atlamak", "At|binmek,nal,koşmak", "İnek|süt,mö,çiftlik", "Tavuk|yumurta,gıdak,horoz", "Ördek|vak,göl,yüzmek", "Baykuş|gece,göz,bilge", "Kartal|uçmak,pençe,yüksek", "Ayı|kış uykusu,bal,boz", "Kurt|uluma,sürü,ay", "Tilki|kurnaz,kırmızı,kuyruk", "Kanguru|Avustralya,kese,zıplamak", "Timsah|nehir,çene,sürüngen", "Örümcek|ağ,sekiz,bacak", "Karınca|küçük,çalışkan,yuva", "Sincap|fındık,ağaç,kabarık", "Deve|hörgüç,çöl,su"],
  "Yiyecek & İçecek": ["Pizza|İtalya,dilim,peynir", "Hamburger|köfte,ekmek,fast food", "Simit|susam,çay,halka", "Döner|et,dürüm,şiş", "Lahmacun|ince,kıyma,limon", "Baklava|şerbet,fıstık,tatlı", "Çay|demlik,bardak,sıcak", "Türk kahvesi|fincan,köpük,fal", "Ayran|yoğurt,tuz,içmek", "Dondurma|soğuk,külah,yaz", "Çikolata|kakao,tatlı,tablet", "Makarna|spagetti,haşlamak,sos", "Pilav|pirinç,tencere,tane", "Menemen|yumurta,domates,biber", "Patates kızartması|yağ,ketçap,çıtır", "Karpuz|yaz,çekirdek,kırmızı", "Muz|sarı,maymun,kabuk", "Elma|kırmızı,ağaç,meyve", "Limon|ekşi,sarı,sıkmak", "Pasta|doğum günü,mum,krema", "Mantı|hamur,yoğurt,Kayseri", "Kokoreç|bağırsak,ekmek,sokak", "Patlamış mısır|sinema,tuz,patlamak", "Yumurta|tavuk,kahvaltı,haşlanmış", "Peynir|beyaz,süt,kahvaltı", "Bal|arı,tatlı,petek", "Çorba|kaşık,sıcak,mercimek", "Su|içmek,şişe,bardak", "Limonata|limon,şeker,serin", "Tost|ekmek,kaşar,makine"],
  "Meslekler": ["Doktor|hastane,hasta,tedavi", "Öğretmen|okul,ders,öğrenci", "Polis|suç,karakol,düdük", "İtfaiyeci|yangın,su,hortum", "Aşçı|yemek,mutfak,şef", "Pilot|uçak,kokpit,uçmak", "Hemşire|hastane,iğne,bakım", "Avukat|mahkeme,dava,hukuk", "Hakim|mahkeme,karar,tokmak", "Mühendis|proje,hesap,bina", "Yazılımcı|kod,bilgisayar,program", "Berber|saç,sakal,makas", "Garson|restoran,sipariş,servis", "Kasiyer|market,para,kasa", "Fotoğrafçı|kamera,çekmek,poz", "Şoför|araba,direksiyon,sürmek", "Postacı|mektup,kargo,zil", "Çiftçi|tarla,traktör,hasat", "Mimar|bina,çizim,tasarım", "Diş hekimi|diş,çürük,ağız", "Veteriner|hayvan,tedavi,kedi", "Eczacı|ilaç,reçete,eczane", "Astronot|uzay,roket,ay", "Futbolcu|top,gol,maç", "Şarkıcı|şarkı,sahne,ses", "Oyuncu|film,dizi,rol", "Ressam|tablo,fırça,boya", "Gazeteci|haber,muhabir,yazmak", "Kaptan|gemi,deniz,dümen", "Terzi|dikiş,kumaş,iğne"],
  "Ev & Eşyalar": ["Buzdolabı|soğuk,mutfak,yiyecek", "Çamaşır makinesi|yıkamak,kıyafet,deterjan", "Yastık|uyku,yatak,baş", "Ayna|yansıma,yüz,bakmak", "Şemsiye|yağmur,açmak,ıslanmak", "Saat|zaman,akrep,yelkovan", "Anahtar|kapı,kilit,açmak", "Gözlük|göz,cam,görmek", "Cüzdan|para,kart,cep", "Diş fırçası|diş,macun,sabah", "Makas|kesmek,kağıt,keskin", "Kalem|yazmak,mürekkep,kurşun", "Mum|ateş,ışık,erimek", "Battaniye|sıcak,örtü,kış", "Kumanda|televizyon,kanal,düğme", "Süpürge|toz,temizlik,elektrik", "Ütü|kırışık,sıcak,kıyafet", "Sandalye|oturmak,masa,ayak", "Lamba|ışık,ampul,yakmak", "Çanta|taşımak,omuz,okul", "Havlu|kurulanmak,banyo,ıslak", "Tava|yağ,kızartmak,ocak", "Çaydanlık|çay,demlik,kaynamak", "Bardak|içmek,su,cam", "Kapı|açmak,kapatmak,kilit", "Yatak|uyumak,yastık,çarşaf", "Pencere|cam,perde,açmak", "Halı|yer,yün,sermek", "Kitap|okumak,sayfa,yazar", "Fotoğraf makinesi|çekmek,poz,lens"],
  "Yerler": ["Hastane|doktor,hasta,ambulans", "Okul|öğretmen,ders,sınıf", "Kütüphane|kitap,sessiz,okumak", "Sinema|film,perde,bilet", "Plaj|deniz,kum,güneş", "Havalimanı|uçak,bavul,uçuş", "Market|alışveriş,kasa,sepet", "Park|bank,ağaç,salıncak", "Müze|tarih,sergi,eser", "Hayvanat bahçesi|hayvan,kafes,ziyaret", "Kafe|kahve,oturmak,sohbet", "Restoran|yemek,garson,menü", "Spor salonu|ağırlık,egzersiz,koşu bandı", "Otel|oda,resepsiyon,tatil", "Stadyum|maç,tribün,futbol", "Kampüs|üniversite,öğrenci,fakülte", "Banka|para,hesap,ATM", "Eczane|ilaç,reçete,eczacı", "Postane|mektup,kargo,PTT", "Çarşı|alışveriş,dükkan,pazar", "Orman|ağaç,yeşil,hayvan", "Çöl|kum,sıcak,deve", "Ada|deniz,etrafı,su", "Dağ|zirve,tırmanmak,yüksek", "Köprü|geçmek,nehir,Boğaz", "Metro|tren,yeraltı,durak", "Lunapark|dönme dolap,eğlence,bilet", "Kuaför|saç,boya,fön", "Mutfak|yemek,ocak,tencere", "Kamp alanı|çadır,ateş,doğa"],
  "Spor & Hobiler": ["Futbol|top,gol,kale", "Basketbol|pota,smaç,top", "Voleybol|file,smaç,pas", "Yüzme|havuz,su,kulaç", "Tenis|raket,kort,top", "Satranç|şah,piyon,tahta", "Bisiklet|pedal,tekerlek,sürmek", "Koşu|maraton,hız,ayakkabı", "Yoga|esneme,nefes,mat", "Dans|müzik,ritim,adım", "Boks|yumruk,eldiven,ring", "Kayak|kar,dağ,kaymak", "Okçuluk|ok,yay,hedef", "Fotoğrafçılık|kamera,çekmek,kare", "Resim yapmak|boya,fırça,tuval", "Gitar|tel,çalmak,akor", "Piyano|tuş,çalmak,nota", "Kitap okumak|sayfa,roman,yazar", "Yemek yapmak|mutfak,tarif,ocak", "Kamp|çadır,doğa,ateş", "Balık tutmak|olta,göl,yem", "Bulmaca|kare,kelime,çözmek", "Video oyunu|konsol,oynamak,kol", "Örgü|şiş,yün,atkı", "Dağcılık|tırmanmak,zirve,ip", "Masa tenisi|raket,pinpon,masa", "Golf|delik,sopa,çim", "Sörf|dalga,tahta,deniz", "Bowling|lobut,top,strike", "Karaoke|şarkı,mikrofon,söylemek"],
  "Teknoloji": ["Telefon|aramak,ekran,mesaj", "Bilgisayar|klavye,ekran,fare", "Şarj aleti|pil,kablo,priz", "Kulaklık|müzik,kulak,dinlemek", "İnternet|Wi-Fi,bağlantı,web", "Şifre|giriş,gizli,parola", "Selfie|fotoğraf,kendi,kamera", "Emoji|gülen yüz,mesaj,ifade", "Robot|makine,yapay,metal", "Drone|uçmak,kamera,pervane", "Oyun konsolu|PlayStation,oynamak,kol", "Akıllı saat|bilek,adım,bildirim", "Klavye|tuş,yazmak,harf", "Mouse|tıklamak,imleç,fare", "Yazıcı|kağıt,mürekkep,çıktı", "Televizyon|kanal,kumanda,dizi", "Hoparlör|ses,müzik,yüksek", "Bluetooth|kablosuz,bağlanmak,kulaklık", "Uygulama|indirmek,telefon,mağaza", "Virüs|bozmak,antivirüs,bilgisayar", "Yapay zekâ|robot,akıllı,ChatGPT", "QR kod|okutmak,kare,kamera", "E-posta|mail,göndermek,gelen kutusu", "Video|izlemek,YouTube,kayıt", "Powerbank|şarj,taşınabilir,pil", "USB bellek|dosya,takmak,depolama", "Navigasyon|harita,yol,konum", "Tablet|dokunmatik,ekran,iPad", "Hesap makinesi|toplama,sayı,işlem", "Oyun|oynamak,kazanmak,seviye"],
  "Okul & Kampüs": ["Sınav|soru,not,çalışmak", "Ödev|ev,teslim,öğretmen", "Final haftası|sınav,dönem sonu,stres", "Yemekhane|yemek,tepsi,kuyruk", "Kantin|tost,çay,mola", "Ders notu|defter,yazmak,fotokopi", "Mezuniyet|kep,diploma,tören", "Kulüp|üye,etkinlik,topluluk", "Devamsızlık|yoklama,gitmemek,ders", "Proje|grup,teslim,sunum", "Sunum|slayt,konuşmak,anlatmak", "Hoca|ders,üniversite,öğretmen", "Not ortalaması|GPA,ders,puan", "Staj|şirket,yaz,deneyim", "Yurt|oda,kalmak,öğrenci", "Servis|otobüs,durak,beklemek", "Erasmus|yurt dışı,değişim,Avrupa", "Burs|para,destek,başarı", "Ders programı|saat,gün,tablo", "Teneffüs|ara,zil,dinlenmek", "Defter|yazmak,sayfa,kalem", "Silgi|silmek,kalem,hata", "Sırt çantası|omuz,kitap,taşımak", "Öğrenci kartı|kimlik,giriş,indirim", "Laboratuvar|deney,önlük,bilgisayar", "Kopya|sınav,yasak,gizli", "Bütünleme|sınav,kalmak,ikinci şans", "Kayıt haftası|ders seçmek,dönem başı,danışman", "Sınıf arkadaşı|aynı,ders,arkadaş", "Amfi|büyük,ders,sıra"]
};
export const TABU_CATS = Object.keys(T);
// id: "kategoriSırası-kelimeSırası"
export function tabuCard(id) {
  const [c, i] = String(id).split("-").map(Number);
  const cat = TABU_CATS[c]; if (!cat) return null;
  const row = T[cat][i]; if (!row) return null;
  const [word, taboo] = row.split("|");
  return { id, cat, word, taboo: taboo.split(",") };
}
export function tabuDeck(catNames) {
  const ids = [];
  catNames.forEach(n => { const c = TABU_CATS.indexOf(n); if (c >= 0) T[n].forEach((_, i) => ids.push(c + "-" + i)); });
  return ids;
}
export const tabuCount = cat => (T[cat] || []).length;

/* ---------------- KATİL KİM? (VAMPİR KÖYLÜ) ---------------- */
export const WW_ROLES = {
  vampir: { name: "Vampir", team: "kotu", short: "Geceleri kurban seçer",
    desc: "Geceleri diğer vampirlerle birlikte bir kurban seçersin. Gündüz masum bir köylü gibi davran ve şüpheyi başkasına çevir.",
    win: "Hayatta kalan vampir sayısı diğerlerine eşit olunca vampirler kazanır." },
  koylu: { name: "Köylü", team: "iyi", short: "Özel gücü yok, oyuyla oynar",
    desc: "Özel bir gücün yok ama oyun senin oyunla döner. Gündüz tartışmada vampirleri bulmaya çalış ve oy ver.",
    win: "Bütün vampirler elenince köylüler kazanır." },
  kahin: { name: "Kâhin", team: "iyi", short: "Her gece birinin rolünü öğrenir",
    desc: "Her gece bir kişinin rolünü öğrenirsin. Bilgini dikkatli kullan: kendini belli edersen vampirlerin hedefi olursun.",
    win: "Köylülerle birlikte kazanırsın." },
  doktor: { name: "Doktor", team: "iyi", short: "Her gece birini korur",
    desc: "Her gece bir kişiyi korursun. Vampirler o gece o kişiyi seçerse ölmez. Kendini de koruyabilirsin ama aynı kişiyi üst üste iki gece koruyamazsın.",
    win: "Köylülerle birlikte kazanırsın." },
  cadi: { name: "Cadı", team: "iyi", short: "Bir hayat, bir ölüm iksiri",
    desc: "Her gece vampirlerin kimi seçtiğini görürsün. İki iksirin var ve her biri oyunda bir kez kullanılır. Hayat iksiri vampirlerin kurbanını kurtarır. Ölüm iksiri istediğin birini öldürür.",
    win: "Köylülerle birlikte kazanırsın." },
  avci: { name: "Avcı", team: "iyi", short: "Ölürken birini yanında götürür",
    desc: "Elendiğin anda, gece ya da gündüz fark etmez, son bir atış hakkın var. Birini işaret edersin ve o da seninle birlikte elenir. Atışını moderatöre söyle.",
    win: "Köylülerle birlikte kazanırsın." },
  yazilimci: { name: "Yazılımcı", team: "iyi", short: "Ctrl+Z ile bir oylamayı geri alır", special: true,
    desc: "Bize özel rol. Oyunda bir kez Ctrl+Z yapabilirsin: gündüz oylamayla elenen kişiyi geri getirirsin. Oylama sonucu açıklanınca Ctrl+Z düğmesine bas. Kullanınca herkes senin Yazılımcı olduğunu öğrenir.",
    win: "Köylülerle birlikte kazanırsın." }
};
export const WW_ORDER = ["vampir", "kahin", "doktor", "cadi", "avci", "yazilimci", "koylu"];
export function wwDefaultCounts(n) {
  const vampir = n <= 7 ? 1 : n <= 11 ? 2 : n <= 16 ? 3 : n <= 21 ? 4 : Math.floor(n / 5);
  const c = { vampir, kahin: 1, doktor: 1, yazilimci: 1, cadi: n >= 8 ? 1 : 0, avci: n >= 10 ? 1 : 0 };
  const used = Object.values(c).reduce((a, b) => a + b, 0);
  c.koylu = Math.max(0, n - used);
  return c;
}
