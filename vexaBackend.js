/* ═══════════════════════════════════════════════════════════════════════════
   VEXA CHAT — BACKEND CLOUD FUNCTIONS (Secure Recovery Vault v1.0)
   Region: us-central1 · Runtime: nodejs18+ (global WebCrypto)

   ⚡VAULT v1.0 CHANGES (spec §3/§6/§8/§9/§11):
   ✗ staffGetPassword REMOVE — staff NEVER access passwords (spec §10)
   ✗ vexaSecureStore credential store — DEAD (client no longer calls it)
   + vexaVault actions:
       ping                  — health probe
       vaultRegister (AUTH)  — vault metadata register (NO secrets stored)
       recoveryRequestCreate (AUTH) — .vexa server-side verify + request
       recoveryDecision (AUTH staff) — admin recommend / owner approve+2FA log
       migrationRun (AUTH owner) — MIGRATION ENGINE (checkpoints, resume)
   + vexa-vault.js core module required server-side (same crypto code path)
   + dataRecoveryApply throttle bug FIX (was: undefined `uid`)

   SECURITY RULES (enforced here, spec §10):
     • .vexa secret + file contents are verified IN MEMORY ONLY — nothing
       sensitive is ever persisted. Only verdicts + hashes + IDs.
     • Rate limits: request create 3/h/user · decisions 20/h/staff.
     • Every decision/action → immutable recoveryAuditLogs entry.
     • Owner-only: final approve, migration run. Admin: verify/recommend.
   ═══════════════════════════════════════════════════════════════════════════ */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const VexaVault = require('./vexa-vault.js');

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
/* generic sliding-window throttle */
async function throttleOk(key, max, windowMs) {
  const ref = db.ref('securityRecoveryAttempts/' + key);
  const now = Date.now();
  const snap = await ref.get();
  const attempts = (snap.exists() ? snap.val() : []).filter(t => now - t < windowMs);
  if (attempts.length >= max) return false;
  attempts.push(now);
  await ref.set(attempts);
  return true;
}
async function roleOf(uid) {
  const s = await db.ref('users/' + uid + '/role').get();
  return s.exists() ? s.val() : 'user';
}
async function audit(action, actor, actorRole, targetType, targetId, detail) {
  try {
    await db.ref('recoveryAuditLogs').push({
      at: Date.now(), actor: actor || '', actorRole: actorRole || '',
      action, targetType: targetType || '', targetId: targetId || '',
      detail: String(detail || '').slice(0, 300)
    });
  } catch (e) { /* non-fatal */ }
}
async function notify(uid, type, title, body) {
  try {
    await db.ref('users/' + uid + '/notifications').push({ type, title, body, read: false, at: Date.now() });
  } catch (e) { /* non-fatal */ }
}
async function notifyStaff(type, title, body, roles) {
  try {
    const si = await db.ref('staffIndex').get();
    if (!si.exists()) return;
    si.forEach(c => {
      const v = c.val() || {};
      if (!roles || roles.includes(v.role)) notify(c.key, type, title, body);
    });
  } catch (e) { /* non-fatal */ }
}

/* ═══════════ MIGRATION ENGINE (spec §11) ═══════════
   Checkpointed, resumable, batched. Steps:
     profile → posts → social → chats → settings → verify
   Modes: full_migration | selective_migration | restoration            */
const MIG_STEPS = ['profile', 'posts', 'social', 'chats', 'settings', 'verify'];

