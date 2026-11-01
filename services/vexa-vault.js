/* ═══════════════════════════════════════════════════════════════════════════
   VEXA SECURE RECOVERY VAULT — CORE CRYPTO MODULE v1.0
   (AnimeTubePro Studio × VEXA · Secure Recovery Vault v1.0)
   ─────────────────────────────────────────────────────────────────────────
   .VEXA FILE GENERATOR + READER + VALIDATOR (spec §3, §4, §10)

   FORMAT : JSON envelope, UTF-8, extension .vexa  (e.g. CLIENT_001.vexa)
   CRYPTO : AES-256-GCM (authenticated encryption)
            PBKDF2-HMAC-SHA256 ×250,000 → 256-bit vault key
            HMAC-SHA256 integrity signature over header+payload
            SHA-256 account fingerprint + key verifier

   KEY MANAGEMENT (spec §3 — "never save keys inside the file"):
     • VaultSecret  : 8-block user code (user-controlled recovery material,
                      shown ONCE at vault creation, NEVER stored server-side)
     • VaultKey     : PBKDF2(VaultSecret, salt)          → AES-256-GCM key
     • Verifier     : SHA-256(rawKey) hex                → recoveryKeyMetadata
                      (proves key knowledge WITHOUT storing the key)
     • AAD          : canonical header JSON (without payload/tag/integrity)
     • Integrity    : HMAC-SHA256(VaultKey, AAD‖ct‖tag)

   RULES:
     • Plaintext password / OTP / tokens / sessions / plaintext Remember
       Codes are NEVER written into the payload (spec §4).
     • The .vexa file is supporting evidence only — never a login
       credential (spec §3).

   UMD: browser → window.VexaVault · Node ≥18 (tests) → module.exports
   (uses global WebCrypto — identical code path in browser and Node)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';
(function(root, factory){
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.VexaVault = factory();
})(typeof self !== 'undefined' ? self : this, function(){

  var VV = {
    FORMAT_ID   : 'VEXA-VAULT',          // format identifier
    VAULT_VER   : '1.0',                 // vault version
    ALG         : 'AES-256-GCM',         // encryption algorithm
    KDF         : 'PBKDF2-HMAC-SHA256',
    ITERATIONS  : 250000,                // OWASP-recommended for PBKDF2-SHA256
    KEY_BITS    : 256,
    TAG_BITS    : 128,
    NONCE_BITS  : 96,
    KEY_VERSION : 1,                     // key version (rotation support)
    MAX_FILE    : 96 * 1024,             // hard cap — malware-safe handling
    SALT_BITS   : 128,
    ALPHABET    : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I confusion
  };

  /* ── base64url + hex helpers ─────────────────────────────────────────── */
  function b2b64u(buf){
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function b64u2b(str){
    str = String(str||'').replace(/-/g,'+').replace(/_/g,'/');
    while (str.length % 4) str += '=';
    var s = atob(str), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  function b2hex(buf){
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2);
    return s;
  }
  function te(s){ return new TextEncoder().encode(String(s)); }
  function td(buf){ return new TextDecoder().decode(buf); }
  function concat(){ var out=[],len=0,i;
    for(i=0;i<arguments.length;i++){out.push(new Uint8Array(arguments[i]));len+=out[i].length}
    var r=new Uint8Array(len),o=0;
    for(i=0;i<out.length;i++){r.set(out[i],o);o+=out[i].length}
    return r;
  }
  function rand(n){ var b=new Uint8Array(n); crypto.getRandomValues(b); return b; }
  function pad3(n){ var s=String(n); while(s.length<3)s='0'+s; return s.slice(-3); }

  /* ── hashing ─────────────────────────────────────────────────────────── */
  VV.sha256 = async function(data){
    var b = (typeof data === 'string') ? te(data) : new Uint8Array(data);
    return b2hex(await crypto.subtle.digest('SHA-256', b));
  };
  VV.randomBytes = rand;
  VV.b2b64u = b2b64u; VV.b64u2b = b64u2b; VV.b2hex = b2hex; VV.pad3 = pad3;

  /* ── vault secret (user-controlled recovery material) ────────────────── */
  /* 8 blocks × 4 chars = 40 chars incl. separators ≈ 160 bits entropy     */
  VV.genSecret = function(){
    var blocks = [];
    for (var b = 0; b < 8; b++){
      var s = '';
      for (var i = 0; i < 4; i++) s += VV.ALPHABET[Math.floor(Math.random()*VV.ALPHABET.length)];
      blocks.push(s);
    }
    return blocks.join('-');
  };
  VV.normalizeSecret = function(s){
    return String(s||'').toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9-]/g,'');
  };
  VV.secretOk = function(s){
    s = VV.normalizeSecret(s);
    return /^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$/.test(s);
  };

  /* ── key derivation ──────────────────────────────────────────────────── */
  /* PBKDF2 → 512 bits: first 256 = AES-256-GCM key, last 256 = HMAC key   */
  VV.deriveKey = async function(secret, saltBytes){
    var base = await crypto.subtle.importKey('raw', te(VV.normalizeSecret(secret)),
                                             'PBKDF2', false, ['deriveBits']);
    var bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name:'PBKDF2', hash:'SHA-256', salt:new Uint8Array(saltBytes), iterations:VV.ITERATIONS },
      base, VV.KEY_BITS * 2));
    var aesBits = bits.slice(0, VV.KEY_BITS / 8);
    var macBits = bits.slice(VV.KEY_BITS / 8);
    var aesKey = await crypto.subtle.importKey('raw', aesBits, {name:'AES-GCM', length:VV.KEY_BITS}, false, ['encrypt','decrypt']);
    var macKey = await crypto.subtle.importKey('raw', macBits, {name:'HMAC', hash:'SHA-256', length:256}, false, ['sign','verify']);
    return { aesKey: aesKey, macKey: macKey, rawHex: b2hex(bits) };
  };
  /* verifier = SHA-256(rawKey) — proves key knowledge, stores NO key */
  VV.verifierOf = async function(rawHex){
    return (await VV.sha256('vexa-verifier-1:' + rawHex)).slice(0, 64);
  };

  /* ── account fingerprint (spec: Account fingerprint) ─────────────────── */
  VV.fingerprint = async function(uid, saltBytes){
    return (await VV.sha256('VEXA-FP1:' + String(uid) + ':' + b2hex(saltBytes))).slice(0, 32);
  };

  /* ── canonical JSON (deterministic header serialization) ─────────────── */
  function canon(obj){
    var keys = Object.keys(obj).sort(), out = [];
    for (var i = 0; i < keys.length; i++){
      var k = keys[i], v = obj[k];
      out.push(JSON.stringify(k) + ':' + (v === null || typeof v !== 'object' ? JSON.stringify(v) : canon(v)));
    }
    return '{' + out.join(',') + '}';
  }
  VV.canonical = canon;

  /* AAD = header minus dynamic fields */
  function aadHeader(h){
    var c = {};
    for (var k in h){ if (['payload','tag','integrity','filename'].indexOf(k) === -1) c[k] = h[k]; }
    return c;
  }

  /* ── mini-database payload builder (spec §4 — SAFE FIELDS ONLY) ──────── */
  /* Never: password / OTP / tokens / sessions / plaintext remember codes  */
  VV.buildPayload = function(a){
    return {
      account: {
        uid: String(a.uid || ''),
        username: String(a.username || ''),
        emailRef: String(a.email || ''),
        createdAt: a.createdAt || 0,
        lastLoginAt: a.lastLoginAt || 0,
        dobRef: String(a.dob || '')
      },
      recovery: {
        recoveryId: 'rec_' + b2b64u(rand(9)),
        backupId: a.backupId || '',
        mainCodeProtected: a.mainCodeProtected !== false,
        secCodeProtected: a.secCodeProtected !== false,
        recoveryKeyVersion: VV.KEY_VERSION,
        integrity: 'hmac-sha256-aad'
      },
      accountInfo: {
        profileRef: 'users/' + a.uid,
        status: a.status || 'active',
        vipRef: !!a.vip,
        verifiedRef: !!a.verified
      }
    };
  };

  /* ── .VEXA GENERATOR ─────────────────────────────────────────────────── */
  /* account: {uid,username,email,dob,createdAt,lastLoginAt,status,vip,verified,
              mainCodeProtected,secCodeProtected}
     opts:    {secret?, seq?}  → returns {json, file, filename, meta}       */
  VV.create = async function(account, opts){
    opts = opts || {};
    var secret = VV.normalizeSecret(opts.secret || VV.genSecret());
    if (!VV.secretOk(secret)) throw new Error('Vault secret format invalid (8 blocks × 4 chars)');
    var salt   = rand(VV.SALT_BITS / 8);
    var nonce  = rand(VV.NONCE_BITS / 8);
    var backupId = 'vlt_' + b2b64u(rand(12)).replace(/[-_]/g,'A');
    var now = Date.now();

    var header = {
      vexa: VV.FORMAT_ID,                  // format identifier
      fmt: 1,                              // envelope format version
      vaultVersion: VV.VAULT_VER,          // vault version
      backupId: backupId,                  // backup ID
      createdAt: now,                      // backup creation timestamp
      updatedAt: now,                      // backup update timestamp
      alg: VV.ALG,                         // encryption algorithm
      kdf: VV.KDF + '-' + VV.ITERATIONS,   // key derivation
      keyVersion: VV.KEY_VERSION,          // encryption key version
      salt: b2b64u(salt),
      nonce: b2b64u(nonce),                // unique nonce
      accountFingerprint: await VV.fingerprint(account.uid, salt)
    };

    var payloadObj = VV.buildPayload(account); payloadObj.recovery.backupId = backupId;
    var pt = te(JSON.stringify(payloadObj));
    var derived = await VV.deriveKey(secret, salt);

    /* AES-256-GCM: AAD = canonical header (without payload/tag/integrity) */
    var ctFull = new Uint8Array(await crypto.subtle.encrypt(
      { name:'AES-GCM', iv:nonce, tagLength:VV.TAG_BITS,
        additionalData: te(canon(header)) },
      derived.aesKey, pt));
    var tag = ctFull.slice(ctFull.length - 16);   // authentication tag
    var ct  = ctFull.slice(0, ctFull.length - 16);

    header.tag = b2b64u(tag);
    header.payload = b2b64u(ct);
    /* HMAC over AAD-header‖ct‖tag — same formula as VV.read() */
    var integrity = b2hex(await crypto.subtle.sign(
      'HMAC', derived.macKey, concat(te(canon(aadHeader(header))), ct, tag)));
    header.integrity = integrity;

    var fname = 'CLIENT_' + pad3(opts.seq || 1) + '.vexa';
    header.filename = fname;

    return {
      json: header,                          // parsed .vexa envelope
      file: JSON.stringify(header, null, 2), // file content (pretty JSON)
      filename: fname,
      meta: {
        secret: secret,
        verifier: await VV.verifierOf(derived.rawHex),
        backupId: backupId,
        salt: b2b64u(salt),
        keyVersion: VV.KEY_VERSION,
        fileHash: await VV.sha256(JSON.stringify(header))
      }
    };
  };

  /* ── STRUCTURAL VALIDATOR (no key needed) ────────────────────────────── */
  VV.validateHeader = function(h){
    var err = [];
    if (!h || typeof h !== 'object') return ['Not a JSON object'];
    if (h.vexa !== VV.FORMAT_ID) err.push('Format identifier mismatch');
    if (h.fmt !== 1) err.push('Unsupported format version');
    if (!/^vlt_[A-Za-z0-9]{10,24}$/.test(String(h.backupId||''))) err.push('Backup ID invalid');
    if (!h.createdAt || !h.updatedAt) err.push('Timestamps missing');
    if (h.alg !== VV.ALG) err.push('Algorithm must be AES-256-GCM');
    if (String(h.kdf||'').indexOf('PBKDF2-HMAC-SHA256-250000') !== 0) err.push('KDF mismatch');
    if (!(h.keyVersion >= 1)) err.push('Key version invalid');
    try {
      if (b64u2b(h.salt).length !== 16) err.push('Salt must be 128-bit');
      if (b64u2b(h.nonce).length !== 12) err.push('Nonce must be 96-bit');
      if (b64u2b(h.tag).length !== 16) err.push('Auth tag must be 128-bit');
    } catch(e){ err.push('Base64url field malformed'); }
    if (!/^[a-f0-9]{32}$/.test(String(h.accountFingerprint||''))) err.push('Fingerprint invalid');
    if (!/^[a-f0-9]{64}$/.test(String(h.integrity||''))) err.push('Integrity signature invalid');
    try {
      var ct = b64u2b(h.payload);
      if (!ct.length || ct.length > VV.MAX_FILE) err.push('Payload size out of range');
    } catch(e){ err.push('Payload malformed'); }
    return err;
  };

  /* ── .VEXA READER + VERIFIER (needs the user secret) ─────────────────── */
  /*  returns { ok, header, payload, errors[] } — tamper → ok:false        */
  VV.read = async function(input, secret){
    var h;
    try {
      h = (typeof input === 'string') ? JSON.parse(input) : input;
    } catch(e){ return { ok:false, errors:['File is not valid JSON'] }; }
    var structErr = VV.validateHeader(h);
    if (structErr.length) return { ok:false, errors: structErr, header: h };

    secret = VV.normalizeSecret(secret);
    if (!VV.secretOk(secret)) return { ok:false, errors:['Vault secret format invalid'], header:h };

    var salt = b64u2b(h.salt), nonce = b64u2b(h.nonce),
        ct = b64u2b(h.payload), tag = b64u2b(h.tag);
    var derived = await VV.deriveKey(secret, salt);

    /* 1) integrity signature (HMAC over header‖ct‖tag) */
    var mac = b2hex(await crypto.subtle.sign('HMAC', derived.macKey,
                concat(te(canon(aadHeader(h))), ct, tag)));
    var ref = String(h.integrity);
    var macOk = mac.length === ref.length;
    if (macOk){ for (var i=0;i<mac.length;i++){ if(mac[i]!==ref[i]){macOk=false;break} } }
    if (!macOk) return { ok:false, errors:['Integrity signature FAILED — file was modified or wrong key'], header:h };

    /* 2) authenticated decryption (GCM tag check) */
    var pt;
    try {
      pt = await crypto.subtle.decrypt(
        { name:'AES-GCM', iv:nonce, tagLength:VV.TAG_BITS, additionalData: te(canon(aadHeader(h))) },
        derived.aesKey, concat(ct, tag));
    } catch(e){
      return { ok:false, errors:['Decryption FAILED — wrong vault secret or corrupted file'], header:h };
    }
    var payload;
    try { payload = JSON.parse(td(pt)); }
    catch(e){ return { ok:false, errors:['Payload not valid JSON'], header:h }; }

    /* 3) account fingerprint ↔ payload UID binding */
    var fp = await VV.fingerprint(payload.account && payload.account.uid, salt);
    if (fp !== h.accountFingerprint)
      return { ok:false, errors:['Account fingerprint mismatch — payload UID was altered'], header:h, payload:payload };

    return { ok:true, header:h, payload:payload, verifier: await VV.verifierOf(derived.rawHex) };
  };

  /* ── structural check without key (used before secret entry) ─────────── */
  VV.structuralCheck = function(input){
    try {
      var h = (typeof input === 'string') ? JSON.parse(input) : input;
      var err = VV.validateHeader(h);
      return { ok: err.length === 0, errors: err, header: h };
    } catch(e){ return { ok:false, errors:['Not valid JSON'] }; }
  };

  /* ── parse uploaded File/Blob → {ok, json, name, size} ───────────────── */
  VV.parseFile = async function(file){
    if (!file) return { ok:false, errors:['No file selected'] };
    if (file.size > VV.MAX_FILE) return { ok:false, errors:['File too large (max 96 KB) — not a .vexa vault'] };
    if (file.name && file.name.indexOf('.') > -1 && /\.vexa$/i.test(file.name) === false)
      return { ok:false, errors:['Extension must be .vexa'] };
    var text = await file.text();
    try {
      var j = JSON.parse(text);
      return { ok:true, json:j, name:file.name, size:file.size };
    } catch(e){ return { ok:false, errors:['File is not a valid .vexa vault (JSON expected)'] }; }
  };

  /* ── filename helper (spec example: CLIENT_001.vexa) ─────────────────── */
  VV.filename = function(seq){ return 'CLIENT_' + pad3(seq||1) + '.vexa'; };

  return VV;
});
