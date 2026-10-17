# HSD İAÜ Tanışma Oyunları · Kurulum

Bu klasör sitenin kendisi. İçindeki dosyalar:

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Sayfanın görünümü |
| `app.js` | Giriş, moderatör yetkileri ve oyunların çalışması |
| `data.js` | Oyun içerikleri (bingo maddeleri, sorular, kelimeler, Katil Kim kurgusu). Soru eklemek istersen buradan değiştir. |
| `firebase-config.js` | Firebase projenin bağlantı bilgileri ve yönetici Gmail adresi |
| `firestore.rules` | Veritabanı güvenlik kuralları: kimin neyi görebileceği |

> Not: `index.html` dosyasına çift tıklayıp açarsan çalışmaz. Site, Vercel'e yüklendikten sonra kendi adresinde çalışır.

---

## 1. Güvenlik kurallarını yükle

1. Firebase konsolunda sol menüden **Firestore Database**'e gir.
2. Üstteki **Rules** (Kurallar) sekmesine tıkla.
3. Kutudaki her şeyi sil. `firestore.rules` dosyasını Not Defteri ile aç, **tamamını** kopyalayıp kutuya yapıştır.
4. **Publish** (Yayınla) düğmesine bas.

## 2. Kodu GitHub'a yükle

1. github.com'a gir, sağ üstteki **+** düğmesinden **New repository**'yi seç.
2. Repository adı `hsd-iau-oyunlar` olsun. Public veya Private, ikisi de olur. **Create repository**'ye bas.
3. Açılan sayfada **uploading an existing file** bağlantısına tıkla.
4. `E:\hsd-iau-oyunlar` klasörünü aç ve içindeki **dosyaları** (klasörün kendisini değil) sürükleyip bırak.
5. Alttaki **Commit changes** düğmesine bas.

## 3. Vercel'de yayına al

1. vercel.com'a GitHub hesabınla giriş yap.
2. **Add New… → Project**'e bas, listeden `hsd-iau-oyunlar` reposunun yanındaki **Import**'a tıkla.
3. **Framework Preset** alanında **Other** seçili olsun, başka hiçbir ayara dokunma. **Deploy**'a bas.
4. Yaklaşık 30 saniye sonra site yayında olur. Adresi not et, örneğin `hsd-iau-oyunlar.vercel.app`.

## 4. Site adresine giriş izni ver

Google girişi sadece izin verilen adreslerde çalışır.

1. Firebase konsolunda **Authentication → Settings** (Ayarlar) sekmesine gir, **Authorized domains**'i aç.
2. **Add domain**'e bas ve Vercel adresini `https://` olmadan yaz, örneğin `hsd-iau-oyunlar.vercel.app`.
3. **Add**'e bas.

## 5. Dene

1. Siteyi telefondan aç ve Google ile giriş yap.
2. Sağ üstte adının altında **Yönetici** yazmalı ve en altta **Moderatör Paneli** sekmesi görünmeli.
3. Başka bir hesapla girersen **Katılımcı** yazmalı ve moderatör bölümleri görünmemeli.

## Moderatör eklemek

- Moderatör Paneli'nde giriş yapmış katılımcıların listesi var, yanlarındaki **Moderatör yap** düğmesine basman yeterli.
- Henüz giriş yapmamış birini eklemek için Gmail adresini yazıp **Moderatör yap**'a bas.
- Moderatör eklemek ve çıkarmak sadece yöneticinin (senin) yetkinde. Moderatörler tüm kartları, çözümleri ve oyları görür, oyunları yönetir.

## Kodu değiştirince

GitHub'daki repoda dosyayı güncelle (dosyayı aç, kalem simgesi ya da **Add file → Upload files**). Vercel değişikliği bir dakika içinde kendiliğinden yayına alır.

## Etkinlik günü

- Sitenin adresini QR koda çevir (örneğin qr-code-generator.com) ve projeksiyona yansıt.
- Moderatör Paneli'ndeki **Canlı oyun** bölümünden oyunu seçince herkesin ekranı o oyuna geçer.
- Hız tanışması turlarını moderatörün sayfası ilerletir. Sayfayı açık bırak, ekran kilitlenmesin.
- Ücretsiz Firebase planı günlük 50.000 okuma veriyor. 100 kişilik bir etkinlik için yeterli.
