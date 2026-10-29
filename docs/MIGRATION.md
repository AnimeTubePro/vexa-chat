# VEXA Chat v2.1 — MIGRATION PLAN (Backup + Rollback सहित)

## ⚠️ नियम: ये changes production DB पर apply करने से पहले Backup लो

---

## Phase 0 — BACKUP (सबसे पहले, अनिवार्य)

1. **RTDB Backup**: Firebase Console → Realtime Database → ⋮ menu → **Export JSON**
   - इसे safe जगह store करो (Drive/local) — rollback का आधार यही है
   - Size बड़ा हो तो Node script से selective export:
     ```
     nodes: users, usernames, recoveryPrivate, recoveryCheck, publicIdMeta
     ```
2. **Rules Backup**: Console → Realtime Database → Rules → पूरा text copy कर लो
3. **Supabase Backup** (3 projects): Storage buckets public हैं — URLs list को
   `users/{uid}/profilePhoto` + `users/{uid}/posts` से collect करके CSV बना लो
4. **App backup**: GitHub repo की current branch का tag लगा लो:
   ```
   git tag v2.0.1-backup && git push origin v2.0.1-backup
   ```

## Phase 1 — CODE DEPLOY (DB छुए बिना, zero-risk)

GitHub Pages पर नई files push करो:
- `index.html` (3 बदलाव: vexa-upgrade.js script tag + Recovery Code Login link + 🎬 button)
- `script.js` (surgical: config expansion, version 2.1.0, posts max-5, 2FA hook, publish hook)
- `style.css` (append-only)
- `vexa-upgrade.js` (नई file — सारे नए features)

**Rollback**: इन 4 files को `v2.0.1-backup` tag से वापस कर दो।
नए DB nodes (`groups/`, `publicIds/` आदि) बने तो भी पुराना app उन्हें ignore करता है — खराब कुछ नहीं होता।

## Phase 2 — DATABASE CHANGES (phase-wise, हर phase के बाद verify)

### 2a. New nodes (additive, safe)
| Node | Purpose | Risk |
|------|---------|------|
| `publicIdMeta/counter` | ID allocation counter (init: `1000000`) | none — नया |
| `publicIds/{num}` | num→uid unique map | none |
| `users/{uid}/publicUserId` | lazy allocate on login | none |
| `groups/`, `groupMessages/`, `groupInvites/` | group chat | none |
| `recoveryCodes/{uid}/{hash}` | single-use hashed codes | none |
| `users/{uid}/security/kickAt` | remote logout | none |

### 2b. SECURITY FIX — Legacy plaintext purge (⚠️ ध्यान से)
- **क्या जाता है**: `recoveryPrivate/{uid}` का `password, mainCode, secondaryCode, email, dob`
  और `users/{uid}/recovery/mainCode, secondaryCode` (plaintext)
- **क्या टूटता है**: staff-approval auto-login के बाद credentials दिखाना
  (recCredChat) — **login खुद काम करता रहेगा** (custom token से)
- **कैसे**: हर user खुद करेगा — Settings → Security → Recovery Center →
  "Purge legacy plaintext secrets"
  या staff: `vexaBackend` action `purgeVault` (per-user)
- **Rollback**: Phase 0 के backup से `recoveryPrivate` node वापस restore करो
  (⚠️ पर मत करो — वापसी का मतलब plaintext passwords वापस)

### 2c. Rules deployment
1. `backend/database.rules.json` में comments हटाकर (`node` script से)
   Console → Rules में paste → Publish
2. **Verify** करो: chat भेजना, recovery flow, group create — तीनों काम कर रहे हों
3. **Rollback**: Phase 0 वाले पुराने rules paste कर दो

### 2d. publicUserId bulk migration (optional — lazy भी चलता है)
- Staff user login करके `vexaBackend` → action `bulkMigrateIds` call करो
  (batches of 400 — जब तक `migrated: 0` न आए)
- Lazy migration भी है: पुराने user के login पर auto-allocate

## Rollback Master Procedure

```
1. GitHub: git checkout v2.0.1-backup → 4 files वापस → push (app पुराना होगा)
2. Rules: Phase 0 backup rules → Console paste → Publish
3. DB: additive nodes (groups/publicIds/...) — मत हटाओ, harmless हैं
   recoveryPrivate restore करना ही हो तो: Export-JSON में से node copy →
   Console import (या Node script से set)
4. Cloud Functions: functions deploy revert (git checkout functions/)
```

## Testing Checklist (deploy के बाद ज़रूर चलाओ)

- [ ] Login/Signup पुराने तरीके से — नए users को VEXA ID मिले (profile में)
- [ ] पुराना user login → VEXA ID auto-allocate (Settings → Security)
- [ ] Post: 5 photos तक, Supabase-2 bucket में upload + feed में दिखे
- [ ] Avatar change → Supabase-1 में
- [ ] Group: create → invite (username/ID) → accept → text/image/video send
- [ ] Group roles: member message delete ना कर पाए, admin कर पाए
- [ ] 1:1 chat: 🎬 → Drive connect → upload → send → receiver देखे / Open-in-Drive
- [ ] 2FA: enable (phone) → logout → login with SMS code
- [ ] Devices: दूसरा device logout → वहाँ 30s में kick
- [ ] Recovery Center: 10 codes generate → 1 code से login → code single-use रहे
