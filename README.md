# VEXA Chat — v2.8.2 Final (aapka original style + encrypted ads)

Ye **aapke v2.8.2 ka original style/UI** hai — koi redesign nahi. Sirf ye kaam hue:

## 🔐 Ads Code ENCRYPTED
- AdSense publisher (`ca-pub-…`) + slot — **source me kahin plaintext nahi**
- `ads/ads.js` me encrypted hai, runtime par decode hota hai
- Loader bhi `ads/ads.js` khud inject karta hai (index.html me plaintext tag nahi)
- Ads same jagah: Home feed + post ke beech (har 6 posts) + desktop sidebar
- Chat, calls, games, settings me KABHI nahi (same rule)

## ✅ Fixes (jo pehle manga tha)
- **Users load fix** — `database.rules.json` me galat `hasChild()` syntax thi,
  isliye panels me users load nahi ho rahe the. Ab fixed rules hain.
- **User detail dashboard** — userModal teeno panels me kaam karega
- **panelSecurity rules** add — owner panel gate sahi se chalega
- **Login** — recovery code + password login intact
- **.txt 100% removed** — sirf `.vexa` recovery files (download bhi .vexa deta hai)
- AI Assistant teeno panels me inline hai (Owner/Admin/Moderator)

## 📁 Structure (database & backend alag)
```
index.html, script.js, style.css, login/signup/forgot.html ...  ← frontend (root)
ads/            ← ads.js (encrypted) + ads.css + ads.txt
database/       ← database.rules.json + supabase-policies.sql
backend/functions/  ← vexaBackend.js (Cloud Functions) + package.json
game/           ← game.html
```

## 📌 Note
- `ads.txt` SIRF ads ke liye hai (Google AdSense ko chahiye) — site me koi aur .txt nahi
- Deploy: frontend files root me, `index.html` entry point
- Firebase Console me `database/database.rules.json` paste karo (users-load fix wale rules)
- Settings UI alignment fix: section icons ab titles ke saath sahi align hain
