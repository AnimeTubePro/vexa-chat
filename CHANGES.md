# VEXA v4.0 — REBUILD EDITION 🚀

**AnimeTubePro Studio × VEXA** — reverse-engineer karke pura naya bana. **OLD UI hi rakha gaya hai** (style.css + redesign.css — jaisa pehle dikhta tha waisa hi), saare v4 fixes functional hain: owner-level privacy, bina size-limit wali Google Drive files, calls + games — sab ek jagah.

## 🧱 v4 me kya FIX hua (UI purana, engine naya)

### 1) UI — OLD STYLE RETAINED (user spec: "old ui me bano")
- `index.html` + `style.css` + `redesign.css` — sab v3 (old UI) wale hi hain
- Old animated splash (orbit ring + gradient title + progress) waise ka waisa
- v4 ke functional patches script.js me hain — purane UI ke saath 100% compatible
- Browser smoke test PASS: splash + login render clean, 0 console errors, 375px no overflow

### 2) Loading screen — old animated wala hi
- Old UI ka splash already animated hai (ring orbit + gradient title + % bar + rotating status)
- Tap to skip ✓ — sab old jaisa hi

### 3) 🔒 OWNER PRIVACY (sabse bada fix)
Pehle koi bhi logged-in user `users/{kisiBhiUid}` ka PURA node padh sakta tha
(chats index, call history, saved, archived, blocks… sab leak tha). Ab:
- **`users/{uid}` full read = sirf KHUD + Owner/Admin/Moderator** (rules locked)
- Baaki users sirf **public fields** padh sakte hain — naya `V.pubUser()` helper
  (username, naam, photo, bio, verified, vip, role, followers/posts counts…)
- 18+ jagah code se cross-user whole-node reads hata diye (chat list, profile,
  search, posts, reels, comments, likes, games, calls, local scan, notifications)
- Private data users/{uid} se BAHAR migrate: `savedIdx`, `archIdx`, `socialIdx`,
  `followReq`, `localIdx` (+ v3.1 ke chatIdx/callIdx/secData/devData…)
- **Owner panel ka full access SAME rakha gaya hai** — recoveryPrivate plaintext
  password sync **BILKUL UNTOUCHED** (product decision — jaisa tha waisa hi)

### 4) ☁️ Drive files — old style, NO SIZE LIMIT (v3.1 se aage, v4 me bhi)
- 📎 Local file select → Google Drive **resumable chunked upload** → message send
- 8MB chunks · network fail pe auto-resume · 3 retry/chunk · live progress % + cancel
- ☁️ Drive se direct send · 🎬 video-first picker · image/video/file bubbles
- Big-video streaming: `drive.usercontent.google.com` endpoints
- Firebase rules me `size` pe koi cap nahi

### 5) Calls fix
- `cleanup()` ka ghost `ssBtn` bug fix (screen-share button ab sahi reset hota hai)
- Naya call UI: incoming pulse, timer pill, speaker/mute/cam/screen controls
- Voice + video + screen share sab flows intact (notifications se incoming detect)

### 6) Local Scan fix + hardening
- GPS errors ab clear Hinglish me (HTTPS zaroori hai — insecure par GPS block hota hai)
- Load fail pe reason + Retry button
- localGrid ab `localIdx/{uid}/grid` me (self-only read — location index private)

### 7) Settings
- Settings hub pe seedha **Logout** aur **Delete Account** rows (Danger Zone bhi wahi hai)
- Delete account: reauth + posts/likes/comments/chats/storage/recovery full cleanup

### 8) Games
- Online 2-player (TTT, RPS, C4, Quiz, Reaction) + offline NEUROSTORM arcade
- `game/game.html` V9 — browser smoke test PASS (60 FPS, zero console errors)

### 9) Deploy notes
- `database.rules.json` (v4) Firebase Console/CLI me deploy karo — **zaroori**,
  warna privacy lock active nahi hoga. Purana data login par auto-migrate ho jata hai.
- Firebase config, Supabase config, Cloud Functions, Vault — sab v3 jaisa hi (proven)

## 📁 Structure
- `index.html` — OLD UI shell (v3 wala hi — splash + app + chat + games + calls)
- `style.css` + `redesign.css` — old design + animations (unchanged)
- `script.js` — engine (v3.1 proven core + v4 privacy/fix patches, Ver 4.0.0)
- `services/` — Vault, Drive OAuth, Temp access, ads modules
- `vault.css` — Vault UI (vv-*)
- `game/game.html` — NEUROSTORM offline arcade
- `staff/`, `backend/`, `database/`, `docs/` — owner/staff panels + docs
- `login.html` / `signup.html` / `forgot.html` — standalone auth pages (unchanged)

## ✅ Verification (sab script se check kiya)
- `node --check` — script.js + saare services PASS
- CSS class audit — JS-generated 300+ classes me **0 missing**
- Headless browser: index (splash→login render clean, 0 console errors),
  game.html (0 errors), 375px mobile — no horizontal overflow
- Rules JSON validated (comments strip karke)

## ⚠️ Owners/Staff ke liye
- Owner panel (staff/ + panel-vault) — role checks waise hi: sirf owner/admin/mod
- Plain-text password recoveryPrivate me owner panel ke liye hai — v4 ne usse
  deploy rules me waisa hi chhoda hai (koi hash/change NAHI)
