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
2. **`database.rules.json` (v4.2) deploy karo** (Firebase Console → Realtime Database → Rules):
   privacy lock + naye `pubUsers` (search/profile) + `ownerAudit` nodes.
   **Ye step skip kiya to search bar + local scan + owner.html kaam nahi karenge.**
3. Deploy ke baad ek baar **re-login** karo — har user ka `pubUsers` mirror auto ban jata hai.
4. APK build karte waqt `script.js` me `Ver.CURRENT` badalna ('4.4.0').

## Owner / Staff
- 👑 **`owner.html` — naya standalone Owner Panel (v4.2)**: sirf OWNER role; user search,
  role/VIP/verify/ban actions, 🔑 recovery password view, audit log
- Staff panel: `staff/` (owner/admin/moderator role-based)
- Owner panels me sab users ki info (passwords included — `recoveryPrivate`) dikhti hai;
  normal users kisi ka private data padh nahi sakte (v4 rules + pubUsers mirror).

## Features
| Area | Status |
|---|---|
| Chat (text/emoji/reply/react/lock/archive/mute) | ✅ |
| Files via Google Drive — 📎 local → Drive → message | ✅ NO size limit |
| ☁️ Drive direct send + 🎬 video picker | ✅ |
| 🎬 Video: One Time View ya Permanent (choice popup) | ✅ v4.1 |
| 🗑️ Sent video delete — dono side se hat jata hai | ✅ v4.1 |
| 🔍 Search bar (pubUsers mirror se) | ✅ v4.2 FIX |
| 📡 Local scan + rules-deploy hints | ✅ v4.2 |
| 👑 owner.html — user ka hacker-console panel (12 tabs, matrix rain) | ✅ v4.3 |
| 🎬 Video: message se easy play (poster + tap → player + download) | ✅ v4.3 |
| 🔔 Notification settings — 8 type ON/OFF toggle | ✅ v4.4 |
| 🔒 App Lock — password / PIN / pattern (hash saved) | ✅ v4.4 |
| 🔍 Search FIX — username + display name + UID sab se | ✅ v4.4 |
| 🛰️ Local scan FIX — presence auto-refresh + CTA | ✅ v4.4 |
| 🎨 Loading screen — naya logo ke according (gradient V + wordmark) | ✅ v4.4 |
| 📱 Android APK — 24 permissions + logo icons + signed (site: animetubepro.github.io/vexa-chat) | ✅ v4.4 |
| ✨ Must-animated loading screen (old style) | ✅ v4.2 |
| Voice / Video / Screen share | ✅ (old UI, v4 fixes) |
| Posts / Reels / Search / Follow / Profile themes | ✅ |
| Games (5 online 2-player + offline arcade) | ✅ |
| Vault (.vexa backup), Recovery, Temp access | ✅ |
| Settings: Logout + Delete Account (hub pe seedha) | ✅ |
| Owner privacy — kisi ka private data leak nahi | ✅ v4 lock |
