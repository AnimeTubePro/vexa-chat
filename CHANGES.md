# VEXA v4.5 — SEARCH REBUILD + HEAVY SPLASH + GUIDE BOOK 🚀

**AnimeTubePro Studio × VEXA** — user spec ke hisaab se 3 bade updates: (1) search bar pura shuru se — purana prefix style wapas, (2) loading screen heavy-animated + text bhi animate, (3) puri guide book ab PDF me bhi.

## 🔍 1) SEARCH BAR — PURA REBUILD (purana prefix style)
- **"Amit" type karo → Amit, Amitsharma_059, Amit_007… jo bhi naam se START hota hai sabki list** — avatar + naam + @username ke saath
- 3 sources PARALLEL, koi ek fail ho tab bhi search chalti rehti hai:
  1. `usernames` node key-prefix query — **`.indexOn` ki zaroorat NAHI**, purane deployed rules par bhi chal gaya (ye hi pakka path hai)
  2. `pubUsers` poora snapshot — client-side prefix filter (`unLC`/`dnLC` mirror na ho tab bhi username/displayName/UID/publicUserId se match)
  3. UID direct lookup (Firebase UID ya numeric public ID, original case me)
- **Username + Display name + UID TEENO** se search; result tap → seedha profile
- Ranking: username-prefix sabse upar, phir name-prefix, phir ID — har group me A→Z; neeche **"N users mile"** count; khud apne result par **You** badge; max 30 results
- Search page placeholder ab: "Naam, @username, UID ya #hashtag..."

## 🎬 2) LOADING SCREEN — HEAVY ANIMATED (text bhi animate)
- **Per-letter wordmark**: V-E-X-A--C-h-a-t har akshar khud uthta hai (staggered bounce), phir lehrata hai, glow pulse + har letter me gradient shine sweep ("VEXA-" white→magenta→purple gradient, "Chat" logo-red)
- Naya **aurora layer** (3 dim color clouds drift) + orbs wapas (dim) + **shooting star** + purane stars/scan/rings/logo — background ab bhi saccha BLACK
- Subtitle blur + letter-spacing se clear hoti hai, phir halka float karta hai; chip pulse, bar glow, status-text pulse, "Tap to skip" bounce
- `prefers-reduced-motion` respected — animation band par text PHIR BHI dikhta hai
- Saare JS IDs same: `#splash`, `#splashLogo`, `#loadBar`, `#loadPct`, `#splashTx`, `.loader-title`, `.loader-sub`, `.skiphint` — Ver lock screen waise ka waisa kaam karega

## 📖 3) GUIDE BOOK — PDF (alag file)
- **`vexa-user-guide.pdf`** — 16 pages, Hinglish, puri app ki guide: account, search (naya v4.5), chat & calls, Drive files, posts, reels, songs, friends, games, backup/vault, notifications (8 types table), app lock, paid promotion, safety, **settings ka pura naksha (table)** aur FAQ/troubleshooting
- App ke andar: **Settings → Legal & Support → "Guide Book PDF"** (naya row, `GuideBook.pdf()`) — file ko index.html ke saath deploy karna hai

## ✅ Verify
- `node --check script.js` PASS; splash headless-Chromium me render check (letters visible, gradient clip sahi)
- Guide PDF: `pdf_qa.py` **PASS** (16 pages, 0 overflow, fill ok), har page visual check

---

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

### 9) 🎬 ONE TIME VIEW videos (naya feature — v4.1)
- Video send karte waqt popup: **♾️ Permanent** (kabhi bhi dekho) ya **👁️ One Time** (receiver sirf EK baar dekh payega) ya **⏹️ Cancel**
- 📎 local video, 🎬 video picker, ☁️ Drive picker — teeno paths me choice aata hai
- One-time bubble: blurred thumbnail + pulsing ▶ + "👁️ One time view" tag
- Tap khulte hi `opened:true` DB me set — doosre device/refresh pe bhi lock pakka
- Dekha gaya → bubble hamesha ke liye "👁️‍🗨️ Video dekha gaya — dobara nahi khulega" ban jata hai
- Sender apna video replay kar sakta hai (receiver nahi)
- Chat list preview: `👁️ filename` (one-time) / `📎 filename` (permanent)

