# VEXA Chat v2.1 — VERIFICATION REPORT (ईमानदार status)

## ✅ Code-level verified (static analysis + syntax check)

| Item | Status |
|------|--------|
| `script.js` syntax (node --check) | ✅ PASS |
| `vexa-upgrade.js` syntax (node --check) | ✅ PASS |
| `index.html` — 3 surgical edits in-place (script tag, login link, 🎬 button) | ✅ PASS (diff-verified) |
| Original functions rewritten नहीं — सिर्फ wrap/inject | ✅ (monkey-patch layer) |
| Existing flows untouched: Auth, CodeLogin, Rec staff-flow, Calls, Games, Local, Music | ✅ (कोई edit नहीं) |
| DB paths नए nodes में consistent (groups/groupMessages/publicIds/recoveryCodes) | ✅ |
| Media limits enforce (JPEG/PNG/WebP, ≤200KB, 5 images) | ✅ client-side |
| Recovery codes DB में hashes only | ✅ |
| Tokens (Drive OAuth) sessionStorage only — DB में कभी नहीं | ✅ |

## ⚠️ LIVE TESTING बाकी (environment कारण — असली Firebase/Google/Supabase चाहिए)

ये features **code-complete** हैं पर live credentials/Console पर test **नहीं** हो सकते थे:

1. **2FA** — Firebase Console में Phone Auth enable + Blaze plan चाहिए।
   Test numbers के बिना SMS cost लगता है।
2. **Drive resumable upload + Picker** — Google Cloud में redirect URI + API key
   setup + असली OAuth consent चाहिए। Picker बिना API key के link-paste fallback
   ही चलेगा।
3. **Supabase-2/-3 uploads** — buckets के RLS policies deploy होने चाहिए;
   Supabase-3 bucket का नाम dashboard में confirm करना ज़रूरी (spec कहता है verify)।
4. **vexaBackend actions** — Cloud Function deploy होने तक:
   - Recovery Code Login → "backend deploy nahi hai" message दिखेगा (honest fallback)
   - revokeDevice/logoutAllOthers → DB-flag path (30s watchdog) फिर भी काम करेगा
5. **Group chat** — नए RTDB rules के साथ live read/write verify करना बाकी
   (rules syntax validated है, behavior Console Simulator से भी test कर सकते हो)

## 🧪 Deploy के बाद 10-min smoke test

1. दो accounts (A, B) — दो browser/device
2. A: Settings → Security → Storage Check → तीनों buckets HTTP 200/reachable
3. A: Group बनाओ → B को invite (username) → B accept करे
4. A→B: text, image (group), 🎬 Drive video भेजो
5. B: video play / Open-in-Drive fallback
6. A: Devices & Sessions में B का session revoke → B का tab 30s में logout
7. A: 2FA enable → logout → login challenge आए
8. A: Recovery codes generate → एक code से Recovery Code Login (backend deployed हो तो)

## Known limitations (documented, spec-के-विरुद्ध नहीं)

- Firebase per-device token revoke SDK में नहीं — global revoke + DB-flag का combo है
- 200KB server-side enforcement नहीं (client-side है) — Edge Function v2.2 roadmap
- 1:1 chat में image messages नहीं (existing design; spec में media groups के लिए था)
- Group unread badge bottom-nav में merge नहीं (chat list badge है) — v2.2 roadmap
