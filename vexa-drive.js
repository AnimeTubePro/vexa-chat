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

  /* ── OAuth implicit flow (redirect) ──────────────────────────────────── */
  connect:function(){
    var back = location.hash || '';
    try{ sessionStorage.setItem('vexaVaultDriveBack', back) }catch(e){}
    var url = 'https://accounts.google.com/o/oauth2/v2/auth'
      + '?client_id='      + encodeURIComponent((typeof VEXA_GOOGLE!=='undefined' && VEXA_GOOGLE.clientId) || '')
      + '&redirect_uri='   + encodeURIComponent(location.origin + location.pathname)
      + '&response_type=token'
      + '&scope='          + encodeURIComponent(this.SCOPE)
      + '&include_granted_scopes=true'
      + '&prompt=consent select_account';
    location.href = url;
  },
  /* returns true when the current URL is an OAuth return for the vault */
  handleOAuthReturn:function(){
    var h = location.hash || '';
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