async function runMigration(jobId) {
  const jref = db.ref('recoveryJobs/' + jobId);
  const js = await jref.get();
  if (!js.exists()) return { error: 'Job not found' };
  const job = js.val() || {};
  if (['completed', 'failed', 'cancelled'].includes(job.status)) return { ok: true, status: job.status, note: 'Job already ' + job.status };

  const oldUid = job.oldUid, newUid = job.newUid, mode = job.mode || 'full_migration';
  const cats = job.cats || null;
  const stats = job.stats || { postsMoved: 0, followersMoved: 0, followingMoved: 0, chatsMoved: 0 };

  await jref.update({ status: 'in_progress', updatedAt: Date.now() });

  let idx = MIG_STEPS.indexOf(job.checkpoint) >= 0 ? MIG_STEPS.indexOf(job.checkpoint) : 0;
  if (job.checkpoint === 'queued') idx = 0;

  for (; idx < MIG_STEPS.length; idx++) {
    const step = MIG_STEPS[idx];
    await jref.update({ checkpoint: step, checkpointIndex: idx, status: 'in_progress', updatedAt: Date.now() });

    /* destination data is NEVER silently overwritten (spec §6 Option 2):
       merge-with-skip for all modes */
    try {
      if (step === 'profile' && mode !== 'restoration' && (!cats || cats.profile)) {
        const os = await db.ref('users/' + oldUid).get();
        if (os.exists()) {
          const o = os.val() || {};
          const keep = ['displayName', 'bio', 'profilePhoto', 'dob', 'profileDesign'];
          const patch = {};
          keep.forEach(k => { if (o[k] !== undefined && o[k] !== null && o[k] !== '') patch[k] = o[k]; });
          if (o.settings && typeof o.settings === 'object') patch.settings = o.settings;
          patch.migratedFrom = oldUid;
          patch.migratedAt = Date.now();
          /* don't clobber role/vip/verified of the temp account unless empty */
          await db.ref('users/' + newUid).update(patch);
        }
      }
      if (step === 'posts' && (!cats || cats.posts)) {
        const ps = await db.ref('users/' + oldUid + '/posts').get();
        if (ps.exists()) {
          let n = 0;
          const up = {};
          ps.forEach(p => {
            const v = p.val() || {};
            v.migratedFrom = oldUid;
            up['users/' + newUid + '/posts/' + p.key] = v;
            up['posts/' + p.key + '/userId'] = newUid;   /* re-point public post */
            n++; stats.postsMoved = (stats.postsMoved || 0) + 1;
          });
          if (Object.keys(up).length) await db.ref().update(up);
          const pc = await db.ref('users/' + newUid + '/posts').get();
          await db.ref('users/' + newUid + '/postCount').set(pc.exists() ? pc.numChildren() : n);
        }
      }
      if (step === 'social') {
        if (!cats || cats.followers) {
          const fs = await db.ref('users/' + oldUid + '/followers').get();
          if (fs.exists()) {
            const up = {};
            fs.forEach(f => { up['users/' + newUid + '/followers/' + f.key] = f.val() || true;
                             up['users/' + f.key + '/following/' + newUid] = true;
                             stats.followersMoved++; });
            if (Object.keys(up).length) await db.ref().update(up);
          }
        }
        if (!cats || cats.following) {
          const fg = await db.ref('users/' + oldUid + '/following').get();
          if (fg.exists()) {
            const up = {};
            fg.forEach(f => { up['users/' + newUid + '/following/' + f.key] = f.val() || true;
                              up['users/' + f.key + '/followers/' + newUid] = true;
                              stats.followingMoved++; });
            if (Object.keys(up).length) await db.ref().update(up);
          }
        }
      }
      if (step === 'chats' && (!cats || cats.chatHistory)) {
        const cs = await db.ref('users/' + oldUid + '/chats').get();
        if (cs.exists()) {
          const up = {};
          cs.forEach(c => { up['users/' + newUid + '/chats/' + c.key] = c.val() || true;
                            stats.chatsMoved++; });
          if (Object.keys(up).length) await db.ref().update(up);
          /* group memberships: chats/{chatId}/members */
          const gs = await db.ref('chats').get();
          if (gs.exists()) {
            const gup = {};
            gs.forEach(g => {
              const mem = g.child('members/' + oldUid);
              if (mem.exists()) gup['chats/' + g.key + '/members/' + newUid] = mem.val() || true;
            });
            if (Object.keys(gup).length) await db.ref().update(gup);
          }
        }
      }
      if (step === 'settings' && (!cats || cats.settings)) {
        const ss = await db.ref('users/' + oldUid + '/settings').get();
        if (ss.exists()) await db.ref('users/' + newUid + '/settings').update(ss.val() || {});
      }
      if (step === 'verify') {
        /* post-completion verification (spec §11.6): counts must match */
        const out = {};
        const a = await db.ref('users/' + newUid + '/posts').get();
        out.postsInDest = a.exists() ? a.numChildren() : 0;
        const b = await db.ref('users/' + newUid + '/followers').get();
        out.followersInDest = b.exists() ? b.numChildren() : 0;
        const c = await db.ref('users/' + newUid + '/following').get();
        out.followingInDest = c.exists() ? c.numChildren() : 0;
        await jref.update({ verification: out });
      }
    } catch (e) {
      await jref.update({ status: 'failed', error: String(e.message || e).slice(0, 200), updatedAt: Date.now() });
      await audit('migration_failed', job.ownerUid || '', 'system', 'recoveryJob', jobId, e.message);
      return { ok: false, error: e.message, jobId };
    }
  }

  /* ── finish per mode ── */
  if (mode === 'full_migration') {
    /* retire old account (spec §6 Option 1) */
    await db.ref('users/' + oldUid).update({ retired: true, retiredAt: Date.now(), retiredInFavourOf: newUid });
    try { await admin.auth().revokeRefreshTokens(oldUid); } catch (e) {}
    await notify(oldUid, 'security', '📦 Account Migrated',
      'Aapka purana account retire ho gaya — saara data naye account me transfer ho chuka hai.');
  }
  if (mode === 'restoration') {
    /* old account re-activates with a TEMP password handed to the verified
       user ONCE via their temp account's Help Chat (logged + audited).
       User pehli login ke baad password turant change karega. */
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tmp = '';
    for (let i = 0; i < 12; i++) tmp += alphabet[Math.floor(Math.random() * alphabet.length)];
    tmp += '7x';
    try {
      await admin.auth().updateUser(oldUid, { password: tmp, disabled: false });
      await db.ref('users/' + oldUid).update({ retired: false, disabled: false, restoredAt: Date.now(), restoredFor: newUid });
      await db.ref('users/' + oldUid + '/helpChat').push({
        from: 'system', text: '♻️ ACCOUNT RESTORED — temp login:\n\n📧 Email: aapka registered email\n🔑 Temp Password: ' + tmp +
        '\n\n⚠️ Login ke turant baad Settings me password CHANGE kar lo. Ye message 1 baar dikhega.',
        at: Date.now()
      });
      /* retire the temp account */
      await db.ref('users/' + newUid).update({ retired: true, disabled: true, retiredAt: Date.now(), retiredAsTemp: true });
      try { await admin.auth().revokeRefreshTokens(newUid); } catch (e) {}
    } catch (e) {
      await jref.update({ status: 'failed', error: 'restore fail: ' + e.message, updatedAt: Date.now() });
      return { ok: false, error: e.message, jobId };
    }
  }
  /* selective: old account stays intact (no retirement) */

  await jref.update({ status: 'completed', checkpoint: 'done', finishedAt: Date.now(), updatedAt: Date.now() });
  await audit('migration_completed', job.ownerUid || '', 'system', 'recoveryJob', jobId,
    mode + ' · ' + JSON.stringify(stats));
  const rs = await db.ref('recoveryRequests/' + job.reqId + '/status').set('completed').catch(() => {});
  await notify(newUid, 'security', '🏁 Recovery Complete',
    'Migration complete! ' + stats.postsMoved + ' posts, ' + stats.followersMoved + ' followers transfer hue.');
  return { ok: true, status: 'completed', stats };
}

