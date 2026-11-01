/* ═══════════════════════════════════════════════════════════════════════════
   VEXA SECURE RECOVERY VAULT — STAFF PANEL MODULE v1.0
   (AnimeTubePro Studio × VEXA · spec §8 Admin Panel, §9 Main Owner Panel)
   ─────────────────────────────────────────────────────────────────────────
   Shared module for admin.html · moderator.html · owner.html.
   Auto-detects which panel global exists (Admin / Mod / Owner) and wires
   the new VAULT RECOVERY workflow into it via runtime overrides.

   SECURITY MODEL (spec §8/§9/§10 — staff NEVER see credentials):
     • Staff panels read ONLY encrypted-vault METADATA
       (recoveryVaults · recoveryKeyMetadata · recoveryBackupStatus).
     • recoveryPrivate (legacy plaintext) is NEVER read here — node is
       locked in rules; legacy scrub happens via CF purgeVault only.
     • Ownership evidence = .vexa file (server-verified) + Remember Codes
       (server-hash verified) + email/DOB. Staff sees VERDICTS, not secrets.
     • Approvals: Admin = pre-verify + approve trusted; Owner = FINAL
       approve with 2FA (Firebase reauthenticate — password re-entry).
     • Every action appends an IMMUTABLE audit log (recoveryAuditLogs —
       rules allow create-only; edit/delete denied).
     • Migration runs ONLY through the vexaVault Cloud Function
       (server-side engine with checkpoints in recoveryJobs).

   STATUS FLOW:
     pending → verifying → admin_recommended → owner_pending → approved
           → in_progress → completed | rejected | expired
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const PanelVault = {
  CF_URL: 'https://us-central1-vexa-b3a1d.cloudfunctions.net/vexaVault',
  ROLE: null,        /* 'moderator' | 'admin' | 'owner' — set in init() */
  PANEL: null,       /* panel global object */
  STATE: { reqs:{}, vaults:{}, jobs:{}, approvals:{} },

  /* ── status maps ──────────────────────────────────────────────────── */
  ST:{
    pending:        ['🟡 Pending review','var(--wns);color:#ffd27d'],
    verifying:      ['🔍 Under verification','var(--wns);color:#ffd27d'],
    admin_recommended:['✅ Admin recommended','var(--oks);color:#7dffa0'],
    owner_pending:  ['👑 Owner approval pending','var(--acs);color:#ff8a80'],
    approved:       ['🟢 Approved — ready to migrate','var(--oks);color:#7dffa0'],
    in_progress:    ['⚙️ Migration in progress','var(--wns);color:#ffd27d'],
    completed:      ['🏁 Completed','var(--oks);color:#7dffa0'],
    rejected:       ['❌ Rejected','var(--dns);color:#ff8a80'],
    expired:        ['⏰ Expired','var(--bd);color:var(--tx2)'],
    cancelled:      ['⛔ Cancelled','var(--dns);color:#ff8a80']
  },
  MODES:{
    full_migration:'📦 FULL Migration',
    selective_migration:'🧩 SELECTIVE Migration',
    restoration:'♻️ Old Account Restoration'
  },

  /* ── tiny helpers (panel-agnostic) ────────────────────────────────── */
  esc:function(s){ var d=document.createElement('div'); d.textContent=String(s==null?'':s); return d.innerHTML },
  ago:function(ts){ if(!ts)return '—'; var s=Math.floor((Date.now()-ts)/1000);
    if(s<60)return 'now'; if(s<3600)return Math.floor(s/60)+'m';
    if(s<86400)return Math.floor(s/3600)+'h'; return new Date(ts).toLocaleDateString() },
  badge:function(st){ var m=this.ST[st]||[this.esc(st||'—'),'var(--wns);color:#ffd27d'];
    return '<span class="badge" style="background:'+m[1]+'">'+m[0]+'</span>' },
  toast:function(msg,ok){ if (typeof t==='function') t(msg, ok!==false); else console.log('[PanelVault]',msg) },

  /* ── CF caller (graceful when not deployed) ───────────────────────── */
  cf:async function(action,data){
    var tok = await auth.currentUser.getIdToken(true);
    var r = await fetch(this.CF_URL,{ method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
      body:JSON.stringify(Object.assign({action:action},data||{})) });
    var j = await r.json().catch(function(){ return {error:'Bad CF response'} });
    if (r.status===404) j.__missing = true;
    return j;
  },

  /* ═══════════ AUDIT LOG (immutable — create-only per rules) ════════ */
  audit:async function(action,targetType,targetId,detail){
    try{
      await db.ref('recoveryAuditLogs').push({
        at:Date.now(), actor:myUid||'', actorRole:this.ROLE||'staff',
        action:action, targetType:targetType||'', targetId:targetId||'',
        detail:String(detail||'').slice(0,300)
      });
    }catch(e){ console.warn('[audit]',e.message) }
  },

  /* ═══════════ OWNER 2FA — Firebase reauthentication ════════════════ */
  twofa:async function(){
    if (this.ROLE!=='owner') return true;               /* 2FA sirf owner ke final decisions pe */
    var em = auth.currentUser.email || '';
    var pw = prompt('🔐 2FA — apna OWNER password dobara daalo:\n('+this.esc(em)+')');
    if (pw===null) return false;
    if (!pw){ this.toast('2FA cancel — password khali',false); return false }
    try{
      var cred = firebase.auth.EmailAuthProvider.credential(em,pw);
      await auth.currentUser.reauthenticateWithCredential(cred);
      await this.audit('twofa_verified','auth',myUid,'Owner re-authenticated for recovery decision');
      return true;
    }catch(e){ this.toast('❌ 2FA FAIL — galat password',false); 
      await this.audit('twofa_failed','auth',myUid,'Failed re-authentication attempt');
      return false }
  },

  /* ═══════════ DATA LOADERS ═════════════════════════════════════════ */
  loadAll:async function(){
    var S = this.STATE;
    S.reqs={}; S.vaults={}; S.jobs={}; S.approvals={};
    try{
      var rq = await db.ref('recoveryRequests').get();
      if (rq.exists()) rq.forEach(function(x){
        /* flat NEW requests carry tempUid; nested LEGACY {uid}/{reqId} don't */
        var v = x.val();
        if (v && typeof v === 'object' && v.tempUid){
          S.reqs[x.key] = v;
        } else if (v && typeof v === 'object'){
          x.forEach(function(c){
            var cv = c.val() || {};
            if (cv && typeof cv === 'object' && cv.status)
              S.reqs[x.key + '/' + c.key] = Object.assign({}, cv, {_legacy:true, legacyUid:x.key});
          });
        }
      });
      var vv = await db.ref('recoveryVaults').get();
      if (vv.exists()) vv.forEach(function(x){ S.vaults[x.key]=x.val()||{} });
      var jb = await db.ref('recoveryJobs').get();
      if (jb.exists()) jb.forEach(function(x){ S.jobs[x.key]=x.val()||{} });
      var ap = await db.ref('recoveryApprovals').get();
      if (ap.exists()) ap.forEach(function(x){ S.approvals[x.key]=x.val()||{} });
    }catch(e){ console.warn('[PanelVault] load', e.message) }
  },

  /* cross-check evidence against vault metadata (spec §8.3) */
  verifyEvidence:async function(reqId){
    var r = this.STATE.reqs[reqId]; if (!r) return null;
    var out = { checks:[], score:0, total:4 };
    var push=function(name,ok,note){ out.checks.push({name:name,ok:ok,note:note||''}); if(ok)out.score++ };
    /* 1) .vexa integrity verdict */
    var iv = r.integrityStatus==='server_verified' || r.integrityStatus==='client_verified';
    push('.vexa file integrity', !!iv, r.integrityStatus||'not_verified');
    /* 2) backupId ↔ registered vault match */
    var v = this.STATE.vaults[r.origUid];
    var idOk = !!(v && v.backupId && v.backupId===r.backupId);
    push('Backup ID ↔ vault registry', idOk, v?('registered '+v.backupId.slice(0,12)+'…'):'no vault registered');
    /* 3) fingerprint match */
    var fpOk = !!(v && r.origFingerprint && v.accountFingerprint===r.origFingerprint);
    push('Account fingerprint', fpOk, fpOk?'match':'mismatch/missing');
    /* 4) server-verified codes/email (CF) */
    push('Remember codes + email/DOB', r.ownershipStatus==='server_verified'||r.ownershipStatus==='verified',
      r.ownershipStatus||'pending');
    return out;
  },

  /* ═══════════ MAIN TAB RENDER (all panels) ═════════════════════════ */
  tab:async function(){
    var c = document.getElementById('tabContent');
    if (!c) return;
    c.innerHTML = '<div class="empt"><div class="ei">⏳</div>Loading vault recovery…</div>';
    await this.loadAll();
    var S = this.STATE, h='';
    var pending=0, jobs=0;
    Object.keys(S.reqs).forEach(function(k){ var s=(S.reqs[k]||{}).status; if(s==='pending'||s==='verifying'||s==='owner_pending')pending++ });
    Object.keys(S.jobs).forEach(function(k){ var s=(S.jobs[k]||{}).status; if(s==='queued'||s==='in_progress')jobs++ });

    /* counters on tab pills */
    var pill=document.getElementById('recCount'); if(pill) pill.textContent = pending?('('+pending+')'):'';

    h += '<div class="snote" style="margin-bottom:12px">🛡️ <b>SECURE RECOVERY VAULT v1.0</b> — encrypted .vexa backups. '
      +'Staff kabhi credentials nahi dekhta: sirf verdicts. Flow: '
      +'<b>User request → Admin verify → Owner 2FA approve → Migration engine</b></div>';

    h += '<div class="stats" style="margin-bottom:14px">'
      +'<div class="stat"><div class="sv">'+pending+'</div><div class="sl">PENDING</div></div>'
      +'<div class="stat"><div class="sv">'+Object.keys(S.reqs).length+'</div><div class="sl">REQUESTS</div></div>'
      +'<div class="stat"><div class="sv">'+Object.keys(S.vaults).length+'</div><div class="sl">VAULTS</div></div>'
      +'<div class="stat"><div class="sv">'+jobs+'</div><div class="sl">ACTIVE JOBS</div></div>'
      +'</div>';

    /* request cards */
    var ids = Object.keys(S.reqs).sort(function(a,b){
      return (S.reqs[b].requestedAt||S.reqs[b].createdAt||0)-(S.reqs[a].requestedAt||S.reqs[a].createdAt||0) });
    if (!ids.length){
      h += '<div class="empt"><div class="ei">🛡️</div>Koi recovery request nahi</div>';
    }
    var openCount = 0;
    for (var i=0;i<ids.length;i++){
      var id=ids[i], r=S.reqs[id];
      var st = r.status||'pending';
      if (st==='completed'||st==='rejected'||st==='expired'||st==='cancelled'){ if(openCount>=0 && ids.length>8) continue; }
      openCount++;
      h += this.reqCard(id,r);
    }

    /* active migration jobs */
    var jobIds = Object.keys(S.jobs).filter(function(k){ var s=S.jobs[k].status; return s!=='completed'&&s!=='failed'&&s!=='cancelled' });
    if (jobIds.length){
      h += '<div class="card" style="border-color:var(--ac)"><div class="cname mb8">⚙️ MIGRATION JOBS</div>';
      for (var j=0;j<jobIds.length;j++) h += this.jobCard(jobIds[j], S.jobs[jobIds[j]]);
      h += '</div>';
    }
    c.innerHTML = h;
  },

  reqCard:function(id,r){
    var S=this.STATE;
    var tempU = r.tempUsername||r.tempName||'?';
    var h = '<div class="card">'
      +'<div class="crow"><div style="font-size:20px">'+(r._legacy?'🧾':'🛡️')+'</div>'
      +'<div class="cinfo"><div class="cname">'+(r._legacy?'LEGACY (old system — read only)':'Recovery Request')
      +' '+this.badge(r.status)
      +(r.viaServer?'<span class="badge" style="background:var(--oks);color:#7dffa0">SERVER-VERIFIED</span>'
                   :'<span class="badge" style="background:var(--wns);color:#ffd27d">CLIENT-CLAIM</span>')+'</div>'
      +'<div class="cmeta">'+this.esc(this.MODES[r.mode]||r.mode||'—')
      +' · Old: <b>@'+this.esc(r.origUsername||'?')+'</b> → Temp: <b>@'+this.esc(tempU)+'</b>'
      +' · '+(r._legacy?this.ago(r.createdAt):this.ago(r.requestedAt))+'</div>'
      +'<div class="cmeta mono" style="font-size:10px">req '+this.esc(id)+' · origUID '+this.esc(String(r.origUid||r.legacyUid||'').slice(0,14))+'… · backup '+this.esc(String(r.backupId||'—').slice(0,14))+'…</div>'
      +(r.reason?'<div class="rep-reason">📝 '+this.esc(r.reason)+'</div>':'')
      +'</div></div>';

    if (r._legacy){
      h += '<div class="snote">🧾 Purane auto-login system ki request — naya system isko process nahi karta. User se bolo Help Center ▸ Secure Recovery Vault use kare.</div></div>';
      return h;
    }

    /* verification checklist (admin+ see it) */
    var self=this;
    var ev = this._evCache && this._evCache[id];
    var evH = '';
    if (ev){
      evH += '<div class="card" style="margin:8px 0;background:var(--bg3)"><div class="sm" style="font-weight:700;margin-bottom:6px">🔍 OWNERSHIP EVIDENCE — '+ev.score+'/'+ev.total+'</div>';
      ev.checks.forEach(function(ch){
        evH += '<div class="sm">'+(ch.ok?'✅':'❌')+' '+self.esc(ch.name)+(ch.note?' <span class="mut">('+self.esc(ch.note)+')</span>':'')+'</div>';
      });
      evH += '</div>';
    }

    h += '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">';
    var st = r.status||'pending';
    /* verification buttons — moderator: escalate only; admin: verify+recommend; owner: everything */
    if (this.ROLE!=='owner' && (st==='pending'||st==='verifying')){
      h += '<button class="btn bg bsm" onclick="PanelVault.doVerify(\''+id+'\')">🔍 Verify Evidence</button>';
      h += '<button class="btn bwn bsm" onclick="PanelVault.doEscalate(\''+id+'\')">👑 Escalate to Owner</button>';
    }
    if (this.ROLE==='admin' && (st==='pending'||st==='verifying')){
      h += '<button class="btn bok bsm" onclick="PanelVault.doRecommend(\''+id+'\')">✅ Recommend (trusted)</button>';
      h += '<button class="btn bdn bsm" onclick="PanelVault.doReject(\''+id+'\')">✕ Reject</button>';
    }
    if (this.ROLE==='owner'){
      if (st==='pending'||st==='verifying'||st==='admin_recommended'||st==='owner_pending'){
        h += '<button class="btn bg bsm" onclick="PanelVault.doVerify(\''+id+'\')">🔍 Verify</button>';
        h += '<button class="btn bok bsm" onclick="PanelVault.doApprove(\''+id+'\')">🔐 Approve (2FA)</button>';
        h += '<button class="btn bdn bsm" onclick="PanelVault.doReject(\''+id+'\')">✕ Reject</button>';
      }
      if (st==='approved'){
        h += '<button class="btn bp bsm" onclick="PanelVault.startMigration(\''+id+'\')">⚙️ Run Migration</button>';
      }
    }
    h += '<button class="btn bg bsm" onclick="PanelVault.reqDetail(\''+id+'\')">📄 Details</button>';
    h += '</div>';
    if (r.adminNote) h += '<div class="snote">🗒️ Staff note: '+this.esc(r.adminNote)+'</div>';
    if (r.rejectReason) h += '<div class="snote" style="color:#ff8a80">❌ Reject reason: '+this.esc(r.rejectReason)+'</div>';
    h += '</div>';
    return h;
  },

  jobCard:function(id,j){
    var pct = 0;
    var steps = j.steps||['profile','posts','social','chats','settings','verify'];
    var done = j.checkpointIndex||0;
    pct = steps.length? Math.round(done/steps.length*100):0;
    return '<div class="card" style="background:var(--bg3);margin:8px 0">'
      +'<div class="sm"><b>'+this.esc(this.MODES[j.mode]||j.mode||'—')+'</b> — '+this.badge(j.status)
      +' · '+this.esc(j.oldUsername||'')+' → '+this.esc(j.newUsername||'')+'</div>'
      +'<div style="background:var(--bd);border-radius:99px;height:8px;margin:8px 0"><div style="background:var(--gr);height:8px;border-radius:99px;width:'+pct+'%"></div></div>'
      +'<div class="sm mut">checkpoint: '+this.esc(j.checkpoint||'—')+' ('+done+'/'+steps.length+') · updated '+this.ago(j.updatedAt)+'</div>'
      +(this.ROLE==='owner'&&j.status!=='completed'
        ?'<div style="display:flex;gap:6px;margin-top:8px"><button class="btn bp bsm" onclick="PanelVault.resumeJob(\''+id+'\')">▶️ Resume/Retry</button>'
         +'<button class="btn bdn bsm" onclick="PanelVault.cancelJob(\''+id+'\')">⛔ Cancel</button></div>':'')
      +'</div>';
  },

  /* ═══════════ ACTIONS ══════════════════════════════════════════════ */
  doVerify:async function(id){
    var ev = await this.verifyEvidence(id);
    this._evCache = this._evCache||{}; this._evCache[id]=ev;
    try{
      await db.ref('recoveryRequests/'+id+'/status').set('verifying');
      await db.ref('recoveryRequests/'+id+'/verifiedBy').set(this.ROLE+':'+(myUid||''));
      await db.ref('recoveryRequests/'+id+'/updatedAt').set(Date.now());
    }catch(e){ this.toast('Rules update fail: '+e.message,false) }
    await this.audit('evidence_verified','recoveryRequest',id,'score '+ev.score+'/'+ev.total);
    this.toast('Evidence check: '+ev.score+'/'+ev.total+(ev.score>=3?' ✅ strong':' ⚠️ weak'));
    this.tab();
  },
  doEscalate:async function(id){
    try{
      await db.ref('recoveryRequests/'+id).update({status:'owner_pending',updatedAt:Date.now(),
        escalatedBy:this.ROLE+':'+(myUid||'')});
    }catch(e){ return this.toast('Fail: '+e.message,false) }
    await this.audit('escalated_to_owner','recoveryRequest',id,this.ROLE+' escalated');
    this.toast('👑 Owner approval queue me bhej diya');
    this.tab();
  },
  doRecommend:async function(id){
    try{
      await db.ref('recoveryRequests/'+id).update({status:'admin_recommended',ownershipStatus:'verified',updatedAt:Date.now()});
      await db.ref('recoveryApprovals/'+id).set({reqId:id, type:'admin_recommendation',
        approverUid:myUid||'', approverRole:'admin', at:Date.now(), viaFallback:!this.cfOk()});
    }catch(e){ return this.toast('Fail: '+e.message,false) }
    await this.audit('admin_recommended','recoveryRequest',id,'trusted request');
    /* notify owner users */
    try{
      var us = await db.ref('users').get();
      us.forEach(function(u){ var v=u.val()||{};
        if (v.role==='owner') db.ref('users/'+u.key+'/notifications').push({
          type:'security', title:'👑 Recovery Approval Pending',
          body:'Admin ne ek recovery request recommend ki hai — Owner Panel me 2FA approve karo.',
          read:false, at:Date.now() });
      });
    }catch(e){}
    this.toast('✅ Recommended — Owner ko notify kar diya');
    this.tab();
  },
  doReject:async function(id){
    var why = prompt('Reject reason (user ko dikhega):','Evidence insufficient');
    if (why===null) return;
    if (!(await this.twofa())) return;
    try{
      await db.ref('recoveryRequests/'+id).update({status:'rejected',rejectReason:why.slice(0,200),updatedAt:Date.now(),
        decidedBy:this.ROLE+':'+(myUid||'')});
      var r=this.STATE.reqs[id];
      if (r && r.tempUid) await db.ref('users/'+r.tempUid+'/notifications').push({
        type:'security',title:'❌ Recovery Request Rejected',
        body:'Reason: '+why.slice(0,150)+' — Help Center se dobara try karo.',read:false,at:Date.now()});
    }catch(e){ return this.toast('Fail: '+e.message,false) }
    await this.audit('request_rejected','recoveryRequest',id,why);
    this.toast('Request rejected');
    this.tab();
  },

  /* OWNER final approve — 2FA + CF preferred */
  doApprove:async function(id){
    if (this.ROLE!=='owner') return this.toast('❌ Final approval sirf OWNER karta hai',false);
    if (!(await this.twofa())) return;
    var r = this.STATE.reqs[id];
    var ev = await this.verifyEvidence(id);
    if (ev.score < 2 && !confirm('⚠️ Evidence weak ('+ev.score+'/'+ev.total+') — phir bhi approve?')) return;
    var viaServer=false, jobId='';
    try{
      var j = await this.cf('recoveryDecision',{reqId:id, decision:'approved', note:'owner 2FA approved'});
      if (j && j.ok){ viaServer=true; jobId=j.jobId||'' }
      else if (j && j.error && !j.__missing) throw new Error(j.error);
    }catch(e){
      if (!String(e.message).match(/Failed to fetch|NetworkError|Bad CF|404/))
        return this.toast('CF fail: '+e.message,false);
    }
    try{
      var up = {};
      up['recoveryRequests/'+id+'/status'] = 'approved';
      up['recoveryRequests/'+id+'/updatedAt'] = Date.now();
      up['recoveryRequests/'+id+'/decidedBy'] = 'owner:'+(myUid||'');
      up['recoveryRequests/'+id+'/viaServer'] = viaServer;
      up['recoveryApprovals/'+id] = { reqId:id, type:'final_approval', decision:'approved',
        approverUid:myUid||'', approverRole:'owner', method:'reauthenticate',
        at:Date.now(), viaServer:viaServer, jobId:jobId||'' };
      if (!viaServer && jobId==='') jobId = 'job_'+Date.now().toString(36);
      up['recoveryJobs/'+jobId] = { reqId:id, oldUid:r.origUid||'', newUid:r.tempUid||'',
        oldUsername:r.origUsername||'', newUsername:r.tempUsername||'',
        mode:r.mode||'full_migration', cats:r.cats||null,
        status: viaServer?'queued':'approved_local', checkpoint:'queued', checkpointIndex:0,
        createdAt:Date.now(), updatedAt:Date.now(), viaServer:viaServer };
      await db.ref().update(up);
      if (r && r.tempUid) await db.ref('users/'+r.tempUid+'/notifications').push({
        type:'security',title:'✅ Recovery Approved!',
        body:'Owner ne approve kiya. Migration start hoga — status Settings ▸ Recovery Vault me dekho.',
        read:false,at:Date.now()});
    }catch(e){ return this.toast('Local update fail: '+e.message,false) }
    await this.audit('request_approved','recoveryRequest',id,'2FA OK · viaServer='+viaServer+' job='+jobId);
    await this.audit('approval_granted','recoveryApproval',id,'final owner approval');
    this.toast('🔐 APPROVED (2FA) — migration job '+(viaServer?'queued on server':'local (CF deploy karo)'));
    this.tab();
  },

  /* migration engine trigger (CF-only; local fallback flags the job) */
  startMigration:async function(id){
    var r = this.STATE.reqs[id];
    if (!(await this.twofa())) return;
    var jobId='';
    Object.keys(this.STATE.jobs).forEach(function(k){ if (PanelVault.STATE.jobs[k].reqId===id) jobId=k });
    try{
      var j = await this.cf('migrationRun',{reqId:id, jobId:jobId||undefined});
      if (j && j.ok){
        await this.audit('migration_started','recoveryJob',j.jobId||jobId,'status '+j.status);
        this.toast('⚙️ Migration '+(j.status||'running')+' — '+this.esc(j.note||''));
        return this.tab();
      }
      if (j && j.__missing) this.toast('⚠️ Cloud Function deploy nahi hai — job approved_local marked hai. functions deploy karo.',false);
      else if (j && j.error) throw new Error(j.error);
    }catch(e){ this.toast('Migration trigger fail: '+e.message,false) }
    try{ if (jobId) await db.ref('recoveryJobs/'+jobId+'/status').set('queued_server_pending') }catch(e){}
    this.tab();
  },
  resumeJob:async function(jobId){ this.startMigration(this.STATE.jobs[jobId].reqId) },
  cancelJob:async function(jobId){
    if (!(await this.twofa())) return;
    try{ await db.ref('recoveryJobs/'+jobId+'/status').set('cancelled') }catch(e){ return this.toast('Fail',false) }
    await this.audit('job_cancelled','recoveryJob',jobId,'owner cancelled');
    this.toast('Job cancelled'); this.tab();
  },

  /* details modal */
  reqDetail:async function(id){
    var r = this.STATE.reqs[id]; if(!r) return;
    var v = this.STATE.vaults[r.origUid]||null;
    var h = '<div class="card"><div class="cname mb8">📄 Request '+this.esc(id)+'</div>'
      +'<div class="cmeta" style="line-height:2">'
      +'Mode: <b>'+this.esc(this.MODES[r.mode]||r.mode||'—')+'</b><br>'
      +'Old account: <b class="mono">'+this.esc(r.origUid||'—')+'</b> (@'+this.esc(r.origUsername||'?')+')<br>'
      +'Temp account: <b class="mono">'+this.esc(r.tempUid||'—')+'</b> (@'+this.esc(r.tempUsername||'?')+')<br>'
      +'Original email: '+this.esc(r.origEmail||'—')+'<br>'
      +'Backup ID: <span class="mono">'+this.esc(r.backupId||'—')+'</span><br>'
      +'Fingerprint: <span class="mono" style="font-size:10px">'+this.esc(r.origFingerprint||'—')+'</span><br>'
      +'Integrity: <b>'+this.esc(r.integrityStatus||'—')+'</b> · Ownership: <b>'+this.esc(r.ownershipStatus||'—')+'</b><br>'
      +(r.cats?('Categories: '+this.esc(Object.keys(r.cats).join(', '))+'<br>'):'')
      +'Requested: '+this.ago(r.requestedAt||r.createdAt)+'</div></div>'
      +(v?'<div class="card"><div class="cname mb8">🗄️ Registered Vault (encrypted metadata — NO secrets)</div>'
        +'<div class="cmeta" style="line-height:2">Backup ID: <span class="mono">'+this.esc(v.backupId||'—')+'</span><br>'
        +'Key version: '+this.esc(String(v.keyVersion||1))+' · Status: '+this.esc(v.status||'—')+'<br>'
        +'Drive bound: '+(v.driveBound?'✅':'❌')+' · Last backup: '+this.ago(v.lastBackupAt)+'<br>'
        +'Vault created: '+this.ago(v.createdAt)+'</div></div>'
        :'<div class="snote">⚠️ Original account ka koi registered vault nahi mila — .vexa file hi primary evidence hai.</div>');
    if (typeof Admin!=='undefined' && Admin.modal) return Admin.modal('📄 Recovery Details',h);
    if (typeof Mod!=='undefined' && Mod.modal) return Mod.modal('📄 Recovery Details',h);
    if (typeof Owner!=='undefined' && Owner.modal) return Owner.modal('📄 Recovery Details',h);
  },

  /* ═══════════ VAULT OVERVIEW TAB (owner/admin — metadata only) ═════ */
  vaultOverview:async function(){
    var c = document.getElementById('tabContent'); if(!c) return;
    c.innerHTML='<div class="empt"><div class="ei">⏳</div>Loading vault registry…</div>';
    await this.loadAll();
    var S=this.STATE, total=0, h='';
    h += '<div class="snote" style="margin-bottom:12px">🗄️ <b>ENCRYPTED VAULT REGISTRY</b> — sirf METADATA dikh ti hai '
      +'(backup IDs, versions, Drive binding). <b>Passwords/codes/keys KABHI nahi</b> — wo AES-256-GCM se user ke '
      +'.vexa file me locked hain aur secret sirf user ke paas hai.</div>';
    var users=[];
    try{ var us=await db.ref('users').get(); us.forEach(function(u){ users.push({uid:u.key,val:u.val()||{}}) }) }catch(e){}
    var self=this;
    users.forEach(function(u){
      var v=S.vaults[u.uid]; if(!v) return; total++;
      h += '<div class="card"><div class="crow"><div style="font-size:20px">🗄️</div>'
        +'<div class="cinfo"><div class="cname">'+self.esc(u.val.displayName||'Unknown')
        +(u.val.verified?' ✔':'')+'</div>'
        +'<div class="cmeta">@'+self.esc(u.val.username||'—')+' · vault '+self.badge(v.status||'active')+'</div>'
        +'<div class="cmeta mono" style="font-size:10px">backup '+self.esc(String(v.backupId||'—').slice(0,18))+'… · key v'+self.esc(String(v.keyVersion||1))
        +' · '+(v.driveBound?'🟢 Drive bound':'⚪ local only')+' · last backup '+self.ago(v.lastBackupAt)+'</div>'
        +'</div></div></div>';
    });
    h += total? '' : '<div class="empt"><div class="ei">📭</div>Abhi koi user ne vault nahi banaya</div>';
    c.innerHTML = h;
  },

  /* ═══════════ AUDIT LOG VIEWER (owner/admin) ═══════════════════════ */
  auditTab:async function(){
    var c = document.getElementById('tabContent'); if(!c) return;
    c.innerHTML='<div class="empt"><div class="ei">⏳</div>Loading audit trail…</div>';
    var h='<div class="snote" style="margin-bottom:12px">📜 <b>IMMUTABLE AUDIT LOG</b> — har recovery action ka record. '
      +'Rules: create-only (edit/delete denied). Ye log tamper-proof hai.</div>';
    try{
      var s = await db.ref('recoveryAuditLogs').limitToLast(120).get();
      if (!s.exists()){ c.innerHTML = h+'<div class="empt"><div class="ei">📭</div>Log khali hai</div>'; return }
      var rows=[]; s.forEach(function(x){ rows.push(x.val()) });
      rows.sort(function(a,b){ return (b.at||0)-(a.at||0) });
      var self=this;
      rows.forEach(function(l){
        h += '<div class="card" style="padding:10px 14px"><div class="sm">'
          +'<b>'+self.esc(l.action||'—')+'</b> <span class="badge" style="background:var(--acs);color:#ff8a80">'+self.esc(l.actorRole||'?')+'</span>'
          +'<div class="cmeta mono" style="font-size:10px">'+self.esc(String(l.actor||'').slice(0,14))+'… → '+self.esc(l.targetType||'')+' '+self.esc(String(l.targetId||'').slice(0,20))+' · '+self.ago(l.at)+'</div>'
          +(l.detail?'<div class="sm mut">'+self.esc(l.detail)+'</div>':'')
          +'</div></div>';
      });
      c.innerHTML = h;
    }catch(e){ c.innerHTML = h+'<div class="empt">Rules read fail: '+this.esc(e.message)+'</div>' }
  },

  cfOk:function(){ return this._cfOk!==false },
  init:function(role){
    this.ROLE = role;
    this._cfOk = true;
    var self = this;
    /* one-time CF reachability probe (silent) */
    auth.currentUser && auth.currentUser.getIdToken().then(function(tok){
      return fetch(self.CF_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
        body:JSON.stringify({action:'ping'})});
    }).then(function(r){ return r? r.json():null })
     .then(function(j){ self._cfOk = !!(j && j.ok) })
     .catch(function(){ self._cfOk=false });
  }
};
window.PanelVault = PanelVault;

