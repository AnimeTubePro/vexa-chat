# 🔑 APK Signing — VEXA-Chat

## Keystore (isi zip me hai)
- File: `apk/vexa-release.jks`
- Alias: `vexa`
- Store password: `VexaChat44Key!`
- Key password: `VexaChat44Key!`
- Validity: 30 saal (10950 din)

⚠️ **YE FILE + PASSWORD SAFE RAKHO** — agla update isi key se sign hona chahiye,
warna Android purane version ke UPAR naya install hone dega (uninstall karke
data loss hoga).

## Certificate fingerprint (SHA-256)
`ff75432a54ca47ed0d8b50d48949f9cc1528f12c275b2d6860ccfdf04d5c92f5`

## Dobara APK banane ka tarika (v4.5+)
1. Toolchain ready: build-tools 34 + platform-34 (`/tmp/apktool`) + JDK 21
   (`/tmp/apktool/jdk-21*`) — sandbox recycle hone par wapas download karne honge:
   - https://dl.google.com/android/repository/build-tools_r34-linux.zip
   - https://dl.google.com/android/repository/platform-34-ext7_r03.zip
   - https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse
2. `bash /home/z/my-project/scripts/build_apk.sh`
   (icons `scripts/gen_icons.py` se logo-v44.png se bante hain)
3. Output: `apk/vexa-chat-v4.4.1.apk`

## Site URL
App me site kholta hai: **https://animetubepro.github.io/vexa-chat/**

## Permissions (24) — sab included
Internet · Network State · WiFi State · Camera · Record Audio · Modify Audio ·
Video/Audio Capture · Fine/Coarse/Background Location · Read Media
(Images/Video/Audio) · Read/Write External Storage (≤32) · Post Notifications ·
Vibrate · Wake Lock · Foreground Service · Full Screen Intent · Bluetooth
Connect (+ legacy ≤30) · Biometric

## MainActivity features
- JS + DOM storage + 3rd-party cookies + mixed-content compat
- Camera/mic permission requests → voice/video calls
- Geolocation grant → Local scan
- File chooser → attachments
- DownloadManager → downloads (cookie + UA pass)
- Notification channel `vexa_chat_default` + POST_NOTIFICATIONS runtime request
- App links: `https://animetubepro.github.io/vexa-chat/` deep-link intent filter
- UserAgent suffix: `VEXA-Chat/4.4.0 Android` (site app-detect kar sakti hai)

## v4.4.1 add-ons
- `vexachat://` scheme — Chrome OAuth dance ka auto-return (tok/exp extras + query params)
- OAuth hosts (accounts.google.com, linkedin.com) WebView me block → Chrome me khulte hain
- VexaBridge JS interface: site notifications → Android system notification
- Rebuild ke baad APKOUT: `apk/vexa-chat-v4.4.1.apk`
