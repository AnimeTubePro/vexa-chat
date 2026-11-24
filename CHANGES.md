# VEXA CHAT v3.1 — SECURITY FIX + REDESIGN CHANGELOG

Pura repo audit karke sab issues fix kiye, naya UI/animation layer add kiya,
aur purana Drive file-sharing style wapas laya. Neeche sab kuch detail me.

---

## 1) SECURITY FIXES (database.rules.json — poora rewrite, v3.1 SECURE)

### Critical fixes
- **role self-grant REMOVE** — pehle naya/legacy account khud ko `owner` likh
  sakta tha. Ab role sirf OWNER panel se set hota hai.
- **Sensitive data users/{uid} se BAHAR** — naye self-only nodes:
  | Purana path (sab users readable tha) | Naya path (self-only / owner) |
  |---|---|
  | users/{uid}/recovery (plaintext codes!) | vaultRecovery/{uid} |
  | users/{uid}/security + securityEvents | secData/{uid} |
  | users/{uid}/devices + sessions | devData/{uid} |
  | users/{uid}/chatLocks (PINs) | chatLocks/{uid} |
  | users/{uid}/helpChat (temp passwords) | helpChats/{uid} |
  | users/{uid}/notifications (message text) | notifs/{uid} |
  | users/{uid}/email + dob | secData/{uid}/account |
  | users/{uid}/chats (kaun kisse karta hai) | chatIdx/{uid} |
  | users/{uid}/callHistory | callIdx/{uid} |
- **RTDB cascade leaks fix** — `chats`, `groups`, `calls`, `gamesAll`,
  `recoveryCheck`, `webLogin`, `recoveryTemp` ke top-level "auth != null"
  reads hata diye. Ab:
  - chats/messages/typing: sirf participants
  - calls: sirf caller/callee
  - gamesAll: sirf p1/p2 (+ query-scoped lobby)
  - recoveryCheck (code/email/dob hashes): sirf self + staff
- **webLogin enumeration fix** — login codes ab `SHA-256(code)` key ke saath
  store hote hain + write rule sirf apna uid allow karta hai. Koi dusra user
  active codes padh hi nahi sakta.
- **hackReports** — plaintext mainCode/secCode fields ab rules me `validate:false`
  (DB me recovery secrets plaintext me jaana band).
- **recoveryCheck public read REMOVE** — unsalted hashes offline brute-force se
  bach gaye (dob/email hash ab koi nahi padh sakta).
- **notifs validates** — type/title/body/from length limits; read sirf self
  (koi dusra aapke notifications nahi padh sakta).
- **groups self-join fix** — member banne ke liye invite zaroori
  (groupInvites/{uid}/{gid} exist hona chahiye) ya group owner hona chahiye.
- **messages senderId validate** — `senderId === auth.uid` (message spoofing band).
- **users list read** = sirf staff (owner/admin/moderator); profile full read
  auth users ke liye khula hai (chat/feed chalane ke liye zaroori) par
  sensitive subtrees us node se bahar ho chuki hain.

### Client patches (rules ke saath match)
- `Auth.migratePrivateNodes()` — purane accounts ka data login par ek baar
  naye private nodes me move hota hai (recovery codes, chat locks, help chat,
  devices, chats index, email/dob sab migrate; purana path delete).
- Signup do jagah (script.js + services/auth-pages.js): private data ab alag
  nodes me likha jata hai; email/dob profile se hat gaye.
- Bootstrap: `me.email/me.dob` ab secData/{uid}/account se merge hota hai.
- Node-wide queries REMOVE (rules tootne se pehle hi): chat list, unread badge,
  incoming-call watcher, staff lookups — sab apne indexes se.
  - Incoming calls ab notifications (type:'call') se detect hote hain.
- Delete Account: naye private nodes ka bhi poora cleanup.
- **recoveryPrivate plaintext password sync — INTENTIONALLY AS-IS rakha**
  (aapne kaha tha change nahi karna) — owner panel ise padh sakta hai.

## 2) BACKEND (backend/vexaBackend.js)
- Private paths update: notifs / secData / devData / helpChats.
- Migration engine: email/dob ab secData/{uid}/account me copy hote hain.
- Purane "owner password send" plaintext flows pehle hi theek the — temp
  password helpChat me jaata hai jo ab sirf user + staff padh sakte hain.

