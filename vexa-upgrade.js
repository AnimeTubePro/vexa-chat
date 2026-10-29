/* ═══════════════════════════════════════════════════════════════════════════
   VEXA CHAT — UPGRADE MODULE v2.1  (AnimeTubePro Studio × VEXA)
   ─────────────────────────────────────────────────────────────────────────
   ⚡ यह file मौजूदा script.js को REBUILD नहीं करती — sirf ADD-ON modules देती है।
   Existing functionality (Auth/Rec/CodeLogin/ChatUI/Calls/Games/Local) UNTOUCHED।
   Rollback = index.html से इस file की <script> line हटाओ। सब कुछ पहले जैसा।

   MODULES:
     VexaStorage  — 3× Supabase projects (avatars / posts / guilds) + validation
     VexaId       — numeric publicUserId (atomic allocation + lazy migration)
     VexaDrive    — Google OAuth + Picker + resumable Drive upload + video msgs
     VexaSec      — 2FA (Firebase second factor) + Remote Logout + Recovery Center
     VexaGroup    — complete group chat (roles/invites/media/unread/moderation)
     VexaBackend  — trusted Cloud Function client (token-verified actions)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ═══════════════ 1) VEXA STORAGE — 3× SUPABASE (spec §3,§4,§5) ═══════════════
   - Supabase 1 (avatars): profile/{uid}/avatar.jpg  — existing bucket vexa-media
   - Supabase 2 (posts):   posts/{uid}/{pid}_{i}.jpg — naya bucket vexa-posts
   - Supabase 3 (guilds):  guilds/{gid}/...          — bucket vexa-chat-guild
     ⚠️ VERIFY: Supabase-3 dashboard में bucket का exact नाम 'vexa-chat-guild'
        ही होना चाहिए — अलग हो तो सिर्फ VEXA_STORAGE.guilds.bucket बदलो।
   Rules: JPEG/PNG/WebP only, ≤200KB per image (client-enforce + compress)      */
const VexaStorage={
 _clients:{},
 ready:function(){return (typeof supabase!=='undefined')&&!!db},
 /* client per category cache — duplicate createClient नहीं */
 client:function(cat){
   var c=this.cfg[cat]||VEXA_STORAGE[cat];
   if(!c)throw new Error('Unknown storage category: '+cat);
   if(!this._clients[cat])this._clients[cat]=supabase.createClient(c.url,c.anonKey);
   return this._clients[cat];
 },
 bucket:function(cat){return (VEXA_STORAGE[cat]||{}).bucket},
 /* dataURL → {blob,mime,bytes} + spec validation */
 validate:function(dataUrl){
   var mime=(dataUrl.match(/^data:([^;,]+)[;,]/)||[])[1]||'';
   if(VEXA_MEDIA_LIMITS.allowedMime.indexOf(mime)===-1)throw new Error('Only JPEG/PNG/WebP allowed (got '+mime+')');
   var b64=dataUrl.split(',')[1]||'';
   var bytes=Math.round(b64.length*3/4);
   if(bytes>VEXA_MEDIA_LIMITS.maxBytes)throw new Error('Image too large ('+Math.round(bytes/1024)+'KB > 200KB) — aur compress karo');
   return {mime:mime,bytes:bytes};
 },
 d2b:function(du){
   var parts=du.split(','),b64=parts[1];
   var bin=atob(b64),a=new Uint8Array(bin.length);
   for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
   return new Blob([a],{type:(du.match(/^data:([^;,]+)[;,]/)||[])[1]||'image/jpeg'});
 },
 /* core uploader — reuse pattern from V.uploadPhoto but per-category */
 _upload:async function(cat,path,dataUrl){
   this.validate(dataUrl);
   var cl=this.client(cat),bk=this.bucket(cat);
   var r=await cl.storage.from(bk).upload(path,this.d2b(dataUrl),{contentType:(dataUrl.match(/^data:([^;,]+)[;,]/)||[])[1]||'image/jpeg',upsert:true});
   if(r.error)throw r.error;
   var pub=cl.storage.from(bk).getPublicUrl(path).data.publicUrl;
   /* verify public reachability (existing app भी यही verify करता है) */
   var ok=await new Promise(function(res){var i=new Image();i.onload=function(){res(true)};i.onerror=function(){res(false)};i.src=pub;setTimeout(function(){res(false)},5000)});
   if(!ok)throw new Error('Upload done but public URL not readable — bucket policy check karo ('+cat+')');
   return pub;
 },
 /* POST IMAGE → Supabase 2 (vexa-posts) — spec §4 (max 5, caller enforce) */
 uploadPostImage:async function(dataUrl,uid,pid,idx){
   return this._upload('posts','posts/'+uid+'/'+pid+'_'+idx+'.jpg',dataUrl);
 },
 /* GUILD/GROUP IMAGE → Supabase 3 (vexa-chat-guild) — spec §5 */
 uploadGuildImage:async function(dataUrl,gid){
   return this._upload('guilds','guilds/'+gid+'/photo_'+Date.now()+'.jpg',dataUrl);
 },
 /* GROUP CHAT IMAGE → Supabase 3 media path — spec §9 (group media) */
 uploadGroupChatImage:async function(dataUrl,gid,uid){
   return this._upload('guilds','guilds/'+gid+'/media/'+uid+'/'+Date.now()+'.jpg',dataUrl);
 },
 /* AVATAR → Supabase 1 (vexa-media) — existing V.uploadPhoto का structured alias
   (duplicate नहीं — same bucket, same path; profile flow इसी से होगा) */
 uploadAvatar:async function(dataUrl,uid){
   return this._upload('avatars','profile/'+uid+'/avatar.jpg',dataUrl);
 },
 /* delete helper — account delete / post delete cleanup के लिए */
 removeMany:async function(cat,paths){
   var cl=this.client(cat);
   var r=await cl.storage.from(this.bucket(cat)).remove(paths);
   if(r&&r.error)throw r.error;
   return true;
 },
 /* ⚠️ bucket verification — Settings → Security → Storage Check
    Supabase-3 dashboard manually verify करने का alternative: public URL probe */
 verifyBuckets:async function(){
   var out={};
   var cats=['avatars','posts','guilds'];
   for(var i=0;i<cats.length;i++){
     var c=VEXA_STORAGE[cats[i]];
     try{
       var probe=c.url+'/storage/v1/bucket';
       var res=await fetch(probe,{headers:{apikey:c.anonKey,Authorization:'Bearer '+c.anonKey}});
       out[cats[i]]={bucket:c.bucket,http:res.status,note:res.status===200?'reachable':'HTTP '+res.status+' — anon list allowed nahi (यह ठीक है), upload test करो'};
     }catch(e){out[cats[i]]={bucket:c.bucket,error:e.message}}
   }
   return out;
 }
};
/* alias — script.js (Posts.publish) इसी नाम से check करता है */
window.VexaStorage=VexaStorage;

/* ═══════════════ 2) VEXA ID — NUMERIC PUBLIC USER ID (spec §6) ═══════════════
   - firebaseUid  = internal (कहीं public नहीं)
   - publicUserId = numeric public ID (7-digit, 1000000+)
   - Atomic allocation: RTDB transaction on publicIdMeta/counter
   - Uniqueness:      publicIds/{num} = uid  (write fails if exists → retry)
   - Migration:       पुराने users को lazy — login पर allocate हो जाता है          */
const VexaId={
 BASE:1000000,
 MAX_TRIES:8,
 /* core allocator — transaction से race-safe */
 allocate:async function(uid){
   var self=this;
   /* पहले check — already allocated? */
   var ex=await db.ref('users/'+uid+'/publicUserId').get().catch(function(){return null});
   if(ex&&ex.exists()&&ex.val())return ex.val();
   for(var t=0;t<this.MAX_TRIES;t++){
     var txn=await db.ref('publicIdMeta/counter').transaction(function(cur){
       return ((cur||self.BASE-1)+1);
     });
     var num=txn.snapshot&&txn.snapshot.val();
     if(!num)continue;
     try{
       await db.ref('publicIds/'+num).set(uid); /* unique slot claim */
       await db.ref('users/'+uid+'/publicUserId').set(num);
       await db.ref('users/'+uid+'/publicUserIdAt').set(Date.now());
       return num;
     }catch(e){ /* slot taken (किसी और ने ले लिया) → retry नया number */ }
   }
   throw new Error('publicUserId allocation failed — thodi der baad try karo');
 },
 /* lazy migration — V.requireAuth hook इसे call करता है */
 ensure:function(uid){
   var self=this;
   if(!uid)return Promise.resolve(null);
   return this.allocate(uid).catch(function(e){console.warn('[VexaId]',e.message);return null});
 },
 /* uid → numeric id lookup */
 numFor:async function(uid){
   var s=await db.ref('users/'+uid+'/publicUserId').get().catch(function(){return null});
   return (s&&s.exists())?s.val():null;
 },
 /* numeric id / username से profile ढूंढना (search integration) */
 resolve:async function(num){
   var s=await db.ref('publicIds/'+parseInt(num,10)).get().catch(function(){return null});
   if(!s||!s.exists())return null;
   var u=await db.ref('users/'+s.val()).get().catch(function(){return null});
   return (u&&u.exists())?u.val():null;
 },
 /* profile card में ID row render करने का helper */
 row:function(u){
   var n=(u&&(u.publicUserId||u.publicId))||'—';
   return '<div class="srow" onclick="V.copy(\''+n+'\',\'Public ID copied!\')"><div class="sri">🔢</div><div class="srf"><div class="srt">VEXA ID (Public)</div><div class="srs mono">'+V.esc(String(n))+'</div></div><div class="sra">📋</div></div>';
 }
};

/* ═══════════════ 3) VEXA DRIVE — GOOGLE DRIVE VIDEO WORKFLOW (spec §5) ═══════════════
   Flow: connectGoogleDrive() → OAuth implicit token (sessionStorage ONLY, DB में कभी नहीं)
         → selectGoogleDriveFile() (Picker; no-key fallback = manual link paste)
         → uploadVideoToGoogleDrive(file) (resumable, progress UI)
         → sendVideoMessage(conversationId, meta) → RTDB metadata only
         → renderVideoMessage(msg) → recipient player + "Open in Drive" fallback
   ⚠️ सभी videos auto-public नहीं करते — sender per-file "allow viewing" चुनता है।   */