### 10) 🗑️ Video/message delete (naya feature — v4.1)
- Apne bheje hue video par bhi Delete chalta hai — bubble "🚫 deleted" dono side dikhta hai
- Delete karte hi `fileId`/`fileName`/`mimeType` bhi saaf — stream link nahi bachta
- Media messages (photo/video/file) par "✏️ Edit" hidden, "🗑️ Delete (dono side se hat jayega)" dikhta hai
- Text messages waise hi (Edit + Delete)

### 11) 🔍 Search + 📡 Local scan FIX (v4.2 — sabse zaroori)
**Root cause:** Firebase RTDB rules cascade — jab `users/` parent node ne read deny kiya,
to `users/{uid}/username` jaise child-level grants **sab DEAD** ho gaye. Isliye:
- Search me `V.pubUser()` har field read denied → blank results / "Search failed"
- Cross-user public reads (profile, chat headers, local scan names) sab pehli baar toot gaye

**Fix — `pubUsers/{uid}` mirror node (public data ka alag top-level node):**
- Rules: `pubUsers` read = koi bhi authed user; write = khud + staff (public fields ONLY)
- `V.pubUser()` pehle `pubUsers/{uid}` padhta hai, fallback purana path (open-rules compat)
- Naya `V.syncPub()` — login par mirror auto-sync (photo/name/bio/username/vip/verified/role…)
- Profile photo / name / bio / username change → mirror turant update
- Delete account → `pubUsers/{uid}` bhi remove
- **Search ab kaam karega** — user ko ek baar login karna hai (mirror ban jata hai)

**Local scan:** rules theek the (`localPresence` authed-read); permission error par ab
clear Hinglish hint — "database.rules.json (v4.2) deploy karo + re-login"

### 12) 👑 owner.html — standalone Owner Panel (v4.2)
- Alag file: sirf **OWNER role** login kar sakta hai (admin/mod auto signOut)
- Live stats: users / staff / banned counts
- User search: username query ya direct uid
- Per-user actions: +Admin / +Mod / Role reset / VIP toggle / Verify toggle / Ban / Unban
- 🔑 Recovery password view (recoveryPrivate — rules me owner-only read)
- Har action `ownerAudit` node me log (owner-only read/write)
- Mobile responsive, old-UI palette, prefers-reduced-motion respect

### 13) ✨ Loading screen "MUST" animation (v4.2 — old UI style me hi)
- Double orbit rings (solid + dashed cyan, counter-rotate) + glowing orbit dot
- 12-star twinkling starfield + scanline sweep
- Title shimmer sweep + "⚡ V4.2 · REBUILD" chip + bar glow sweep + status pulse
- Rotating Hinglish status + 2 naye lines ("✨ Magic render…", "🚀 Engine warm up…")
- prefers-reduced-motion full respect — old palette (purple/cyan/pink) wahi

### 14) Deploy notes (v4.2)
- `database.rules.json` deploy karo — **zaroori**: isme `pubUsers` + `ownerAudit`
  naye nodes hain, warna search/local/owner.html kaam nahi karenge
- Deploy ke baad **ek baar re-login** karo — har user ka pubUsers mirror ban jayega

### 15) 🎬 Easy video play (v4.3)
- Video message (sent + received) ab **poster + pulsing ▶ + "▶ filename · tap to play"** card
- Tap karo → **bada player modal** (autoplay, controls, fullscreen-capable) + ⬇ Download button
- Inline `<video>` hata diya — Android WebView me Drive stream inline aksar atakta tha,
  ab modal player me reliable playback + download fallback
- One-time view videos pehle jaisa hi (open hote hi lock) — same player pattern

### 16) 👑 owner.html = user ka console (v4.3, fixed)
- User ka apna **v3.2.4 hacker-console panel** (matrix rain, 12 tabs) replace kar diya —
  Dashboard / Users / Posts / Reels / Reports / Help / Pass Send / Promo / Announce /
  Version / Recovery / Audit
- Mera simple panel hata diya; user wale me ye BUGS fix kiye:
  - `users/{uid}/notifications` (purana path) → `notifs/{uid}/notifications` (v4 path) —
    warna announce/warn/grant/promo/password-send notifications SILENT FAIL hote
  - announce/verBc notification body 200-char cap (rules validate fail hone se bachne ke liye)
  - staff chat index `users/{staff}/chats` → `chatIdx/{staff}/chats`
- Rules update (zaroori): `users/$uid` .write me staff allowed (panel ka repair + temp
  profile banao), naya `auditLog` node (staff write/read), `usernames` me staff-create
  (temp accounts ke username index ke liye)