/* ═══════════ AUTO-WIRING (⚡v2.8.2 FIXED) ══════════════════════════════
   ⚡BUGFIX: purane code ne Admin/Mod/Owner globals dhoondhe — panels asal me
   window.PANEL export karte hain, isliye wiring KABHI nahi chalti thi
   (Recoveries tab dead). Ab window.PANEL + PANEL.ROLE detect hota hai.

   • tab pill "Recoveries" → PanelVault.tab() (vault flow)
   • Owner: plaintext Passwords tab (recoveryPrivate) USER SPEC ke hisaab se
     INTACT rehta hai — ye usse override NAHI hota.
   • Old auto-login approve fns neutralised (old system DEAD).
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  function secure(pvRole){
    PanelVault.init(pvRole);
    var P = window.PANEL;
    if (!P || typeof P.tab !== 'function') return;
    PanelVault.PANEL = P;
    if (P.ROLE !== pvRole) return;   /* galat panel pe wire mat karo */
    /* vault recovery tab — sab roles */
    P.tabRecoveries = function(){ PanelVault.tab() };
    /* old auto-login system neutralise (agar panel me hai) */
    if (typeof P.approveRec === 'function')
      P.approveRec = function(){ t('❌ Old auto-login approval REMOVED — Vault flow use karo',false) };
    if (typeof P.rejectRec === 'function')
      P.rejectRec  = function(){ t('❌ Old system removed — Vault flow me Reject hai',false) };
    if (typeof P.needsReport === 'function')
      P.needsReport = function(){ t('❌ Old system removed',false) };
    if (P.ROLE !== 'owner') return;
    /* ⚡OWNER — Passwords tab (plaintext recoveryPrivate) USER SPEC: intact.
       Sirf legacy decision path vault flow se route hota hai. */
    P.decideReq = async function(uid,rid,dec){
      if (dec==='approved') return PanelVault.doApprove(rid);
      if (dec==='rejected') return PanelVault.doReject(rid);
      t('❌ Old decision path removed',false);
    };
    /* owner stats: vaulted count from recoveryVaults */
    var _ls = P.loadStats && P.loadStats.bind(P);
    if (_ls){
      P.loadStats = async function(){
        try{
          var vv = await db.ref('recoveryVaults').get();
          var vaulted = vv.exists()? vv.numChildren():0;
          await _ls();
          var row=document.getElementById('statsRow');
          if (row && !document.getElementById('pvVaultStat') && row.firstElementChild){
            var s=document.createElement('div'); s.className='stat'; s.id='pvVaultStat';
            s.innerHTML='<div class="sv">'+vaulted+'</div><div class="sl">VAULTS</div>';
            row.appendChild(s);
          } else if (document.getElementById('pvVaultStat')){
            document.getElementById('pvVaultStat').innerHTML='<div class="sv">'+vaulted+'</div><div class="sl">VAULTS</div>';
          }
        }catch(e){ _ls() }
      };
    }
  }
  if (typeof firebase!=='undefined' && firebase.auth){
    var tries=0;
    var iv=setInterval(function(){
      tries++;
      var u = (typeof auth!=='undefined' && auth.currentUser) ? auth.currentUser : null;
      if (u){ clearInterval(iv);
        db.ref('users/'+u.uid+'/role').get().then(function(s){
          var r=s.exists()?s.val():'user';
          if (r==='owner') secure('owner');
          else if (r==='admin') secure('admin');
          else if (r==='moderator') secure('moderator');
        }).catch(function(){});
      } else if (tries>120) clearInterval(iv);
    },500);
  }
})();