const VexaDrive={
 TOKKEY:'vexaDriveTok',
 _pickerApi:false,
 /* ── token state ── */
 token:function(){try{return sessionStorage.getItem(this.TOKKEY)||''}catch(e){return''}},
 setToken:function(t){try{sessionStorage.setItem(this.TOKKEY,t)}catch(e){}},
 clearToken:function(){try{sessionStorage.removeItem(this.TOKKEY)}catch(e){}},
 connected:function(){return !!this.token()},
 /* ── OAuth implicit flow (SPA redirect) ──
    ⚠️ Google Cloud Console → Credentials → Authorized redirect URIs में
       site URL (https://animetubepro.github.io/vexa-chat/) होना ज़रूरी है। */
 connectGoogleDrive:function(){
   var authBase='https://accounts.google.com/o/oauth2/v2/auth';
   var redirect=location.origin+location.pathname;
   var scopes=(VEXA_GOOGLE.scopes||[]).concat(['openid','email']).join(' ');
   var url=authBase
    +'?client_id='+encodeURIComponent(VEXA_GOOGLE.clientId)
    +'&redirect_uri='+encodeURIComponent(redirect)
    +'&response_type=token'
    +'&scope='+encodeURIComponent(scopes)
    +'&include_granted_scopes=true'
    +'&prompt=consent';
   sessionStorage.setItem('vexaDriveBack',location.hash||'');
   location.href=url;
 },
 /* OAuth redirect वापस आने पर token parse — boot में auto-call */
 handleOAuthReturn:function(){
   var h=location.hash||'';
   if(h.indexOf('access_token=')===-1)return false;
   var m=h.match(/access_token=([^&]+)/);
   if(m){this.setToken(m[1]);try{history.replaceState(null,'',location.pathname+location.search+(sessionStorage.getItem('vexaDriveBack')||''))}catch(e){}}
   return true;
 },
 disconnect:function(){this.clearToken();V.toast('info','Google Drive disconnected')},
 /* ── Google Picker (spec: pickerEnabled) ── */
 _loadPicker:function(){
   var self=this;
   return new Promise(function(res,rej){
     if(self._pickerApi)return res();
     if(typeof google==='undefined'||!google.load)return rej(new Error('Picker API load failed'));
     google.load('picker','1',{callback:function(){self._pickerApi=true;res()}});
   });
 },
 selectGoogleDriveFile:function(){
   var self=this;
   if(!this.connected())return this.connectGoogleDrive();
   if(!VEXA_GOOGLE.pickerEnabled||!VEXA_GOOGLE.apiKey)return this._manualPick('Picker key missing — link paste karo');
   this._loadPicker().then(function(){
     var view=new google.picker.DocsView(google.picker.ViewId.DOCS_VIDEOS).setSelectMultiple(false);
     var picker=new google.picker.PickerBuilder()
       .addView(view)
       .setOAuthToken(self.token())
       .setDeveloperKey(VEXA_GOOGLE.apiKey)
       .setCallback(function(data){
         if(data[google.picker.Response.ACTION]===google.picker.Action.PICKED){
           var f=data[google.picker.Response.DOCUMENTS][0];
           var meta={fileId:f[google.picker.Document.ID],name:f[google.picker.Document.NAME],mimeType:f[google.picker.Document.MIME_TYPE],size:f[google.picker.Document.SIZE_BYTES]||0,source:'picker'};
           V.mClose();
           if(typeof self.onPicked==='function')self.onPicked(meta);
         }else if(data[google.picker.Response.ACTION]===google.picker.Action.CANCEL){V.mClose()}
       })
       .build();
     picker.setVisible(true);
   }).catch(function(e){self._manualPick(e.message)});
 },
 /* no-Picker fallback: Drive share link से file ID निकालो */
 _manualPick:function(reason){
   var self=this;
   V.mOpen('📎 Drive Video Link','<div class="snote mb8">ℹ️ '+(reason||'')+'</div>'
    +'<div class="fld"><label class="flbl">Google Drive video link</label><input class="inp" id="dvLink" placeholder="https://drive.google.com/file/d/FILE_ID/view..."></div>'
    +'<div class="fhint">File को "Anyone with link — Viewer" करना होगा तभी दूसरा user देख पाएगा।</div>',
    '<button class="btn bp" onclick="VexaDrive._manualPickGo()">Attach</button>');
 },
 _manualPickGo:function(){
   var link=V.g('dvLink').value.trim();
   var m=link.match(/\/d\/([a-zA-Z0-9_-]{10,})/)||link.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
   if(!m)return V.toast('error','Valid Drive link nahi hai');
   V.mClose();
   var meta={fileId:m[1],name:'Drive video',mimeType:'video/*',size:0,source:'link',shared:true};
   if(typeof this.onPicked==='function')this.onPicked(meta);
 },
 /* ── RESUMABLE UPLOAD (local file → अपने Drive) ── */
 uploadVideoToGoogleDrive:function(file,onProg){
   var self=this;
   if(!this.connected()){this.connectGoogleDrive();return Promise.reject(new Error('Connect Google Drive first'))}
   if(!file.type||file.type.indexOf('video/')!==0)return Promise.reject(new Error('Sirf video files'));
   if(file.size>500*1024*1024)return Promise.reject(new Error('Max 500MB — badi files Drive app se upload karo'));
   var meta={name:('VEXA-'+Date.now()+'-'+(file.name||'video.mp4')).slice(0,120),mimeType:file.type};
   return fetch(VEXA_GOOGLE.driveUploadUrl+'?uploadType=resumable&supportsAllDrives=true',{
     method:'POST',
     headers:{'Authorization':'Bearer '+this.token(),'Content-Type':'application/json','X-Upload-Content-Type':file.type,'X-Upload-Content-Length':String(file.size)},
     body:JSON.stringify(meta)
   }).then(function(r){
     if(r.status===401||r.status===403){self.clearToken();throw new Error('Drive session expire — dobara connect karo')}
     if(!r.ok)throw new Error('Drive init fail (HTTP '+r.status+')');
     var loc=r.headers.get('Location')||r.headers.get('location');
     if(!loc)throw new Error('Drive resumable URL nahi mila (CORS exposed-headers check)');
     return loc;
   }).then(function(loc){
     return new Promise(function(res,rej){
       var xhr=new XMLHttpRequest();
       xhr.open('PUT',loc,true);
       xhr.setRequestHeader('Content-Type',file.type);
       xhr.upload.onprogress=function(e){if(onProg&&e.lengthComputable)onProg(Math.round(e.loaded/e.total*100))};
       xhr.onload=function(){
         if(xhr.status>=200&&xhr.status<300){
           try{var j=JSON.parse(xhr.responseText);res({fileId:j.id,name:j.name,size:j.size||file.size,mimeType:j.mimeType||file.type,source:'upload',shared:false})}
           catch(e){rej(new Error('Drive response parse fail'))}
         }else rej(new Error('Upload fail (HTTP '+xhr.status+')'));
       };
       xhr.onerror=function(){rej(new Error('Network error during upload'))};
       xhr.send(file);
     });
   });
 },
 /* per-file sharing consent — "सभी videos public नहीं" (spec) */
 allowViewing:function(fileId){
   return fetch(VEXA_GOOGLE.driveApiBaseUrl+'/files/'+fileId+'/permissions?supportsAllDrives=true',{
     method:'POST',
     headers:{'Authorization':'Bearer '+this.token(),'Content-Type':'application/json'},
     body:JSON.stringify({role:'reader',type:'anyone'})
   }).then(function(r){if(!r.ok)throw new Error('Share fail (HTTP '+r.status+')');return true});
 },
 /* ── VIDEO MESSAGE → RTDB (metadata ONLY — kabhi video bytes DB में नहीं) ── */
 sendVideoMessage:async function(conversationId,fileMetadata,isGroup){
   if(!conversationId||!fileMetadata||!fileMetadata.fileId)return V.toast('error','Video metadata missing');
   var msg={
     senderId:V.uid,type:'video',
     video:{fileId:fileMetadata.fileId,name:(fileMetadata.name||'video').slice(0,120),size:fileMetadata.size||0,mimeType:fileMetadata.mimeType||'video/*',shared:!!fileMetadata.shared,source:fileMetadata.source||'upload',by:V.uid,at:Date.now()},
     createdAt:firebase.database.ServerValue.TIMESTAMP
   };
   if(isGroup){
     var mid=db.ref('groupMessages/'+conversationId).push().key;
     await db.ref('groupMessages/'+conversationId+'/'+mid).set(msg);
     await VexaGroup.afterSend(conversationId,'🎬 Video',msg.senderId);
   }else{
     var cid=conversationId;
     var mid2=db.ref('messages/'+cid).push().key;
     await db.ref('messages/'+cid+'/'+mid2).set(msg);
     var part={};part[V.uid]=true;part[ChatUI.peerUid]=true;
     await db.ref('chats/'+cid).update({participants:part,lastMessage:'🎬 Video',lastSender:V.uid,updatedAt:firebase.database.ServerValue.TIMESTAMP});
     try{db.ref('users/'+V.uid+'/chats/'+cid).set({peer:ChatUI.peerUid,updatedAt:Date.now()})}catch(e){}
     try{db.ref('users/'+ChatUI.peerUid+'/chats/'+cid).set({peer:V.uid,updatedAt:Date.now()})}catch(e){}
     db.ref('chats/'+cid+'/unread/'+ChatUI.peerUid).transaction(function(n){return (n||0)+1});
     try{db.ref('users/'+ChatUI.peerUid+'/notifications').push({type:'message',from:V.uid,fromName:me.displayName,text:'🎬 Video message',read:false,at:Date.now()})}catch(e){}
   }
   return true;
 },
 /* ── RENDER — recipient player + Open-in-Drive fallback ── */
 streamUrl:function(fileId){return 'https://drive.google.com/uc?export=view&id='+fileId},
 thumbUrl:function(fileId){return 'https://drive.google.com/thumbnail?id='+fileId+'&sz=w400'},
 driveUrl:function(fileId){return 'https://drive.google.com/file/d/'+fileId+'/view'},
 renderVideoMessage:function(m){
   var vd=m.video||{};
   var fid=vd.fileId||'';
   var sizeLbl=vd.size?(vd.size>1048576?Math.round(vd.size/1048576)+' MB':Math.round(vd.size/1024)+' KB'):'';
   var shared=!!vd.shared;
   return '<div class="vmsg" data-fid="'+V.esc(fid)+'">'
    +'<video class="vmsg-v" controls preload="metadata" poster="'+this.thumbUrl(fid)+'" src="'+this.streamUrl(fid)+'"></video>'
    +'<div class="vmsg-i"><span class="vmsg-n">🎬 '+V.esc(vd.name||'Drive video')+'</span>'
    +(sizeLbl?'<span class="vmsg-s">'+sizeLbl+'</span>':'')
    +(shared?'':'<span class="vmsg-w">⚠️ Private file — owner ne share nahi kiya</span>')
    +'</div>'
    +'<div class="vmsg-a">'
    +'<a class="btn bds2 bsm" href="'+this.driveUrl(fid)+'" target="_blank" rel="noopener">↗ Open in Drive</a>'
    +(vd.by===V.uid&&!shared?'<button class="btn bg bsm" onclick="VexaDrive.shareThis(\''+fid+'\')">🔓 Allow viewing</button>':'')
    +'</div></div>';
 },
 shareThis:function(fid){
   var self=this;
   V.toast('info','Sharing…');
   this.allowViewing(fid).then(function(){
     /* DB में shared flag update — दोनों message paths try करो */
     ['messages','groupMessages'].forEach(function(root){
       db.ref(root).orderByChild('video/fileId').equalTo(fid).limitToFirst(5).get().then(function(s){
         if(s&&s.exists())s.forEach(function(c){db.ref(root+'/'+c.key+'/video/shared').set(true)});
       }).catch(function(){});
     });
     V.toast('success','✅ Ab receiver dekh sakta hai');
   }).catch(function(e){V.toast('error',e.message)});
 },
 /* bubble में inject — ChatUI.bubble / VexaGroup.bubble call करते हैं */
 bubbleHtml:function(m){
   return this.renderVideoMessage(m);
 }
};
window.VexaDrive=VexaDrive;
/* OAuth return auto-handle (page load par) */
try{if(VexaDrive.handleOAuthReturn()){setTimeout(function(){V&&V.toast&&V.toast('success','✅ Google Drive connected')},1200)}}catch(e){}

