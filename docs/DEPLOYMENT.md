# VEXA Chat v2.1 — DEPLOYMENT GUIDE

## A) Frontend — GitHub Pages (मौजूदा repo)

```bash
git checkout main
# 4 files copy/update: index.html, style.css, script.js, vexa-upgrade.js
git add index.html style.css script.js vexa-upgrade.js
git commit -m "v2.1: Supabase×3 + Drive videos + VEXA ID + 2FA + RemoteLogout + Groups + RecoveryCenter"
git push origin main
```
Pages auto-deploy (~1 min). Verify: https://animetubepro.github.io/vexa-chat/ पर
Settings → Security group दिखना चाहिए।

## B) Cloud Functions — vexaBackend (नया)

मौजूदा Firebase project: `vexa-b3a1d`

```bash
# मौजूदा functions folder में जाओ (जहाँ recoveryLogin आदि हैं)
cd functions/
# vexaBackend.js का content index.js में paste करो (या require करो)
# — ध्यान: recoveryLogin/vexaSecureStore/recoveryCredChat मौजूदा code में रहने दो
npm install            # firebase-functions, firebase-admin पहले से होंगे
cd ..
firebase deploy --only functions:vexaBackend
```

URL बन जाएगा: `https://us-central1-vexa-b3a1d.cloudfunctions.net/vexaBackend`
Client इसे खुद derive करता है (`CF_BACKEND_URL` — script.js में) — कोई config नहीं बदलना।

## C) Firebase Console — manual steps

1. **Phone Auth enable** (2FA के लिए):
   Authentication → Sign-in method → **Phone** → Enable
   ⚠️ Phone Auth (Blaze plan) में SMS charges — test numbers डालो:
   Authentication → Sign-in method → Phone → "Phone numbers for testing"
2. **Rules**: Realtime Database → Rules → `database.rules.json` (comments हटाकर) → Publish
   (पहले backup — MIGRATION.md देखो)
3. **Authorized domains**: Authentication → Settings → Authorized domains —
   `animetubepro.github.io` पहले से होगा (2FA/Google popup के लिए ज़रूरी)

## D) Google Cloud Console — Drive/OAuth (project `vexa-d`)

1. **OAuth consent screen**: App name VEXA, support email, scopes:
   - `.../auth/drive.file` (+ openid, email auto)
   - Test mode → users add करो, या Publish
2. **Credentials → OAuth Client (Web)**: Client ID `504252409437-219ln0ti9fttnqfoiroc8gc4jmp152ud.apps.googleusercontent.com`
   - **Authorized JavaScript origins**:
     - `https://animetubepro.github.io`
   - **Authorized redirect URIs**:
     - `https://animetubepro.github.io/vexa-chat/`
     - `http://localhost:8080/` (local test)
3. **API enable**: APIs & Services → Library → **Google Drive API** → Enable
   (+ Google Picker API → Enable)
4. **API Key** (सिर्फ Picker के लिए — public-ish, restrictions लगाओ):
   Credentials → API Key → HTTP referrers: `animetubepro.github.io/*`
   इस key को `script.js` → `VEXA_GOOGLE.apiKey` में डालो (Picker enable होगा;
   खाली छोड़ो तो Drive link-paste fallback चलता है)

## E) Supabase — 3 projects (SQL Editor)

`backend/supabase-policies.sql` के तीनों sections अपने-अपने project में चलाओ।
⚠️ Project-3 के Storage में bucket का नाम **verify** करो (`vexa-chat-guild`)।

## F) Env Vars / Secrets (backend-only)

```bash
# Firebase Functions config (अगर अपने secrets चाहिए)
firebase functions:secrets:set SUPABASE_SECRET_KEY_AVATARS
firebase functions:secrets:set SUPABASE_SECRET_KEY_POSTS
firebase functions:secrets:set SUPABASE_SECRET_KEY_GUILDS
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
# ⚠️ इनमें से कोई भी value client/static site पर कभी नहीं रखनी
```

## Deploy order (महत्वपूर्ण)

```
1. Backup (MIGRATION.md Phase 0)
2. Cloud Function deploy (B)          ← पहले backend
3. Rules publish (C-2)
4. Supabase policies (E)
5. Google Cloud config (D)
6. Frontend push (A)                  ← सबसे आखिर में
7. Testing checklist (MIGRATION.md)
```
