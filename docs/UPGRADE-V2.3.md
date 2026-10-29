# VEXA v2.3 — Recovery Console + Social/Game Profile + Standalone Policy Pages

## 🔐 1) RECOVERY CONSOLE — poora naya UI (dark + color-coded)
Auth screen ka Account Recovery ab ek **alag dark console** hai — app theme change ho
tab bhi ye dark hi rahega, taaki har step clear dikhe:

| Color | Matlab |
|-------|--------|
| 🔵 Blue | Step 1 — Identity check (Username + DOB) |
| 🟡 Yellow | Step 2 — Secret codes verify (UID + Secondary Code) + 6-hour rule warnings |
| 🟢 Green | Step 3 — Main Code + Entry request → Success/Auto-login |
| 🔴 Red | Koi bhi problem/galat info — exact reason ke saath |

Upar **color legend** + live **status strip** hai jo har step pe batata hai kya ho raha hai.

### Fixed bugs
1. **Stale state** — Login ↔ Recovery switch karne pe purana step/error reh jata tha.
   Ab `V.showAuth('sRec')` har baar `Rec.reset()` chalata hai.
2. **"Invalid recovery information."** — har galat cheez pe same generic message.
   Ab har check ka apna specific message (username nahi mila / DOB galat / UID mismatch /
   secondary code galat / main code galat) red box me.
3. **Double-submit** — buttons busy ho jate hain verify ke waqt ("⏳ Checking…").
4. **Step 3 ka UID re-entry hataya** — UID Step 2 me verify hota hai, wahi carry hota hai
   (green "verified" chip ke saath). DOB final check ab bhi hai (safety).
5. **Galat hint** — pehle likha tha "UID Profile se copy karo" (user to locked-out hai!).
   Ab: "UID aapki Recovery TXT file me saved hai".
6. **Waiting modal galti se band ho jata tha** — backdrop tap se modal close ho jata tha
   aur approval status kho jata tha. Ab modal **locked** hai (backdrop + ✕ dono band),
   sirf **✖ Cancel Request** button se cancel hoga (request DB me `cancelled` ho jati hai).
7. **Staff notification slow tha** — pehle poora `users` scan hota tha. Ab pehle
   `staffIndex` (fast), fallback users scan.
8. **Rejected/6h-rule modals** — ab color-coded strips ke saath + seedha Help Center route.

## 🔒 2) recoveryPrivate PROTECTION (user rule)
**recoveryPrivate/{uid} → {dob, email, mainCode, password, secondaryCode, username}**
ab **kabhi delete nahi hota jab tak account khud delete na ho**:
- Recovery Center se "🧨 Purge legacy plaintext secrets" row REMOVED
- `VexaSec.purgeLegacy()` ab kuch delete nahi karta (info toast only)
- Backend `purgeVault` action ka koi UI caller nahi (server-side unused)
- Sirf `Settings → Delete Account` me recoveryPrivate clean hota hai (allowed)

## 🆘 3) HELP CENTER FIX (ReferenceError bug)
Auth screen ke Help Center buttons `Help.report()` call karte the lekin `Help` module
**exist hi nahi karta tha** — saare buttons broken the. Naya shim:
- Modal: type + username + detail → `helpRequests` node me save
- Rules: public write (logged-out bhi bhej sake), read sirf staff
- Staff panel → Recovery tab me **"🆘 Help Requests"** list (Resolve button ke saath)

## 👥 4) STAFF PANEL — recovery list fix (nested shape)
Staff panel pehle `recoveryRequests` ko FLAT padhta tha lekin client NESTED
(`recoveryRequests/{uid}/{reqId}`) likhta hai — isliye list broken/empty dikhti thi.
- Ab nested iterate hota hai; fields: UID (short) + device + trusted badge + time
- **username/note columns removed** (user instruction) — real fields dikhte hain
- Naya "⏱️ 6h Rule" action button (status → needs_report)
- `recStatus(uid, rid, st)` — nested path update

## 🌐 5) PROFILE — Social Media + Game UIDs (public)
Edit Profile modal me 2 naye sections:
- **🌐 Social Media**: Instagram, YouTube, Telegram, Discord (sirf jo bharo wahi dikhega)
- **🎮 Game UIDs**: Free Fire (ff), BGMI (bgmi) — sabko dikhega
- Save: `users/{uid}/social/{platform}/url` + `users/{uid}/gameUids/{game}`
- Profile render: game UID chips (🔥 FF / 🔫 BGMI) + copy button (own) +
  "➕ Game UID / Social add karo" chip (own, khali ho to)
- Social links pehle se the lekin UNKA KOI EDITOR NAHI THA — ab hai

## 📄 6) STANDALONE POLICY PAGES (store listing ke liye)
- **privacy.html** — Privacy Policy ka alag standalone page (dark, self-contained)
- **terms.html** — Terms of Service ka alag standalone page
- In-app Policies pages (Police → policies / signup links) me
  "🌐 Full page kholo (link share karo)" button added
- GitHub Pages pe live honge: `https://<user>.github.io/vexa-chat/privacy.html`

## 🗄️ 7) database.rules.json
- NEW `helpRequests` node (public write + validate, staff-only read)

## ✅ Verification checklist (sab pass)
- `node --check`: script.js / vexa-upgrade.js / staff/staff.js / vexaBackend.js
- rules JSON valid (comment-strip test) — 32 nodes, helpRequests present
- index.html: saare naye IDs present, stale `rUid3` removed
- 16 cross-checks: reset hook, modal lock, cancel, staffIndex notify, Help shim,
  social/game save, purge neutered, standalone links, nested staff fix
- recoveryPrivate: koi bhi delete path sirf account-deletion tak limited

## 🚀 Deploy steps (same as before)
1. Firebase Console → Realtime Database → Rules → `backend/database.rules.json` paste → Publish
2. (Cloud Functions pehle se deployed hain — koi change nahi)
3. GitHub: poora folder push karo (privacy.html + terms.html root me hi hain)
4. Staff panel: `staff/index.html` ko apne alag hosting pe deploy karo (main site se alag)
5. Staff (owner/admin/mod) ek baar main app me login kare — `staffIndex` auto banega
