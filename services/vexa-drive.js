/* ═══════════════════════════════════════════════════════════════════════════
   VEXA SECURE RECOVERY VAULT — GOOGLE DRIVE BACKUP MODULE v1.0
   (AnimeTubePro Studio × VEXA · spec §5 + §13)
   ─────────────────────────────────────────────────────────────────────────
   • OAuth 2.0 implicit flow (same proven pattern as VexaDrive video module)
     → access token ONLY, short-lived, sessionStorage — a refresh token is
       NEVER requested, NEVER stored, NEVER touches frontend JS (spec 5.12).
   • Least-privilege scope: drive.appdata → files live in the Google-managed
     APPLICATION-PRIVATE folder (appDataFolder): invisible in the user's
     Drive UI, readable only by this app through the API (spec §5.3, §13).
   • Operations: bind / disconnect / upload / update / version list /
     download / integrity verify / auto-prune (keep 5 versions).
   • A failed backup NEVER blocks login or profile updates (spec §5) —
     every public method catches its own errors; callers decide.
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── Google OAuth client (vexa-d project) ─────────────────────────────
   Ye constant pehle script.js me tha (VexaDrive video module) — vault
   drive module bhi isi proven client ko use karta hai. FIX: ab yahan
   define hota hai, warna client_id empty jata tha → Google Error 400
   (invalid_request: Required parameter client_id missing).          ── */
window.VEXA_GOOGLE = window.VEXA_GOOGLE || {
  projectId : 'vexa-d',
  clientId  : '504252409437-219ln0ti9fttnqfoiroc8gc4jmp152ud.apps.googleusercontent.com',
  driveScope: 'https://www.googleapis.com/auth/drive.appdata'
};

