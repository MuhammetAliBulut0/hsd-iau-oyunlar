# HSD İAÜ Tanışma Oyunları

Huawei Student Developers İstanbul Aydın Üniversitesi (HSD İAÜ) tanışma etkinlikleri için hazırlanmış, telefondan oynanan çok oyunculu bir web uygulaması. Katılımcılar Google hesabıyla giriş yapar. Moderatörler oyunları başlatır ve yönetir. Herkes kendi telefonundan oynar.

**Canlı adresler:** [hsd-iau-oyunlar.web.app](https://hsd-iau-oyunlar.web.app) · [hsd-iau-oyunlar.vercel.app](https://hsd-iau-oyunlar.vercel.app)

## Oyunlar

| Oyun | Nasıl oynanır |
|---|---|
| **Tech Bingo** | Herkese 16 kutulu rastgele bir kart düşer ("Kahve yerine çay içen biri" gibi). Katılımcılar odada dolaşıp her kutuya uyan birini bulur. Kutulara sadece o an oyunda olan kişiler, adlarının ilk harfleri yazılarak eklenebilir. İlk üç bingo yapan sabit kazanandır. |
| **Hız Tanışması** | İç içe iki halka kurulur. Soru ve süre herkesin ekranında aynı anda görünür. Süre bitince dış halka bir kişi kayar. Turları moderatörün sayfası ilerletir. |
| **Katil Kim?** | Vampir Köylü kurallarıyla oynanır. Roller: Vampir, Köylü, Kâhin, Doktor, Cadı, Avcı ve kulübe özel **Yazılımcı** (oyunda bir kez oylamayı Ctrl+Z ile geri alır). Gece görevleri ve oylama telefondan yapılır, kazanan belli olunca oyun kendiliğinden biter. Aynı anda birden fazla oda açılabilir ve her odayı bir moderatör yönetir. |
| **Tabu** | Gruplar kurulur, moderatör onaylarken grubun oyun yöneticisini seçer. Anlatan kişi kartı görür, takım arkadaşları tahmin eder, rakip takımdan rastgele seçilen bir kontrolcü yasaklı kelimeleri denetler. 8 kategoride 240 kelime var ve bir oyunda kelime tekrar etmez. |
| **Cesaret** | Herkes bir görev yazar. Moderatör uygunsuz görevleri kaldırır. Başlayınca herkese kendi yazdığı dışında, başka kimseye verilmemiş bir görev düşer. |
| **2 Doğru 1 Yalan** | Herkes kendisi hakkında 3 cümle yazar. **Sahne modunda** kişiler sırayla sahneye çıkar, diğerleri telefondan oylar. **Avcı modunda** herkese başka birinin cümleleri düşer ve o kişiyi bulup konuşarak yalanı tahmin eder. |

## Roller ve yetkiler

- **Katılımcı:** Oyunlara katılır. Sadece kendi kartını, görevini ve rolünü görür.
- **Moderatör:** Oyunları başlatır ve bitirir. Tüm kartları, rolleri, oyları ve görevleri görür. "Canlı oyun" seçerek herkesin ekranını o oyuna yönlendirir.
- **Yönetici:** Moderatörlerin yaptığı her şeyi yapar, ayrıca moderatör ekleyip çıkarabilir. Yönetici adresi `firebase-config.js` ve `firestore.rules` dosyalarında tanımlıdır.

Yetkiler tarayıcıda değil, Firestore güvenlik kurallarıyla sunucuda uygulanır. Geliştirici araçlarını açan bir katılımcı da başkasının rolünü ya da kartını okuyamaz.

## Teknolojiler

- **Ön yüz:** Derleme adımı olmayan düz HTML, CSS ve JavaScript (ES modülleri)
- **Kimlik doğrulama:** Firebase Authentication (Google ile giriş)
- **Veritabanı:** Cloud Firestore (gerçek zamanlı dinleyiciler ve transaction'lar)
- **Barındırma:** Firebase Hosting ve Vercel (ikisi de aynı kodu yayınlar)

Firebase JS SDK 10.12.2, `gstatic.com` üzerinden modül olarak yüklenir. `npm install` gerekmez.

## Dosya yapısı

```
index.html          Sayfa, stiller ve oyun açıklamaları
app.js              Giriş, sekmeler, canlı oyun, moderatör paneli
core.js             Firebase bağlantısı ve ortak yardımcılar
data.js             Oyun içerikleri: bingo maddeleri, sorular, tabu kelimeleri, roller
g-bingo.js          Tech Bingo
g-speed.js          Hız Tanışması
g-ww.js             Katil Kim? (Vampir Köylü)
g-tabu.js           Tabu
g-dare.js           Cesaret
g-lie.js            2 Doğru 1 Yalan
firebase-config.js  Firebase proje bilgileri ve yönetici adresi
firestore.rules     Firestore güvenlik kuralları
firebase.json       Firebase Hosting ayarı
vercel.json         Vercel ayarı (giriş isteklerini Firebase'e aktarır)
KURULUM.md          Türkçe kullanım ve güncelleme rehberi
```

İçerik eklemek için sadece `data.js` dosyasını düzenlemek yeterli: yeni bingo maddesi, hız tanışması sorusu ya da `"Kelime|yasak1,yasak2,yasak3"` biçiminde tabu kartı.

## Veri modeli (özet)

| Koleksiyon | İçerik | Kim okur |
|---|---|---|
| `users` | Ad ve e-posta | Kişinin kendisi ve moderatörler |
| `people` | Herkese görünen ad | Giriş yapmış herkes |
| `mods` | Moderatör e-postaları | Giriş yapmış herkes (sadece yönetici yazar) |
| `games/{oyun}` | Bingo, Cesaret ve 2D1Y oyunlarının durumu | Herkes (sadece moderatör yazar) |
| `bingoCards`, `bingoPlayers`, `bingoWins` | Bingo kartları, o an oynayanlar, kazananlar | Kart: kişinin kendisi ve moderatör |
| `speed/state` | Hız tanışmasının turu, sorusu ve süresi | Herkes |
| `ww/{oda}/players, roles, actions, inbox, votes` | Vampir Köylü odası | Roller ve gece görevleri: kişinin kendisi ve moderatör |
| `tabu/{grup}/members` | Tabu grupları ve oyun durumu | Herkes (grup üyeleri günceller) |
| `dareSubs`, `dareGot` | Yazılan ve dağıtılan görevler | Kişinin kendisi ve moderatör |
| `lieSubs`, `lieStage`, `lieVotes`, `lieHunt`, `lieGuess` | 2D1Y cümleleri, sahne, oylar ve av | Cevaplar sadece moderatöre açık |

Kuralların tamamı `firestore.rules` dosyasında.

## Kurulum

1. [Firebase konsolunda](https://console.firebase.google.com) bir proje aç, ücretsiz Spark planı yeterli.
2. Bir **Web uygulaması** ekle ve verilen bilgileri `firebase-config.js` dosyasına yaz.
3. **Authentication → Sign-in method** altında **Google**'ı etkinleştir.
4. **Firestore Database** oluştur, production mode'da başlat. **Rules** sekmesine `firestore.rules` dosyasının içeriğini yapıştır ve **Publish**'e bas.
5. `firebase-config.js` ve `firestore.rules` dosyalarındaki yönetici e-postasını kendi adresinle değiştir.

### Firebase Hosting'e yayınlama

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting --project <proje-id>
```

### Vercel'e yayınlama

Repoyu Vercel'de **Import** et ve Framework Preset olarak **Other** seç. Ardından:

- Vercel adresini **Authentication → Settings → Authorized domains** listesine ekle.
- Google Cloud Console'da **APIs & Services → Credentials → Web client** altına şu iki adresi ekle:
  - Authorized JavaScript origins: `https://<adres>`
  - Authorized redirect URIs: `https://<adres>/__/auth/handler`

`vercel.json`, `/__/auth/*` isteklerini Firebase'e aktarır. `firebase-config.js` de `authDomain` değerini sitenin açıldığı adrese göre ayarlar. Böylece iPhone Safari'deki çapraz site depolama kısıtlaması girişi bozmaz.

## Yerelde çalıştırma

ES modülleri dosyadan (`file://`) açılınca çalışmaz, küçük bir sunucu gerekir:

```bash
npx serve .
```

`localhost` Firebase'in izin verilen adresler listesinde varsayılan olarak bulunur.

## Güncelleme

1. Kod değiştiyse Firebase Hosting için `firebase deploy --only hosting` komutunu çalıştır. Vercel için dosyaları GitHub'a yüklemen yeterli, Vercel kendiliğinden yayına alır.
2. `firestore.rules` değiştiyse kuralları Firebase konsolunda yeniden yayınla.

Moderatörler için ayrıntılı kullanım rehberi `KURULUM.md` dosyasında.

---

HSD İAÜ · Huawei Student Developers İstanbul Aydın Üniversitesi