/* ═══════════════ 4) VEXA BACKEND — TRUSTED SERVERLESS CLIENT (spec §11) ═══════════════
   GitHub Pages static है — secrets वहाँ नहीं रख सकते। सारे privileged काम
   Cloud Function `vexaBackend` (us-central1, same region) करेगा:
     action=recoverWithCode  → single-use recovery code verify + custom token
     action=revokeDevice     → admin.auth().revokeRefreshTokens + session delete
     action=logoutAllOthers  → global kick timestamp + token revoke
     action=purgeVault       → recoveryPrivate plaintext scrub (migration)
   Client: Firebase ID token Bearer से — user identity server verify करता है।   */
const VexaBackend={
 call:async function(action,payload){
   var tok=await auth.currentUser.getIdToken(true);
   var r=await fetch(CF_BACKEND_URL,{
     method:'POST',
     headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
     body:JSON.stringify(Object.assign({action:action},payload||{}))
   });
   if(!r.ok){var t='';try{t=(await r.json()).error||''}catch(e){}throw new Error(t||('Backend HTTP '+r.status))}
   return r.json();
 },
 available:function(){return !!CF_BACKEND_URL}
};

/* ═══════════════ 5) VEXA SEC — 2FA + REMOTE LOGOUT + RECOVERY CENTER (spec §7,§8,§10) ═══════════════ */
const VexaSec={
 /* ─────────── A) TWO-STEP VERIFICATION — REAL Firebase second factor ───────────
    Phone Auth second factor (Console → Authentication → Sign-in method → Phone
    enable + "2 step verification" से billing note देखना)। Fake/frontend-only नहीं। */
 vrecap:null,
 twoFaOpen:async function(){
   var mf=null;
   try{mf=auth.currentUser.multiFactor}catch(e){}
   if(!mf)return V.toast('error','2FA support nahi (login dobara karo)');
   var enrolled=false,enrolledItems='';
   try{enrolled=!!(mf.enrolledFactors&&mf.enrolledFactors.length)}catch(e){}
   var h='<div class="tc mb8">'+(enrolled?'🛡️ 2-Step Verification <b style="color:var(--ok)">ACTIVE</b>':'⚠️ 2-Step Verification <b style="color:var(--wn)">OFF</b>')+'</div>';
   if(enrolled){
     try{
       (mf.enrolledFactors||[]).forEach(function(f){
         enrolledItems+='<div class="sesc"><div class="si2"><div class="sesd">📱 '+(f.displayName||'Phone')+'</div><div class="sesm">'+V.esc(f.phoneNumber||f.uid||'')+'</div></div>'
          +'<button class="btn bds2 bsm" onclick="VexaSec.twoFaUnenroll(\''+(f.uid||'')+'\')">Remove</button></div>';
       });
     }catch(e){}
   }
   h+=enrolledItems
    +'<div class="stit mt16">'+(enrolled?'Add another phone':'Enable 2-Step Verification')+'</div>'
    +'<div class="fld"><label class="flbl">Phone number (E.164)</label><input class="inp" id="v2faPhone" placeholder="+919876543210" autocomplete="tel"></div>'
    +'<div id="v2faRecapWrap"><div id="v2faRecap"></div></div>'
    +'<div id="v2faCodeRow" class="hidden"><div class="fld"><label class="flbl">6-digit SMS code</label><input class="inp mono" id="v2faCode" maxlength="6" inputmode="numeric" autocomplete="one-time-code"></div>'
    +'<button class="btn bp bbk" onclick="VexaSec.twoFaVerify()">Verify & Enable</button></div>'
    +'<div class="snote mt8">🔐 Enable करने के बाद login = password + SMS code (dusre device pe bhi)।</div>';
   V.mOpen('🛡️ Two-Step Verification',h);
   this._vId=null;
   setTimeout(function(){VexaSec._initRecap()},300);
 },
 _initRecap:function(){
   try{
     if(this.vrecap){this.vrecap.clear();this.vrecap=null}
     var el=V.g('v2faRecap');if(!el)return;
     this.vrecap=new firebase.auth.RecaptchaVerifier('v2faRecap',{size:'normal'});
     this.vrecap.render();
   }catch(e){console.warn('[2FA] recaptcha:',e.message)}
 },
 twoFaSend:async function(){
   var ph=V.g('v2faPhone').value.trim();
   if(!/^\+\d{8,15}$/.test(ph))return V.toast('error','Phone +91… format me daalo');
   var self=this;
   try{
     var mf=auth.currentUser.multiFactor;
     var session=await mf.getSession();
     var provider=new firebase.auth.PhoneAuthProvider(auth);
     this._vId=await provider.verifyPhoneNumber({phoneNumber:ph,multiFactorSession:session},this.vrecap);
     V.g('v2faCodeRow').classList.remove('hidden');
     V.toast('success','SMS bhej diya — code daalo');
   }catch(e){V.toast('error',V.friendErr(e));try{this.vrecap&&this.vrecap.reset()}catch(e2){}}
 },
 twoFaVerify:async function(){
   var code=V.g('v2faCode').value.trim();
   if(!code||!this._vId)return V.toast('error','Pehle SMS request karo');
   try{
     var cred=firebase.auth.PhoneAuthProvider.credential(this._vId,code);
     var assertion=firebase.auth.PhoneMultiFactorGenerator.assertion(cred);
     await auth.currentUser.multiFactor.enroll(assertion,(me.displayName||'VEXA')+' phone');
     V.mClose();V.toast('success','🛡️ 2-Step Verification enabled!');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 twoFaUnenroll:function(factorUid){
   if(!confirm('Remove this 2FA method?'))return;
   var mf=auth.currentUser.multiFactor;
   var f=(mf.enrolledFactors||[]).filter(function(x){return x.uid===factorUid})[0];
   if(!f)return V.toast('error','Factor not found');
   mf.unenroll(f).then(function(){V.mClose();V.toast('success','2FA method removed');setTimeout(function(){VexaSec.twoFaOpen()},400)})
    .catch(function(e){V.toast('error',V.friendErr(e))});
 },
 /* login-time challenge — Auth.login error hook इसे call करेगा */
 twoFaChallenge:function(resolver){
   var self=this;
   V.mOpen('🛡️ 2-Step Verification','<div class="tc mb8">Account protected hai — SMS code daalo</div>'
    +'<div id="v2faLRecap"></div>'
    +'<div class="fld mt8"><label class="flbl">6-digit code</label><input class="inp mono" id="v2faLCode" maxlength="6" inputmode="numeric" autocomplete="one-time-code"></div>'
    +'<button class="btn bp bbk mt8" onclick="VexaSec.twoFaChallengeResolve()">Verify →</button>');
   try{
     this._lrecap=new firebase.auth.RecaptchaVerifier('v2faLRecap',{size:'normal'});
     this._lrecap.render();
     this._lresolver=resolver;
     var provider=new firebase.auth.PhoneAuthProvider(auth);
     var hint=(resolver.hints&&resolver.hints[0])||null;
     provider.verifyPhoneNumber(hint?{multiFactorHint:hint,multiFactorSession:resolver.session}:{multiFactorSession:resolver.session},this._lrecap)
      .then(function(vid){self._lvid=vid;V.toast('info','SMS code bhej diya')})
      .catch(function(e){V.toast('error',V.friendErr(e))});
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 twoFaChallengeResolve:function(){
   var code=V.g('v2faLCode').value.trim();
   if(!code||!this._lvid||!this._lresolver)return V.toast('error','SMS pehle request karo');
   var self=this;
   try{
     var cred=firebase.auth.PhoneAuthProvider.credential(this._lvid,code);
     var assertion=firebase.auth.PhoneMultiFactorGenerator.assertion(cred);
     this._lresolver.resolveSignIn(assertion).then(function(){
       V.mClose();V.toast('success','2FA verified ✅');
     }).catch(function(e){V.toast('error',V.friendErr(e))});
   }catch(e){V.toast('error',V.friendErr(e))}
 },

 /* ─────────── B) REMOTE LOGOUT — Devices & Sessions (spec §7) ───────────
   Data: users/{uid}/devices/{devId} (existing) + users/{uid}/sessions/{sid} (existing)
   Remote kill: DB flag (instant, online clients) + backend revoke (tokens)   */
 myDevId:function(){return this._myDevId||null},
 mySid:function(){try{return sessionStorage.getItem('vexaSid')||null}catch(e){return null}},
 devicesOpen:async function(){
   var self=this;
   var w='<div class="spn" style="margin:18px auto"></div>';
   V.mOpen('📱 Devices & Sessions',w+'<button class="btn bds2 bbk" style="margin-top:12px" onclick="VexaSec.logoutAllOthers()">🚪 Logout all other devices</button>');
   try{
     var dv=await db.ref('users/'+V.uid+'/devices').get().catch(function(){return null});
     var ss=await db.ref('users/'+V.uid+'/sessions').get().catch(function(){return null});
     var myDev=this.myDevId(),mySid=this.mySid();
     var h='';
     if(dv&&dv.exists()){
       h+='<div class="stit">📱 Registered Devices</div>';
       dv.forEach(function(d){
         var v=d.val()||{};
         var cur=(d.key===myDev);
         var revoked=!!v.revoked;
         h+='<div class="sesc'+(revoked?' off':'')+'"><div class="si2"><div class="sesd">📱 '+V.esc(v.name||'Device')+(cur?' <span class="bver">THIS</span>':'')+'</div>'
          +'<div class="sesm">'+V.esc((v.ua||'').slice(0,60))+' · registered '+V.timeAgo(v.registeredAt)+(v.lastActive?' · active '+V.timeAgo(v.lastActive):'')+'</div></div>'
          +(revoked?'<span class="sm mut">revoked</span>':(cur?'<span class="sm mut">current</span>':'<button class="btn bds2 bsm" onclick="VexaSec.revokeDevice(\''+d.key+'\')">🚪 Logout</button>'))
          +'</div>';
       });
     }
     if(ss&&ss.exists()){
       h+='<div class="stit mt16">🧩 Active Web Sessions</div>';
       ss.forEach(function(s){
         var v=s.val()||{};
         var cur=(s.key===mySid);
         h+='<div class="sesc"><div class="si2"><div class="sesd">🌐 '+(cur?'This session':'Session '+s.key.slice(0,6))+'</div><div class="sesm">'+V.esc(v.device||'')+' · '+V.timeAgo(v.lastActive||v.at)+'</div></div>'
          +(cur?'<span class="sm mut">current</span>':'<button class="btn bds2 bsm" onclick="VexaSec.revokeSession(\''+s.key+'\')">🚪</button>')+'</div>';
       });
     }
     if(!h)h='<div class="empo"><div class="ei">📱</div><div class="et">No devices</div></div>';
     var b=V.g('mBody');
     if(b)b.innerHTML=h+'<button class="btn bds2 bbk" style="margin-top:12px" onclick="VexaSec.logoutAllOthers()">🚪 Logout all other devices</button>';
   }catch(e){var b2=V.g('mBody');if(b2)b2.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 },
 revokeDevice:async function(devId){
   if(!confirm('Is device ko logout karna hai?'))return;
   try{
     await db.ref('users/'+V.uid+'/devices/'+devId).update({revoked:true,revokedAt:Date.now(),revokedBy:V.uid});
     /* backend available → real token revoke (offline device bhi next login pe block) */
     if(VexaBackend.available()){try{await VexaBackend.call('revokeDevice',{deviceId:devId})}catch(e){console.warn('[remote-logout] backend:',e.message)}}
     V.toast('success','🚪 Device logged out remotely');
     this.devicesOpen();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 revokeSession:async function(sid){
   try{
     await db.ref('users/'+V.uid+'/sessions/'+sid+'/revoked').set(true);
     await db.ref('users/'+V.uid+'/sessions/'+sid+'/revokedAt').set(Date.now());
     V.toast('success','Session revoked');
     this.devicesOpen();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 logoutAllOthers:async function(){
   if(!confirm('SABHI dusre devices/sessions logout? (ye device active rahega)'))return;
   try{
     var kickRef=db.ref('users/'+V.uid+'/security/kickAt');
     await kickRef.set(Date.now());
     /* अपने device/session को exempt mark करो */
     var dId=this.myDevId(),sId=this.mySid();
     if(dId)try{await db.ref('users/'+V.uid+'/devices/'+dId+'/kickExemptAt').set(Date.now())}catch(e){}
     if(sId)try{await db.ref('users/'+V.uid+'/sessions/'+sId+'/kickExemptAt').set(Date.now())}catch(e){}
     if(VexaBackend.available()){try{await VexaBackend.call('logoutAllOthers',{})}catch(e){console.warn('[kick] backend:',e.message)}}
     V.toast('success','🚪 Sab devices pe logout command bhej diya');
     V.mClose();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 /* self-guard — har 30s + focus: khud ka device/session revoked? global kick?
   (V.requireAuth hook ise start karta hai) */
 startWatchdog:function(){
   var self=this;
   this._startedAt=Date.now();
   var check=async function(){
     try{
       if(!V.uid||!auth.currentUser)return;
       var dId=self.myDevId(),sId=self.mySid();
       var checks=[];
       if(dId)checks.push(db.ref('users/'+V.uid+'/devices/'+dId).get());
       if(sId)checks.push(db.ref('users/'+V.uid+'/sessions/'+sId).get());
       checks.push(db.ref('users/'+V.uid+'/security/kickAt').get());
       var rs=await Promise.all(checks);
       var kicked=false,reason='';
       rs.forEach(function(r){
         if(!r||!r.exists())return;
         var v=r.val();
         if(r.key==='kickAt'){
           var exempt=0;
           if(dId&&v-0>0){/* kickAt global hai — exempt per device/session node se */}
           if(v>(self._startedAt-15000))kicked=true,reason='Security logout (all devices)';
         }else{
           if(v&&v.revoked){kicked=true,reason='Device/session remotely logged out'}
         }
       });
       /* exempt check: khud ke exempt timestamp kickAt se naya ho to skip */
       if(kicked&&rs.length){
         try{
           var ex1=dId?await db.ref('users/'+V.uid+'/devices/'+dId+'/kickExemptAt').get():null;
           var ex2=sId?await db.ref('users/'+V.uid+'/sessions/'+sId+'/kickExemptAt').get():null;
           var exMax=Math.max(ex1&&ex1.exists()?ex1.val():0,ex2&&ex2.exists()?ex2.val():0);
           var kick=0;rs.forEach(function(r){if(r&&r.key==='kickAt'&&r.exists())kick=r.val()});
           if(exMax>=kick)kicked=false;
         }catch(e){}
       }
       if(kicked){
         V.toast('warning','🚪 '+reason,6000);
         try{await db.ref('presence/'+V.uid).update({online:false,lastSeen:Date.now()})}catch(e){}
         try{await auth.signOut()}catch(e){}
         setTimeout(function(){location.reload()},1500);
       }
     }catch(e){}
   };
   var self2=this;
   setInterval(check,30000);
   window.addEventListener('focus',check);
 },
 /* device registration helper — login pe existing code se pehle call */
 registerDevice:async function(uid){
   if(!uid)return;
   try{
     var dId='dev_'+(await V.sha(V.dev()+navigator.userAgent)).slice(0,16);
     this._myDevId=dId;
     var r=db.ref('users/'+uid+'/devices/'+dId);
     var ex=await r.get();
     if(ex.exists()){await r.update({lastActive:Date.now(),revoked:false})}
   }catch(e){}
 },

 /* ─────────── C) RECOVERY CENTER — single-use HASHED codes (spec §10) ───────────
   REPLACES old plaintext remember-code center:
   - 10 single-use codes → sirf SHA-256 hashes DB me (users ya vault me plaintext NAHI)
   - Legacy plaintext purge (recoveryPrivate ka password/codes DELETE — security fix)
   - Use-at-login: backend `recoverWithCode` (hash server verify → custom token)    */
 recoveryOpen:async function(){
   var h='';
   var codes=null;
   try{
     var s=await db.ref('recoveryCodes/'+V.uid).get();
     codes=s.exists()?s.val():null;
   }catch(e){}
   var total=0,used=0;
   if(codes){for(var k in codes){total++;if(codes[k].used)used++}}
   h+='<div class="tc mb8">🔐 Recovery Center — Single-use Codes</div>'
    +'<div class="snote">Har code <b>EK BAAR</b> use hota hai. DB me sirf <b>hash</b> store hota hai — plaintext kahin nahi.</div>';
   h+='<div class="srow" onclick="VexaSec.recoveryGenerate()"><div class="sri">🎲</div><div class="srf"><div class="srt">'+(total?'Regenerate 10 codes':'Generate 10 recovery codes')+'</div><div class="srs">Purane codes cancel ho jayenge</div></div><div class="sra">›</div></div>';
   if(total)h+='<div class="srow"><div class="sri">📊</div><div class="srf"><div class="srt">Codes status</div><div class="srs">'+(total-used)+' unused / '+total+' total</div></div></div>';
   h+='<div class="stit mt16">🧹 Security Cleanup (Legacy)</div>'
    +'<div class="srow" onclick="VexaSec.purgeLegacy()"><div class="sri">🧨</div><div class="srf"><div class="srt">Purge legacy plaintext secrets</div><div class="srs">recoveryPrivate (password/codes/email/dob) DB se DELETE</div></div><div class="sra">›</div></div>'
    +'<div class="stit mt16">🔑 Login with Recovery Code</div>'
    +'<div class="snote">Login screen → <b>Recovery Code Login</b> → email + ek unused code → auto-login + password reset.</div>'
    +'<div class="srow" onclick="VexaSec.recoveryDownload()"><div class="sri">💾</div><div class="srf"><div class="srt">Download codes TXT</div><div class="srs">Ek baar dikhte hain — file safe rakho</div></div><div class="sra">⬇️</div></div>';
   V.mOpen('🔐 Recovery Center',h);
 },
 recoveryGenerate:async function(){
   if(!confirm('10 naye single-use codes generate karein? Purane unused codes cancel.'))return;
   var codes=[];
   var ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   for(var i=0;i<10;i++){
     var c='';
     for(var b=0;b<2;b++){for(var x=0;x<4;x++)c+=ch[Math.floor(Math.random()*ch.length)];if(b===0)c+='-'}
     codes.push(c);
   }
   try{
     var up={};
     for(var j=0;j<codes.length;j++){
       var hsh=await V.sha(codes[j]);
       up[hsh]={used:false,createdAt:Date.now(),n:j+1};
     }
     /* अपने hi naye set ko overwrite — purane hashes हटो */
     await db.ref('recoveryCodes/'+V.uid).set(up);
     await db.ref('users/'+V.uid+'/securityEvents').push({type:'recovery_codes_generated',device:V.dev(),at:Date.now()});
     var h='<div class="snote mb8">⚠️ YE CODES ABHI KE BAAD KABHI NAHI DIKHENGE — copy/download kar lo!</div><div class="rcgrid">';
     codes.forEach(function(c){h+='<div class="rccode mono">'+c+'</div>'});
     h+='</div><div class="snote">Login pe: Recovery Code Login → email + code → auto-login.</div>';
     V.mOpen('🎲 Your 10 Recovery Codes',h,'<button class="btn bp" onclick="VexaSec.recoveryDownload(\'['+codes.join(',')+']\')">💾 Download TXT</button>');
     this._lastCodes=codes;
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 recoveryDownload:function(codesJson){
   var codes=this._lastCodes;
   if(!codes&&codesJson){try{codes=JSON.parse(codesJson)}catch(e){}}
   if(!codes||!codes.length)return V.toast('error','Pehle codes generate karo');
   var L='================================================\n'
    +'   AnimeTubePro Studio × VEXA\n'
    +'   SINGLE-USE RECOVERY CODES 🔐\n'
    +'================================================\n\n'
    +'Name     : '+(me.displayName||'')+'\n'
    +'Username : @'+(me.username||'')+'\n'
    +'VEXA ID  : '+(me.publicUserId||'-')+'\n'
    +'Date     : '+new Date().toLocaleString()+'\n\n'
    +'Har code SIRF EK BAAR use hota hai:\n\n'
    +codes.map(function(c,i){return (i+1)+'. '+c}).join('\n')
    +'\n\nLogin → Recovery Code Login → email + code\n'
    +'Ye file kisi ke saath SHARE mat karo!\n\nGenerated v'+Ver.get()+'\n';
   var blob=new Blob([L],{type:'text/plain;charset=utf-8'});
   var url=URL.createObjectURL(blob);
   var a=document.createElement('a');
   a.href=url;a.download='VEXA-RecoveryCodes-'+(me.username||'user')+'.txt';
   document.body.appendChild(a);a.click();
   setTimeout(function(){try{document.body.removeChild(a);URL.revokeObjectURL(url)}catch(e){}},200);
 },
 /* legacy purge — recoveryPrivate plaintext DELETE (spec security rule) */
 purgeLegacy:async function(){
   if(!confirm('PERMANENT: recoveryPrivate/{password, codes, email, dob} aur users/{recovery/mainCode,secondaryCode} DELETE?\n\nOld staff-approval recovery (hash-based) kaam karti rahegi.'))return;
   try{
     var up={};
     up['recoveryPrivate/'+V.uid+'/password']=null;
     up['recoveryPrivate/'+V.uid+'/mainCode']=null;
     up['recoveryPrivate/'+V.uid+'/secondaryCode']=null;
     up['recoveryPrivate/'+V.uid+'/email']=null;
     up['recoveryPrivate/'+V.uid+'/dob']=null;
     up['users/'+V.uid+'/recovery/mainCode']=null;
     up['users/'+V.uid+'/recovery/secondaryCode']=null;
     await db.ref().update(up);
     await db.ref('users/'+V.uid+'/securityEvents').push({type:'legacy_secret_purge',device:V.dev(),at:Date.now()});
     V.toast('success','🧹 Legacy plaintext secrets purged — DB ab clean hai');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 /* login-screen flow — email + code → backend verify → custom token */
 recoveryLoginOpen:function(){
   V.mOpen('🔑 Recovery Code Login','<div class="snote mb8">Email + ek unused single-use code</div>'
    +'<div class="fld"><label class="flbl">Email</label><input type="email" class="inp" id="rcEmail" autocomplete="email"></div>'
    +'<div class="fld"><label class="flbl">Recovery code</label><input class="inp mono" id="rcCode" placeholder="XXXX-XXXX" style="text-transform:uppercase" autocapitalize="characters"></div>'
    +'<div class="fhint">Success → auto-login + naya password set karne ka prompt.</div>',
    '<button class="btn bp" onclick="VexaSec.recoveryLoginGo()">Verify →</button>');
 },
 recoveryLoginGo:async function(){
   var em=V.g('rcEmail').value.trim(),code=V.g('rcCode').value.trim().toUpperCase();
   if(!V.email(em)||!code)return V.toast('error','Email + code daalo');
   if(!VexaBackend.available())return V.toast('error','Recovery backend deploy nahi hai — staff approval flow use karo');
   var btnEvent=null;
   try{
     var j=await VexaBackend.call('recoverWithCode',{email:em,code:code});
     if(!j||!j.token)throw new Error('Token nahi mila');
     await auth.signInWithCustomToken(j.token);
     V.mClose();
     V.toast('success','✅ Verified! Ab naya password set karo',5000);
     /* custom-token login के बाद password reset flow — email link bhej dena best */
     try{await auth.currentUser.sendPasswordResetEmail(em)}catch(e){}
     V.toast('info','Password reset email bhej diya — email check karo');
   }catch(e){
     V.toast('error',(e.message==='Invalid code'||/code/i.test(e.message||''))?'❌ Invalid ya already-used code':V.friendErr(e));
   }
 }
};
window.VexaSec=VexaSec;

/* ═══════════════ 6) VEXA GROUP — COMPLETE GROUP CHAT (spec §9) ═══════════════
   DB:
     groups/{gid}            : {name,photo,description,createdBy,createdAt,
                                members/{uid}/{role,joinedAt,addedBy},memberCount,
                                lastMessage,lastSender,lastSenderName,updatedAt,
                                unread/{uid}:count}
     groupMessages/{gid}/{mid}: {senderId,senderName,text,type:'text'|'image'|'video'|'system',
                                imageUrl,video,createdAt,deleted,deletedBy}
     users/{uid}/groups/{gid}: {updatedAt}        ← per-user index (fast list)
     groupInvites/{uid}/{iid}: {gid,name,from,fromName,at,status}
   Roles: owner(creator) > admin > member — role हमेशा DB से पढ़ा जाता है (client trust नहीं)
   Media: images → Supabase-3 guilds bucket; videos → Google Drive metadata      */
const VexaGroup={
 gid:null,_unsubs:[],_msgCache:{},
 /* ── permission helpers (DB-verified) ── */
 roleOf:function(gdata,uid){
   var m=gdata&&gdata.members&&gdata.members[uid];
   return (m&&m.role)||null; /* null = member nahi */
 },
 can:function(role,action){
   var lvl={member:1,admin:2,owner:3}[role]||0;
   var need={send:1,addImage:1,addVideo:1,delOwn:1,delAny:2,removeMember:2,invite:2,editInfo:2,promote:3,removeGroup:3}[action]||99;
   return lvl>=need;
 },
 /* ── CREATE ── */
 createOpen:function(){
   V.mOpen('👥 New Group','<div class="pup"><div class="ava lg" id="gAvaP" onclick="document.getElementById(\'gPhotoF\').click()" role="button" tabindex="0" aria-label="Group photo">📷</div><input type="file" id="gPhotoF" accept="image/jpeg,image/png,image/webp" class="hidden" onchange="VexaGroup._photoPrev(this)"><span class="sm mut">Group photo (≤200KB)</span></div>'
    +'<div class="fld"><label class="flbl">Group name</label><input class="inp" id="gName" maxlength="40" placeholder="e.g. Anime Squad"></div>'
    +'<div class="fld"><label class="flbl">Description (optional)</label><textarea class="txta" id="gDesc" maxlength="200"></textarea></div>',
    '<button class="btn bp" onclick="VexaGroup.create()">Create Group</button>');
 },
 _photoPrev:function(inp){
   if(!inp.files||!inp.files[0])return;
   var self=this;
   V.compress(inp.files[0],190).then(function(du){
     try{VexaStorage.validate(du)}catch(e){return V.toast('error',e.message)}
     self._photo=du;
     var a=V.g('gAvaP');a.style.backgroundImage='url('+du+')';a.textContent='';
   }).catch(function(e){V.toast('error',e.message)});
 },
 create:async function(){
   var name=V.g('gName').value.trim();
   if(!name)return V.toast('error','Group name daalo');
   try{
     var gid=db.ref('groups').push().key;
     var g={name:name,description:(V.g('gDesc').value||'').trim(),createdBy:V.uid,createdAt:firebase.database.ServerValue.TIMESTAMP,
       members:{},memberCount:1,unread:{},lastMessage:'',updatedAt:firebase.database.ServerValue.TIMESTAMP};
     g.members[V.uid]={role:'owner',joinedAt:Date.now(),addedBy:'self'};
     await db.ref('groups/'+gid).set(g);
     await db.ref('users/'+V.uid+'/groups/'+gid).set({updatedAt:Date.now()});
     if(this._photo){
       try{await db.ref('groups/'+gid+'/photo').set(await VexaStorage.uploadGuildImage(this._photo,gid))}catch(e){console.warn('gphoto:',e.message)}
       this._photo=null;
     }
     await db.ref('groupMessages/'+gid).push({type:'system',text:'👥 Group created by '+(me.displayName||'user'),senderId:V.uid,createdAt:firebase.database.ServerValue.TIMESTAMP});
     V.mClose();V.toast('success','🎉 Group created!');
     this.openWith(gid);
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 /* ── INVITES (username / VEXA-ID से; notification accept) ── */
 inviteOpen:async function(){
   if(!this.gid)return;
   var self=this;
   var gd=(await db.ref('groups/'+this.gid).get()).val()||{};
   var role=this.roleOf(gd,V.uid);
   if(!this.can(role,'invite'))return V.toast('warning','Sirf Admin/Owner invite kar sakte hain');
   V.mOpen('➕ Add Members — '+gd.name,'<div class="fld"><label class="flbl">Username ya VEXA ID (numeric)</label><input class="inp" id="giWho" placeholder="@username ya 1000001" autocapitalize="none"></div>'
    +'<div class="fhint">User ko notification jayega — accept karega to member ban jayega.</div>',
    '<button class="btn bp" onclick="VexaGroup.inviteSend()">Send Invite</button>');
 },
 inviteSend:async function(){
   var who=V.g('giWho').value.trim().toLowerCase().replace('@','');
   if(!who)return V.toast('error','Username ya ID daalo');
   var targetUid=null;
   try{
     if(/^\d+$/.test(who)){
       var s=await db.ref('publicIds/'+parseInt(who,10)).get();
       if(s.exists())targetUid=s.val();
     }else{
       var u=await db.ref('usernames/'+who).get();
       if(u.exists())targetUid=u.val();
     }
   }catch(e){}
   if(!targetUid)return V.toast('error','User nahi mila');
   if(targetUid===V.uid)return V.toast('warning','Khud ko invite nahi');
   var gd=(await db.ref('groups/'+this.gid).get()).val()||{};
   if(gd.members&&gd.members[targetUid])return V.toast('warning','Already a member');
   try{
     await db.ref('groupInvites/'+targetUid).push({gid:this.gid,name:gd.name||'Group',from:V.uid,fromName:me.displayName||'user',at:Date.now(),status:'pending'});
     await db.ref('users/'+targetUid+'/notifications').push({type:'group_invite',title:'👥 Group Invite',body:(me.displayName||'Someone')+' ne '+gd.name+' me invite kiya',from:V.uid,gid:this.gid,read:false,at:Date.now()});
     V.mClose();V.toast('success','📨 Invite sent!');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 inviteAccept:async function(iid,gid){
   try{
     var s=await db.ref('groupInvites/'+V.uid+'/'+iid).get();
     if(!s.exists())return;
     var inv=s.val();
     var g=await db.ref('groups/'+gid).get();
     if(!g.exists()){await db.ref('groupInvites/'+V.uid+'/'+iid).remove();return V.toast('error','Group deleted')}
     await db.ref('groups/'+gid+'/members/'+V.uid).set({role:'member',joinedAt:Date.now(),addedBy:inv.from});
     await db.ref('groups/'+gid+'/memberCount').transaction(function(n){return (n||1)+1});
     await db.ref('users/'+V.uid+'/groups/'+gid).set({updatedAt:Date.now()});
     await db.ref('groupInvites/'+V.uid+'/'+iid).update({status:'accepted'});
     await db.ref('groupMessages/'+gid).push({type:'system',text:'✅ '+(me.displayName||'User')+' joined the group',senderId:V.uid,createdAt:firebase.database.ServerValue.TIMESTAMP});
     V.toast('success','🎉 Joined '+inv.name+'!');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 inviteDecline:async function(iid){try{await db.ref('groupInvites/'+V.uid+'/'+iid).update({status:'declined'})}catch(e){}V.toast('info','Declined')},
 /* ── OPEN + MESSAGE LIST (chatV panel reuse) ── */
 active:function(){return !!this.gid},
 openWith:async function(gid){
   var self=this;
   try{
     var gs=await db.ref('groups/'+gid).get();
     if(!gs.exists())return V.toast('error','Group not found');
     var g=gs.val();
     if(!this.roleOf(g,V.uid))return V.toast('warning','You are not a member');
     this.close();
     this.gid=gid;
     ChatUI._groupMode=true;
     /* header */
     V.g('cvAva').style.backgroundImage=g.photo?('url("'+g.photo+'")'):'';
     V.g('cvAva').textContent=g.photo?'':'👥';
     V.g('cvName').textContent=g.name||'Group';
     var mc=g.memberCount||Object.keys(g.members||{}).length;
     V.g('cvSt').textContent=mc+' members';
     /* call buttons hide (1:1 only) — chhota DOM tweak */
     var hdr=V.g('chatV').querySelector('.chd');
     if(hdr){hdr.querySelectorAll('.bico[aria-label="Voice call"],.bico[aria-label="Video call"]').forEach(function(b){b.style.display='none'})}
     V.g('chatV').classList.add('open');
     V.g('feye').classList.remove('show');
     /* messages */
     V.g('cmsgs').innerHTML='<div class="spn" style="margin:20px auto"></div>';
     var r=db.ref('groupMessages/'+gid).limitToLast(150);
     var cb=r.on('value',function(s){
       var w=V.g('cmsgs');if(!w)return;
       w.innerHTML='';
       var lastD='';
       s.forEach(function(m){
         var v=m.val();
         var d=V.dateDiv(v.createdAt||Date.now());
         if(d!==lastD){w.insertAdjacentHTML('beforeend','<div class="ddiv">'+d+'</div>');lastD=d}
         w.insertAdjacentHTML('beforeend',self.bubble(m.key,v,g));
       });
       w.scrollTop=w.scrollHeight;
       try{db.ref('groups/'+gid+'/unread/'+V.uid).set(0)}catch(e){}
     });
     this._unsubs.push(function(){r.off('value',cb)});
     this.emojiBind();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 emojiBind:function(){
   /* input events are shared — ChatUI.send hook se route hota hai */
 },
 afterSend:async function(gid,lastMsg,senderId){
   var now=firebase.database.ServerValue.TIMESTAMP;
   var gd=(await db.ref('groups/'+gid).get()).val()||{};
   var members=gd.members||{};
   var up={lastMessage:(lastMsg||'').slice(0,80),lastSender:senderId,lastSenderName:me.displayName||'user',updatedAt:now};
   await db.ref('groups/'+gid).update(up);
   var self=this;
   var un={};
   for(var uid in members){
     if(uid===senderId)continue;
     un[uid]=db.ref('groups/'+gid+'/unread/'+uid).transaction(function(n){return (n||0)+1});
   }
   /* per-user group index touch */
   for(var uid2 in members){
     if(uid2===senderId)continue;
     try{db.ref('users/'+uid2+'/groups/'+gid).set({updatedAt:Date.now()})}catch(e){}
   }
 },
 send:function(){
   var t=V.g('cInput').value.trim();
   if(!t||!this.gid)return;
   V.g('cInput').value='';V.g('cInput').style.height='auto';
   var gid=this.gid;
   db.ref('groupMessages/'+gid).push({senderId:V.uid,senderName:me.displayName||'user',text:t,type:'text',createdAt:firebase.database.ServerValue.TIMESTAMP})
    .then(function(){return VexaGroup.afterSend(gid,t,V.uid)})
    .catch(function(){V.toast('error','Send fail — net check karo');V.g('cInput').value=t});
 },
 /* image message (guilds bucket) */
 sendImage:function(){
   var self=this;
   if(!this.gid)return;
   var i=document.createElement('input');
   i.type='file';i.accept='image/jpeg,image/png,image/webp';
   i.onchange=async function(){
     if(!i.files||!i.files[0])return;
     V.toast('info','Uploading…');
     try{
       var du=await V.compress(i.files[0],190);
       var url=await VexaStorage.uploadGroupChatImage(du,self.gid,V.uid);
       var gid=self.gid;
       await db.ref('groupMessages/'+gid).push({senderId:V.uid,senderName:me.displayName||'user',type:'image',imageUrl:url,text:'🖼️ Photo',createdAt:firebase.database.ServerValue.TIMESTAMP});
       await self.afterSend(gid,'🖼️ Photo',V.uid);
       V.toast('success','🖼️ Photo sent');
     }catch(e){V.toast('error',e.message||'Upload fail')}
   };
   i.click();
 },
 /* video message (Drive) */
 sendVideo:function(){
   var self=this;
   if(!this.gid)return;
   V.mOpen('🎬 Video Message','<div class="snote mb8">Google Drive se video attach karo (metadata only — video bytes app pe upload nahi hote)</div>'
    +'<div class="rrow" onclick="V.mClose();VexaDrive.selectGoogleDriveFile()">📁 Drive se choose karo (Picker)</div>'
    +'<div class="rrow" onclick="V.mClose();VexaGroup._uploadVideoLocal()">⬆️ Device se upload → Drive</div>'
    +'<div class="rrow" onclick="V.mClose();VexaDrive._manualPick()">🔗 Drive link paste karo</div>'
    +'<div class="fhint mt8">Drive connect nahi hai? Pehli baar Google OAuth popup khulega.</div>');
   VexaDrive.onPicked=function(meta){
     var gid=self.gid;
     V.toast('info','Sending…');
     VexaDrive.sendVideoMessage(gid,meta,true).then(function(){V.toast('success','🎬 Video sent')}).catch(function(e){V.toast('error',e.message)});
   };
 },
 _uploadVideoLocal:function(){
   var self=this;
   var i=document.createElement('input');
   i.type='file';i.accept='video/*';
   i.onchange=function(){
     if(!i.files||!i.files[0])return;
     V.mOpen('⬆️ Uploading to Drive','<div class="tc"><div class="spinner lg" style="margin:14px auto"></div><div id="vupPct" style="font-weight:800;font-size:20px">0%</div><div class="sm mut">Video apne Google Drive me VEXA folder me jaayega</div></div>');
     VexaDrive.uploadVideoToGoogleDrive(i.files[0],function(p){
       var el=V.g('vupPct');if(el)el.textContent=p+'%';
     }).then(function(meta){
       V.mClose();
       var gid=self.gid;
       VexaDrive.sendVideoMessage(gid,meta,true).then(function(){V.toast('success','🎬 Video sent (private — Allow viewing se share karo)')}).catch(function(e){V.toast('error',e.message)});
     }).catch(function(e){V.mClose();V.toast('error',e.message)});
   };
   i.click();
 },
 /* ── BUBBLE RENDER (roles/media/system aware) ── */
 bubble:function(id,m,g){
   var meM=(m.senderId===V.uid);
   var role=(m.senderId&&g&&g.members&&g.members[m.senderId]&&g.members[m.senderId].role)||'member';
   var rtag=role==='owner'?' <span class="gtag gtag-o">OWNER</span>':role==='admin'?' <span class="gtag gtag-a">ADMIN</span>':'';
   var meta=V.clock(m.createdAt);
   var inner='';
   if(m.type==='system')return '<div class="mrow sys"><div class="msys">'+V.esc(m.text||'')+'</div></div>';
   if(m.type==='image')inner='<img class="mimg" src="'+V.esc(m.imageUrl||'')+'" loading="lazy" onclick="Posts.view(\''+V.esc(m.imageUrl||'')+'\')">';
   else if(m.type==='video')inner=VexaDrive.bubbleHtml(m);
   else inner=(m.deleted?'<span class="mdel">🚫 deleted</span>':V.esc(m.text||''))+(m.edited?'<span class="medt"> (edited)</span>':'');
   return '<div class="mrow '+(meM?'me':'them')+'" data-mid="'+id+'">'
    +'<div class="mbub">'
    +(meM?'':'<div class="gwho" onclick="V.openProfile(\''+m.senderId+'\')">'+V.esc(m.senderName||'User')+rtag+'</div>')
    +inner
    +'<div class="mmet">'+meta+'</div>'
    +'<span class="mrbar" id="rb-'+id+'"><span onclick="VexaGroup.delMsg(\''+id+'\')">🗑️</span></span>'
    +'</div></div>';
 },
 delMsg:async function(id){
   var self=this;
   var gs=(await db.ref('groups/'+this.gid).get()).val()||{};
   var role=this.roleOf(gs,V.uid);
   var m=(await db.ref('groupMessages/'+this.gid+'/'+id).get()).val()||{};
   if(m.senderId!==V.uid&&!this.can(role,'delAny'))return V.toast('warning','Sirf Admin/Owner kisi ka message delete kar sakte hain');
   if(!confirm('Delete this message?'))return;
   await db.ref('groupMessages/'+this.gid+'/'+id).update({text:'',deleted:true,deletedBy:V.uid});
 },
 /* ── MEMBERS + MODERATION ── */
 membersOpen:async function(){
   if(!this.gid)return;
   var gd=(await db.ref('groups/'+this.gid).get()).val()||{};
   var myRole=this.roleOf(gd,V.uid);
   var members=gd.members||{};
   var h='<div class="stit">'+(gd.memberCount||Object.keys(members).length)+' Members</div>';
   var keys=Object.keys(members);
   var self=this;
   var us=await Promise.all(keys.map(function(k){return db.ref('users/'+k).get().catch(function(){return null})}));
   keys.forEach(function(k,i){
     var u=(us[i]&&us[i].val())||{displayName:'User'};
     var role=members[k].role;
     var h2='';
     if(myRole==='owner'&&k!==V.uid){
       h2=role==='admin'
        ?'<button class="btn bds2 bsm" onclick="VexaGroup.setRole(\''+k+'\',\'member\')">⬇ Demote</button>'
        :'<button class="btn bg bsm" onclick="VexaGroup.setRole(\''+k+'\',\'admin\')">⬆ Make Admin</button>';
       h2+='<button class="btn bds2 bsm" onclick="VexaGroup.removeMember(\''+k+'\')">🗑️</button>';
     }else if((myRole==='admin')&&k!==V.uid&&role==='member'){
       h2='<button class="btn bds2 bsm" onclick="VexaGroup.removeMember(\''+k+'\')">🗑️</button>';
     }
     var rtag=role==='owner'?' <span class="gtag gtag-o">OWNER</span>':role==='admin'?' <span class="gtag gtag-a">ADMIN</span>':'';
     h+='<div class="urow">'+V.ava(u,'sm')+'<div class="uinf"><div class="unm" onclick="V.openProfile(\''+k+'\')">'+V.nameB(u)+rtag+'</div><div class="uun">@'+V.esc(u.username||'')+(u.publicUserId?' · ID '+u.publicUserId:'')+'</div></div>'+h2+'</div>';
   });
   var own=myRole==='owner'?'<button class="btn bds2 bbk" style="margin-top:12px" onclick="VexaGroup.deleteGroup()">💥 Delete Group</button>':'';
   var leave=(myRole!=='owner')?'<button class="btn bds2 bbk" style="margin-top:12px" onclick="VexaGroup.leave()">🚪 Leave Group</button>':'';
   V.mOpen('👥 Members',h+own+leave,'<button class="btn bp" onclick="V.mClose();VexaGroup.inviteOpen()">➕ Add Member</button>');
 },
 setRole:async function(uid,role){
   try{
     await db.ref('groups/'+this.gid+'/members/'+uid+'/role').set(role);
     await db.ref('groupMessages/'+this.gid).push({type:'system',text:role==='admin'?'⬆ '+(me.displayName||'User')+' ne ek member ko ADMIN banaya':'⬇ '+(me.displayName||'User')+' ne ek member ko demote kiya',senderId:V.uid,createdAt:firebase.database.ServerValue.TIMESTAMP});
     V.toast('success','Role updated');this.membersOpen();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 removeMember:async function(uid){
   if(!confirm('Remove this member?'))return;
   try{
     var g=(await db.ref('groups/'+this.gid).get()).val()||{};
     if(g.members&&g.members[uid]&&g.members[uid].role==='owner')return V.toast('error','Owner ko remove nahi kar sakte');
     await db.ref('groups/'+this.gid+'/members/'+uid).remove();
     await db.ref('groups/'+this.gid+'/memberCount').transaction(function(n){return Math.max(1,(n||2)-1)});
     await db.ref('users/'+uid+'/groups/'+this.gid).remove();
     await db.ref('groupMessages/'+this.gid).push({type:'system',text:'🚪 '+(me.displayName||'User')+' ne ek member ko nikala',senderId:V.uid,createdAt:firebase.database.ServerValue.TIMESTAMP});
     V.toast('success','Member removed');this.membersOpen();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 leave:async function(){
   if(!confirm('Group chhodna hai?'))return;
   try{
     await db.ref('groups/'+this.gid+'/members/'+V.uid).remove();
     await db.ref('groups/'+this.gid+'/memberCount').transaction(function(n){return Math.max(1,(n||2)-1)});
     await db.ref('users/'+V.uid+'/groups/'+this.gid).remove();
     this.close();ChatUI.load();
     V.toast('info','Group left');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 deleteGroup:async function(){
   if(!confirm('GROUP PERMANENTLY DELETE? (messages + members sab)'))return;
   try{
     var gid=this.gid;
     var g=(await db.ref('groups/'+gid).get()).val()||{};
     var members=g.members||{};
     var up={};
     up['groups/'+gid]=null;
     up['groupMessages/'+gid]=null;
     for(var uid in members){up['users/'+uid+'/groups/'+gid]=null}
     await db.ref().update(up);
     /* guild media cleanup (best-effort) */
     try{VexaStorage.removeMany('guilds',['guilds/'+gid]).catch(function(){})}catch(e){}
     this.close();ChatUI.load();
     V.toast('success','Group deleted');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 optsOpen:function(){
   V.mOpen('Group options',
    '<div class="rrow" onclick="V.mClose();VexaGroup.membersOpen()">👥 Members & Roles</div>'
    +'<div class="rrow" onclick="V.mClose();VexaGroup.inviteOpen()">➕ Add Member (invite)</div>'
    +'<div class="rrow" onclick="V.mClose();VexaGroup.sendImage()">🖼️ Send Photo</div>'
    +'<div class="rrow" onclick="V.mClose();VexaGroup.sendVideo()">🎬 Send Drive Video</div>'
    +'<div class="rrow" onclick="V.mClose();VexaGroup.muteToggle()">🔕 Mute / Unmute</div>');
 },
 muteToggle:async function(){
   V.mClose();
   var ex=false;
   try{ex=(await db.ref('users/'+V.uid+'/muted/'+this.gid).get()).exists()}catch(e){}
   try{
     if(ex)await db.ref('users/'+V.uid+'/muted/'+this.gid).remove();
     else await db.ref('users/'+V.uid+'/muted/'+this.gid).set(true);
     V.toast('success',ex?'Unmuted':'Muted');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 /* ── CLOSE ── */
 close:function(){
   this._unsubs.forEach(function(fn){try{fn()}catch(e){}});
   this._unsubs=[];
   this.gid=null;
   ChatUI._groupMode=false;
   /* call buttons wapas (1:1 header) */
   var hdr=V.g('chatV')&&V.g('chatV').querySelector('.chd');
   if(hdr){hdr.querySelectorAll('.bico[aria-label="Voice call"],.bico[aria-label="Video call"]').forEach(function(b){b.style.display=''})}
 },
 /* ── INVITES PANEL (profile/notif se) ──
    Notif module me type 'group_invite' icon already map ho — pending invites UI: */
 invitesOpen:async function(){
   var w='<div class="spn" style="margin:18px auto"></div>';
   V.mOpen('📨 Group Invites',w);
   try{
     var s=await db.ref('groupInvites/'+V.uid).get();
     var h='';
     if(s.exists()){
       var arr=[];
       s.forEach(function(c){if((c.val()||{}).status==='pending')arr.push({id:c.key,val:c.val()})});
       arr.sort(function(a,b){return (b.val.at||0)-(a.val.at||0)});
       arr.forEach(function(x){
         h+='<div class="urow"><div class="ava md">👥</div><div class="uinf"><div class="unm">'+V.esc(x.val.name||'Group')+'</div><div class="uun">from '+V.esc(x.val.fromName||'user')+' · '+V.timeAgo(x.val.at)+'</div></div>'
          +'<button class="btn bp bsm" onclick="VexaGroup.inviteAccept(\''+x.id+'\',\''+x.val.gid+'\')">✓</button> <button class="btn bds2 bsm" onclick="VexaGroup.inviteDecline(\''+x.id+'\')">✕</button></div>';
       });
     }
     var b=V.g('mBody');
     if(b)b.innerHTML=h||'<div class="empo"><div class="ei">📨</div><div class="et">No pending invites</div></div>';
   }catch(e){var b2=V.g('mBody');if(b2)b2.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 },
 /* ── CHAT LIST INTEGRATION — groups rows (ChatUI.load hook call karta hai) ── */
 listRows:async function(){
   var out=[];
   try{
     var idx=await db.ref('users/'+V.uid+'/groups').get().catch(function(){return null});
     if(!idx||!idx.exists())return out;
     var gids=[];
     idx.forEach(function(x){gids.push({gid:x.key,at:(x.val()&&x.val().updatedAt)||0})});
     var gs=await Promise.all(gids.map(function(e){return db.ref('groups/'+e.gid).get().catch(function(){return null})}));
     for(var i=0;i<gids.length;i++){
       var g=(gs[i]&&gs[i].val());
       if(!g||!g.members||!g.members[V.uid])continue; /* left/removed */
       out.push({gid:gids[i].gid,g:g,at:(g.updatedAt||gids[i].at||0)});
     }
   }catch(e){console.warn('[groups] list:',e.message)}
   return out;
 },
 rowHtml:function(o,locked,muted){
   var g=o.g;
   var un=(g.unread&&g.unread[V.uid])||0;
   var av=g.photo?'<div class="ava md" style="background-image:url(\''+V.esc(g.photo)+'\')"></div>':'<div class="ava md">👥</div>';
   return '<div class="crow" onclick="VexaGroup.openWith(\''+o.gid+'\')">'+av
    +'<div class="cri"><div class="crt"><div class="crn">'+V.esc(g.name||'Group')+' <span class="gtag">GROUP</span>'+(muted?' 🔕':'')+'</div><div class="crtm">'+V.timeAgo(g.updatedAt)+'</div></div>'
    +'<div class="crb"><div class="crp">'+((g.lastSender===V.uid?'You: ':((g.lastSenderName||'')?V.esc(g.lastSenderName)+': ':''))+V.esc(g.lastMessage||'Say hi 👋'))+'</div>'+(un?'<span class="cru">'+un+'</span>':'')+'</div></div></div>';
 }
};
window.VexaGroup=VexaGroup;

/* ═══════════════ 7) INTEGRATION LAYER — existing modules ke साथ glue ═══════════════
   कोई original function REWRITE नहीं — wrap (monkey-patch) किया गया है।
   Rollback: यह file हटाओ → सब original behaviour वापस।                            */
const VexaUI={
 videoTap:function(){
   /* chat input का 🎬 button — group/1:1 दोनों handle */
   if(window.VexaGroup&&VexaGroup.active())return VexaGroup.sendVideo();
   var cid=ChatUI.chatId;
   if(!cid)return V.toast('warning','Pehle chat open karo');
   V.mOpen('🎬 Video Message','<div class="snote mb8">Google Drive video attach karo (sirf metadata bheja jaata hai)</div>'
    +'<div class="rrow" onclick="V.mClose();VexaDrive.selectGoogleDriveFile()">📁 Drive se choose karo (Picker)</div>'
    +'<div class="rrow" onclick="V.mClose();VexaUI._uploadVideoLocal()">⬆️ Device se upload → Drive</div>'
    +'<div class="rrow" onclick="V.mClose();VexaDrive._manualPick()">🔗 Drive link paste karo</div>');
   VexaDrive.onPicked=function(meta){
     V.toast('info','Sending…');
     VexaDrive.sendVideoMessage(cid,meta,false).then(function(){V.toast('success','🎬 Video sent')}).catch(function(e){V.toast('error',e.message)});
   };
 },
 _uploadVideoLocal:function(){
   var i=document.createElement('input');
   i.type='file';i.accept='video/*';
   i.onchange=function(){
     if(!i.files||!i.files[0])return;
     V.mOpen('⬆️ Uploading to Drive','<div class="tc"><div class="spinner lg" style="margin:14px auto"></div><div id="vupPct" style="font-weight:800;font-size:20px">0%</div><div class="sm mut">Google Drive me VEXA-… naam se save hoga</div></div>');
     VexaDrive.uploadVideoToGoogleDrive(i.files[0],function(p){var el=V.g('vupPct');if(el)el.textContent=p+'%'})
      .then(function(meta){
        V.mClose();
        var cid=(window.VexaGroup&&VexaGroup.active())?VexaGroup.gid:ChatUI.chatId;
        var isG=window.VexaGroup&&VexaGroup.active();
        VexaDrive.sendVideoMessage(cid,meta,isG).then(function(){V.toast('success','🎬 Video sent (private — receiver tap karke "Allow viewing" maang sakta hai)')}).catch(function(e){V.toast('error',e.message)});
      }).catch(function(e){V.mClose();V.toast('error',e.message)});
   };
   i.click();
 },
 /* Picker script lazy-load (index.html me extra tag nahi) */
 boot:function(){
   var self=this;
   if(!VexaDrive._pickerApi&&!document.getElementById('gapiScript')){
     var s=document.createElement('script');
     s.id='gapiScript';s.src='https://apis.google.com/js/api.js';s.async=true;
     s.onerror=function(){console.warn('[VexaDrive] Picker API blocked — manual link fallback chalega')};
     document.head.appendChild(s);
   }
 }
};
window.VexaUI=VexaUI;

/* ── HOOKS (original wrap — koi rewrite nahi) ── */
(function vexaIntegrate(){
 function tryHook(fn){try{fn()}catch(e){console.warn('[vexa-hook]',e.message)}}

 /* 1) ChatUI.send → group mode route */
 tryHook(function(){
   if(typeof ChatUI==='undefined')return;
   var _send=ChatUI.send;
   ChatUI.send=function(){
     if(window.VexaGroup&&VexaGroup.active())return VexaGroup.send();
     return _send.apply(this,arguments);
   };
 });

 /* 2) ChatUI.bubble → video type (1:1) */
 tryHook(function(){
   if(typeof ChatUI==='undefined')return;
   var _bub=ChatUI.bubble;
   ChatUI.bubble=function(id,m){
     if(m&&m.type==='video'&&window.VexaDrive){
       var meM=(m.senderId===V.uid);
       var meta=V.clock(m.createdAt);
       if(meM)meta+='<span>'+(m.seen?'✓✓':'✓')+'</span>';
       return '<div class="mrow '+(meM?'me':'them')+'" data-mid="'+id+'"><div class="mbub">'
        +VexaDrive.bubbleHtml(m)+'<div class="mmet">'+meta+'</div></div></div>';
     }
     return _bub.apply(this,arguments);
   };
 });

 /* 3) ChatUI.close → group listeners clean */
 tryHook(function(){
   if(typeof ChatUI==='undefined')return;
   var _cl=ChatUI.close;
   ChatUI.close=function(){
     try{if(window.VexaGroup)VexaGroup.close()}catch(e){}
     return _cl.apply(this,arguments);
   };
 });

 /* 4) ChatUI.opts → group options route */
 tryHook(function(){
   if(typeof ChatUI==='undefined')return;
   var _op=ChatUI.opts;
   ChatUI.opts=function(){
     if(window.VexaGroup&&VexaGroup.active())return VexaGroup.optsOpen();
     return _op.apply(this,arguments);
   };
 });

 /* 5) ChatUI.viewProfile → group header tap = members */
 tryHook(function(){
   if(typeof ChatUI==='undefined')return;
   var _vp=ChatUI.viewProfile;
   ChatUI.viewProfile=function(){
     if(window.VexaGroup&&VexaGroup.active())return VexaGroup.membersOpen();
     return _vp.apply(this,arguments);
   };
 });

 /* 6) ChatUI.load → group rows merge (all-tab, top par) */
 tryHook(function(){
   if(typeof ChatUI==='undefined')return;
   var _ld=ChatUI.load;
   ChatUI.load=async function(){
     await _ld.apply(this,arguments);
     try{
       if(!window.VexaGroup||this.tabC!=='all')return;
       var rows=await VexaGroup.listRows();
       if(!rows.length)return;
       rows.sort(function(a,b){return b.at-a.at});
       var w=V.g('chatL');if(!w)return;
       var emp=w.querySelector('.empo');
       if(emp)emp.remove();
       var html=rows.map(function(r){return VexaGroup.rowHtml(r,false,false)}).join('');
       w.insertAdjacentHTML('afterbegin',html);
     }catch(e){console.warn('[groups-merge]',e.message)}
   };
 });

 /* 7) Settings.open → Security (NEW) group inject */
 tryHook(function(){
   if(typeof Settings==='undefined')return;
   var _so=Settings.open;
   Settings.open=function(){
     var r=_so.apply(this,arguments);
     setTimeout(function(){
       var pc=V.g('profC');if(!pc)return;
       if(document.getElementById('vexaSecGrp'))return;
       var pgc=pc.querySelector('.pgc');if(!pgc)return;
       var driveOn=window.VexaDrive&&VexaDrive.connected();
       var grp=document.createElement('div');
       grp.id='vexaSecGrp';grp.className='sgrp';
       grp.innerHTML='<div class="sgrp-title" style="color:var(--wn)">🔐 SECURITY — UPGRADED</div>'
        +'<div class="srow" onclick="VexaSec.devicesOpen()"><div class="sri">📱</div><div class="srf"><div class="srt">Devices & Sessions</div><div class="srs">Remote logout — dusre devices uda do</div></div><div class="sra">›</div></div>'
        +'<div class="srow" onclick="VexaSec.twoFaOpen()"><div class="sri">🛡️</div><div class="srf"><div class="srt">Two-Step Verification</div><div class="srs">SMS second factor (real Firebase 2FA)</div></div><div class="sra">›</div></div>'
        +'<div class="srow" onclick="VexaSec.recoveryOpen()"><div class="sri">🔐</div><div class="srf"><div class="srt">Recovery Center</div><div class="srs">Single-use hashed codes — purane se safe</div></div><div class="sra">›</div></div>'
        +'<div class="srow" onclick="VexaUI.vexaIdCopy()"><div class="sri">🔢</div><div class="srf"><div class="srt">My VEXA ID</div><div class="srs mono">'+V.esc(String((me&&me.publicUserId)||'…'))+'</div></div><div class="sra">📋</div></div>'
        +'<div class="srow" onclick="VexaGroup.invitesOpen()"><div class="sri">📨</div><div class="srf"><div class="srt">Group Invites</div><div class="srs">Pending group invites dekho</div></div><div class="sra">›</div></div>'
        +'<div class="srow" onclick="VexaGroup.createOpen()"><div class="sri">👥</div><div class="srf"><div class="srt">Create Group</div><div class="srs">Naya group banao</div></div><div class="sra">›</div></div>'
        +'<div class="srow" onclick="VexaDrive.'+(driveOn?'':'connect')+'GoogleDrive()"><div class="sri">🎬</div><div class="srf"><div class="srt">'+(driveOn?'Google Drive — Connected ✅':'Connect Google Drive')+'</div><div class="srs">Video messages ke liye</div></div><div class="sra">›</div></div>'
        +'<div class="srow" onclick="VexaUI.storageCheck()"><div class="sri">🧪</div><div class="srf"><div class="srt">Storage Check (3 buckets)</div><div class="srs">avatars / posts / guilds verify</div></div><div class="sra">›</div></div>';
       pgc.appendChild(grp);
     },60);
     return r;
   };
 });

 /* 8) Auth.login → 2FA challenge hook (surgical line script.js me bhi hai — yahan safe net) */
 tryHook(function(){
   if(typeof Auth==='undefined')return;
   /* NOTE: original Auth.login errors ko catch karke UI dikhata hai —
      2FA code 'auth/multi-factor-auth-required' msgMap me nahi tha.
      script.js me msgMap se pehle hook line add ki gayi hai (vexa2faHook).
      Yahan sirf global helper: */
   window.vexa2faHook=function(e){
     if(e&&e.code==='auth/multi-factor-auth-required'&&window.VexaSec){VexaSec.twoFaChallenge(e.resolver);return true}
     return false;
   };
 });

 /* 9) V.requireAuth → post-login upgrades (Id ensure, watchdog, device reg) */
 tryHook(function(){
   if(typeof V==='undefined')return;
   var _ar=V._authReal;
   V._authReal=function(cb){
     return _ar.call(this,async function(u){
       try{if(window.VexaSec){VexaSec.registerDevice(u.uid);VexaSec.startWatchdog()}}catch(e){}
       try{if(window.VexaId)VexaId.ensure(u.uid)}catch(e){}
       if(cb){try{cb(u)}catch(e){}}
     });
   };
 });

 /* 10) Notif icons — group_invite */
 tryHook(function(){
   if(typeof Notif==='undefined')return;
   Notif.icons.group_invite='👥';
   Notif.icons.group='👥';
 });

 /* 11) Search — numeric VEXA ID bhi search ho */
 tryHook(function(){
   if(typeof Search==='undefined')return;
   var _run=Search.run;
   Search.run=async function(){
     var inp=V.g('sInput');
     var q=(inp&&inp.value||'').trim();
     if(/^\d{5,12}$/.test(q)&&window.VexaId){
       var w=V.g('sRes');if(w)w.innerHTML='<div class="spn" style="margin:20px auto"></div>';
       var u=await VexaId.resolve(q);
       if(!w)return;
       if(u){
         var uid=null;
         try{uid=(await db.ref('usernames/'+(u.username||'')).get()).val()}catch(e){}
         w.innerHTML='<div class="urow">'+V.ava(u,'md')+'<div class="uinf"><div class="unm">'+V.nameB(u)+'</div><div class="uun">@'+V.esc(u.username||'')+' · VEXA ID '+q+'</div></div>'
          +'<button class="btn bp bsm" onclick="V.openProfile(\''+(uid||'')+'\')">View</button></div>';
       }else{
         w.innerHTML='<div class="empo" style="padding:18px"><div class="ei">🔍</div><div class="et">ID '+V.esc(q)+' se koi user nahi mila</div></div>';
       }
       return;
     }
     return _run.apply(this,arguments);
   };
 });
})();

/* VexaUI helpers used above */
VexaUI.vexaIdCopy=function(){V.copy(String((me&&me.publicUserId)||''),'VEXA ID copied!')};
VexaUI.storageCheck=function(){
  V.mOpen('🧪 Storage Check','<div class="spn" style="margin:18px auto"></div>');
  VexaStorage.verifyBuckets().then(function(res){
    var h='<div class="stit">Supabase Buckets</div>';
    for(var k in res){
      var r=res[k];
      h+='<div class="sesc"><div class="si2"><div class="sesd">'+(k==='avatars'?'1️⃣':k==='posts'?'2️⃣':'3️⃣')+' '+k+' → '+V.esc(r.bucket)+'</div>'
       +'<div class="sesm">'+(r.error?('❌ '+V.esc(r.error)):('HTTP '+r.http+' — '+V.esc(r.note||'')))+'</div></div></div>';
    }
    h+='<div class="snote mt8">Upload test karne ke liye: post photo / group photo / avatar change karo.<br>⚠️ Supabase-3 bucket ka naam dashboard me confirm karo — galat ho to VEXA_STORAGE.guilds.bucket badlo.</div>';
    var b=V.g('mBody');if(b)b.innerHTML=h;
  }).catch(function(e){var b2=V.g('mBody');if(b2)b2.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">'+V.esc(e.message)+'</div></div>'});
};

/* boot glue */
ATP.ready(function(){try{VexaUI.boot()}catch(e){}});
