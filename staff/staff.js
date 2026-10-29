/* ═══════════════════════════════════════════════════════════
   VEXA STAFF PANEL — staff.js (standalone — main site se ALAG)
   ─────────────────────────────────────────────────────────
   • Login: Firebase Auth + role guard (owner/admin/moderator)
   • Dashboard / Users / Reports / Tickets / Recovery / Tools
   • Same Firebase project — security RULES hi asli guard hain
   Deploy: /staff/ folder GitHub Pages pe — URL sirf staff ko
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* Firebase config — same project (vexa-b3a1d) */
const SP_CFG={
  apiKey:"AIzaSyDU-J6_YGJC1CUOr_v3ih_rqWGRyhqB4mw",
  authDomain:"vexa-b3a1d.firebaseapp.com",
  databaseURL:"https://vexa-b3a1d-default-rtdb.firebaseio.com",
  projectId:"vexa-b3a1d",
  storageBucket:"vexa-b3a1d.firebasestorage.app",
  messagingSenderId:"431099898297",
  appId:"1:431099898297:web:3adf83427e1b8c7f9c2e68"
};
/* Cloud Function endpoint (bulk migration — vexaBackend) */
const SP_BACKEND='https://us-central1-vexa-b3a1d.cloudfunctions.net/vexaBackend';
const STAFF_ROLES=['owner','admin','moderator'];

/* Supabase buckets (public URLs — probe only) */
const SP_BUCKETS=[
  {name:'avatars (vexa-media)',url:'https://ygbkjnwuvjcgdzbqwgwv.supabase.co',key:'sb_publishable__0S4cvfvVDrEnONXnuHjGQ_Yl_bjC-o',bucket:'vexa-media'},
  {name:'posts (vexa-posts)',url:'https://qrrcyvtvwjzhsdklxluh.supabase.co',key:'sb_publishable_xv8P8Lo3wwLCjO1GexlJtQ_oQBvT6m4',bucket:'vexa-posts'},
  {name:'guilds (vexa-chat-guild)',url:'https://kjsfenhmlhgdlhqipqts.supabase.co',key:'sb_publishable_t5BhzEaXtTCq5fkJfvzD0g_9v7As_Sd',bucket:'vexa-chat-guild'}
];

