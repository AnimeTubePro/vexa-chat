/* ═══════════════════════════════════════════════════════════════════════════
   VEXA TEMP ACCOUNT RECOVERY — v1.0 (AnimeTubePro Studio × VEXA)
   ─────────────────────────────────────────────────────────────────────────
   USER SPEC (jaisa maanga tha):
     1) recover.vexa file upload → 3-STEP VERIFICATION
     2) Auto-generate TEMP username + TEMP UID + TEMP password
        UID format:  LOST-<username>-<number>
     3) Temp account SIRF admin/owner se chat kar sakta hai
     4) Accept hone par old account ka email + password CHAT MESSAGE me
        milta hai (staff approve karta hai) → user copy karke logout
     5) Delete flow: "delete" type karo + TEMP password daalo → temp
        account delete (Firebase reauth → user delete + profile cleanup)

   SECURITY:
     • .vexa file + secret sirf CLIENT-side decrypt hote hain (VexaVault)
     • Temp password client pe generate hota hai aur user ko EK baar
       dikhta hai — RTDB me sirf profile flags jate hain, password NAHI
     • Firebase UID asli rehta hai; display UID = LOST-<user>-<num>
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const TempRec = {
  EXPIRY_DAYS : 7,
  _file   : null,   /* parsed .vexa {ok,header,payload} */
  _full   : null,   /* decrypted full read result       */
  _secret : '',

  /* ── helpers ─────────────────────────────────────────────────────────── */
  _rand:function(n){
    var chars='abcdefghjkmnpqrstuvwxyz23456789', out='';
    try{
      var buf=new Uint8Array(n); crypto.getRandomValues(buf);
      for(var i=0;i<n;i++) out+=chars[buf[i]%chars.length];
    }catch(e){ for(var j=0;j<n;j++) out+=chars[Math.floor(Math.random()*chars.length)]; }
    return out;
  },
  _num:function(n){
    var s=''; for(var i=0;i<n;i++) s+=String(Math.floor(Math.random()*10));
    return s;
  },
  _sanitize:function(u){
    return String(u||'').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,12)||'user';
  },
  isTemp:function(){
    try{ return !!(typeof me!=='undefined' && me && me.tempRecovery && auth.currentUser); }catch(e){ return false }
  },
  staffRole:function(r){ return r==='owner'||r==='admin' },

  /* ═══════════ ENTRY — start modal (login screen + settings se) ═════════ */
  start:async function(){
    /* logged-in real account? pehle logout samjhao */
    if (this.isTemp()) return this.status();
    var logged=false; try{ logged=!!(auth&&auth.currentUser) }catch(e){}
    if (logged){
      return V.mOpen('🧡 Temporary Account Access',
        '<div class="vv-warn">⚠️ Aap abhi ek account me logged-in ho. Temporary recovery account banane ke liye pehle <b>logout</b> karo.</div>'
        +'<div class="vv-s" style="margin-top:10px">Login screen pe <b>🧡 Temporary Account Access</b> link milega — wahan se 3-step verification shuru hogi.</div>',
        '<button class="btn bg" onclick="V.mClose()">Baad me</button>'
        +'<button class="btn bp" onclick="V.mClose();auth.signOut().then(function(){location.reload()})">Logout karo</button>');
    }
    var h=''
      +'<div class="vv-head"><div class="vv-badge">TEMP RECOVERY v1.0 · 3-STEP VERIFIED</div></div>'
      +'<div class="vv-card">'
      +'<div class="vv-row"><span>Step 1</span><b>📄 recover.vexa file upload</b></div>'
      +'<div class="vv-row"><span>Step 2</span><b>🔑 Vault secret → decrypt test</b></div>'
      +'<div class="vv-row"><span>Step 3</span><b>🪪 Email confirm + reason</b></div>'
      +'</div>'
      +'<div class="vv-s" style="text-align:left;line-height:1.9">'
      +'✅ Verify hone par <b>TEMPORARY account</b> auto ban jayega — auto username, UID (<b class="mono">LOST-username-number</b>) aur temp password ke saath<br>'
      +'💬 Temp account me aap <b>SIRF admin/owner se chat</b> kar paoge<br>'
      +'📨 Admin/owner <b>accept</b> karega to purane account ka <b>email + password chat me</b> milega — copy karke logout karo<br>'
      +'🗑️ Kaam ho jaye to Settings me <b>"delete" type + temp password</b> daal ke temp account delete kar dena'
      +'</div>'
      +'<div class="vv-warn">🚨 Zaroori: original account ka <b>.vexa backup file + 8-block vault secret</b> dono chahiye. File kisi ko mat do.</div>';
    V.mOpen('🧡 Temporary Account — 3-Step Recovery', h,
      '<button class="btn bg" onclick="V.mClose()">Cancel</button>'
      +'<button class="btn bp" onclick="TempRec._step1()">🚀 Shuru karo →</button>');
  },

  /* ═══════════ STEP 1 — recover.vexa file upload ════════════════════════ */
  _step1:function(){
    var inp=document.createElement('input');
    inp.type='file'; inp.accept='.vexa,application/json';
    inp.style.display='none';
    document.body.appendChild(inp);
    inp.addEventListener('change', function(){
      var f=inp.files&&inp.files[0];
      try{ document.body.removeChild(inp) }catch(e){}
      if (f) TempRec._step1Open(f);
    });
    inp.click();
  },
  _step1Open:async function(file){
    try{
      var p = await VexaVault.parseFile(file);
      if (!p.ok){
        return V.mOpen('❌ Invalid .vexa File',
          '<div class="vv-fail">'+p.errors.map(V.esc).join('<br>')+'</div>'
          +'<div class="vv-s" style="margin-top:8px">Sirf <b>.vexa</b> vault backup file chalegi — jaise <b class="mono">CLIENT_001.vexa</b> (jo vault banate waqt download hui thi).</div>',
          '<button class="btn bg" onclick="V.mClose()">OK</button>');
      }
      var sc = VexaVault.structuralCheck(p.json);
      if (!sc.ok){
        return V.mOpen('⚠️ Structure Fail',
          '<div class="vv-fail">'+sc.errors.map(V.esc).join('<br>')+'</div>'
          +'<div class="vv-s" style="margin-top:8px">File corrupt/modify hui lagti hai — original .vexa use karo.</div>',
          '<button class="btn bg" onclick="V.mClose()">OK</button>');
      }
      this._file = p.json;
      var j=p.json, info=''
        +'<div class="vv-row"><span>File</span><b class="mono">'+V.esc(p.name||'backup.vexa')+'</b></div>'
        +'<div class="vv-row"><span>Backup ID</span><b class="mono" style="font-size:10px">'+V.esc((j&&j.backupId)||'—')+'</b></div>'
        +'<div class="vv-row"><span>Banaya gaya</span><b>'+(j&&j.createdAt?new Date(j.createdAt).toLocaleString():'—')+'</b></div>';
      var h='<div class="vv-step">STEP 1 / 3 — File mil gayi ✅ (structure valid)</div>'
        +'<div class="vv-card">'+info+'</div>'
        +'<div class="vv-step">STEP 2 / 3 — Vault secret daalo (decrypt + integrity test)</div>'
        +'<div class="fld"><label class="flbl">8-block Vault Secret</label>'
        +'<input class="inp mono" id="tpSecret" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" style="text-transform:uppercase" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>'
        +'<div id="tpRes"></div>'
        +'<div class="vv-warn">🚨 Secret wahi 8-block code jo vault banate waqt EK baar dikha tha.</div>';
      V.mOpen('🧡 Temp Account — Step 2: Secret', h,
        '<button class="btn bg" onclick="V.mClose()">Cancel</button>'
        +'<button class="btn bp" onclick="TempRec._step2Go()">🔓 Verify karo</button>');
    }catch(e){
      V.mOpen('❌ Error','<div class="vv-fail">'+V.esc(e.message||String(e))+'</div>','<button class="btn bg" onclick="V.mClose()">OK</button>');
    }
  },

  /* ═══════════ STEP 2 — secret → decrypt + integrity ════════════════════ */
  _step2Go:async function(){
    var out=V.g('tpRes'); if(!out) return;
    var sec=VexaVault.normalizeSecret((V.g('tpSecret')||{}).value||'');
    if (!VexaVault.secretOk(sec)){ out.innerHTML='<div class="vv-fail">❌ Secret 8-block format me daalo (XXXX-XXXX-…)</div>'; return }
    out.innerHTML='<div class="spn"></div>';
    try{
      var full = await VexaVault.read(this._file, sec);
      if (!full.ok){
        out.innerHTML='<div class="vv-fail">❌ '+(full.errors||[]).map(V.esc).join('<br>')+'</div>'; return;
      }
      this._full=full; this._secret=sec;
      var a=(full.payload&&full.payload.account)||{};
      var em=String(a.emailRef||'');
      var emMask = em ? em.replace(/^(.).*(@.*)$/,'$1•••$2') : '—';
      var uid=String(a.uid||'');
      var uidMask = uid ? uid.slice(0,4)+'••••'+uid.slice(-4) : '—';
      var h='<div class="vv-ok">🔓 File verified — decrypt + integrity PASS ✅</div>'
        +'<div class="vv-card">'
        +'<div class="vv-row"><span>Username</span><b>'+V.esc(a.username||'—')+'</b></div>'
        +'<div class="vv-row"><span>Email</span><b class="mono" style="font-size:11px">'+V.esc(emMask)+'</b></div>'
        +'<div class="vv-row"><span>UID</span><b class="mono" style="font-size:10px">'+V.esc(uidMask)+'</b></div>'
        +'</div>'
        +'<div class="vv-step">STEP 3 / 3 — Identity confirm + reason</div>'
        +'<div class="fld"><label class="flbl">Original account ka PURA email (match karna chahiye)</label>'
        +'<input class="inp" id="tpEmail" type="email" placeholder="purana@email.com" autocomplete="off"></div>'
        +'<div class="fld"><label class="flbl">Kya hua tha? (reason — 10+ chars)</label>'
        +'<textarea class="txta" id="tpReason" maxlength="300" placeholder="Account kaise kho gaya / hack hua? Kab?"></textarea></div>'
        +'<div id="tpGo"></div>';
      V.mOpen('🧡 Temp Account — Step 3: Confirm', h,
        '<button class="btn bg" onclick="V.mClose()">Cancel</button>'
        +'<button class="btn bp" onclick="TempRec._step3Go()">🪪 Confirm + Temp Account banao</button>');
    }catch(e){ out.innerHTML='<div class="vv-fail">❌ '+V.esc(e.message||String(e))+'</div>' }
  },

  /* ═══════════ STEP 3 — email match → AUTO temp account ═════════════════ */
  /* picker (Restore .vexa Backup) se aaye verified file+secret reuse karo */
  fromVerified:function(){
    try{
      if (typeof VaultUI==='undefined' || !VaultUI._pickVerified){
        return this.start();                     /* verified data nahi → normal 3-step */
      }
      this._file   = VaultUI._pickJson || VaultUI._pickVerified.header;
      this._full   = VaultUI._pickVerified;
      this._secret = VaultUI._pickSecret || '';
      var a=(this._full.payload&&this._full.payload.account)||{};
      var em=String(a.emailRef||'');
      var emMask = em ? em.replace(/^(.).*(@.*)$/,'$1•••$2') : '—';
      var uid=String(a.uid||'');
      var uidMask = uid ? uid.slice(0,4)+'••••'+uid.slice(-4) : '—';
      var h='<div class="vv-ok">🔓 File already verified (Restore picker se) ✅ — Step 1/2 skip</div>'
        +'<div class="vv-card">'
        +'<div class="vv-row"><span>Username</span><b>'+V.esc(a.username||'—')+'</b></div>'
        +'<div class="vv-row"><span>Email</span><b class="mono" style="font-size:11px">'+V.esc(emMask)+'</b></div>'
        +'<div class="vv-row"><span>UID</span><b class="mono" style="font-size:10px">'+V.esc(uidMask)+'</b></div>'
        +'</div>'
        +'<div class="vv-step">STEP 3 / 3 — Identity confirm + reason</div>'
        +'<div class="fld"><label class="flbl">Original account ka PURA email (match karna chahiye)</label>'
        +'<input class="inp" id="tpEmail" type="email" placeholder="purana@email.com" autocomplete="off"></div>'
        +'<div class="fld"><label class="flbl">Kya hua tha? (reason — 10+ chars)</label>'
        +'<textarea class="txta" id="tpReason" maxlength="300" placeholder="Account kaise kho gaya / hack hua? Kab?"></textarea></div>';
      V.mOpen('🧡 Temp Account — Step 3: Confirm', h,
        '<button class="btn bg" onclick="V.mClose()">Cancel</button>'
        +'<button class="btn bp" onclick="TempRec._step3Go()">🪪 Confirm + Temp Account banao</button>');
    }catch(e){ V.toast('error', e.message||String(e)) }
  },

  _step3Go:async function(){
    if (!this._full) return;
    var a=(this._full.payload&&this._full.payload.account)||{};
    var emIn=(V.g('tpEmail').value||'').trim().toLowerCase();
    var rs=(V.g('tpReason').value||'').trim();
    if (!emIn) return V.toast('warning','Original email daalo');
    if (String(a.emailRef||'').toLowerCase()!==emIn)
      return V.toast('error','Email file se match nahi hua — wahi email daalo jo account banate waqt thi');
    if (rs.length<10) return V.toast('warning','Reason thoda detail me likho (10+ chars)');

    /* auto-generate: username + display UID + password */
    var base=this._sanitize(a.username);
    var user='lost_'+base+'_'+this._num(4);
    var dispUid='LOST-'+base.toUpperCase().slice(0,10)+'-'+this._num(4);
    var tempEmail='lost.'+this._rand(10)+'@vexa-temp.account';
    var tempPass=this._rand(4)+'-'+this._rand(4);

    V.mOpen('⏳ Temp account ban raha hai…','<div class="tc"><div class="spinner lg" style="margin:16px auto"></div><p class="mt8">Firebase account + profile + staff chat seed ho raha hai…</p></div>');
    try{
      /* 1) Firebase auth user (auto sign-in ho jata hai) */
      var cred = await auth.createUserWithEmailAndPassword(tempEmail, tempPass);
      var nu = cred.user;
      var now = Date.now();
      var profile = {
        displayName:'🔄 '+String(a.username||'LostUser')+' (Temp)',
        username:user,
        email:tempEmail,
        role:'user',
        accountType:'temp_recovery',
        tempRecovery:true,
        tempUid:dispUid,
        tempPasswordSet:true,
        origUid:String(a.uid||''),
        origUsername:String(a.username||''),
        origEmail:emIn,
        lostReason:rs.slice(0,300),
        backupId:String((this._file&&this._file.backupId)||''),
        createdAt:now,
        lastLoginAt:now,
        tempExpiresAt: now + this.EXPIRY_DAYS*86400000,
        banned:false
      };
      try{ await db.ref('users/'+nu.uid).set(profile) }catch(e){ throw new Error('Profile save fail: '+e.message) }

      /* 2) recovery request (client fallback — staff panel dikhata hai) */
      var reqId='req_'+now.toString(36)+'_'+this._rand(6);
      try{
        await db.ref('recoveryRequests/'+reqId).set({
          reqId:reqId,
          tempUid:nu.uid, tempUsername:user, tempUidLabel:dispUid,
          viaTemp:true,
          mode:'full_migration', cats:null,
          origUid:String(a.uid||''),
          origFingerprint:(this._file&&this._file.accountFingerprint)||'',
          backupId:String((this._file&&this._file.backupId)||''),
          origUsername:String(a.username||''),
          origEmail:emIn,
          reason:rs.slice(0,300),
          integrityStatus:'client_verified', viaServer:false,
          ownershipStatus:'pending', status:'pending',
          requestedAt:now, updatedAt:now
        });
      }catch(e){ console.warn('[TempRec] request write fail', e) }

      /* 3) staff chat seed — owner/admin ko intro message */
      var staffUid=await this._findStaff();
      if (staffUid){
        try{ await this._seedChat(nu.uid, staffUid, profile, reqId) }catch(e){ console.warn('[TempRec] seed chat fail', e) }
      }

      /* 4) success modal — credentials EK baar dikhao */
      var creds=''
        +'<div class="vv-ok">✅ Temporary account READY!</div>'
        +'<div class="vv-card">'
        +'<div class="vv-row"><span>Username</span><b class="mono">'+V.esc(user)+'</b></div>'
        +'<div class="vv-row"><span>Temp UID</span><b class="mono" style="font-size:10.5px">'+V.esc(dispUid)+'</b></div>'
        +'<div class="vv-row"><span>Temp Password</span><b class="mono" id="tpPwShow">'+V.esc(tempPass)+'</b></div>'
        +'</div>'
        +'<div style="display:flex;gap:8px;margin-top:8px">'
        +'<button class="btn bg bsm" style="flex:1" onclick="V.copy(\''+V.esc(user)+'\',\'Username copied\')">📋 Copy username</button>'
        +'<button class="btn bg bsm" style="flex:1" onclick="V.copy(\''+V.esc(dispUid)+'\',\'UID copied\')">📋 Copy UID</button>'
        +'<button class="btn bg bsm" style="flex:1" onclick="V.copy(document.getElementById(\'tpPwShow\').textContent,\'Temp password copied\')">📋 Copy password</button>'
        +'</div>'
        +'<div class="vv-s" style="text-align:left;line-height:1.9;margin-top:10px">'
        +'💬 Ab aap <b>sirf admin/owner se chat</b> kar sakte ho — intro message already bhej diya gaya hai<br>'
        +'📨 Staff <b>accept</b> karega to purana <b>email + password chat me</b> aayega — copy karo, logout karo, phir apne asli account me login karo<br>'
        +'🗑️ Kaam poora hone par: Settings ▸ <b>Delete Temporary Account</b> → "delete" type + upar wala temp password<br>'
        +'⏰ Ye account <b>'+this.EXPIRY_DAYS+' din</b> ke liye hai — expiry ke baad staff delete kar sakta hai'
        +'</div>'
        +'<div class="vv-warn">🚨 Temp password ABHI save kar lo — delete confirm karte waqt yahi lagana hoga!</div>';
      V.mOpen('🎉 Temp Account Ready — ' + dispUid, creds,
        '<button class="btn bp" onclick="V.mClose();location.reload()">VEXA me enter karo →</button>');
      try{ V.toast('success','🧡 Temp account ready!') }catch(e){}
    }catch(e){
      var msg=(e&&e.message)||String(e);
      if (String(msg).indexOf('email-already-in-use')>-1) msg='Internal collision — dobara try karo';
      if (String(msg).indexOf('weak-password')>-1) msg='Password weak — dobara try karo';
      V.mOpen('❌ Temp Account Fail','<div class="vv-fail">'+V.esc(msg)+'</div>'
        +'<div class="vv-s" style="margin-top:8px">File + secret verify ho chuke hain — sirf account creation step fail hua. Dobara try karo.</div>',
        '<button class="btn bg" onclick="V.mClose()">OK</button>');
    }
  },

  /* ── staff dhundo (owner first, phir admin) ──────────────────────────── */
  _findStaff:async function(){
    try{
      var s=await db.ref('users').get();
      var owners=[],admins=[];
      if (s.exists()){
        s.forEach(function(c){
          var r=c.val()&&c.val().role;
          if (c.key && (c.val()&&c.val().banned)!==true){
            if (r==='owner') owners.push(c.key);
            else if (r==='admin') admins.push(c.key);
          }
        });
      }
      return owners[0]||admins[0]||'';
    }catch(e){ return '' }
  },
  _seedChat:async function(tempUid, staffUid, profile, reqId){
    var cid=[tempUid,staffUid].sort().join('_');
    var mid=db.ref('messages/'+cid).push().key;
    var intro='🧡 TEMP RECOVERY REQUEST\n\n'
      +'Username: @'+(profile.username||'')+'\n'
      +'Temp UID: '+(profile.tempUid||'')+'\n'
      +'Original: @'+(profile.origUsername||'')+'\n'
      +'Backup ID: '+(profile.backupId||'—')+'\n'
      +'Request ID: '+(reqId||'—')+'\n\n'
      +'Maine apna account kho diya hai. 3-step .vexa verification PASS hui hai. '
      +'Accept karke mujhe mera original email + password chat me bhej do. Dhanyawad!';
    await db.ref('messages/'+cid+'/'+mid).set({
      senderId:tempUid, text:intro, type:'text',
      createdAt:firebase.database.ServerValue.TIMESTAMP,
      delivered:true, seen:false
    });
    var part={}; part[tempUid]=true; part[staffUid]=true;
    await db.ref('chats/'+cid).update({
      participants:part, lastMessage:'🧡 Temp recovery request', lastSender:tempUid,
      updatedAt:firebase.database.ServerValue.TIMESTAMP
    });
    try{ await db.ref('users/'+tempUid+'/chats/'+cid).set({peer:staffUid,updatedAt:Date.now()}) }catch(e){}
    try{ await db.ref('users/'+staffUid+'/chats/'+cid).set({peer:tempUid,updatedAt:Date.now()}) }catch(e){}
    db.ref('chats/'+cid+'/unread/'+staffUid).transaction(function(n){return (n||0)+1});
    try{
      await db.ref('users/'+staffUid+'/notifications').push({
        type:'temp_recovery', title:'🧡 Temp Recovery Request',
        body:'@'+(profile.username||'')+' — .vexa 3-step verified. Accept karke credentials bhejo.',
        read:false, at:Date.now()
      });
    }catch(e){}
  },

  /* ═══════════ TEMP STATUS (logged-in temp user) ════════════════════════ */
  status:async function(){
    var self=this;
    var h='<div class="vv-head"><div class="vv-badge">TEMP RECOVERY ACCOUNT</div></div>'
      +'<div class="vv-card">'
      +'<div class="vv-row"><span>Username</span><b class="mono">'+V.esc((me&&me.username)||'')+'</b></div>'
      +'<div class="vv-row"><span>Temp UID</span><b class="mono" style="font-size:10.5px">'+V.esc((me&&me.tempUid)||'')+'</b></div>'
      +'<div class="vv-row"><span>Original account</span><b>@'+V.esc((me&&me.origUsername)||'—')+'</b></div>'
      +'<div class="vv-row"><span>Expiry</span><b>'+(me&&me.tempExpiresAt?new Date(me.tempExpiresAt).toLocaleDateString():'—')+'</b></div>'
      +'</div>'
      +'<div class="vv-s" style="text-align:left;line-height:1.9">'
      +'💬 Aap sirf <b>admin/owner se chat</b> kar sakte ho<br>'
      +'📨 Accept hone par purana <b>email + password chat me</b> aayega — copy karke logout karo, phir original account me login<br>'
      +'🗑️ Kaam poora hone par neeche <b>Delete Temp Account</b> se hata do ("delete" type + temp password)'
      +'</div>'
      +'<button class="btn bp bbk" style="margin-top:10px" onclick="V.mClose();ChatUI.openWithStaff()">💬 Staff se chat kholo</button>'
      +'<button class="btn bg bbk" style="margin-top:8px" onclick="V.mClose();VaultUI.myRequests()">📋 Request status dekho</button>';
    V.mOpen('🧡 Temp Account — Status', h,
      '<button class="btn bg" onclick="V.mClose()">Close</button>'
      +'<button class="btn bp" onclick="V.mClose();TempRec.deleteFlow()">🗑️ Temp account delete</button>');
  },

  /* ═══════════ DELETE FLOW — "delete" + temp password ═══════════════════ */
  deleteFlow:function(){
    var h='<div class="vv-warn">🚨 Pehle confirm karo: <b>purane account ka email + password COPY kar liye</b> aur usme login bhi kar liya? Temp account delete hone ke baad is chat ka access chala jayega.</div>'
      +'<div class="vv-step">Delete confirm — 2 cheezein chahiye</div>'
      +'<div class="fld"><label class="flbl">Type karo: delete</label>'
      +'<input class="inp mono" id="tpDelWord" placeholder="delete" autocomplete="off" spellcheck="false"></div>'
      +'<div class="fld"><label class="flbl">Temp password (jo account banate waqt mila tha)</label>'
      +'<input class="inp mono" id="tpDelPw" type="password" placeholder="••••-••••" autocomplete="off"></div>'
      +'<div id="tpDelRes"></div>';
    V.mOpen('🗑️ Delete Temporary Account', h,
      '<button class="btn bg" onclick="V.mClose()">Cancel</button>'
      +'<button class="btn bds2" onclick="TempRec._deleteGo()">🗑️ Permanently delete</button>');
  },
  _deleteGo:async function(){
    var out=V.g('tpDelRes'); if(!out) return;
    var w=(V.g('tpDelWord').value||'').trim().toLowerCase();
    var pw=V.g('tpDelPw').value||'';
    if (w!=='delete'){ out.innerHTML='<div class="vv-fail">❌ Exactly "delete" type karo</div>'; return }
    if (!pw){ out.innerHTML='<div class="vv-fail">❌ Temp password daalo</div>'; return }
    out.innerHTML='<div class="spn"></div>';
    try{
      var cu=auth.currentUser; if(!cu) throw new Error('Login nahi ho');
      var em=cu.email||'';
      /* reauth (recent-login rule) → phir delete */
      var cred=firebase.auth.EmailAuthProvider.credential(em, pw);
      await cu.reauthenticateWithCredential(cred);
      /* DB cleanup pehle (auth user ke paas token abhi valid hai) */
      try{ await db.ref('users/'+cu.uid).remove() }catch(e){ console.warn('profile rm', e) }
      try{
        var idx=await db.ref('users/'+cu.uid+'/chats').get();
        if (idx.exists()){
          idx.forEach(function(c){ try{ db.ref('chats/'+c.key+'/participants/'+cu.uid).remove() }catch(e){} });
        }
      }catch(e){}
      try{
        var rq=await db.ref('recoveryRequests').orderByChild('tempUid').equalTo(cu.uid).get();
        if (rq.exists()) rq.forEach(function(c){ try{ db.ref('recoveryRequests/'+c.key+'/status').set('temp_deleted'); db.ref('recoveryRequests/'+c.key+'/updatedAt').set(Date.now()) }catch(e){} });
      }catch(e){}
      await cu.delete();
      V.mClose();
      V.mOpen('🗑️ Temp Account Deleted','<div class="vv-ok">Temporary account delete ho gaya. Original account ke credentials se login karo.</div>',
        '<button class="btn bp" onclick="V.mClose();location.reload()">Login screen →</button>');
      try{ await auth.signOut() }catch(e){}
    }catch(e){
      var m=(e&&e.code)||e.message||String(e);
      if (String(m).indexOf('invalid-credential')>-1||String(m).indexOf('wrong-password')>-1) m='❌ Temp password galat hai';
      if (String(m).indexOf('requires-recent-login')>-1) m='Session purana ho gaya — logout/login karke phir try karo';
      out.innerHTML='<div class="vv-fail">❌ '+V.esc(String(m))+'</div>';
    }
  }
};
window.TempRec = TempRec;

/* queued early-clicks (VXtemp shim) consume karo — splash khatam hone ke
   BAAD, warna modal loading screen ke piche chala jata tha */
try{
  window.addEventListener('load', function(){
    try{
      if (sessionStorage.getItem('vexaTempQueue')==='1'){
        sessionStorage.removeItem('vexaTempQueue');
        (window.VexaSplashWait||function(cb){ setTimeout(cb,600) })(function(){ try{ TempRec.start() }catch(e){} });
      }
    }catch(e){}
  });
}catch(e){}
