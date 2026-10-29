/* ═══════════════════════════════════════════════════════════════════════════
   VEXA CHAT — BACKEND CLOUD FUNCTIONS (Add-on for v2.1 upgrade)
   Region: us-central1 (existing recoveryLogin/vexaSecureStore/recoveryCredChat
   वहीं deployed हैं — उन्हें TOUCH नहीं करना, यह file उनके साथ-साथ deploy होगी)

   Deploy:
     firebase deploy --only functions:vexaBackend
   Required env/secrets (function config में):
     firebase functions:config:set recovery.app_url="https://animetubepro.github.io/vexa-chat/"

   Actions:
     recoverWithCode (PUBLIC) — single-use hashed recovery code → custom token
     revokeDevice    (AUTH)   — refresh token revoke + device flag
     logoutAllOthers (AUTH)   — global kick timestamp + token revoke
     purgeVault      (AUTH)   — legacy plaintext secrets scrub (migration helper)
   ═══════════════════════════════════════════════════════════════════════════ */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/* NOTE: अगर existing index.js में admin.initializeApp() पहले से है तो यह guard skip कर देगा */
try { admin.initializeApp(); } catch (e) { /* already initialized */ }

const db = admin.database();

/* ── helpers ── */
function sha256Hex(s) {
  return require('crypto').createHash('sha256').update(String(s)).digest('hex');
}
function json(res, code, obj) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.status(code).json(obj);
}
/* per-email recovery attempt throttle: 5 / hour */
async function throttleOk(emailHash) {
  const ref = db.ref('securityRecoveryAttempts/' + emailHash);
  const now = Date.now();
  const snap = await ref.get();
  const attempts = (snap.exists() ? snap.val() : []).filter(t => now - t < 3600000);
  if (attempts.length >= 5) return false;
  attempts.push(now);
  await ref.set(attempts);
  return true;
}

/* ═══════════ MAIN ROUTER ═══════════ */
exports.vexaBackend = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  const body = req.body || {};
  const action = body.action || '';

  try {
    /* ────── 1) recoverWithCode — PUBLIC (login से पहले) ────── */
    if (action === 'recoverWithCode') {
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim().toUpperCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: 'Invalid email' });
      if (!code || !/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) return json(res, 400, { error: 'Invalid code format' });

      const emailHash = sha256Hex(email);
      if (!(await throttleOk(emailHash))) return json(res, 429, { error: 'Too many attempts — 1 hour baad try karo' });

      /* user ढूंढो (Admin SDK — email index DB में नहीं है) */
      let user;
      try { user = await admin.auth().getUserByEmail(email); }
      catch (e) { return json(res, 400, { error: 'Invalid code ya email' }); }
      const uid = user.uid;

      /* single-use hash verify */
      const codeHash = sha256Hex(code);
      const ref = db.ref('recoveryCodes/' + uid + '/' + codeHash);
      const snap = await ref.get();
      if (!snap.exists()) return json(res, 400, { error: 'Invalid code' });
      const rec = snap.val();
      if (rec.used) return json(res, 400, { error: 'Code already used (single-use)' });

      /* atomically mark used */
      const txn = await ref.transaction(cur => {
        if (cur === null) return null;                 /* deleted race */
        if (cur.used) return;                          /* abort — already used */
        return Object.assign({}, cur, { used: true, usedAt: Date.now(), usedVia: 'recoveryLogin' });
      });
      if (!txn.committed) return json(res, 400, { error: 'Code already used' });

      /* security event + custom token */
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'recovery_code_used', at: Date.now(), device: 'recovery-login' });
      const token = await admin.auth().createCustomToken(uid);
      return json(res, 200, { ok: true, token: token });
    }

    /* ────── बाकी सब actions AUTH required ────── */
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) return json(res, 401, { error: 'Auth token missing' });
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(idToken, true); }
    catch (e) { return json(res, 401, { error: 'Invalid token' }); }
    const uid = decoded.uid;

    /* ────── 2) revokeDevice ──────
       Firebase tokens globally revoke होते हैं (per-device revoke SDK में नहीं),
       इसलिए: DB flag (online clients के लिए instant) + revokeRefreshTokens
       (offline device के next refresh के लिए)। Current device exempt है क्योंकि
       वो अपना fresh ID token use कर रहा है (1h valid), और re-login से वापस आ जाएगा। */
    if (action === 'revokeDevice') {
      const deviceId = String(body.deviceId || '');
      if (!/^dev_[a-f0-9]{16}$/.test(deviceId)) return json(res, 400, { error: 'Invalid deviceId' });
      await db.ref('users/' + uid + '/devices/' + deviceId).update({ revoked: true, revokedAt: Date.now(), revokedBy: uid });
      await admin.auth().revokeRefreshTokens(uid);
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'device_revoked', device: deviceId, at: Date.now() });
      return json(res, 200, { ok: true, note: 'Tokens globally revoked; online web clients DB-flag से instant logout होंगे' });
    }

    /* ────── 3) logoutAllOthers ────── */
    if (action === 'logoutAllOthers') {
      await admin.auth().revokeRefreshTokens(uid);
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'logout_all_others', at: Date.now() });
      return json(res, 200, { ok: true, note: 'kickAt timestamp client ने पहले ही set कर दिया होता है' });
    }

    /* ────── 4) purgeVault — legacy plaintext scrub (migration) ────── */
    if (action === 'purgeVault') {
      const up = {};
      up['recoveryPrivate/' + uid + '/password'] = null;
      up['recoveryPrivate/' + uid + '/mainCode'] = null;
      up['recoveryPrivate/' + uid + '/secondaryCode'] = null;
      up['recoveryPrivate/' + uid + '/email'] = null;
      up['recoveryPrivate/' + uid + '/dob'] = null;
      up['users/' + uid + '/recovery/mainCode'] = null;
      up['users/' + uid + '/recovery/secondaryCode'] = null;
      await db.ref().update(up);
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'legacy_secret_purge', at: Date.now() });
      return json(res, 200, { ok: true });
    }

    /* ────── 5) bulkMigrateIds — admin-only: पुराने users के publicUserId one-shot
       (owner role वाला user ही चला सकता है; per-user lazy migration भी है) ────── */
    if (action === 'bulkMigrateIds') {
      const meSnap = await db.ref('users/' + uid + '/role').get();
      if (meSnap.val() !== 'owner' && meSnap.val() !== 'admin') return json(res, 403, { error: 'Staff only' });
      const users = await db.ref('users').get();
      let migrated = 0, skipped = 0;
      const updates = {};
      let counter = null;
      const cs = await db.ref('publicIdMeta/counter').get();
      counter = cs.exists() ? cs.val() : 1000000;
      const BATCH = 400;
      await users.forEach(u => {
        const v = u.val() || {};
        if (v.publicUserId || migrated + skipped >= BATCH) return;
        counter += 1;
        updates['users/' + u.key + '/publicUserId'] = counter;
        updates['users/' + u.key + '/publicUserIdAt'] = Date.now();
        updates['publicIds/' + counter] = u.key;
        migrated++;
      });
      if (Object.keys(updates).length) {
        updates['publicIdMeta/counter'] = counter;
        await db.ref().update(updates);
      }
      return json(res, 200, { ok: true, migrated, skipped, note: 'Batches me chalao jab tak migrated=0 na aaye' });
    }

    return json(res, 400, { error: 'Unknown action: ' + action });
  } catch (e) {
    console.error('[vexaBackend]', action, e);
    return json(res, 500, { error: 'Server error' });
  }
});