const VexaVaultDrive = {
  TOKKEY     : 'vexaVaultDriveTok',
  FOLDER_HDR : 'appDataFolder',                              // app-private
  SCOPE      : 'https://www.googleapis.com/auth/drive.appdata',
  API        : 'https://www.googleapis.com/drive/v3',
  UPLOAD     : 'https://www.googleapis.com/upload/drive/v3/files',
  KEEP_VERSIONS: 5,

  /* ── token state (session-only; no refresh token in this flow) ── */
  token:function(){ try{ return sessionStorage.getItem(this.TOKKEY)||'' }catch(e){ return '' } },
  setToken:function(t){ try{ sessionStorage.setItem(this.TOKKEY,t) }catch(e){} },
  clearToken:function(){ try{ sessionStorage.removeItem(this.TOKKEY) }catch(e){} },
  connected:function(){ return !!this.token() },

  /* ── OAuth implicit flow — POPUP preferred (Google Identity Services),
       redirect fallback (CDN blocked ho to purana proven flow) ─────────── */
  connect:function(){
    /* FIX (HTTP 400): client_id guard — bina ID Google hamesha
       "Error 400: invalid_request" deta hai. Clear message + no redirect. */
    var cid = (typeof VEXA_GOOGLE!=='undefined' && VEXA_GOOGLE && VEXA_GOOGLE.clientId) || '';
    if (!cid){
      var m1='⚠️ Google Client ID missing — Drive connect nahi ho sakta.';
      try{ V.toast('error',m1,6000) }catch(e){ alert(m1) }
      return;
    }
    /* FIX (HTTP 400): file:// pe Google OAuth kabhi kaam nahi karta. */
    if (location.protocol==='file:'){
      var m2='⚠️ Drive connect ke liye site ko http/https par kholo (file:// nahi).';
      try{ V.toast('error',m2,6000) }catch(e){ alert(m2) }
      return;
    }
    var self=this;
    /* ⚡POPUP: chhota "Connect to Google" popup — page kahin NAHI jata,
       pura-page signup/consent redirect flow hat gaya. */
    try{
      if (window.google && google.accounts && google.accounts.oauth2){ self._popup(cid); return; }
      var s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client'; s.async=true;
      s.onload=function(){ try{ self._popup(cid) }catch(e){ self._redirect(cid) } };
      s.onerror=function(){ self._redirect(cid) };  /* GIS load fail → redirect fallback */
      document.head.appendChild(s);
    }catch(e){ self._redirect(cid) }
  },
  /* popup token client — access token seedha callback me, koi navigation nahi */
  _popup:function(cid){
    var self=this;
    var tc=google.accounts.oauth2.initTokenClient({
      client_id : cid,
      scope     : this.SCOPE,
      callback  : function(resp){
        if (resp && resp.access_token){
          self.setToken(resp.access_token);
          try{ V.toast('success','🔗 Google Drive connected') }catch(e){}
          self._notify();
        }else{
          var er=(resp&&resp.error)||'unknown';
          try{ V.toast('error','⚠️ Drive connect fail: '+er,6000) }catch(e){}
        }
      },
      error_callback:function(err){
        var t=(err&&err.type)||'';
        var m={ access_denied:'Aapne permission nahi di — dobara try karo',
                popup_closed:'Popup band ho gaya — dobara try karo',
                popup_failed_to_open:'Popup nahi khula — popup blocker check karo',
                tokenizer_failed:'Google popup fail hua — dobara try karo' };
        try{ V.toast('error','⚠️ '+(m[t]||'Connect fail — dobara try karo'),6000) }catch(e){}
      }
    });
    tc.requestAccessToken();
  },
  /* UI refresh notify — Settings screen / open Vault modal turant update */
  _notify:function(){
    try{
      var sp=document.getElementById('sc-profile');
      if (window.Settings && typeof Settings.open==='function' && sp && sp.classList.contains('act')) Settings.open();
    }catch(e){}
    try{
      if (window.VaultUI && typeof VaultUI.onConnected==='function') VaultUI.onConnected();
    }catch(e){}
  },
  /* redirect fallback — purana proven flow (page Google pe jata hai aur wapas) */
  _redirect:function(cid){
    var back = location.hash || '';
    try{ sessionStorage.setItem('vexaVaultDriveBack', back) }catch(e){}
    /* FIX (HTTP 400 redirect_uri_mismatch): Google Console me registered
       redirect URI exact match hona chahiye (e.g. https://site/vexa-chat/).
       Agar page index.html ke saath khula to pathname se hatao.        */
    var ruri = location.origin + location.pathname.replace(/\/index\.html?$/i,'/');
    var url = 'https://accounts.google.com/o/oauth2/v2/auth'
      + '?client_id='      + encodeURIComponent(cid)
      + '&redirect_uri='   + encodeURIComponent(ruri)
      + '&response_type=token'
      + '&scope='          + encodeURIComponent(this.SCOPE)
      + '&include_granted_scopes=true'
      + '&prompt='         + encodeURIComponent('consent select_account');
    location.href = url;
  },
  /* returns true (token) | 'error' (Google error) | false (not a vault return) */
  handleOAuthReturn:function(){
    var h = location.hash || '';
    /* FIX: Google error return (access_denied / redirect_uri_mismatch ...)
       pehle hash URL me atka rehta tha — ab friendly toast + cleanup.  */
    var em = h.match(/[#&]error=([^&]+)/);
    if (em && sessionStorage.getItem('vexaVaultDriveBack') !== null){
      try{ history.replaceState(null,'',location.pathname+location.search) }catch(e){}
      try{ sessionStorage.removeItem('vexaVaultDriveBack') }catch(e){}
      var eraw = decodeURIComponent(em[1]||'');
      var emap = {
        access_denied         : 'Aapne Drive permission nahi di — dobara try karo',
        admin_policy_enforced : 'Aapke Google Workspace admin ne is app ko block kiya hai',
        invalid_request       : 'Google request invalid bata raha hai — reload karke try karo',
        redirect_uri_mismatch : 'Site URL Google Cloud Console ke Authorized redirect URIs me add karo',
        invalid_scope         : 'Drive scope available nahi — Console me Drive API enable karo'
      };
      var msg = emap[eraw] || ('Google Drive error: ' + eraw);
      try{ V.toast('error','⚠️ '+msg,7000) }catch(e){ console.warn('[VexaVaultDrive]',msg) }
      return 'error';
    }
    if (h.indexOf('access_token=') === -1 || (sessionStorage.getItem('vexaVaultDriveBack') === null && !/state=vault/.test(h)))
      return false; /* main app VexaDrive also uses hash tokens — only claim when a vault backup was pending */
    var m = h.match(/access_token=([^&]+)/);
    if (m){
      this.setToken(m[1]);
      try{ history.replaceState(null,'',location.pathname+location.search+(sessionStorage.getItem('vexaVaultDriveBack')||'')) }catch(e){}
      try{ sessionStorage.removeItem('vexaVaultDriveBack') }catch(e){}
      return true;
    }
    return false;
  },
  disconnect:async function(){
    var tok = this.token();
    this.clearToken();
    if (tok){
      try{ await fetch('https://accounts.google.com/o/oauth2/revoke?token='+encodeURIComponent(tok)) }catch(e){}
    }
    return true;
  },

  /* ── low-level request wrapper (401 → clear token, ask reconnect) ───── */
  _req:async function(url, opts){
    var tok = this.token();
    if (!tok) throw new Error('DRIVE_NOT_CONNECTED');
    opts = opts || {};
    opts.headers = Object.assign({'Authorization':'Bearer '+tok}, opts.headers||{});
    var r = await fetch(url, opts);
    if (r.status === 401 || r.status === 403){
      this.clearToken();
      throw new Error('DRIVE_SESSION_EXPIRED');
    }
    return r;
  },

  /* ── find existing vault file in appDataFolder (by exact name) ──────── */
  findFile:async function(name){
    var q = encodeURIComponent("name = '"+String(name).replace(/'/g,"\\'")+"' and trashed = false");
    var r = await this._req(this.API+'/files?spaces='+this.FOLDER_HDR+'&q='+q+'&fields=files(id,name,size,modifiedTime,md5Checksum)&orderBy=modifiedTime desc&pageSize=10');
    if (!r.ok) throw new Error('Drive list fail (HTTP '+r.status+')');
    var j = await r.json();
    return (j.files && j.files[0]) || null;
  },
  listVersions:async function(name){
    var q = encodeURIComponent("name = '"+String(name).replace(/'/g,"\\'")+"' and trashed = false");
    var r = await this._req(this.API+'/files?spaces='+this.FOLDER_HDR+'&q='+q+'&fields=files(id,name,size,modifiedTime,md5Checksum)&orderBy=modifiedTime desc&pageSize=25');
    if (!r.ok) throw new Error('Drive list fail (HTTP '+r.status+')');
    return (await r.json()).files || [];
  },

  /* ── upload (new) or update (existing) — multipart, simple media ────── */
  saveFile:async function(name, textContent){
    var meta = { name:name, parents:[this.FOLDER_HDR], mimeType:'application/json' };
    var existing = null;
    try{ existing = await this.findFile(name) }catch(e){}
    var url, method;
    if (existing){
      method = 'PATCH';
      url = this.UPLOAD+'/'+existing.id+'?uploadType=multipart&fields=id,name,modifiedTime';
    } else {
      method = 'POST';
      url = this.UPLOAD+'?uploadType=multipart&fields=id,name,modifiedTime';
    }
    var boundary = 'vexavault' + Math.random().toString(36).slice(2);
    var body = '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
      + JSON.stringify(meta)
      + '\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'
      + textContent
      + '\r\n--'+boundary+'--';
    var r = await this._req(url, { method:method, headers:{'Content-Type':'multipart/related; boundary='+boundary}, body:body });
    if (!r.ok) throw new Error('Drive save fail (HTTP '+r.status+')');
    return await r.json();
  },

  /* ── download → text ────────────────────────────────────────────────── */
  downloadFile:async function(fileId){
    var r = await this._req(this.API+'/files/'+encodeURIComponent(fileId)+'?alt=media');
    if (!r.ok) throw new Error('Drive download fail (HTTP '+r.status+')');
    return await r.text();
  },

  /* ── integrity verify: sha256(local) === sha256(remote text) ────────── */
  verifyRemote:async function(fileId, expectedFileHash){
    var text = await this.downloadFile(fileId);
    var hash = (window.VexaVault) ? await VexaVault.sha256(JSON.parse(text)) : null;
    if (!hash) return { ok:false, note:'hash-unavailable' };
    return { ok: hash === expectedFileHash, hash:hash, json:JSON.parse(text) };
  },

  /* ── keep only newest N versions ────────────────────────────────────── */
  pruneVersions:async function(name){
    try{
      var files = await this.listVersions(name);
      for (var i = this.KEEP_VERSIONS; i < files.length; i++){
        await this._req(this.API+'/files/'+files[i].id, { method:'DELETE' }).catch(function(){});
      }
      return files.length;
    }catch(e){ return -1 }
  },

  /* ── HIGH-LEVEL: backup a .vexa envelope (never throws to caller) ───── */
  backupEnvelope:async function(filename, fileText, expectedHash){
    if (!this.connected()) throw new Error('DRIVE_NOT_CONNECTED');
    var saved = await this.saveFile(filename, fileText);
    var versions = -1;
    try{ versions = await this.pruneVersions(filename) }catch(e){}
    var integ = { ok:null };
    try{ integ = await this.verifyRemote(saved.id, expectedHash) }catch(e){}
    return {
      ok:true, fileId:saved.id, name:saved.name,
      modifiedTime:saved.modifiedTime||null,
      versions:versions,
      integrityVerified: integ.ok === true,
      remoteHash: integ.hash||null
    };
  },

  /* ── HIGH-LEVEL: download latest backup for restore/verify ──────────── */
  fetchLatest:async function(filename){
    var f = await this.findFile(filename);
    if (!f) return null;
    var text = await this.downloadFile(f.id);
    return { fileId:f.id, name:f.name, modifiedTime:f.modifiedTime, text:text, json:JSON.parse(text) };
  }
};
window.VexaVaultDrive = VexaVaultDrive;