## 3) LOADING SCREEN — NAYA ANIMATION
- Orbit ring logo (spin) + pulsing glow + bobbing triangle
- 3 floating gradient orbs (blur glow, alag speeds)
- Shimmer progress bar (gradient loop + glow) + smooth fade-out scale
- `prefers-reduced-motion` respect karta hai
- game.html ka loading bhi polish: shimmer bar + glow ring + pulsing logo

## 4) DRIVE FILE SHARING — OLD STYLE RESTORED (v2.8.2 me stub tha)
### 🚫 KOI SIZE LIMIT NAHI (v3.1 update)
- 📎 **Local file**: file select → Google Drive **RESUMABLE chunked upload**
  ("VEXA Chat Files" folder, anyone-reader link) → message me file card.
  1KB se multi-GB video tak — **sab chalega** (Drive ka apna 5TB/file limit).
- 8MB chunks (256KB-aligned), network fail pe **auto-resume** (server se
  offset poochh ke), har chunk **3 retry**, full cancel support.
- **Live progress UI** — filename + % + shimmer bar + cancel ✕ (glass card).
- ☁️ **Drive se direct**: Drive ki recent files picker se seedha send
  (drive.file scope — app ki files dikhti hain).
- 🎬 **Video**: video-first picker; video bubble me inline player —
  bade videos ke liye `drive.usercontent.google.com` streaming endpoint.
- 🖼️ Image bubbles (Drive thumbnail), video player, file card + size
  (KB/MB/GB formatter) + download. Receiver pe direct download — koi
  extra auth nahi. Message bubbles kisi size pe depend nahi karte.
- OAuth same proven popup flow (VexaVaultDrive module reuse).

## 5) CALLS / VIDEO CALL / SCREEN SHARE
- 🖥️ Screen-share ab proper call controls ke andar (pehle alag floating
  button tha) — toggle ON/OFF, button state highlight, stream end auto-cleanup.
- Call UI glass redesign: gradient ring incoming pulse, blur controls,
  gradient end/accept buttons, self-video pip border, timer polish.
- Pehle se theek fix (caller controls, autoplay play(), missed handling) — intact.

## 6) SETTINGS — LOGOUT + DELETE ACCOUNT
- Logout (APP & INFO me) + Delete Account (DANGER ZONE, "DELETE" type karke
  + password reauth) — dono verify kiye; ab saare naye private nodes bhi
  delete hote hain (vaultRecovery/secData/devData/chatIdx/callIdx/chatLocks/
  helpChats/notifs/recoveryCheck/recoveryPrivate/...).

## 7) GAME (game/game.html)
- Real bug fix: `?.remove;` → `?.remove()` (gMd element cleanup jo silently
  fail ho raha tha).
- Loading screen polish (shimmer + glow ring + pulsing logo).
- Firebase gameStats sync rules ke saath compatible (gameStats self-read/write).

## 8) GLOBAL UI UPGRADE (redesign.css — naya layer)
- Springy button/row transitions, glass cards + modals pop-in
- Chat bubbles: gradient (me = purple gradient), soft pop-in animation
- Composer blur + send button glow; custom purple scrollbars
- Focus rings on inputs, avatar rings
- Sab additive overrides — purana layout nahi toota

---

## DEPLOY CHECKLIST
1. `firebase deploy --only database` (database.rules.json) — **Pehle ye karo**,
   warna purana data migrate nahi hoga / naya app rules se block hoga.
2. `cd backend && npm install && firebase deploy --only functions`
3. Site upload (GitHub Pages ya hosting).
4. Purane users ka data unke NEXT LOGIN par auto-migrate ho jayega
   (recovery codes, chat locks, help chat, devices, chats, email/dob).

## NOTES / LIMITS
- Purani notifications purane path me rehti hain — migration unhe naye
  notifs/{uid}/notifications me le jata hai (1 login ke baad).
- ☁️ Drive picker me sirf app-created files dikhti hain (drive.file scope ka
  Google limit) — poori Drive chahiye to OAuth scope full-drive karna hoga.
- Supabase anon-key storage policies (supabase-policies.sql) me delete/overwrite
  risk wahi hai — wo upgrade alag se karna hoga (Edge Function wrapper, v2.2 roadmap).
