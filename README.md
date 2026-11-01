# AnimeTubePro Studio × VEXA — Chat v2.8.2

Pure-frontend static site (no build step). Koi GitHub use nahi hota — files
directly edit hote hain aur hosting par upload ho jate hain.

## Folder structure

```
/                  ← site root (HTML pages + styles + core script.js)
├── index.html     ← main app
├── login.html / signup.html / forgot.html / privacy.html / terms.html
├── owner.html / admin.html / moderator.html   ← staff panels
├── style.css / vault.css / auth-pages.css
├── script.js      ← main app logic
├── ads.txt        ← AdSense ownership file — ROOT me hi rehna chahiye
│
├── services/      ← frontend service modules
│   ├── ads.js          (AdSense manager — IDs encrypted, self-inject loader)
│   ├── vexa-vault.js   (crypto core — AES-256-GCM vault)
│   ├── vexa-drive.js   (Google Drive appDataFolder backup — OAuth implicit)
│   ├── vault-ui.js     (Vault UI — Settings/Support se open hota hai)
│   ├── panel-vault.js  (staff panels vault module)
│   ├── panel-ai.js     (staff panels inline AI assistant)
│   └── auth-pages.js   (login/signup/forgot shared logic)
│
├── database/      ← database config & security
│   ├── database.rules.json   (Firebase RTDB rules — deploy target: realtime db)
│   └── supabase-policies.sql (Supabase storage RLS policies)
│
└── backend/       ← Cloud Functions (Node 18)
    ├── vexaBackend.js        (recoveryLogin / vexaSecureStore / recoveryCredChat)
    └── package.json          (firebase-admin + firebase-functions)
```

## Deploy checklist

1. **ads.txt** site ROOT me hona chahiye (`https://<site>/ads.txt`) — AdSense
   verification ke liye. Ye poori site ki EKMATRA `.txt` file hai; baaki sab
   data files `.vexa` format me hain.
2. **Firebase**: realtime database rules `database/database.rules.json` deploy karo
   (`firebase deploy --only database` ya Console me paste).
3. **Backend**: `backend/` folder me `npm install` → `firebase deploy --only functions`.
4. **Google Drive connect (Vault)**: OAuth client `vexa-d` project ka hai.
   Connect dabate hi **chhota "Connect to Google" popup** khulta hai
   (Google Identity Services — page kahin nahi jata; GIS load fail hone
   par purana redirect flow fallback hai). Google Cloud Console →
   Credentials → OAuth Client me:
   - **Authorized JavaScript origins** me site ka origin add karo
     (e.g. `https://animetubepro.github.io`) — POPUP flow ke liye
   - **Authorized redirect URIs** me exact URL add karo
     (e.g. `https://animetubepro.github.io/vexa-chat/`) — fallback ke liye
   `drive.appdata` scope ke liye app **Testing mode** me ho to apna Google
   account **Test users** me add karo, ya app **Publish** karo.

## Ads (privacy)

- Publisher/slot IDs source code me **encrypted** hain (`services/ads.js` —
  XOR+base64 runtime decode; panels me charcode assembly). Plaintext sirf
  `ads.txt` me hai — jo AdSense policy ke liye public hona hi chahiye.
- Ads SIRF home/posts feed + desktop sidebar me. Chat, calls, games,
  settings, auth pages pe ads kabhi nahi.

## Settings — categories UI (v3 se port)

Settings screen 8 categories me organized hai (native `sgrp-title` style):
👤 ACCOUNT · 🛡️ PRIVACY & SECURITY · 📜 LEGAL & SUPPORT ·
☁️ GOOGLE DRIVE BACKUP · 🎨 CUSTOMIZATION · 📱 APP & INFO ·
🛠️ STAFF (sirf staff) · ⚠️ DANGER ZONE.

**LEGAL & SUPPORT** section (v3-panels se port kiya gaya):
- 📜 Privacy Policy / 📖 Terms of Service — in-app pages (`sc-privacy` /
  `sc-terms`) + signup screen ke Terms links (pehle dead the — `Policies`
  module missing tha, ab live).
- 👮 Police — community rules + reports (`Police` module, `sc-police`).
- 🆘 Support — recovery · email · staff tickets (`Support` module,
  `sc-support`; tickets `supportTickets` node me, rules already allow).

Port script: `scripts/port_v3_settings.py` · verify: 29 automated checks.
