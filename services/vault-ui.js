/* ═══════════════════════════════════════════════════════════════════════════
   VEXA SECURE RECOVERY VAULT — USER UI MODULE v1.0
   (AnimeTubePro Studio × VEXA · spec §6 (3 modes), §7 (Help Center),
    §11 (migration preview), §14 (UI design language))
   ─────────────────────────────────────────────────────────────────────────
   DEPENDS (loaded after script.js): V, me, auth, db, Ver, VexaVault,
   VexaVaultDrive, VEXA_GOOGLE, CF infra.

   SURFACES:
     VaultUI.open()             → User Recovery Vault + Backup Manager
     VaultUI.createWizard()     → vault creation (secret shown ONCE)
     VaultUI.backupNow()        → manual/updated backup → Drive
     VaultUI.verifyBackup()     → Verify Backup (file or Drive copy)
     VaultUI.recoveryRequest()  → I Lost My Account (3 recovery modes)
     VaultUI.myRequests()       → Recovery Request Status
     VaultUI.helpSection()      → Help Center ▸ Account Recovery (7 items)

   SECURITY:
     • vault secret lives ONLY in the user's head/file; cached in
       sessionStorage for THIS TAB's auto-updates; never in RTDB.
     • RTDB writes here are metadata-only (no secret, no plaintext codes).
     • All admin/owner actions run through the vexaVault Cloud Function —
       client fallback creates flagged viaServer:false requests only.
     • A failed backup never blocks the app (all try/catch isolated).
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const VaultUI = {
  CF_URL:'https://us-central1-vexa-b3a1d.cloudfunctions.net/vexaVault',
  SEC_KEY:'vexaVaultSecretCache',           // sessionStorage — this tab only
  MODES:{
    full_migration:'📦 Full Account Migration — purane account ka saara eligible data naye account me transfer, phir purana account retire',
    selective_migration:'🧩 Selective Data Migration — sirf selected categories transfer, purana account waise ka waisa intact',
    restoration:'♻️ Old Account Restoration — naya temp account retire, PURANA UID wapas active (naya password set karoge)'
  },
  CATS:[
    ['profile','👤 Profile (name, bio, photo, dob-verified flag)'],
    ['posts','📝 Posts (images Supabase pe rehte hain — metadata move hoga)'],
    ['followers','👥 Followers'],
    ['following','➡️ Following'],
    ['chatHistory','💬 Chat history index (1:1 + groups membership)'],
    ['settings','⚙️ Settings (privacy, themes, preferences)']
  ],

  /* ═══════════ CLOUD FUNCTION CALLER ═══════════ */
  cfAvailable:null,
  cf:async function(action, data){
    var tok = await auth.currentUser.getIdToken(true);
    var r = await fetch(this.CF_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
      body:JSON.stringify(Object.assign({action:action, appVer:(typeof Ver!=='undefined'?Ver.get():'')}, data||{}))
    });
    var j = await r.json().catch(function(){ return {error:'Bad CF response'} });
    if (r.status === 404) { j.__missing = true; }
    return j;
  },

  /* ═══════════ STATE ═══════════ */
  vault:null,   /* recoveryVaults/{uid} snapshot */
  kmeta:null,   /* recoveryKeyMetadata/{uid} snapshot */
  bstatus:null, /* recoveryBackupStatus/{uid} snapshot */
  secret:function(){ try{ return sessionStorage.getItem(this.SEC_KEY)||'' }catch(e){ return '' } },
  setSecret:function(s){ try{ s?sessionStorage.setItem(this.SEC_KEY,s):sessionStorage.removeItem(this.SEC_KEY) }catch(e){} },

  loadState:async function(){
    if (!V.uid || !db) return false;
    try{
      var r = await db.ref('recoveryVaults/'+V.uid).get();
      this.vault = r.exists()? r.val() : null;
      var k = await db.ref('recoveryKeyMetadata/'+V.uid).get();
      this.kmeta = k.exists()? k.val() : null;
      var b = await db.ref('recoveryBackupStatus/'+V.uid).get();
      this.bstatus = b.exists()? b.val() : null;
      return !!this.vault;
    }catch(e){ console.warn('[VaultUI] state load', e.message); return !!this.vault; }
  },

  /* ═══════════ HELP CENTER ▸ ACCOUNT RECOVERY (spec §7) ═══════════ */
  helpSection:function(){
    var h = '';
    h+='<div class="vv-sect vv-glass">'
     +'<div class="vv-sect-h"><span class="vv-ic">🗄️</span><div><div class="vv-sect-t">Account Recovery — Secure Vault</div>'
     +'<div class="vv-sect-s">Encrypted .vexa backup + Google Drive + 3 recovery modes</div></div></div>'
     +'<div class="vv-grid">';
    var items = [
      ['lost',   '🗺️', 'I Lost My Account',     'Temp account banao → .vexa upload → recovery request', "VaultUI.recoveryRequest()"],
      ['hacked', '🚨', 'My Account Was Hacked', '.vexa backup upload karke turant recovery request bhejo', "VaultUI.recoveryRequest()"],
      ['upload', '📤', 'Upload .vexa Backup',   'Apni encrypted vault file verify karke submit karo',   "VaultUI.recoveryRequest()"],
      ['verify', '✅', 'Verify Backup',         'File integrity + decrypt test apne hi device pe',     "VaultUI.verifyBackup()"],
      ['own',    '🪪', 'Ownership Verification','UID + codes + DOB proof kaise kaam karta hai',        "VaultUI.ownershipInfo()"],
      ['status', '📋', 'Recovery Request Status','Meri requests aur unka live status',                  "VaultUI.myRequests()"],
      ['vault',  '🗄️', 'My Recovery Vault',     'Vault banao / backup / Drive binding',                "VaultUI.open()"],
      ['support','💬', 'Contact Support',       'Ticket ya staff chat — sensitive data mat bhejo',      "Support.ticketOpen()"]
    ];
    for (var i=0;i<items.length;i++){
      var it = items[i];
      h+='<div class="vv-tile" onclick="'+it[4]+'" role="button" tabindex="0">'
        +'<div class="vv-tile-ic">'+it[1]+'</div><div class="vv-tile-t">'+it[2]+'</div>'
        +'<div class="vv-tile-s">'+it[3]+'</div></div>';
    }
    h+='</div>'
     +'<div class="vv-warn">🔐 <b>Security rule:</b> Support chat me kabhi bhi apna <b>vault secret, password ya plaintext codes</b> mat bhejo. Sirf <b>.vexa file</b> upload hoti hai — uska content encrypted rehta hai.</div>'
     +'</div>';
    return h;
  },

  /* ═══════════ USER RECOVERY VAULT DASHBOARD (spec §14.1/3/8) ═══════════ */
  open:async function(){
    await this.loadState();
    var has = !!this.vault;
    var h = '';
    h+='<div class="vv-head"><div class="vv-badge">VEXA VAULT v1.0 · AES-256-GCM</div></div>';

    /* status card */
    h+='<div class="vv-card">'
     +'<div class="vv-row"><span>Status</span><b>'+(has?'🟢 Active vault':'🟡 Vault nahi bana')+'</b></div>'
     +(has
      ?'<div class="vv-row"><span>Backup ID</span><b class="mono" style="font-size:11px">'+V.esc(this.vault.backupId||'—')+'</b></div>'
       +'<div class="vv-row"><span>Key version</span><b>'+V.esc(String(this.vault.keyVersion||1))+'</b></div>'
       +'<div class="vv-row"><span>Last backup</span><b>'+(this.vault.lastBackupAt?V.timeAgo(this.vault.lastBackupAt)+' ago':'—')+'</b></div>'
       +'<div class="vv-row"><span>Integrity (last upload)</span><b>'+(this.bstatus&&this.bstatus.integrityVerified?'✅ verified':'—')+'</b></div>'
      :'<div class="vv-s">🔐 Ek encrypted mini-database jo aapke account ki recovery info rakhti hai. File aapke apne Google Drive me save hoti hai — VEXA ke paas aapka secret kabhi nahi jata.</div>')
     +'</div>';

    /* drive card */
    var drv = VexaVaultDrive.connected();
    h+='<div class="vv-card">'
     +'<div class="vv-row"><span>Google Drive</span><b>'+(drv?'🟢 Connected':'⚪ Not connected')+'</b></div>'
     +'<div class="vv-s">📁 File <b>app-private folder</b> (appDataFolder) me jati hai — aapke Drive UI me nahi dikhti, sirf VEXA API se access hoti hai. Scope: <b>drive.appdata</b> (minimum permission).</div>'
     +'<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'
     +(drv
      ?'<button class="btn bg bsm" onclick="VaultUI.driveTest()">🔄 Test backup</button>'
       +'<button class="btn bds2 bsm" onclick="VaultUI.driveDisconnect()">⛔ Disconnect</button>'
      :'<button class="btn bp bsm" onclick="VexaVaultDrive.connect()">🔗 Connect Google Drive</button>')
     +'</div></div>';

    /* actions */
    h+='<div class="vv-card"><div class="vv-grid2">';
    if (has){
      h+='<div class="vv-tile" onclick="VaultUI.backupNow()"><div class="vv-tile-ic">☁️</div><div class="vv-tile-t">Backup / Update now</div><div class="vv-tile-s">Naya .vexa version banake Drive pe save</div></div>'
        +'<div class="vv-tile" onclick="VaultUI.downloadBackup()"><div class="vv-tile-ic">⬇️</div><div class="vv-tile-t">Download .vexa</div><div class="vv-tile-s">Phone/Drive me safe rakho</div></div>'
        +'<div class="vv-tile" onclick="VaultUI.verifyBackup()"><div class="vv-tile-ic">✅</div><div class="vv-tile-t">Verify backup</div><div class="vv-tile-s">Integrity + decrypt test</div></div>'
        +'<div class="vv-tile" onclick="VaultUI.myRequests()"><div class="vv-tile-ic">📋</div><div class="vv-tile-t">Request status</div><div class="vv-tile-s">Meri recovery requests</div></div>';
    } else {
      h+='<div class="vv-tile vv-tile-hot" onclick="VaultUI.createWizard()"><div class="vv-tile-ic">🔐</div><div class="vv-tile-t">Create Recovery Vault</div><div class="vv-tile-s">3-step wizard — 2 minute</div></div>';
    }
    h+='</div></div>';

    h+='<div class="vv-warn">⚠️ <b>Vault secret</b> sirf ek baar dikhta hai (vault banate waqt). Use <b>bhoolna = backup decrypt nahi hoga</b>. File + secret — dono alag-alag safe rakho. .vexa file kabhi standalone login credential nahi hai.</div>';

    V.mOpen('🗄️ Secure Recovery Vault', h);
  },

  /* ═══════════ CREATE WIZARD (spec §3) ═══════════ */
  createWizard:async function(){
    var self = this;
    if (this.vault){ if(!confirm('Vault already exists — dobara banane se purani .vexa file invalid ho jayegi. Continue?'))return; }
    var a = (typeof me!=='undefined'&&me)?me:{};
    var h = '';
    h+='<div class="vv-step">STEP 1 / 3 — Account snapshot confirm karo</div>';
    h+='<div class="vv-card">'
     +'<div class="vv-row"><span>UID</span><b class="mono" style="font-size:10.5px">'+V.esc(V.uid||'')+'</b></div>'
     +'<div class="vv-row"><span>Username</span><b>@'+V.esc(a.username||'')+'</b></div>'
     +'<div class="vv-row"><span>Email</span><b>'+V.esc(a.email||'')+'</b></div>'
     +'<div class="vv-row"><span>DOB (verification ref)</span><b>'+V.esc(a.dob||'—')+'</b></div>'
     +'<div class="vv-s">📦 Payload me sirf <b>safe metadata</b> jata hai — password, OTP, tokens, sessions, plaintext codes KABHI nahi (spec §4).</div>'
     +'</div>';
    h+='<button class="btn bp bbk" onclick="VaultUI._createStep2()">🔐 Vault Generate karo →</button>';
    V.mOpen('🔐 Create Recovery Vault', h);
  },
  _createStep2:async function(){
    var a = (typeof me!=='undefined'&&me)?me:{};
    var bstatus = this.bstatus||{};
    var acct = {
      uid:V.uid, username:a.username||'', email:a.email||'', dob:a.dob||'',
      createdAt:a.createdAt||Date.now(), lastLoginAt:Date.now(),
      status:'active', vip:!!a.vip, verified:!!a.verified,
      mainCodeProtected:true, secCodeProtected:true
    };
    this._gen = await VexaVault.create(acct, {seq:(bstatus.versions||0)+1});
    var m = this._gen.meta;
    var h = '';
    h+='<div class="vv-step">STEP 2 / 3 — Vault SECRET (sirf EK baar dikhega!)</div>';
    h+='<div class="vv-secret mono" id="vvSecret">'+V.esc(m.secret)+'</div>';
    h+='<div style="display:flex;gap:8px;margin-top:10px">'
     +'<button class="btn bg bsm" style="flex:1" onclick="V.copy(document.getElementById(\'vvSecret\').textContent,\'Secret copied\')">📋 Copy secret</button></div>';
    h+='<label class="vv-chk"><input type="checkbox" id="vvConfirmSecret" onchange="VaultUI._toggleStep3(this)"> ✅ Maine secret password manager / paper pe safe kar liya</label>';
    h+='<div id="vvStep3Btn"></div>';
    h+='<div class="vv-warn">🚨 Ye secret + .vexa file — <b>dono</b> chahiye recovery ke liye. Secret VEXA server pe kabhi nahi jata. Kisi ko mat dikhao.</div>';
    V.mOpen('🔐 Vault Secret — SAVE IT NOW', h);
  },
  _toggleStep3:function(cb){
    var w = V.g('vvStep3Btn');
    if (!w) return;
    w.innerHTML = cb.checked
      ? '<button class="btn bp bbk" style="margin-top:10px" onclick="VaultUI._createStep3()">⬇️ .vexa file download + register →</button>'
      : '';
  },
  _createStep3:async function(){
    var self = this;
    if (!this._gen) return;
    var m = this._gen.meta, json = this._gen.json;
    /* 1) register metadata (CF preferred → fallback direct own-write) */
    var reg = { backupId:m.backupId, keyVersion:m.keyVersion, salt:m.salt,
                verifier:m.verifier, fileHash:m.fileHash,
                accountFingerprint:json.accountFingerprint, createdAt:Date.now() };
    var viaServer = false;
    try{
      var j = await this.cf('vaultRegister', reg);
      if (j && j.ok) viaServer = true;
      else if (j && j.error) console.warn('[vaultRegister]', j.error);
    }catch(e){ console.warn('CF unavailable → direct write', e.message) }
    try{
      var up = {};
      up['recoveryVaults/'+V.uid] = {
        backupId:m.backupId, keyVersion:m.keyVersion,
        accountFingerprint:json.accountFingerprint,
        createdAt:Date.now(), updatedAt:Date.now(),
        lastBackupAt:0, driveBound:VexaVaultDrive.connected(),
        vaultVersion:'1.0', status:'active', viaServer:viaServer
      };
      up['recoveryKeyMetadata/'+V.uid] = {
        keyVersion:m.keyVersion, kdf:json.kdf, salt:m.salt,
        verifier:m.verifier, createdAt:Date.now(), viaServer:viaServer
      };
      up['recoveryBackupStatus/'+V.uid] = {
        backupId:m.backupId, fileHash:m.fileHash,
        uploadedAt:0, driveFileId:'', versions:1, integrityVerified:false
      };
      await db.ref().update(up);
    }catch(e){ V.toast('error','Register fail: '+(e.message||e)); return }

    /* 2) download file */
    this._downloadFile(this._gen.filename, this._gen.file);
    /* 3) cache secret for this session (auto-updates) + state refresh */
    this.setSecret(m.secret);
    try{ await db.ref('users/'+V.uid+'/securityEvents').push({type:'vault_created',backupId:m.backupId,at:Date.now(),device:V.dev()}) }catch(e){}
    await this.loadState();

    var h = '<div class="vv-step">STEP 3 / 3 — Done ✅</div>'
     +'<div class="vv-card"><div class="vv-row"><span>File</span><b class="mono">'+V.esc(this._gen.filename)+'</b></div>'
     +'<div class="vv-row"><span>Backup ID</span><b class="mono" style="font-size:10px">'+V.esc(m.backupId)+'</b></div></div>'
     +'<div class="vv-s">💾 File download ho gayi. Ab <b>Google Drive connect</b> karke encrypted copy wahan bhi save karo (recommended).</div>'
     +'<button class="btn bp bbk" onclick="VaultUI._postCreateDrive()">🔗 Connect Drive + Backup karo</button>'
     +'<button class="btn bg bbk" style="margin-top:8px" onclick="V.mClose()">Baad me</button>';
    V.mOpen('✅ Vault Created', h);
    V.toast('success','🔐 Recovery Vault created!');
  },
  _postCreateDrive:async function(){
    VexaVaultDrive.connect(); /* redirect flow returns to app; user taps Backup after */
  },

  /* ═══════════ BACKUP (manual + updated, spec §5.4/5.8) ═══════════ */
  backupNow:async function(){
    try{
      if (!this.vault) return V.toast('warning','Pehle vault banao');
      var secret = this.secret();
      if (!secret){
        secret = prompt('Vault secret daalo (8-block code — vault banate waqt mila tha):')||'';
        secret = VexaVault.normalizeSecret(secret);
        if (!VexaVault.secretOk(secret)) return V.toast('error','Secret format galat hai');
      }
      V.toast('info','🔐 Encrypting…');
      var a = (typeof me!=='undefined'&&me)?me:{};
      var acct = { uid:V.uid, username:a.username||'', email:a.email||'', dob:a.dob||'',
        createdAt:a.createdAt||this.vault.createdAt||0, lastLoginAt:Date.now(),
        status:'active', vip:!!a.vip, verified:!!a.verified,
        mainCodeProtected:true, secCodeProtected:true };
      var seq = ((this.bstatus&&this.bstatus.versions)||0)+1;
      var gen = await VexaVault.create(acct, {secret:secret, seq:seq});
      this.setSecret(secret);
      var fileHash = await VexaVault.sha256(JSON.stringify(gen.json));

      var driveRes = { ok:false, fileId:'', integrityVerified:false };
      if (VexaVaultDrive.connected()){
        try{
          var r = await VexaVaultDrive.backupEnvelope(gen.filename, gen.file, fileHash);
          driveRes = { ok:true, fileId:r.fileId, integrityVerified:r.integrityVerified };
          if (!r.integrityVerified) V.toast('warning','Upload ok, but remote integrity check skipped');
        }catch(e){
          V.toast('warning','Drive backup fail — local file ready hai ('+e.message+')');
        }
      } else {
        V.toast('info','Drive connected nahi — file download karke khud save karo');
      }

      var up = {};
      up['recoveryVaults/'+V.uid+'/updatedAt'] = Date.now();
      up['recoveryVaults/'+V.uid+'/lastBackupAt'] = Date.now();
      up['recoveryVaults/'+V.uid+'/driveBound'] = VexaVaultDrive.connected();
      up['recoveryBackupStatus/'+V.uid] = {
        backupId:gen.meta.backupId, fileHash:fileHash,
        uploadedAt:Date.now(), driveFileId:driveRes.fileId||'',
        versions:seq, integrityVerified:!!driveRes.integrityVerified
      };
      await db.ref().update(up);
      this._downloadFile(gen.filename, gen.file);
      await this.loadState();
      try{ await db.ref('users/'+V.uid+'/securityEvents').push({type:'vault_backup',seq:seq,at:Date.now(),device:V.dev()}) }catch(e){}
      V.mClose();
      V.toast('success','☁️ Backup v'+seq+' ready — integrity '+(driveRes.integrityVerified?'verified ✅':'local only'));
    }catch(e){ V.toast('error','Backup fail: '+(e.message||e)) }
  },

  downloadBackup:async function(){
    if (!this.vault) return V.toast('warning','Vault nahi hai');
    if (VexaVaultDrive.connected()){
      try{
        var f = await VexaVaultDrive.fetchLatest(this._lastName());
        if (f){ this._downloadFile(f.name, f.text); V.toast('success','Drive se latest backup downloaded'); return }
      }catch(e){ console.warn('drive fetch', e.message) }
    }
    return this.backupNow(); /* regenerate + download */
  },

  _lastName:function(){
    var seq = (this.bstatus&&this.bstatus.versions)||1;
    return VexaVault.filename(seq);
  },

  _downloadFile:function(name, text){
    var blob = new Blob([text], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(function(){ try{document.body.removeChild(a);URL.revokeObjectURL(url)}catch(e){} },200);
  },

  /* ═══════════ VERIFY BACKUP (spec §7) ═══════════ */
  verifyBackup:async function(){
    var h = '<div class="vv-step">File pehle structural check, phir optional decrypt-test</div>'
     +'<div class="fld"><label class="flbl">.vexa file choose karo (ya Drive se fetch hoga)</label>'
     +'<input type="file" id="vvVFile" accept=".vexa,application/json" class="inp"></div>'
     +'<div class="fld"><label class="flbl">Vault secret (optional — full integrity test ke liye)</label>'
     +'<input class="inp mono" id="vvVSecret" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off"></div>'
     +'<button class="btn bp bbk" onclick="VaultUI._verifyGo()">🔍 Verify karo</button>'
     +'<div id="vvVRes" style="margin-top:10px"></div>';
    V.mOpen('✅ Verify Backup', h);
  },
  _verifyGo:async function(){
    var out = V.g('vvVRes');
    out.innerHTML = '<div class="spn"></div>';
    try{
      var fin = V.g('vvVFile').files[0];
      var parsed, json, fname='';
      if (fin){
        var p = await VexaVault.parseFile(fin);
        if (!p.ok) { out.innerHTML='<div class="vv-fail">❌ '+p.errors.map(V.esc).join('<br>')+'</div>'; return }
        json = p.json; fname = p.name;
      } else if (VexaVaultDrive.connected()){
        var f = await VexaVaultDrive.fetchLatest(this._lastName());
        if (!f){ out.innerHTML='<div class="vv-fail">❌ Drive pe koi backup nahi mila</div>'; return }
        json = f.json; fname = f.name;
      } else { out.innerHTML='<div class="vv-fail">❌ File select karo ya Drive connect karo</div>'; return }

      var st = VexaVault.structuralCheck(json);
      var h = '<div class="vv-ok">📄 <b>'+V.esc(fname)+'</b> — structure '+(st.ok?'✅ VALID':'❌ INVALID')+'</div>';
      if (!st.ok) h += '<div class="vv-fail">'+st.errors.map(V.esc).join('<br>')+'</div>';
      else {
        h += '<div class="vv-row"><span>Backup ID</span><b class="mono" style="font-size:10px">'+V.esc(st.header.backupId)+'</b></div>'
           + '<div class="vv-row"><span>Created</span><b>'+new Date(st.header.createdAt).toLocaleString()+'</b></div>'
           + '<div class="vv-row"><span>Key version</span><b>'+V.esc(String(st.header.keyVersion))+'</b></div>';
        var sec = VexaVault.normalizeSecret(V.g('vvVSecret').value);
        if (sec){
          var full = await VexaVault.read(json, sec);
          if (full.ok){
            h += '<div class="vv-ok">🔓 Decrypt + HMAC integrity + fingerprint — <b>SAB PASS ✅</b></div>'
               + '<div class="vv-row"><span>Account</span><b>@'+V.esc(full.payload.account.username)+'</b></div>'
               + '<div class="vv-row"><span>Status</span><b>'+V.esc(full.payload.accountInfo.status)+'</b></div>';
            this.setSecret(sec);
          } else {
            h += '<div class="vv-fail">❌ '+(full.errors||[]).map(V.esc).join('<br>')+'</div>';
          }
        } else {
          h += '<div class="vv-s">ℹ️ Secret nahi diya — sirf structural check hua (tampering header se detect ho jata hai).</div>';
        }
      }
      out.innerHTML = h;
    }catch(e){ out.innerHTML = '<div class="vv-fail">❌ '+(e.message||e)+'</div>' }
  },

  /* ═══════════ OWNERSHIP VERIFICATION INFO (spec §7) ═══════════ */
  ownershipInfo:function(){
    V.mOpen('🪪 Ownership Verification — kaise kaam karta hai',
     '<div class="vv-card"><div class="vv-s" style="text-align:left">'
     +'Recovery ke waqt VEXA <b>4 independent proofs</b> maangta hai:<br><br>'
     +'1️⃣ <b>.vexa file</b> — valid + tamper-free (HMAC + AES-GCM tag)<br>'
     +'2️⃣ <b>Vault secret</b> — file decrypt hoti hai (sirf owner hi jaanta)<br>'
     +'3️⃣ <b>Main + Secondary Remember Codes</b> — server-side hash match<br>'
     +'4️⃣ <b>Email + DOB</b> — account banate waqt ke values<br><br>'
     +'⚠️ Ek valid backup file <b>supporting evidence</b> hai, ownership ka <b>proof nahi</b> (spec §10). Stolen file + stolen codes ke bina bhi admin evidence maang sakta hai, aur final hamesha <b>Owner</b> authorize karta hai.</div></div>',
     '<button class="btn bp" onclick="V.mClose()">Samajh gaya</button>');
  },

  /* ═══════════ RECOVERY REQUEST — I LOST MY ACCOUNT (spec §6) ═══════════ */
  reqMode:'full_migration',
  reqFile:null,   /* parsed .vexa json */
  reqCats:{},
  recoveryRequest:async function(){
    var self = this;
    this.reqFile = null; this.reqMode='full_migration';
    this.reqCats = {}; this.CATS.forEach(function(c){ self.reqCats[c[0]] = true });
    var h = '';
    h+='<div class="vv-step">1 — Recovery mode choose karo</div>';
    h+='<div class="fld">';
    for (var k in this.MODES){
      h+='<label class="vv-radio"><input type="radio" name="vvMode" value="'+k+'" '+(k==='full_migration'?'checked':'')+' onchange="VaultUI._modeChanged(this.value)"> '+V.esc(this.MODES[k])+'</label>';
    }
    h+='</div>';
    h+='<div id="vvCats" style="display:none">'
     +'<div class="vv-step">2 — Categories select karo (selective migration)</div>'
     +'<div class="vv-card">';
    this.CATS.forEach(function(c){
      h+='<label class="vv-chk"><input type="checkbox" checked onchange="VaultUI.reqCats[\''+c[0]+'\']=this.checked"> '+V.esc(c[1])+'</label>';
    });
    h+='<div class="vv-s">⚠️ Unselected categories transfer NAHI hongi. Destination data kabhi bhi silently overwrite nahi hota (spec §6 Option 2).</div></div></div>';
    h+='<div class="vv-step" id="vvStepN">2 — Original account details + evidence</div>';
    h+='<div class="fld"><label class="flbl">Original username</label><input class="inp" id="rqUser" placeholder="@purana_username" maxlength="20"></div>'
     +'<div class="fld"><label class="flbl">Original account email</label><input class="inp" id="rqEmail" type="email" placeholder="purana@email.com"></div>'
     +'<div class="fld"><label class="flbl">Recovery reason</label><textarea class="txta" id="rqReason" maxlength="300" placeholder="Kya hua tha? Kab? Account kaise kho gaya?"></textarea></div>'
     +'<div class="fld"><label class="flbl">Main Remember Code (purana)</label><input class="inp mono" id="rqMain" placeholder="XXXX-XXXX-XXXX-XXXX" style="text-transform:uppercase"></div>'
     +'<div class="fld"><label class="flbl">Secondary Remember Code (purana)</label><input class="inp mono" id="rqSec" placeholder="XXXX-XXXX-XXXX" style="text-transform:uppercase"></div>'
     +'<div class="fld"><label class="flbl">.vexa backup file</label><input type="file" id="rqFile" accept=".vexa,application/json" class="inp"></div>'
     +'<div class="fld"><label class="flbl">Vault secret (file decrypt ke liye)</label><input class="inp mono" id="rqSecret" placeholder="8-block secret" autocomplete="off"></div>'
     +'<div id="rqPrev"></div>'
     +'<button class="btn bp bbk" onclick="VaultUI._reqPreview()">🔍 Verify + Migration Preview</button>'
     +'<button class="btn bp bbk" id="rqGo" style="display:none;margin-top:8px" onclick="VaultUI._reqSubmit()">📨 Recovery Request Submit karo</button>'
     +'<div class="vv-s" style="margin-top:8px">🔒 Submit par file + secret <b>sirf server-side verification</b> ke liye jate hain — store nahi hote. Support messages me sensitive data kabhi nahi jata (spec §7).</div>';
    V.mOpen('🗺️ I Lost My Account — Recovery Request', h);
  },
  _modeChanged:function(v){
    this.reqMode = v;
    var c = V.g('vvCats'); if (c) c.style.display = (v==='selective_migration')?'block':'none';
    var n = V.g('vvStepN'); if (n) n.textContent = (v==='selective_migration'?'3':'2')+' — Original account details + evidence';
  },
  _reqPreview:async function(){
    var out = V.g('rqPrev'); if (!out) return;
    try{
      var fin = V.g('rqFile').files[0];
      if (!fin) return V.toast('warning','Pehle .vexa file select karo');
      var p = await VexaVault.parseFile(fin);
      if (!p.ok){ out.innerHTML='<div class="vv-fail">❌ '+p.errors.map(V.esc).join('<br>')+'</div>'; this.reqFile=null; return }
      var sec = VexaVault.normalizeSecret(V.g('rqSecret').value);
      if (!VexaVault.secretOk(sec)){ out.innerHTML='<div class="vv-fail">❌ Vault secret 8-block format me daalo</div>'; this.reqFile=null; return }
      var full = await VexaVault.read(p.json, sec);
      if (!full.ok){ out.innerHTML='<div class="vv-fail">❌ '+(full.errors||[]).map(V.esc).join('<br>')+'</div>'; this.reqFile=null; return }
      this.reqFile = full;
      /* live migration preview from ORIGINAL account (public profile data) */
      var origUid = full.payload.account.uid;
      var counts = {posts:'?',followers:'?',following:'?',chats:'?'};
      try{
        var u = await db.ref('users/'+origUid).get();
        if (u.exists()){
          var uv = u.val()||{};
          counts.posts = uv.postCount||0;
          counts.followers = uv.followers?Object.keys(uv.followers).length:0;
          counts.following = uv.following?Object.keys(uv.following).length:0;
          counts.chats = uv.chats?Object.keys(uv.chats).length:0;
        } else counts.gone = true;
      }catch(e){}
      var h = '<div class="vv-ok">🔓 File verified — decrypt + integrity PASS ✅</div>';
      h += '<div class="vv-row"><span>Original UID</span><b class="mono" style="font-size:10px">'+V.esc(origUid)+'</b></div>';
      h += '<div class="vv-row"><span>Account status in file</span><b>'+V.esc(full.payload.accountInfo.status)+'</b></div>';
      h += counts.gone ? '<div class="vv-fail">⚠️ Ye original account users/ me abhi exist nahi karta (deleted?) — restoration mode hi chalega, migration ke liye owner decision lagega.</div>' : '';
      if (this.reqMode!=='restoration' && !counts.gone){
        h += '<div class="vv-card" style="margin-top:8px"><div class="vv-step">Migration Preview</div>'
          +'<div class="vv-row"><span>📝 Posts</span><b>'+counts.posts+'</b></div>'
          +'<div class="vv-row"><span>👥 Followers</span><b>'+counts.followers+'</b></div>'
          +'<div class="vv-row"><span>➡️ Following</span><b>'+counts.following+'</b></div>'
          +'<div class="vv-row"><span>💬 Chat index</span><b>'+counts.chats+'</b></div>'
          +(this.reqMode==='full_migration'?'<div class="vv-s">Mode: FULL — sab eligible data jayega, phir purana account retire.</div>':'<div class="vv-s">Mode: SELECTIVE — sirf ticked categories jayengi, purana account intact rahega.</div>')
          +'</div>';
      }
      h += '<div class="vv-s">✅ Sab sahi hai? Neeche submit dabao. Admin review → Owner approval ke baad hi kuch bhi hoga.</div>';
      out.innerHTML = h;
      V.g('rqGo').style.display='block';
    }catch(e){ out.innerHTML='<div class="vv-fail">❌ '+(e.message||e)+'</div>' }
  },
  _reqSubmit:async function(){
    if (!this.reqFile) return V.toast('warning','Pehle verify karo');
    var u=(V.g('rqUser').value||'').trim().replace(/^@/,''),
        em=(V.g('rqEmail').value||'').trim().toLowerCase(),
        rs=(V.g('rqReason').value||'').trim(),
        main=(V.g('rqMain').value||'').trim().toUpperCase(),
        sec=(V.g('rqSec').value||'').trim().toUpperCase(),
        secret=VexaVault.normalizeSecret(V.g('rqSecret').value);
    if (!u) return V.toast('warning','Original username daalo');
    if (!V.email(em)) return V.toast('warning','Valid original email daalo');
    if (rs.length<10) return V.toast('warning','Reason thoda detail me likho (10+ chars)');
    if (!main || !sec) return V.toast('warning','Dono Remember Codes daalo');
    var btn = V.g('rqGo'); btn.disabled=true; btn.textContent='⏳ Submitting…';
    try{
      var fileText = JSON.stringify(this.reqFile.header);
      var cats = null;
      if (this.reqMode==='selective_migration'){
        cats = {}; this.CATS.forEach(function(c){ if (VaultUI.reqCats[c[0]]) cats[c[0]]=true });
        if (!Object.keys(cats).length) throw new Error('Kam se kam 1 category select karo');
      }
      var j = await this.cf('recoveryRequestCreate', {
        mode:this.reqMode, cats:cats,
        origUsername:u, origEmail:em, reason:rs,
        mainCode:main, secCode:sec,
        backupFile:fileText, vaultSecret:secret
      });
      if (j && j.ok){
        V.mClose();
        V.mOpen('📨 Request Submitted',
          '<div class="vv-ok">Recovery request <b class="mono">'+V.esc(j.reqId)+'</b> staff ke paas hai!</div>'
          +'<div class="vv-s" style="text-align:left">1️⃣ Admin file integrity + ownership verify karega<br>2️⃣ Owner approval request receive karega<br>3️⃣ Approval ke baad migration/restoration chal jayegi<br>4️⃣ Status: <b>Settings ▸ Recovery Vault ▸ Request status</b></div>',
          '<button class="btn bp" onclick="V.mClose()">OK</button>');
        try{ V.toast('success','📨 Recovery request submitted!') }catch(e){}
        return;
      }
      /* CF missing → flagged fallback (staff ko manually verify karna padega) */
      if (j && (j.__missing || j.error === 'CF_MISSING')){
        var reqId = 'req_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
        await db.ref('recoveryRequests/'+reqId).set({
          tempUid:V.uid, tempUsername:(me&&me.username)||'',
          mode:this.reqMode, cats:cats||null,
          origUid:this.reqFile.payload.account.uid,
          origFingerprint:this.reqFile.header.accountFingerprint,
          backupId:this.reqFile.header.backupId,
          origUsername:u, origEmail:em, reason:rs.slice(0,300),
          integrityStatus:'client_verified', viaServer:false,
          ownershipStatus:'pending', status:'pending',
          requestedAt:Date.now(), updatedAt:Date.now()
        });
        V.mClose();
        V.toast('success','Request saved (offline mode — admin manually verify karega)');
        return;
      }
      throw new Error(j && j.error ? j.error : 'Submit fail');
    }catch(e){
      if (btn){ btn.disabled=false; btn.textContent='📨 Recovery Request Submit karo' }
      V.toast('error', e.message||'Submit fail', 5000);
    }
  },

  /* ═══════════ REQUEST STATUS (spec §7) ═══════════ */
  myRequests:async function(){
    var h = '<div id="vvReqL"><div class="spn"></div></div>';
    V.mOpen('📋 Recovery Request Status', h);
    try{
      var s = await db.ref('recoveryRequests').orderByChild('tempUid').equalTo(V.uid).get();
      var box = V.g('vvReqL'); if (!box) return;
      if (!s.exists()){ box.innerHTML='<div class="empo"><div class="ei">📭</div><div class="et">Koi request nahi</div></div>'; return }
      var rows = [];
      s.forEach(function(x){ rows.push(x.val()) });
      rows.sort(function(a,b){ return (b.requestedAt||0)-(a.requestedAt||0) });
      var stMap = {pending:'🟡 Pending',verifying:'🔍 Under verification',admin_recommended:'✅ Admin recommended',owner_pending:'👑 Owner approval pending',approved:'🟢 Approved',in_progress:'⚙️ Migration in progress',completed:'🏁 Completed',rejected:'❌ Rejected',expired:'⏰ Expired'};
      var h2 = '';
      rows.forEach(function(r){
        h2 += '<div class="vv-card">'
          +'<div class="vv-row"><span>Request</span><b class="mono" style="font-size:10px">'+V.esc(r.reqId||'')+'</b></div>'
          +'<div class="vv-row"><span>Mode</span><b>'+V.esc(VaultUI.MODES[r.mode]||r.mode||'—').split('—')[0]+'</b></div>'
          +'<div class="vv-row"><span>Status</span><b>'+(stMap[r.status]||V.esc(r.status||'—'))+'</b></div>'
          +(r.rejectReason?'<div class="vv-fail">Reason: '+V.esc(r.rejectReason)+'</div>':'')
          +'<div class="vv-row"><span>Requested</span><b>'+V.timeAgo(r.requestedAt)+' ago</b></div>'
          +'</div>';
      });
      box.innerHTML = h2;
    }catch(e){
      var b2 = V.g('vvReqL');
      if (b2) b2.innerHTML = '<div class="vv-fail">❌ '+(e.message||'Load fail — rules/index check karo')+'</div>';
    }
  },

  /* ═══════════ DRIVE HELPERS ═══════════ */
  /* popup connect hone par VexaVaultDrive._notify() ise call karta hai */
  onConnected:function(){
    try{ if (document.querySelector('.vv-head')) this.open() }catch(e){}   /* vault modal khula hai → refresh */
  },
  driveTest:async function(){
    V.toast('info','Testing Drive backup…');
    try{ await this.backupNow() }catch(e){ V.toast('error',e.message||'Test fail') }
  },
  driveDisconnect:async function(){
    if (!confirm('Google Drive disconnect karein? (Files Drive me rehti hain, app ka access chala jayega)'))return;
    await VexaVaultDrive.disconnect();
    try{ await db.ref('recoveryVaults/'+V.uid+'/driveBound').set(false) }catch(e){}
    V.mClose(); V.toast('info','⛔ Drive disconnected');
  },

  /* ═══════════ BOOT (OAuth return + auto-update check) ═══════════ */
  boot:async function(){
    try{
      var _or = VexaVaultDrive.handleOAuthReturn();
      if (_or === true) V.toast('success','🔗 Google Drive connected — ab Backup dabao');
      /* _or === 'error' → error toast handleOAuthReturn() me already dik chuka */
    }catch(e){}
    /* auto-update: stale backup > 7 days + secret cached → silent refresh */
    try{
      if (!V.uid || !db || !this.secret()) return;
      var has = await this.loadState();
      if (!has || !VexaVaultDrive.connected()) return;
      var stale = !this.vault.lastBackupAt || (Date.now()-this.vault.lastBackupAt > 7*86400000);
      if (stale){ console.info('[VaultUI] auto-backup (stale >7d)'); this.backupNow(); }
    }catch(e){}
  }
};
window.VaultUI = VaultUI;