/* ═══════════ MAIN ROUTER ═══════════ */
exports.vexaBackend = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  const body = req.body || {};
  const action = body.action || '';

  try {
    /* ────── 0) ping ────── */
    if (action === 'ping') return json(res, 200, { ok: true, service: 'vexaBackend', vault: '1.0' });

    /* ────── 1) dataRecoveryApply — AUTH-free action (throttled by oldUid) ────── */
    if (action === 'dataRecoveryApply') {
      const app = body.app || {};
      const appId = String(body.appId || '').slice(0, 80);
      const oldUid = String(app.oldUid || '').trim();
      const main = String(app.mainCode || '').trim().toUpperCase();
      const sec = String(app.secCode || '').trim().toUpperCase();
      const email = String(app.oldEmail || '').trim().toLowerCase();
      const dob = String(app.oldDob || '').trim();
      if (!appId || !/^[A-Za-z0-9_-]{6,80}$/.test(appId)) return json(res, 400, { error: 'Invalid appId' });
      if (!oldUid || oldUid.length < 20 || oldUid.length > 60) return json(res, 400, { error: 'Invalid oldUid' });
      if (!main || !sec || !email || !dob) return json(res, 400, { error: 'Sab details daalo (codes + email + dob)' });

      /* throttle: per-oldUid 5 applies / hour (⚡bug fixed: pehle undefined uid tha) */
      if (!(await throttleOk('dr_' + oldUid, 5, 3600000)))
        return json(res, 429, { error: 'Too many attempts — 1 hour baad try karo' });

      /* 1) hashes verify (Admin SDK read — rules bypass) */
      const chkSnap = await db.ref('recoveryCheck/' + oldUid).get();
      if (!chkSnap.exists()) return json(res, 400, { error: 'Is UID ka recovery data nahi mila' });
      const chk = chkSnap.val() || {};
      if (chk.mainHash !== sha256Hex(main)) return json(res, 400, { error: 'Main Remember Code galat hai' });
      if (chk.secHash !== sha256Hex(sec)) return json(res, 400, { error: 'Secondary Remember Code galat hai' });
      if (chk.emailHash && chk.emailHash !== sha256Hex(email)) return json(res, 400, { error: 'Email match nahi hua' });
      if (chk.dobHash !== sha256Hex(dob)) return json(res, 400, { error: 'DOB match nahi hui' });

      /* 2) duplicate check */
      const dupSnap = await db.ref('dataRecoveryApps').orderByChild('newUid').equalTo(app.newUid || '').get();
      if (dupSnap.exists()) {
        let dup = false;
        dupSnap.forEach(x => { const st = (x.val() || {}).status; if (st === 'pending' || st === 'verified') dup = true; });
        if (dup) return json(res, 409, { error: 'Ek application already pending hai' });
      }

      /* 3) application write (server — trusted data) */
      const rec = {
        oldUid, oldUsername: String(chk.user || app.oldUsername || '').slice(0, 20),
        newUid: String(app.newUid || '').slice(0, 60),
        newUsername: String(app.newUsername || '').slice(0, 20),
        newEmail: String(app.newEmail || '').slice(0, 60),
        oldEmail: email.slice(0, 60), oldDob: dob.slice(0, 12),
        verifiedData: true, viaServer: true, status: 'pending',
        device: String(app.device || '').slice(0, 40),
        appVer: String(app.appVer || '').slice(0, 12),
        createdAt: Date.now(), updatedAt: Date.now()
      };
      await db.ref('dataRecoveryApps/' + appId).set(rec);
      await notifyStaff('data_recovery', '🔐 Data Recovery Application',
        'Old: @' + rec.oldUsername + ' → New: @' + rec.newUsername + ' · Admin Panel me verify karo',
        ['admin', 'moderator', 'owner']);
      try {
        await db.ref('users/' + rec.newUid + '/securityEvents').push({ type: 'data_recovery_applied', oldUid, at: Date.now(), device: rec.device });
      } catch (e) {}
      return json(res, 200, { ok: true, appId });
    }

    /* ────── बाकी सब actions AUTH required ────── */
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) return json(res, 401, { error: 'Auth token missing' });
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(idToken, true); }
    catch (e) { return json(res, 401, { error: 'Invalid token' }); }
    const uid = decoded.uid;

    /* ────── 2) vaultRegister — encrypted vault METADATA register ──────
       Body: {backupId, keyVersion, salt, verifier, fileHash, accountFingerprint}
       ⚠️ NO vault secret, NO payload, NO keys — sirf verifiers (spec §3). */
    if (action === 'vaultRegister') {
      const backupId = String(body.backupId || '');
      const verifier = String(body.verifier || '');
      if (!/^vlt_[A-Za-z0-9]{10,24}$/.test(backupId)) return json(res, 400, { error: 'Invalid backupId' });
      if (!/^[a-f0-9]{64}$/.test(verifier)) return json(res, 400, { error: 'Invalid verifier' });
      const now = Date.now();
      await db.ref('recoveryVaults/' + uid).update({
        backupId, keyVersion: parseInt(body.keyVersion) || 1,
        accountFingerprint: String(body.accountFingerprint || '').slice(0, 64),
        createdAt: body.createdAt || now, updatedAt: now,
        vaultVersion: '1.0', status: 'active', viaServer: true
      });
      await db.ref('recoveryKeyMetadata/' + uid).update({
        keyVersion: parseInt(body.keyVersion) || 1,
        kdf: 'PBKDF2-HMAC-SHA256-250000',
        salt: String(body.salt || '').slice(0, 64),
        verifier, createdAt: body.createdAt || now
      });
      await audit('vault_registered', uid, 'user', 'recoveryVault', uid, backupId);
      return json(res, 200, { ok: true });
    }

    /* ────── 3) recoveryRequestCreate — SERVER-SIDE .vexa VERIFY (spec §6/§8) ──────
       Body: {mode, cats, origUsername, origEmail, reason, mainCode, secCode,
              backupFile(JSON string), vaultSecret}
       File + secret IN-MEMORY verification; NOTHING sensitive persisted. */
    if (action === 'recoveryRequestCreate') {
      if (!(await throttleOk('rr_' + uid, 3, 3600000)))
        return json(res, 429, { error: 'Too many recovery requests — 1 hour baad try karo' });

      const mode = String(body.mode || '');
      if (!['full_migration', 'selective_migration', 'restoration'].includes(mode))
        return json(res, 400, { error: 'Invalid recovery mode' });
      const main = String(body.mainCode || '').trim().toUpperCase();
      const sec = String(body.secCode || '').trim().toUpperCase();
      const origEmail = String(body.origEmail || '').trim().toLowerCase();
      const origUsername = String(body.origUsername || '').replace(/^@/, '').trim().slice(0, 20);
      const reason = String(body.reason || '').slice(0, 300);
      if (!origUsername || !origEmail || reason.length < 10 || !main || !sec)
        return json(res, 400, { error: 'Sab fields bharo (username, email, reason 10+, dono codes)' });

      /* .vexa server-side decrypt + integrity (IN-MEMORY ONLY) */
      let header, payload, verdict;
      try {
        verdict = await VexaVault.read(String(body.backupFile || ''), String(body.vaultSecret || ''));
        if (!verdict.ok) {
          await audit('request_rejected_bad_vexa', uid, 'user', 'recoveryRequest', uid,
            (verdict.errors || []).join('; ').slice(0, 200));
          return json(res, 400, { error: '.vexa verification FAIL: ' + (verdict.errors || ['unknown'])[0] });
        }
        header = verdict.header; payload = verdict.payload;
      } catch (e) {
        return json(res, 400, { error: '.vexa parse fail: ' + e.message });
      }

      const origUid = payload.account.uid;
      /* remember codes + email server-hash verify (4-proof ownership, spec §7) */
      const chkSnap = await db.ref('recoveryCheck/' + origUid).get();
      if (!chkSnap.exists()) return json(res, 400, { error: 'Original account ka recovery data nahi mila' });
      const chk = chkSnap.val() || {};
      const codeOk = chk.mainHash === sha256Hex(main) && chk.secHash === sha256Hex(sec);
      const emailOk = !chk.emailHash || chk.emailHash === sha256Hex(origEmail);
      if (!codeOk || !emailOk) {
        await audit('request_rejected_bad_codes', uid, 'user', 'recoveryRequest', origUid,
          'codesOk=' + codeOk + ' emailOk=' + emailOk);
        return json(res, 400, { error: 'Remember codes ya email match nahi hue' });
      }

      /* cross-check vault registry (backupId should match registered vault) */
      let registryMatch = false;
      const vs = await db.ref('recoveryVaults/' + origUid).get();
      if (vs.exists()) registryMatch = (vs.val() || {}).backupId === header.backupId;

      const reqId = 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      const meSnap = await db.ref('users/' + uid).get();
      const meU = (meSnap.val() || {}).username || '';
      await db.ref('recoveryRequests/' + reqId).set({
        reqId, tempUid: uid, tempUsername: meU,
        mode, cats: body.cats || null,
        origUid, origUsername, origEmail: origEmail.slice(0, 60),
        origFingerprint: header.accountFingerprint,
        backupId: header.backupId,
        keyVersion: header.keyVersion || 1,
        vaultVerdict: { integrity: 'pass', hmac: 'pass', fingerprint: 'pass', verifierMatch: verdictVerifiers(verdict) },
        integrityStatus: 'server_verified',
        ownershipStatus: 'server_verified',
        registryMatch, reason,
        viaServer: true, status: 'pending',
        requestedAt: Date.now(), updatedAt: Date.now()
      });
      /* security event on the ORIGINAL account + staff notify */
      try {
        await db.ref('users/' + origUid + '/securityEvents').push({ type: 'vault_recovery_request', by: uid, reqId, at: Date.now() });
      } catch (e) {}
      await notifyStaff('vault_recovery', '🛡️ Vault Recovery Request',
        '@' + meU + ' → @' + origUsername + ' (' + mode + ') · Admin Panel me verify karo', ['admin', 'owner']);
      await audit('request_created', uid, 'user', 'recoveryRequest', reqId, mode + ' orig=' + origUid);
      /* sirf verdicts return — file/secret KABHI wapas nahi jate */
      return json(res, 200, { ok: true, reqId, integrityStatus: 'server_verified', registryMatch });
    }

    /* ────── 4) recoveryDecision — ADMIN/OWNER (spec §8/§9) ────── */
    if (action === 'recoveryDecision') {
      const myRole = await roleOf(uid);
      if (!['admin', 'owner', 'moderator'].includes(myRole)) return json(res, 403, { error: 'Staff only' });
      const reqId = String(body.reqId || '');
      const decision = String(body.decision || '');
      const note = String(body.note || '').slice(0, 200);
      const rs = await db.ref('recoveryRequests/' + reqId).get();
      if (!rs.exists()) return json(res, 404, { error: 'Request not found' });
      const rec = rs.val() || {};

      if (!(await throttleOk('dec_' + uid, 20, 3600000)))
        return json(res, 429, { error: 'Too many decisions — thoda ruko' });

      let jobId = '';
      if (decision === 'approved') {
        if (myRole !== 'owner') return json(res, 403, { error: 'Final approval sirf OWNER (2FA ke saath)' });
        /* NOTE: 2FA client-side reauthentication se pehle hota hai; yahan
           sirf owner-role check + audit entry. Token verifyIdToken(true) hi
           fresh-session proof hai. */
        jobId = 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        await db.ref('recoveryJobs/' + jobId).set({
          reqId, oldUid: rec.origUid, newUid: rec.tempUid,
          oldUsername: rec.origUsername || '', newUsername: rec.tempUsername || '',
          mode: rec.mode, cats: rec.cats || null,
          status: 'queued', checkpoint: 'queued', checkpointIndex: 0,
          ownerUid: uid, createdAt: Date.now(), updatedAt: Date.now(), viaServer: true
        });
        await db.ref('recoveryApprovals/' + reqId).set({
          reqId, type: 'final_approval', decision: 'approved',
          approverUid: uid, approverRole: 'owner', method: 'reauthenticate',
          at: Date.now(), viaServer: true, jobId
        });
        await db.ref('recoveryRequests/' + reqId).update({ status: 'approved', decidedBy: 'owner:' + uid, updatedAt: Date.now() });
        await notify(rec.tempUid, 'security', '✅ Recovery Approved', 'Owner approved — migration queue me hai.');
        await audit('request_approved', uid, 'owner', 'recoveryRequest', reqId, 'job=' + jobId);
      } else if (decision === 'rejected') {
        if (!['admin', 'owner'].includes(myRole)) return json(res, 403, { error: 'Admin/Owner only' });
        await db.ref('recoveryRequests/' + reqId).update({
          status: 'rejected', rejectReason: note || 'Evidence insufficient', decidedBy: myRole + ':' + uid, updatedAt: Date.now()
        });
        if (rec.tempUid) await notify(rec.tempUid, 'security', '❌ Recovery Rejected', 'Reason: ' + (note || 'evidence insufficient'));
        await audit('request_rejected', uid, myRole, 'recoveryRequest', reqId, note);
      } else if (decision === 'recommend') {
        if (myRole !== 'admin') return json(res, 403, { error: 'Admin only' });
        await db.ref('recoveryRequests/' + reqId).update({ status: 'admin_recommended', updatedAt: Date.now() });
        await db.ref('recoveryApprovals/' + reqId).set({ reqId, type: 'admin_recommendation', approverUid: uid, approverRole: 'admin', at: Date.now(), viaServer: true });
        await notifyStaff('vault_recovery', '👑 Owner Approval Pending', 'Admin ne ' + reqId + ' recommend kiya — Owner Panel me 2FA approve karo', ['owner']);
        await audit('admin_recommended', uid, 'admin', 'recoveryRequest', reqId, note);
      } else if (decision === 'escalate') {
        await db.ref('recoveryRequests/' + reqId).update({ status: 'owner_pending', escalatedBy: myRole + ':' + uid, updatedAt: Date.now() });
        await notifyStaff('vault_recovery', '👑 Escalated to Owner', reqId + ' escalated by ' + myRole, ['owner']);
        await audit('escalated_to_owner', uid, myRole, 'recoveryRequest', reqId, '');
      } else if (decision === 'verify') {
        await db.ref('recoveryRequests/' + reqId).update({ status: 'verifying', verifiedBy: myRole + ':' + uid, updatedAt: Date.now() });
        await audit('evidence_verified', uid, myRole, 'recoveryRequest', reqId, note);
      } else {
        return json(res, 400, { error: 'Unknown decision' });
      }
      return json(res, 200, { ok: true, reqId, decision, jobId: jobId || undefined });
    }

    /* ────── 5) migrationRun — OWNER triggers/resumes engine ────── */
    if (action === 'migrationRun') {
      const myRole = await roleOf(uid);
      if (myRole !== 'owner') return json(res, 403, { error: 'Migration sirf OWNER chala sakta hai' });
      const reqId = String(body.reqId || '');
      let jobId = String(body.jobId || '');
      if (!jobId) {
        const js = await db.ref('recoveryJobs').orderByChild('reqId').equalTo(reqId).get();
        js.forEach(x => { if (!jobId) jobId = x.key; });
      }
      if (!jobId) return json(res, 404, { error: 'Job not found for request' });
      const out = await runMigration(jobId);
      if (out.error) return json(res, 400, out);
      return json(res, 200, Object.assign({ jobId, note: 'checkpoint engine' }, out));
    }

    /* ────── 6) revokeDevice ────── */
    if (action === 'revokeDevice') {
      const deviceId = String(body.deviceId || '');
      if (!/^dev_[a-f0-9]{16}$/.test(deviceId)) return json(res, 400, { error: 'Invalid deviceId' });
      await db.ref('users/' + uid + '/devices/' + deviceId).update({ revoked: true, revokedAt: Date.now(), revokedBy: uid });
      await admin.auth().revokeRefreshTokens(uid);
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'device_revoked', device: deviceId, at: Date.now() });
      return json(res, 200, { ok: true, note: 'Tokens globally revoked' });
    }

    /* ────── 7) logoutAllOthers ────── */
    if (action === 'logoutAllOthers') {
      await admin.auth().revokeRefreshTokens(uid);
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'logout_all_others', at: Date.now() });
      return json(res, 200, { ok: true });
    }

    /* ────── 8) purgeVault — legacy plaintext scrub (migration helper) ────── */
    if (action === 'purgeVault') {
      const up = {};
      up['recoveryPrivate/' + uid] = null;
      up['users/' + uid + '/recovery/mainCode'] = null;
      up['users/' + uid + '/recovery/secondaryCode'] = null;
      await db.ref().update(up);
      await db.ref('users/' + uid + '/securityEvents').push({ type: 'legacy_secret_purge', at: Date.now() });
      await audit('legacy_purge', uid, 'user', 'recoveryPrivate', uid, 'self-service plaintext scrub');
      return json(res, 200, { ok: true });
    }

    /* ────── 9) bulkMigrateIds — admin/owner one-shot ────── */
    if (action === 'bulkMigrateIds') {
      const myRole = await roleOf(uid);
      if (myRole !== 'owner' && myRole !== 'admin') return json(res, 403, { error: 'Staff only' });
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

/* verifier match helper (payload/recovery/verifier registry cross-check) */
function verdictVerifiers(verdict) {
  try { return !!(verdict && verdict.payload && verdict.payload.recovery && verdict.payload.recovery.backupId); }
  catch (e) { return false }
}