- Plain-text password flow BILKUL untouched — recoveryPrivate + Pass Send + SAB KE
  PASSWORDS waise hi jaise user ke panel me the

### 17) Deploy notes (v4.3)
- `database.rules.json` (v4.3) deploy karo — users-write-staff + auditLog + usernames
  ke naye rules owner.html ke liye zaroori hain
- APK: `Ver.CURRENT` = '4.3.0'

### 18) 🔔 Notification Settings (v4.4)
- Settings me naya section — **🔔 Notifications** tile (Look & Fonts ke baad)
- 8 type ON/OFF: Messages · Calls · Follows · Likes · Comments · Games ·
  Announcements · Promo/VIP — toggle se turant save (`users/{uid}/settings/notif`)
- OFF type: notification list me nahi dikhta + **badge count se bhi count nahi hota**
- 🔐 Account & security alerts (recovery, password send, staff warnings) HAMESHA ON —
  ye disable nahi hote (safety)

### 19) 🔒 App Lock (v4.4)
- Settings ▸ Privacy & Security ▸ **App Lock** — 3 methods: **PIN (4-6 digits)**,
  **Password**, **Pattern (3x3 dots swipe)**
- Login/page kholne par lock screen (blur overlay) — keypad / password box / pattern grid
- Credential ka sirf **SHA-256 hash** device me (localStorage) — plain kabhi save nahi;
  http contexts pe djb2 fallback
- 5 galat attempts → **30s cooldown**; hint optional; per-session unlock
  (sessionStorage) + **"Abhi Lock karo"** button; logout pe unlock reset
- Setup: method chuno → value → confirm → save; change = purana hata ke naya;
  disable = purana credential daal ke confirm

### 20) 🔍 Search bar FIX (v4.4) — asli wajah mil gayi
- Pehle search sirf `usernames` index ka **username-prefix** tha — display name se
  search karne pe HAMESHA "No users"
- Ab **4 parallel queries**: pubUsers `unLC` (username lowercase) + pubUsers `dnLC`
  (display name lowercase) indexed queries + usernames fallback (purane users) +
  **pura UID paste** karo to direct profile
- pubUsers mirror me `unLC`/`dnLC` fields add — next login pe sab ka mirror update
- ⚠️ Rules me `pubUsers` pe `.indexOn: ["unLC","dnLC"]` add kiya — **deploy zaroori**

### 21) 🛰️ Local scan FIX (v4.4) — asli wajah mil gayi
- Pehle presence **2 ghante me chupchap expire** hoti thi → scan hamesha khali,
  dusre users ko tum bhi nahi dikhte the
- Ab Local tab kholte hi apni presence **>15min purani ho to auto-refresh** (at + GPS
  coords best-effort) — presence zinda rehti hai
- Share OFF pe clear **CTA button** ("📍 Apni Share ON karo") + pehle-ON-tha note
- Empty scan pe **🔄 Dubara Scan** button + dono error hints v4.4 rules point karte hain

### 22) Deploy notes (v4.4)
- `database.rules.json` (v4.4) deploy karo — **pubUsers indexOn naya hai**, warna
  search "Index not defined" dega
- Users ek baar re-login karein — pubUsers mirror me naye unLC/dnLC fields banenge
- APK: `Ver.CURRENT` = '4.4.0'

## 📁 Structure
- `index.html` — OLD UI shell (v4.2 must-animated splash)
- `style.css` + `redesign.css` — old design + animations (+ v4.1/v4.2/v4.3 sections end me)
- `script.js` — engine (v3.1 proven core + v4.3 privacy/search/scan/video fixes, Ver 4.3.0)
- `owner.html` — 👑 user ka hacker-console Owner Panel v3.2.4 (v4.3 rules-integrated)
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

### 23) 🎨 Loading screen — naye logo ke according (v4.4)
- Naya logo (`logo-v44.png`) splash me center me — glow pulse + bob animation +
  double orbit rings (blue/purple/pink/red) + 💬 chat-bubble pop
