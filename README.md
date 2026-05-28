# pinart-support

Pinart sunucusu için destek talebi, başvuru ticket, booster renk rolü, oto rol ve ses kanalı botu.

## Kurulum

1. Node.js 18+ kur.
2. Proje klasöründe bağımlılıkları yükle:
   ```bash
   npm install
   ```
3. `.env.example` dosyasını `.env` olarak kopyala ve ayarları doldur:
   ```env
   TOKEN=bot_tokenin
   APPROVER_USER_IDS=senin_id,başka_yetkili_id
   APPLICATION_APPROVAL_ROLE_ID=verilecek_rol_id
   ```
4. `config.js` içindeki kanal/rol ID'lerini kendi sunucuna göre düzenle.
5. Botu başlat:
   ```bash
   npm start
   ```

## Proje Yapısı

```
index.js                 Giriş noktası
config.js                Kanal, rol ve emoji ayarları
handlers/
  tickets.js             Ticket sistemi ve support paneli
  colorRoles.js          Booster renk rol sistemi
  voice.js               Ses kanalı bağlantısı
events/
  ready.js               Başlangıç kurulumu
  guildMemberAdd.js      Oto rol
  interactionCreate.js   Buton etkileşimleri
utils/helpers.js         Ortak yardımcı fonksiyonlar
```

## Özellikler

- Support ticket paneli
- Staff / Sharer başvuru ticket paneli
- Başvuru talebinde **Yetki Ver** butonu (sadece `.env`'deki kullanıcılar)
- Booster renk rol butonları
- Tek renk mantığı (toggle)
- Yeni üyelere oto rol
- Botun seçilen ses kanalına girmesi
- Ses koparsa otomatik yeniden bağlanma

## Discord Ayarları

Bot rolü, oluşturacağı renk rollerinin ve vereceği rollerin **üstünde** olmalı.

Gerekli bot izinleri:
- Manage Roles
- Manage Channels
- View Channels
- Send Messages
- Read Message History
- Connect

Developer Portal'da açılması gereken intent:
- Server Members Intent

## Başvuru Onay Ayarları

`.env` dosyasında:

| Değişken | Açıklama |
|----------|----------|
| `APPROVER_USER_IDS` | **Yetki Ver** butonunu kullanabilecek Discord kullanıcı ID'leri (virgülle ayır) |
| `APPLICATION_APPROVAL_ROLE_ID` | Onay sonrası başvuru sahibine verilecek rol ID'si |

Bu buton yalnızca **Yetkili / Paylaşımcı Başvurusu** kanallarında görünür.

## Panel Yenileme

Eski panelleri silip botu yeniden başlatırsan güncel paneller otomatik gönderilir.

## Sorun Giderme

- **Rol verilmiyor:** Bot rolünü Discord sunucu ayarlarından yukarı taşı.
- **Ticket açılmıyor:** Botun `Manage Channels` izni olduğundan emin ol.
- **Oto rol çalışmıyor:** Developer Portal'da `Server Members Intent` açık olmalı.
- **Ses kanalına girmiyor:** `VOICE_CHANNEL_ID` doğru mu ve botun `Connect` izni var mı kontrol et.
