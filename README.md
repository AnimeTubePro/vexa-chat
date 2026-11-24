# AnimeTubePro Studio × VEXA — v4.0 REBUILD

Private chat + no-limit Google Drive files + voice/video calls + screen share + games + posts/reels + local scan — sab ek private social app me.

**v4 = pura engine rebuild + owner-privacy lock, OLD UI hi rakha gaya hai** (style.css + redesign.css — jaisa pehle tha). Pura changelog: [CHANGES.md](CHANGES.md)

## Run (local)
```bash
python3 -m http.server 8080
# browser: http://localhost:8080
```
GPS (Local Scan) ke liye HTTPS zaroori hai — localhost par browser allow karta hai.

## Deploy
1. Files host par daalo (Firebase Hosting / GitHub Pages / koi static host).
2. **`database.rules.json` deploy karo** (Firebase Console → Realtime Database → Rules):
   ye v4 privacy lock hai — `users/{uid}` full read sirf self + owner/admin/mod.
3. APK build karte waqt `script.js` me `Ver.CURRENT` badalna ('4.0.0').

## Owner / Staff
- Owner panel: `staff/` (role-based — sirf owner/admin/moderator)
- Owner panel me sab users ki info (passwords included — `recoveryPrivate`) dikhti hai;
  normal users kisi ka private data padh nahi sakte (v4 rules + pubUser).

## Features
| Area | Status |
|---|---|
| Chat (text/emoji/reply/react/lock/archive/mute) | ✅ |
| Files via Google Drive — 📎 local → Drive → message | ✅ NO size limit |
| ☁️ Drive direct send + 🎬 video picker | ✅ |
| Voice / Video / Screen share | ✅ (old UI, v4 fixes) |
| Posts / Reels / Search / Follow / Profile themes | ✅ |
| Local scan (~2km, no exact GPS) | ✅ (v4 errors fixed) |
| Games (5 online 2-player + offline arcade) | ✅ |
| Vault (.vexa backup), Recovery, Temp access | ✅ |
| Settings: Logout + Delete Account (hub pe seedha) | ✅ |
| Owner privacy — kisi ka private data leak nahi | ✅ v4 lock |