- Wordmark logo jaisa: **VEXA-** white italic + **Chat** red italic (shine sweep)
- Background: logo ke black + blue/purple/magenta/red radial glows; orbs recolor;
  progress bar ab logo gradient (#3b82f6→#8b5cf6→#d946ef→#ef4444) me flow karta hai
- Sub-line: "AnimeTubePro Studio × VEXA — Connect Privately"

### 24) 📱 Android APK — full permissions (v4.4)
- **vexa-chat-v4.4.apk** — WebView app jo site kholta hai:
  **https://animetubepro.github.io/vexa-chat/**
- **24 permissions**: Internet · Camera · Mic · Location (fine/coarse/background) ·
  Media (images/video/audio) · Storage · Post Notifications · Bluetooth · Biometric ·
  Wake Lock · Full-screen intent · Vibrate · Foreground service
- WebView features: JS + DOM storage · camera/mic grant (calls) · geolocation grant
  (local scan) · file chooser (attachments) · DownloadManager downloads ·
  notification channel + POST_NOTIFICATIONS runtime request · deep-link filter ·
  UA suffix `VEXA-Chat/4.4.0 Android`
- Icons: logo se saare densities (mdpi→xxxhdpi legacy + adaptive)
- minSdk 24 (Android 7.0) · targetSdk 34 · versionCode 44
- Signed: `apk/vexa-release.jks` — credentials + rebuild steps `docs/APK-SIGNING.md`
- Build toolchain: aapt2 + javac + d8 + zipalign + apksigner
  (script: `scripts/build_apk.sh`; NOTE — MainActivity anonymous classes ke bina
  likha gaya, build-tools 34 d8 ka EnclosingMethod NPE bug bypass)

### 25) 🌐 Chrome OAuth dance + 🔔 Android notifications (v4.4.1 APK)
**Problem:** APK WebView me Google Drive connect fail — GIS popup WebView me nahi
khulta, redirect par Google WebView UA block karta hai. Site ke notifications
bhi sirf app ke andar dikhti thi.
**Fix — teen hisse:**
1. **App → Chrome:** app me Drive connect dabaoge to OAuth URL `state=vxaapp`
   ke sath khulta hai → APK `accounts.google.com` (+ linkedin) ko intercept
   karke Chrome me kholta hai (consent + account picker Chrome me proper chalta hai)
2. **Chrome → App (auto):** consent ke baad site Chrome me `#access_token=..&state=vxaapp`
   ke sath khulti hai → site khud `intent://oauth` se **VEXA-Chat app me auto
   redirect** karta hai (fallback "📲 Open VEXA-Chat" button bhi) → app me site
   `#vxaAppTok=..` hash ke sath load hoti hai → token `VexaVaultDrive` ko deliver
   → **🟢 Drive connected** (chat file send ☁️ + vault backup dono isi token se)
   - Desktop/browser flow untouched (state=vxaapp sirf app me add hota hai)
3. **Site → Android notifications:** APK me `VexaBridge` JS interface — site ki
   nayi notifications (`notifs/<uid>/notifications` child_added, unread + 2min
   fresh + `Notif.on(type)` settings respect) Android **system notification**
   banti hain (heads-up, click → app, logo icon, purple accent)
**APK v4.4.1 (versionCode 45):** `vexachat://` scheme intent-filter, OAuth host
intercept (accounts.google.com, accounts.youtube.com, linkedin.com), VexaBridge
(notify/openUrl/isApp/appVersion/toast), notification channel + POST_NOTIFICATIONS
guard, R.mipmap launcher icon as small icon, UA tag 4.4.1.

### 26) ⚫ Loading screen (splash) — BLACK bg + popup-style text (site code)
**Problem:** splash ka background purple gradient (#181052/#0a0430/#04010f + orbs
wash) tha — user ko black chahiye; subtitle cursive "Great Vibes" font me thi
(popup text jaisa nahi).
**Fix (sirf redesign.css — logo image untouched):**
1. `#splash` background → **pure #000000** — dono jagah (line 23 override +
   v4.4 redesigned block line 368 jo !important se jeet raha tha) + purple/blue
   `.splash-orbs` display:none
2. Text popup-style (mbox jaisa clean): `.loader-sub` ab white #f1eefc bold
   sans (cursive hataya), `#splashTx`/`.loader-pct` soft white, `.loader-chip`
   neutral white badge
3. Logo image (logo-v44.png) + rings + wordmark (VEXA- white / Chat red —
   logo colors) WAISE HI rakhe; subtle scan beam + stars (2-4px twinkle) black
   pe ambiance ke liye
**Verify:** browser screenshot — black bg, logo as-is, white popup-style text ✓
