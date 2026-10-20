# HSD İAÜ Tanışma Oyunları · Kurulum ve Güncelleme

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Sayfanın görünümü ve oyunların açıklamaları |
| `app.js` | Giriş, sekmeler, canlı oyun ve moderatör paneli |
| `core.js` | Firebase bağlantısı ve ortak yardımcılar |
| `g-bingo.js` | Tech Bingo |
| `g-speed.js` | Hız Tanışması |
| `g-ww.js` | Katil Kim? (Vampir Köylü odaları) |
| `g-dare.js` | Cesaret |
| `g-tabu.js` | Ben Kimim (Tabu usulü, gruplarla) |
| `g-lie.js` | 2 Doğru 1 Yalan (sahne ve avcı modu) |
| `data.js` | Oyun içerikleri: bingo maddeleri, sorular, tabu kelimeleri, roller. Kelime ya da soru eklemek için burayı düzenle. |
| `firebase-config.js` | Firebase bağlantı bilgileri ve yönetici Gmail adresi |
| `firestore.rules` | Veritabanı güvenlik kuralları |

> `index.html` dosyasına çift tıklayıp açarsan çalışmaz. Site Vercel'deki adresinde çalışır.

## Güncelleme nasıl yapılır

1. **Kurallar değiştiyse:** Firebase konsolunda **Firestore Database → Rules** sekmesine gir. Kutudakileri sil, `firestore.rules` dosyasının tamamını yapıştır ve **Publish**'e bas.
2. **Dosyaları GitHub'a yükle:** GitHub'daki `hsd-iau-oyunlar` reposunda **Add file → Upload files**'a tıkla. Bu klasördeki dosyaları sürükleyip bırak. Aynı isimli dosyaların üstüne yazılır, yeni dosyalar eklenir. Sonra **Commit changes**'e bas.
3. Vercel değişikliği bir dakika içinde yayına alır. Telefonda sayfayı yenile.

## Oyunlar moderatör gözünden

- **Moderatör Paneli → Canlı oyun:** Seçtiğin oyun herkesin ekranında öne çıkar.
- **Tech Bingo:** "Bingoyu başlat" demeden kimse kartını göremez. İlk üç bingo sabit kazanandır. Ödül vermeden önce tablodan kazananın kartını kontrol et.
- **Hız Tanışması:** Ayarları seç ve başlat. Turlar senin sayfan açıkken kendiliğinden ilerler.
- **Katil Kim?:** Oda aç. Herkes katılınca **Yönet → Rolleri dağıt ve başlat**'a bas. Geceyi "Sabahı getir" ile bitirirsin. Gündüz süreyi ayarlarsın, oylamayı açıp kapatırsın. Gece bilgileri senin sayfandan otomatik iletilir, bu yüzden oyun sürerken sayfayı kapatma. Birden fazla oda için başka bir moderatör kendi odasını açıp yönetebilir.
- **Cesaret:** "Görev toplamayı aç"a bas. Uygunsuz görevleri kaldır, yazan kişiden yenisi istenir. "Başlat ve dağıt" deyince herkese kendi yazdığı dışında bir görev düşer.
- **Ben Kimim:** Katılımcılar grup kurar. Sen listeden **Onayla**'ya basarsın, sistem gruptan birini oyun yöneticisi seçer ve gerisini o yönetir.
- **2 Doğru 1 Yalan:** "Cümle toplamayı aç"a bas. Sonra **Sahne modu**nu (herkes sırayla sahneye çıkar) ya da **Avcı modu**nu (herkes kendi hedefini bulup konuşur) başlat.

## Moderatör eklemek

Moderatör Paneli'nde giriş yapmış katılımcıların yanındaki **Moderatör yap** düğmesine bas ya da Gmail adresini yaz. Moderatör ekleyip çıkarma yetkisi sadece yöneticidedir.