const SP={
  auth:null,db:null,me:null,myRole:null,tab:'dash',

  /* ── helpers ── */
  g:function(id){return document.getElementById(id)},
  esc:function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;')},
  timeAgo:function(ts){
    if(!ts)return'';
    var s=Math.floor((Date.now()-ts)/1000);
    if(s<60)return'now';if(s<3600)return Math.floor(s/60)+'m';
    if(s<86400)return Math.floor(s/3600)+'h';
    if(s<604800)return Math.floor(s/86400)+'d';
    return new Date(ts).toLocaleDateString();
  },
  toast:function(m,type){
    var t=document.createElement('div');
    t.className='sp-toast'+(type==='ok'?' ok':type==='err'?' err':'');
    t.textContent=m;
    this.g('spToast').appendChild(t);
    setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove()},250)},3000);
  },

  /* ═══════════ BOOT ═══════════ */
  boot:function(){
    firebase.initializeApp(SP_CFG);
    this.auth=firebase.auth();
    this.db=firebase.database();
    this.auth.onAuthStateChanged(function(u){
      if(u){SP.verifyStaff(u)}
      else{SP.g('spApp').classList.add('hidden');SP.g('spLogin').classList.remove('hidden')}
    });
  },

  login:function(){
    var em=this.g('lgEmail').value.trim(),pw=this.g('lgPw').value,btn=this.g('lgBtn'),err=this.g('lgErr');
    err.classList.remove('show');
    if(!em||!pw){err.textContent='Email aur password dono daalo';err.classList.add('show');return}
    btn.disabled=true;btn.textContent='Checking…';
    this.auth.signInWithEmailAndPassword(em,pw).then(function(){
      btn.disabled=false;btn.textContent='🔐 Sign In';
    }).catch(function(e){
      btn.disabled=false;btn.textContent='🔐 Sign In';
      err.textContent=(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password')?'Galat email ya password':(e.message||'Login failed');
      err.classList.add('show');
    });
  },

  /* verifyStaff neeche define hota hai (async role check) */
  logout:function(){
    this.auth.signOut().then(function(){location.reload()});
  },

  /* ═══════════ TABS ═══════════ */
  tab:function(t){
    this.tab=t;
    document.querySelectorAll('.sp-tab').forEach(function(x){x.classList.toggle('sel',x.dataset.t===t)});
    var R={dash:'renderDash',users:'renderUsers',reports:'renderReports',tickets:'renderTickets',recovery:'renderRecovery',tools:'renderTools'};
    if(this[R[t]])this[R[t]]();
  },

  /* ═══════════ 1) DASHBOARD ═══════════ */
  renderDash:function(){
    var M=this.g('spMain');
    M.innerHTML='<div class="sp-stit">📊 Dashboard</div><div class="stat-grid" id="dStats"><div class="sp-empty"><div class="ei">⏳</div><div class="et">Stats load ho rahe hain…</div></div></div>'
      +'<div class="sp-note">🛡️ <b>'+this.esc(this.me&&this.me.username||'Staff')+'</b> · role: <span class="badge '+this.myRole+'">'+this.myRole.toUpperCase()+'</span><br>Saare actions Firebase Rules se protected hain — sirf staff hi ye panel chala sakta hai.</div>';
    var self=this;
    Promise.all([
      this.db.ref('users').get(),
      this.db.ref('reports').get(),
      this.db.ref('supportTickets').get(),
      this.db.ref('recoveryRequests').get(),
      this.db.ref('groups').get()
    ]).then(function(rs){
      var users=(rs[0].exists()&&rs[0].val())||{},tot=0,banned=0,verified=0,staff=0;
      for(var k in users){var u=users[k]||{};tot++;if(u.banned)banned++;if(u.verified)verified++;if(STAFF_ROLES.indexOf(u.role||'')>-1)staff++}
      var reports=(rs[1].exists()&&rs[1].val())||{},openR=0;
      for(var r in reports){if((reports[r]||{}).status!=='closed'&&((reports[r]||{}).status||'open')!=='dismissed')openR++}
      var tickets=(rs[2].exists()&&rs[2].val())||{},openT=0;
      for(var t in tickets){if((tickets[t]||{}).status==='open')openT++}
      var recs=(rs[3].exists()&&rs[3].val())||{},openQ=0;
      for(var q in recs){if((recs[q]||{}).status==='pending')openQ++}
      var groups=(rs[4].exists()&&rs[4].val())||{};
      var h=''
        +self.stat('👥',tot,'Total Users')
        +self.stat('🚫',banned,'Banned')
        +self.stat('✔️',verified,'Verified')
        +self.stat('🛡️',staff,'Staff')
        +self.stat('🚨',openR,'Open Reports')
        +self.stat('🎫',openT,'Open Tickets')
        +self.stat('🔐',openQ,'Recovery Pending')
        +self.stat('👥',Object.keys(groups).length,'Groups');
      var box=self.g('dStats');if(box)box.innerHTML=h;
      self.badge('bdgReports',openR);self.badge('bdgTickets',openT);self.badge('bdgRecovery',openQ);
    }).catch(function(e){
      var box=self.g('dStats');
      if(box)box.innerHTML='<div class="sp-empty"><div class="ei">⚠️</div><div class="et">Stats fail: '+self.esc(e.message)+'</div></div>';
    });
  },
  stat:function(ic,n,l){return '<div class="stat"><div class="stat-i">'+ic+'</div><div class="stat-n">'+n+'</div><div class="stat-l">'+l+'</div></div>'},
  badge:function(id,n){var b=this.g(id);if(!b)return;if(n>0){b.textContent=n;b.classList.remove('hidden')}else b.classList.add('hidden')},

  /* ═══════════ 2) USERS ═══════════ */
  renderUsers:function(){
    var M=this.g('spMain');
    M.innerHTML='<div class="sp-stit">👤 Users</div>'
      +'<div class="sp-search"><input class="sp-inp mono" id="uQ" placeholder="username / UID / VEXA ID (number)" onkeydown="if(event.key===\'Enter\')SP.userSearch()">'
      +'<button class="sp-btn pri" onclick="SP.userSearch()">🔍 Search</button></div>'
      +'<div id="uRes"><div class="sp-empty"><div class="ei">🔎</div><div class="et">Username, UID ya VEXA ID se search karo</div></div></div>';
  },
  userSearch:function(){
    var q=this.g('uQ').value.trim(),box=this.g('uRes');
    if(!q)return this.toast('Pehle kuch likho');
    box.innerHTML='<div class="sp-empty"><div class="ei">⏳</div><div class="et">Searching…</div></div>';
    var self=this;
    var find=async function(){
      var uid=null;
      if(/^\d{5,12}$/.test(q)){
        var s=await self.db.ref('publicIds/'+q).get().catch(function(){return null});
        if(s&&s.exists())uid=s.val();
      }
      if(!uid){
        var s2=await self.db.ref('usernames/'+q.toLowerCase().replace(/^@/,'')).get().catch(function(){return null});
        if(s2&&s2.exists())uid=s2.val();
      }
      if(!uid&&q.length>=20)uid=q; /* direct UID paste */
      if(!uid)return null;
      var us=await self.db.ref('users/'+uid).get().catch(function(){return null});
      return (us&&us.exists())?Object.assign({uid:uid},us.val()):null;
    };
    find().then(function(u){
      if(!u){box.innerHTML='<div class="sp-empty"><div class="ei">❌</div><div class="et">User nahi mila</div></div>';return}
      box.innerHTML=self.userRow(u,true);
    }).catch(function(){box.innerHTML='<div class="sp-empty"><div class="ei">⚠️</div><div class="et">Search fail hui</div></div>'});
  },
  userRow:function(u,detail){
    var role=u.role||'user';
    var badges='<span class="badge '+role+'">'+role.toUpperCase()+'</span>';
    if(u.banned)badges+=' <span class="badge banned">BANNED</span>';
    if(u.verified)badges+=' <span class="badge answered">VERIFIED</span>';
    if(u.vip)badges+=' <span class="badge vip">VIP</span>';
    var h='<div class="sp-card"><div class="sp-row"><div class="sp-row-i">👤</div>'
      +'<div class="sp-row-b"><div class="sp-row-t">'+this.esc(u.displayName||'?')+' '+badges+'</div>'
      +'<div class="sp-row-s">@'+this.esc(u.username||'—')+' · UID <span class="mono">'+this.esc(u.uid)+'</span>'
      +(u.publicUserId?' · VEXA ID <span class="mono">'+this.esc(String(u.publicUserId))+'</span>':' · <i>no VEXA ID</i>')
      +(u.email?' · '+this.esc(u.email):'')+'</div></div></div>';
    if(detail){
      h+='<div class="sp-acts" style="margin-top:10px">'
        +'<button class="sp-btn '+(u.banned?'ok':'dng')+'" onclick="SP.userSet(\''+u.uid+'\',\'banned\','+(u.banned?'false':'true')+')">'+(u.banned?'✅ Unban':'🚫 Ban')+'</button>'
        +'<button class="sp-btn '+(u.verified?'warn':'ok')+'" onclick="SP.userSet(\''+u.uid+'\',\'verified\','+(u.verified?'false':'true')+')">'+(u.verified?'➖ Unverify':'✔️ Verify')+'</button>'
        +'<button class="sp-btn '+(u.vip?'warn':'ok')+'" onclick="SP.userSet(\''+u.uid+'\',\'vip\','+(u.vip?'false':'true')+')">'+(u.vip?'➖ VIP hatao':'👑 VIP do')+'</button>'
        +'<button class="sp-btn" onclick="SP.userResetPw(\''+this.esc(u.email||'')+'\')">📧 Reset Email</button>'
        +(this.myRole==='owner'?this.roleSel(u):'')
        +'</div>';
    }
    return h+'</div>';
  },
  roleSel:function(u){
    var h='<select class="sp-sel" style="width:auto;min-width:120px" onchange="SP.userRole(\''+u.uid+'\',this.value)">';
    var roles=['user','moderator','admin','owner'];
    for(var i=0;i<roles.length;i++)h+='<option value="'+roles[i]+'"'+((u.role||'user')===roles[i]?' selected':'')+'>'+roles[i]+'</option>';
    return h+'</select>';
  },
  userSet:async function(uid,key,val){
    var upd={};upd[key]=val;
    if(val){upd[key+'At']=Date.now();upd[key+'By']=this.auth.currentUser.uid}
    else{upd[key]=null;upd[key+'At']=null;upd[key+'By']=null}
    try{
      await this.db.ref('users/'+uid).update(upd);
      await this.db.ref('users/'+uid+'/notifications').push({type:'security',title:key==='banned'?(val?'🚫 Account Banned':'✅ Ban Removed'):(key==='vip'?'👑 VIP '+(val?'Enabled':'Removed'):'✔️ Verified '+(val?'✅':'Removed')),body:key+' → '+val,at:Date.now()});
      this.toast('Updated: '+key+' = '+val,'ok');
      this.userSearch();
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },
  userRole:async function(uid,role){
    if(this.myRole!=='owner')return this.toast('Sirf OWNER role badal sakta hai','err');
    try{
      await this.db.ref('users/'+uid+'/role').set(role);
      if(STAFF_ROLES.indexOf(role)>-1){
        await this.db.ref('staffIndex/'+uid).update({role:role,syncedAt:Date.now()});
      }else{
        await this.db.ref('staffIndex/'+uid).remove();
      }
      this.toast('Role set: '+role,'ok');
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },
  userResetPw:function(email){
    if(!email)return this.toast('User ka email nahi mila','err');
    this.auth.sendPasswordResetEmail(email).then(function(){SP.toast('Reset email bhej diya: '+email,'ok')})
      .catch(function(e){SP.toast('Fail: '+e.message,'err')});
  },

  /* ═══════════ 3) REPORTS ═══════════ */
  renderReports:function(){
    var M=this.g('spMain');
    M.innerHTML='<div class="sp-stit">🚨 Reports</div><div id="rList"><div class="sp-empty"><div class="ei">⏳</div><div class="et">Loading…</div></div></div>';
    var self=this;
    this.db.ref('reports').limitToLast(60).get().then(function(s){
      var box=self.g('rList');if(!box)return;
      if(!s.exists()){box.innerHTML='<div class="sp-empty"><div class="ei">✅</div><div class="et">Koi report nahi</div></div>';return}
      var arr=[];s.forEach(function(c){arr.push(Object.assign({id:c.key},c.val()))});
      arr.sort(function(a,b){return (b.at||0)-(a.at||0)});
      var h='';
      for(var i=0;i<arr.length;i++){
        var r=arr[i],st=r.status||'open';
        h+='<div class="sp-card"><div class="sp-row">'
          +'<div class="sp-row-i">'+(r.type==='post'?'📝':r.type==='group'?'👥':'👤')+'</div>'
          +'<div class="sp-row-b"><div class="sp-row-t">'+self.esc(r.target||'?')+' <span class="badge '+self.esc(st)+'">'+self.esc(st.toUpperCase())+'</span></div>'
          +'<div class="sp-row-s"><b>'+self.esc(r.reason||'other')+'</b>'+(r.details?' — '+self.esc(r.details):'')
          +'<br>by @'+self.esc(r.byName||'?')+' · '+self.timeAgo(r.at)+'</div></div></div>'
          +'<div class="sp-acts" style="margin-top:9px">'
          +'<button class="sp-btn" onclick="SP.reportStatus(\''+r.id+'\',\'reviewed\')">👀 Reviewed</button>'
          +'<button class="sp-btn ok" onclick="SP.reportStatus(\''+r.id+'\',\'actioned\')">✅ Action le liya</button>'
          +'<button class="sp-btn" onclick="SP.reportStatus(\''+r.id+'\',\'dismissed\')">🚫 Dismiss</button>'
          +'</div></div>';
      }
      box.innerHTML=h;
    }).catch(function(e){
      var box=self.g('rList');
      if(box)box.innerHTML='<div class="sp-empty"><div class="ei">⚠️</div><div class="et">Rules ne block kiya ya fail: '+self.esc(e.message)+'</div></div>';
    });
  },
  reportStatus:async function(id,st){
    try{await this.db.ref('reports/'+id).update({status:st,updatedAt:Date.now(),updatedBy:this.auth.currentUser.uid});this.toast('Report → '+st,'ok');this.renderReports()}
    catch(e){this.toast('Fail: '+e.message,'err')}
  },

  /* ═══════════ 4) TICKETS ═══════════ */
  renderTickets:function(){
    var M=this.g('spMain');
    M.innerHTML='<div class="sp-stit">🎫 Support Tickets</div><div id="tList"><div class="sp-empty"><div class="ei">⏳</div><div class="et">Loading…</div></div></div>';
    var self=this;
    this.db.ref('supportTickets').limitToLast(60).get().then(function(s){
      var box=self.g('tList');if(!box)return;
      if(!s.exists()){box.innerHTML='<div class="sp-empty"><div class="ei">📭</div><div class="et">Koi ticket nahi</div></div>';return}
      var arr=[];s.forEach(function(c){arr.push(Object.assign({id:c.key},c.val()))});
      arr.sort(function(a,b){return (b.at||0)-(a.at||0)});
      var h='';
      for(var i=0;i<arr.length;i++){
        var t=arr[i],st=t.status||'open';
        h+='<div class="sp-card"><div class="sp-row">'
          +'<div class="sp-row-i">🎫</div>'
          +'<div class="sp-row-b"><div class="sp-row-t">'+self.esc(t.subject||'Ticket')+' <span class="badge '+self.esc(st)+'">'+self.esc(st.toUpperCase())+'</span></div>'
          +'<div class="sp-row-s">by @'+self.esc(t.byName||'?')+' <span class="mono">'+self.esc((t.uid||'').slice(0,10))+'…</span> · '+self.timeAgo(t.at)+'</div>'
          +'<div class="sp-row-s" style="margin-top:6px">'+self.esc(t.body||'')+'</div>'
          +(t.reply?'<div class="sp-reply"><b>🛡️ Staff:</b> '+self.esc(t.reply)+'</div>':'')
          +'</div></div>'
          +'<div style="display:flex;gap:8px;margin-top:9px">'
          +'<input class="sp-inp" id="tr-'+self.esc(t.id)+'" placeholder="Reply likho…" maxlength="600">'
          +'<button class="sp-btn pri" onclick="SP.ticketReply(\''+t.id+'\')">➤</button>'
          +'</div>'
          +'<div class="sp-acts" style="margin-top:8px">'
          +'<button class="sp-btn ok" onclick="SP.ticketStatus(\''+t.id+'\',\'answered\')">✅ Answered</button>'
          +'<button class="sp-btn" onclick="SP.ticketStatus(\''+t.id+'\',\'closed\')">📁 Close</button>'
          +'</div></div>';
      }
      box.innerHTML=h;
    }).catch(function(e){
      var box=self.g('tList');
      if(box)box.innerHTML='<div class="sp-empty"><div class="ei">⚠️</div><div class="et">Fail: '+self.esc(e.message)+'</div></div>';
    });
  },
  ticketReply:async function(id){
    var el=this.g('tr-'+id),v=el?el.value.trim():'';
    if(!v)return this.toast('Reply likho pehle');
    try{
      await this.db.ref('supportTickets/'+id).update({reply:v,status:'answered',repliedAt:Date.now(),repliedBy:this.auth.currentUser.uid});
      var t=(await this.db.ref('supportTickets/'+id+'/uid').get()).val();
      if(t)await this.db.ref('users/'+t+'/notifications').push({type:'security',title:'🛡️ Support reply',body:v.slice(0,120),at:Date.now()});
      this.toast('Reply bhej diya','ok');this.renderTickets();
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },
  ticketStatus:async function(id,st){
    try{await this.db.ref('supportTickets/'+id).update({status:st,updatedAt:Date.now()});this.toast('Ticket → '+st,'ok');this.renderTickets()}
    catch(e){this.toast('Fail: '+e.message,'err')}
  },

  /* ═══════════ 5) RECOVERY (v2.3 — NESTED shape fix) ═══════════
     Data shape (client Rec.requestEntry se): recoveryRequests/{uid}/{reqId}
       {uid, devName, deviceTrusted, status, createdAt, sixHourReported}
     Pehle flat padhta tha (username/note fields bhi the jo exist nahi
     karte the) — isliye list broken thi. Ab nested + real fields. */
  renderRecovery:function(){
    var M=this.g('spMain');
    M.innerHTML='<div class="sp-stit">🔐 Recovery Requests</div>'
      +'<div class="sp-note">⚠️ Approve se pehle user verify karo (UID + device + trusted status). Credentials plaintext me store <b>nahi</b> hote. 🟡 Untrusted device = "6-hour rule": Help Requests me Device-Lost report 6h+ purani honi chahiye.</div>'
      +'<div id="qList"><div class="sp-empty"><div class="ei">⏳</div><div class="et">Loading…</div></div></div>'
      +'<div class="sp-stit" style="margin-top:18px">🆘 Help Requests <span class="sp-note" style="display:inline">(login se pehle wali)</span></div>'
      +'<div id="hReqList"><div class="sp-empty"><div class="ei">⏳</div><div class="et">Loading…</div></div></div>';
    var self=this;
    this.db.ref('recoveryRequests').get().then(function(s){
      var box=self.g('qList');if(!box)return;
      if(!s.exists()){box.innerHTML='<div class="sp-empty"><div class="ei">📭</div><div class="et">Koi request nahi</div></div>';self.renderHelpReqs();return}
      /* NESTED: recoveryRequests/{uid}/{reqId} */
      var items=[];
      s.forEach(function(uu){
        var uidKey=uu.key;
        uu.forEach(function(c){
          items.push({uid:uidKey,rid:c.key,r:c.val()||{}});
        });
      });
      if(!items.length){box.innerHTML='<div class="sp-empty"><div class="ei">📭</div><div class="et">Khatam</div></div>';self.renderHelpReqs();return}
      items.sort(function(a,b){return (b.r.createdAt||0)-(a.r.createdAt||0)});
      var h='';
      for(var i=0;i<items.length;i++){
        var it=items[i],r=it.r,st=r.status||'pending';
        var trusted=!!r.deviceTrusted;
        if(st==='cancelled')continue;
        h+='<div class="sp-card"><div class="sp-row">'
          +'<div class="sp-row-i">'+(trusted?'🔐':'🟡')+'</div>'
          +'<div class="sp-row-b"><div class="sp-row-t">UID: '+self.esc(String(it.uid).slice(0,10))+'… <span class="badge '+self.esc(st)+'">'+self.esc(st.toUpperCase())+'</span></div>'
          +'<div class="sp-row-s">📱 '+self.esc(r.devName||'?')+' · '+(trusted?'✅ Trusted device':'⚠️ UNTRUSTED — 6h rule check karo')+' · '+self.timeAgo(r.createdAt)+'</div></div></div>'
          +(st==='pending'?'<div class="sp-acts" style="margin-top:9px">'
            +'<button class="sp-btn ok" onclick="SP.recStatus(\''+it.uid+'\',\''+it.rid+'\',\'approved\')">✅ Approve</button>'
            +'<button class="sp-btn dng" onclick="SP.recStatus(\''+it.uid+'\',\''+it.rid+'\',\'rejected\')">❌ Reject</button>'
            +'<button class="sp-btn" onclick="SP.recStatus(\''+it.uid+'\',\''+it.rid+'\',\'needs_report\')">⏱️ 6h Rule</button></div>':'')
          +'</div>';
      }
      box.innerHTML=h||'<div class="sp-empty"><div class="ei">📭</div><div class="et">Khatam</div></div>';
      self.badge('bdgRecovery',0);
      self.renderHelpReqs();
    }).catch(function(e){
      var box=self.g('qList');
      if(box)box.innerHTML='<div class="sp-empty"><div class="ei">🔒</div><div class="et">Recovery requests owner-only hain (rules): '+self.esc(e.message)+'</div></div>';
      var hb=self.g('hReqList');if(hb)hb.innerHTML='';
    });
  },
  recStatus:async function(uid,rid,st){
    try{
      await this.db.ref('recoveryRequests/'+uid+'/'+rid).update({status:st,updatedAt:Date.now(),by:this.auth.currentUser.uid});
      this.toast('Request → '+st,'ok');this.renderRecovery();
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },
  /* helpRequests — login se pehle Help Center se aayi reports (staff read) */
  renderHelpReqs:function(){
    var box=this.g('hReqList');if(!box)return;
    var self=this;
    this.db.ref('helpRequests').limitToLast(40).get().then(function(s){
      if(!box)return;
      if(!s.exists()){box.innerHTML='<div class="sp-empty"><div class="ei">📭</div><div class="et">Koi help request nahi</div></div>';return}
      var arr=[];
      s.forEach(function(c){var v=c.val()||{};if(v.status!=='resolved')arr.push(Object.assign({id:c.key},v))});
      arr.sort(function(a,b){return (b.at||0)-(a.at||0)});
      if(!arr.length){box.innerHTML='<div class="sp-empty"><div class="ei">✅</div><div class="et">Sab resolved</div></div>';return}
      var h='';
      for(var i=0;i<arr.length;i++){
        var r=arr[i];
        var tl={lost_account:'📱 Account Lost',lost_device:'🔒 Device Lost',hacked:'🚨 Hacked',other:'💬 Other'}[r.type]||'💬 Help';
        h+='<div class="sp-card"><div class="sp-row"><div class="sp-row-i">🆘</div>'
          +'<div class="sp-row-b"><div class="sp-row-t">'+tl+' — @'+self.esc(r.username||'?')+'</div>'
          +'<div class="sp-row-s">'+self.esc(r.detail||'')+' · '+self.timeAgo(r.at)+'</div></div></div>'
          +'<div class="sp-acts" style="margin-top:9px"><button class="sp-btn ok" onclick="SP.helpResolve(\''+r.id+'\')">✅ Resolve</button></div></div>';
      }
      box.innerHTML=h;
    }).catch(function(e){
      if(box)box.innerHTML='<div class="sp-empty"><div class="ei">🔒</div><div class="et">Help requests load fail (rules): '+self.esc(e.message)+'</div></div>';
    });
  },
  helpResolve:async function(id){
    try{
      await this.db.ref('helpRequests/'+id).update({status:'resolved',resolvedAt:Date.now(),resolvedBy:this.auth.currentUser.uid});
      this.toast('Help request resolved','ok');this.renderHelpReqs();
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },

  /* ═══════════ 6) TOOLS ═══════════ */
  renderTools:function(){
    var M=this.g('spMain');
    var isOwnerAdmin=(this.myRole==='owner'||this.myRole==='admin');
    M.innerHTML='<div class="sp-stit">🛠️ Tools</div>'

      /* version control */
      +'<div class="sp-card"><div class="sp-row-t" style="margin-bottom:10px">📢 Version Control</div>'
      +'<div class="sp-fld"><label>Latest Version</label><input class="sp-inp mono" id="vVer" placeholder="2.2.0"></div>'
      +'<div class="sp-fld"><label>Note (users ko dikhega)</label><input class="sp-inp" id="vNote" placeholder="Naya Police + Support page add hua"></div>'
      +'<div class="sp-fld"><label>APK Link</label><input class="sp-inp mono" id="vApk" placeholder="https://…"></div>'
      +'<button class="sp-btn pri" onclick="SP.versionSave()">💾 Save Version</button> <button class="sp-btn" onclick="SP.versionLoad()">🔄 Current load karo</button></div>'

      /* support email config */
      +'<div class="sp-card"><div class="sp-row-t" style="margin-bottom:10px">📧 Support Email Config</div>'
      +'<div class="sp-note">Ye email app ke <b>Support page</b> me users ko dikhega.</div>'
      +'<div class="sp-fld"><label>Support Email</label><input class="sp-inp mono" id="cfgEmail" placeholder="support@yourdomain.com"></div>'
      +'<button class="sp-btn pri" onclick="SP.supportEmailSave()">💾 Save Email</button> <button class="sp-btn" onclick="SP.supportEmailLoad()">🔄 Load current</button></div>'

      /* VEXA ID migration */
      +'<div class="sp-card"><div class="sp-row-t" style="margin-bottom:10px">🔢 VEXA ID Bulk Migration</div>'
      +'<div class="sp-note">Purane users jin ke paas numeric <b>publicUserId</b> nahi hai unhe ek shot me de deta hai (batch of 400). Jab tak <i>migrated: 0</i> na aaye, button dabao.</div>'
      +(isOwnerAdmin?'<button class="sp-btn pri" id="migBtn" onclick="SP.migrateIds()">⚡ Migrate Batch Chalao</button>':'<div class="sp-note">Sirf <b>owner/admin</b> ye chala sakte hain.</div>')
      +'<div class="sp-row-s mono" id="migOut" style="margin-top:8px"></div></div>'

      /* storage probe */
      +'<div class="sp-card"><div class="sp-row-t" style="margin-bottom:10px">🧪 Supabase Buckets Check</div>'
      +'<button class="sp-btn" onclick="SP.bucketCheck()">🔍 Probe 3 Buckets</button>'
      +'<div id="bkOut" style="margin-top:10px"></div></div>'

      /* staff directory */
      +'<div class="sp-card"><div class="sp-row-t" style="margin-bottom:10px">🛡️ Staff Directory (staffIndex)</div>'
      +'<button class="sp-btn" onclick="SP.staffDir()">🔄 Refresh</button>'
      +'<div id="sdOut" style="margin-top:10px"></div></div>';
  },

  /* version */
  versionSave:async function(){
    var v=this.g('vVer').value.trim(),n=this.g('vNote').value.trim(),a=this.g('vApk').value.trim();
    if(!v)return this.toast('Version likho');
    try{
      await this.db.ref('versionApp/latest').update({version:v,note:n,apkUrl:a,updatedAt:Date.now(),by:this.auth.currentUser.uid});
      this.toast('Version save: '+v,'ok');
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },
  versionLoad:async function(){
    try{
      var s=await this.db.ref('versionApp/latest').get();
      var d=(s.exists()&&s.val())||{};
      this.g('vVer').value=d.version||'';this.g('vNote').value=d.note||'';this.g('vApk').value=d.apkUrl||'';
      this.toast('Current version: '+(d.version||'—'),'ok');
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },

  /* support email */
  supportEmailSave:async function(){
    var em=this.g('cfgEmail').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return this.toast('Valid email daalo','err');
    try{await this.db.ref('config/support').update({email:em,updatedAt:Date.now()});this.toast('Support email set: '+em,'ok')}
    catch(e){this.toast('Fail: '+e.message,'err')}
  },
  supportEmailLoad:async function(){
    try{
      var s=await this.db.ref('config/support/email').get();
      this.g('cfgEmail').value=s.exists()?s.val():'';
      this.toast(s.exists()?'Current: '+s.val():'Abhi set nahi hai','ok');
    }catch(e){this.toast('Fail: '+e.message,'err')}
  },

  /* bulk migration — vexaBackend cloud function */
  migrateIds:async function(){
    var btn=this.g('migBtn'),out=this.g('migOut');
    if(btn){btn.disabled=true;btn.textContent='Chal raha hai…'}
    try{
      var tok=await this.auth.currentUser.getIdToken(true);
      var res=await fetch(SP_BACKEND,{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
        body:JSON.stringify({action:'bulkMigrateIds'})
      });
      var j=await res.json();
      if(out)out.textContent='→ HTTP '+res.status+' · migrated: '+(j.migrated||0)+' · skipped: '+(j.skipped||0)+(j.note?' · '+j.note:'');
      this.toast(res.ok?'Batch done — migrated '+(j.migrated||0):'Fail: '+(j.error||res.status),res.ok?'ok':'err');
    }catch(e){if(out)out.textContent='→ '+e.message;this.toast('Migration fail','err')}
    if(btn){btn.disabled=false;btn.textContent='⚡ Migrate Batch Chalao'}
  },

  /* bucket probe */
  bucketCheck:function(){
    var box=this.g('bkOut');
    if(box)box.innerHTML='<div class="sp-row-s">Probing…</div>';
    var h='';
    var self=this;
    SP_BUCKETS.forEach(function(b,i){
      fetch(b.url+'/storage/v1/bucket',{headers:{apikey:b.key,Authorization:'Bearer '+b.key}})
        .then(function(r){h+=self._bkRow(i,b,r.status);if(box&&i===SP_BUCKETS.length-1)box.innerHTML=h})
        .catch(function(e){h+=self._bkRow(i,b,0,e.message);if(box&&i===SP_BUCKETS.length-1)box.innerHTML=h});
    });
  },
  _bkRow:function(i,b,st,err){
    var ic=st===200?'✅':(err?'❌':'🟡');
    var msg=err?err:(st===200?'reachable':'HTTP '+st+' (anon list blocked — normal, upload test karo)');
    return '<div class="sp-row-s">'+ic+' '+(i+1)+') '+this.esc(b.name)+' — '+this.esc(msg)+'</div>';
  },

  /* staff directory */
  staffDir:async function(){
    var box=this.g('sdOut');
    if(box)box.innerHTML='<div class="sp-row-s">Loading…</div>';
    try{
      var s=await this.db.ref('staffIndex').get();
      if(!s.exists()){box.innerHTML='<div class="sp-row-s">staffIndex khaali — staff ko main app me ek baar login karna hoga.</div>';return}
      var h='';
      s.forEach(function(c){
        var v=c.val()||{};
        h+='<div class="sp-row-s">🛡️ '+SP.esc(v.name||c.key.slice(0,8))+' <span class="badge '+SP.esc(v.role||'user')+'">'+SP.esc((v.role||'user').toUpperCase())+'</span> · synced '+SP.timeAgo(v.syncedAt)+'</div>';
      });
      if(box)box.innerHTML=h;
    }catch(e){if(box)box.innerHTML='<div class="sp-row-s">Fail: '+this.esc(e.message)+'</div>'}
  }
};

/* verifyStaff — async version (role check) */
SP.verifyStaff=async function(u){
  try{
    var s=await this.db.ref('users/'+u.uid+'/role').get();
    var role=s.exists()?s.val():'user';
    if(STAFF_ROLES.indexOf(role)===-1){
      await this.auth.signOut();
      var err=this.g('lgErr');
      err.textContent='🚫 Ye account staff nahi hai. Sirf Owner/Admin/Moderator allowed hai.';
      err.classList.add('show');
      return;
    }
    this.myRole=role;
    var us=await this.db.ref('users/'+u.uid).get();
    this.me=(us.exists()&&us.val())||{};
    this.g('spMe').textContent='@'+(this.me.username||'staff')+' · '+role.toUpperCase();
    this.g('spLogin').classList.add('hidden');
    this.g('spApp').classList.remove('hidden');
    this.tab('dash');
  }catch(e){
    var err2=this.g('lgErr');
    err2.textContent='Verify fail: '+(e.message||'');
    err2.classList.add('show');
  }
};

document.addEventListener('DOMContentLoaded',function(){SP.boot()});
window.SP=SP;
