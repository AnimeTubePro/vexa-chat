/* ═══════════════════════════════════════════════════════════════════════
   🤖 VEXA PANEL AI ASSISTANT — shared module v1.0 (owner/admin/moderator)
   ─────────────────────────────────────────────────────────────────────
   ⚡v2.8.2: teeno panels me AI Assistant wapas — REAL panel data ke saath.
   Ye rule-based assistant panel ke andar chalta hai (koi external API nahi)
   aur LIVE Firebase data se jawab deta hai:

     • stats        → users/posts/reports/recoveries live counts
     • find @user   → user ka poora detail card (+ Manage button)
     • reports      → open reports summary
     • recovery     → pending recovery queue
     • temp         → temp accounts status
     • banned       → banned users list
     • staff        → staff list
     • health       → rules/rules-deploy self-check (permission_denied catch)
     • how-to       → ban/role/panel-pw/rules deploy guidance
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const PanelAI = {
  M:[],        /* chat messages */
  ROLE:null,

  esc:function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML},
  ago:function(ts){if(!ts)return'—';var s=Math.floor((Date.now()-ts)/1000);if(s<60)return'now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return new Date(ts).toLocaleDateString()},

  /* ═══ TAB RENDER ═══ */
  tab:function(){
    this.ROLE=(window.PANEL&&PANEL.ROLE)||'staff';
    var c=document.getElementById('tabContent');
    c.innerHTML='<div class="card" style="display:flex;flex-direction:column;height:min(70vh,620px)">'
     +'<div class="cname mb8">🤖 VEXA AI Assistant <span class="badge" style="background:var(--acs);color:var(--ac)">'+this.esc(this.ROLE.toUpperCase())+'</span></div>'
     +'<div class="snote mb8">Panel ka built-in assistant — live Firebase data se jawab deta hai. Neeche chips ya free text use karo.</div>'
     +'<div id="aiChat" style="flex:1;overflow-y:auto;background:var(--bg3);border:1px solid var(--bd);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:9px"></div>'
     +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 8px" id="aiChips"></div>'
     +'<div style="display:flex;gap:8px"><input class="inp" id="aiInp" placeholder="Poocho… jaise: stats · find @username · reports · health" onkeydown="if(event.key===\'Enter\')PanelAI.send()">'
     +'<button class="btn bp" onclick="PanelAI.send()">➤</button></div></div>';
    this.renderChips();
    this.push('bot','👋 Namaste! Main <b>VEXA AI Assistant</b> hoon — '+this.esc(this.ROLE)+' panel ka. Main live data se help karta hoon.<br>Neeche quick chips hain, ya type karo: <b>stats</b> · <b>find @username</b> · <b>reports</b> · <b>recovery</b> · <b>temp</b> · <b>banned</b> · <b>staff</b> · <b>health</b> · <b>help</b>');
  },

  renderChips:function(){
    var w=document.getElementById('aiChips');if(!w)return;
    var chips=['📊 stats','🔍 find @user','🚨 reports','🛡️ recovery','🧪 temp','🚫 banned','👑 staff','🩺 health','❓ help'];
    var h='';chips.forEach(function(ch){h+='<button class="tbn" onclick="PanelAI.chip(\''+ch.replace(/'/g,"\\'")+'\')">'+ch+'</button>'});
    w.innerHTML=h;
  },
  chip:function(t){var inp=document.getElementById('aiInp');if(inp)inp.value=t.replace(/^[^\s]+\s/,'');this.send()},

  push:function(who,html){
    this.M.push({who:who,html:html});
    var w=document.getElementById('aiChat');if(!w)return;
    var d=document.createElement('div');
    d.style.cssText='max-width:86%;'+(who==='me'
      ?'align-self:flex-end;background:var(--acs);border:1px solid var(--ac);color:var(--tx);border-radius:14px 14px 3px 14px;padding:9px 13px;font-size:13px'
      :'align-self:flex-start;background:var(--bg2);border:1px solid var(--bd);border-radius:14px 14px 14px 3px;padding:9px 13px;font-size:13px;line-height:1.6');
    d.innerHTML=html;
    w.appendChild(d);w.scrollTop=w.scrollHeight;
  },
  thinking:function(){
    var w=document.getElementById('aiChat');if(!w)return null;
    var d=document.createElement('div');
    d.id='aiThink';
    d.style.cssText='align-self:flex-start;background:var(--bg2);border:1px solid var(--bd);border-radius:14px 14px 14px 3px;padding:9px 13px;font-size:12.5px;color:var(--tx2)';
    d.textContent='🤖 soch raha hoon…';
    w.appendChild(d);w.scrollTop=w.scrollHeight;
    return d;
  },
  send:function(){
    var inp=document.getElementById('aiInp');if(!inp)return;
    var q=(inp.value||'').trim();if(!q)return;
    inp.value='';
    this.push('me',this.esc(q));
    var th=this.thinking(),self=this;
    setTimeout(async function(){
      var ans;
      try{ans=await self.answer(q)}
      catch(e){ans='⚠️ Error: '+self.esc(e.message||e)}
      if(th&&th.parentNode)th.remove();
      self.push('bot',ans);
    },260);
  },

  /* ═══ INTENT ENGINE ═══ */
  answer:async function(q){
    var s=q.toLowerCase();
    var um=s.match(/@([a-z0-9_]{3,20})/);
    if(um)return this.findUser(um[1]);
    if(/^(hi|hello|hey|namaste|namaskar)/.test(s))return '👋 Bolo ' + this.esc(this.ROLE) + ' — kya kaam hai? <b>help</b> type karke commands dekho.';
    if(/help|command|kya kar|madad|how to/.test(s))return this.help();
    if(/stat|summary|overview|dashboard|kitne|count/.test(s))return this.stats();
    if(/report/.test(s))return this.reports();
    if(/recover/.test(s))return this.recovery();
    if(/temp/.test(s))return this.tempAcc();
    if(/ban/.test(s)&&!/how/.test(s))return this.banned();
    if(/staff|admin|moderator list|owner/.test(s))return this.staff();
    if(/health|check|rules|permission/.test(s))return this.health();
    if(/vault|password/.test(s))return this.vault();
    if(/post/.test(s))return this.posts();
    if(/version|update/.test(s))return this.version();
    return '🤔 Ye samajh nahi aaya. Ye try karo:<br>• <b>stats</b> — live summary<br>• <b>find @username</b> — user details<br>• <b>reports</b> · <b>recovery</b> · <b>temp</b> · <b>banned</b> · <b>staff</b><br>• <b>health</b> — rules self-check<br>• <b>help</b> — poora menu';
  },

  /* ═══ INTENTS (live data) ═══ */
  health:async function(){
    try{
      await db.ref('users').limitToFirst(1).get();
      return '🩺 <b>Health Check: PASS ✅</b><br>• Firebase RTDB connection OK<br>• <b>users read (staff): ALLOWED</b> — rules sahi deploy hue hain<br>• Users tab, Dashboard details — sab chalenge<br><br>Agar kabhi users load fail ho: naya <b>database.rules.json</b> deploy karo (Firebase Console → Realtime Database → Rules → paste → Publish).';
    }catch(e){
      return '🩺 <b>Health Check: FAIL ❌</b><br><br><b style="color:var(--dn)">PERMISSION_DENIED</b> — Firebase rules purane hain!<br><br><b>Fix (2 min):</b><br>1. Firebase Console → Realtime Database → Rules<br>2. Naya <b>database.rules.json</b> paste karo (jo VEXA package me hai)<br>3. Publish → page reload<br><br>Iske bina panels users load NAHI kar sakte.';
    }
  },
  stats:async function(){
    try{
      var us=await db.ref('users').get();
      var nu=0,staff=0,banned=0,temp=0;
      if(us.exists())us.forEach(function(x){var v=x.val()||{};nu++;if(v.role&&v.role!=='user')staff++;if(v.banned)banned++;if(v.isTempAccount)temp++});
      var po=await db.ref('posts').get();var np=po.exists()?po.numChildren():0;
      var re=await db.ref('reports').get();var nr=0,nro=0;
      if(re.exists())re.forEach(function(x){nr++;if((x.val()||{}).status==='open')nro++});
      var rq=await db.ref('recoveryRequests').get();var nrec=0;
      if(rq.exists())rq.forEach(function(x){var v=x.val()||{};if(v.tempUid&&['pending','verifying','admin_recommended','owner_pending'].indexOf(v.status||'pending')>-1)nrec++});
      return '📊 <b>Live Panel Stats</b><br>━━━━━━━━━━━━━━<br>👥 Users: <b>'+nu+'</b><br>📸 Posts: <b>'+np+'</b><br>🚨 Reports: <b>'+nr+'</b> total · <b>'+nro+'</b> open<br>🛡️ Pending recoveries: <b>'+nrec+'</b><br>👑 Staff: <b>'+staff+'</b><br>🚫 Banned: <b>'+banned+'</b><br>🧪 Temp accounts: <b>'+temp+'</b>';
    }catch(e){return this.errAns(e)}
  },
  findUser:async function(name){
    try{
      var idx=await db.ref('usernames/'+name).get();
      if(!idx.exists())return '❌ User <b>@'+this.esc(name)+'</b> nahi mila (username index me nahi). Spelling check karo.';
      var uid=idx.val();
      var s=await db.ref('users/'+uid).get();
      if(!s.exists())return '❌ <b>@'+this.esc(name)+'</b> ka UID index me hai par profile missing.';
      var v=s.val()||{};
      if(window.usersCache)usersCache[uid]=v;
      var h='👤 <b>User Details — @'+this.esc(v.username||name)+'</b><br>━━━━━━━━━━━━━━<br>'
        +'🆔 UID: <span class="mono" style="font-size:10.5px">'+this.esc(uid)+'</span><br>'
        +'📧 Email: '+this.esc(v.email||'—')+'<br>'
        +'📛 Name: '+this.esc(v.displayName||'—')+'<br>'
        +(v.dob?'📅 DOB: '+this.esc(v.dob)+'<br>':'')
        +'👑 Role: '+this.esc(v.role||'user')+' · '+(v.verified?'✔ verified':'unverified')+' · '+(v.vip?'💎 VIP':'normal')+'<br>'
        +(v.banned?'<b style="color:var(--dn)">🚫 BANNED</b><br>':'')
        +'📸 Posts: '+(v.postCount||0)+' · 🕐 Joined: '+this.ago(v.createdAt)+'<br>'
        +(v.lastLoginAt?'🕐 Last login: '+this.ago(v.lastLoginAt)+'<br>':'');
      try{var vp=await db.ref('recoveryPrivate/'+uid).get();if(vp.exists()){var pv=vp.val()||{};h+='🔑 Vault: password <b>'+(pv.password?this.esc(pv.password):'—')+'</b> · DOB '+this.esc(pv.dob||'—')+'<br>'}}catch(e){}
      if(window.PANEL)h+='<div style="margin-top:8px"><button class="btn bsm bp" onclick="PANEL.userModal(\''+uid+'\')">⚙️ Manage User (full details)</button></div>';
      return h;
    }catch(e){return this.errAns(e)}
  },
  reports:async function(){
    try{
      var s=await db.ref('reports').get();
      if(!s.exists())return '🎉 Koi report nahi — sab shanti hai.';
      var open=[],total=0;
      s.forEach(function(x){var v=x.val()||{};total++;if((v.status||'open')==='open')open.push({k:x.k,v:v})});
      var h='🚨 <b>Reports</b> — '+total+' total · <b>'+open.length+'</b> open<br>━━━━━━━━━━━━━━';
      open.slice(0,5).forEach(function(r){
        h+='<br>🟠 <b>'+PanelAI.esc((r.v.type||'report').toUpperCase())+'</b> target '+PanelAI.esc(r.v.targetId||r.v.target||'?')+' — by @'+PanelAI.esc(r.v.byName||r.v.reporterId||'?')+' · '+PanelAI.ago(r.v.at||r.v.createdAt);
      });
      if(open.length>5)h+='<br>…aur '+(open.length-5)+' open reports';
      h+='<br><div style="margin-top:6px"><button class="btn bsm bwn" onclick="PANEL.tab(\'reports\')">🚨 Reports tab kholo</button></div>';
      return h;
    }catch(e){return this.errAns(e)}
  },
  recovery:async function(){
    try{
      var s=await db.ref('recoveryRequests').get();
      if(!s.exists())return '🛡️ Koi recovery request nahi.';
      var rows=[];
      s.forEach(function(x){var v=x.val()||{};if(v.tempUid)rows.push({k:x.k,v:v})});
      var pend=rows.filter(function(r){return ['pending','verifying','admin_recommended','owner_pending'].indexOf(r.v.status||'pending')>-1});
      var h='🛡️ <b>Recovery Queue</b> — '+rows.length+' total · <b>'+pend.length+'</b> pending<br>━━━━━━━━━━━━━━';
      pend.slice(0,5).forEach(function(r){
        h+='<br>'+(r.v.status==='owner_pending'?'👑':'🟡')+' <b>'+PanelAI.esc(r.v.mode||'migration')+'</b> — @'+PanelAI.esc(r.v.origUsername||'?')+' · '+PanelAI.esc(r.v.status||'pending')+' · '+PanelAI.ago(r.v.createdAt);
      });
      if(!pend.length)h+='<br>✅ Sab processed — koi pending nahi';
      h+='<br><div style="margin-top:6px"><button class="btn bsm bwn" onclick="PANEL.tab(\'recoveries\')">🛡️ Recoveries tab kholo</button></div>';
      return h;
    }catch(e){return this.errAns(e)}
  },
  tempAcc:async function(){
    try{
      var s=await db.ref('recoveryTemp').get();
      if(!s.exists())return '🧪 Koi temp account nahi — clean.';
      var rows=[];s.forEach(function(x){rows.push({k:x.k,v:x.val()||{}})});
      var h='🧪 <b>Temp Accounts</b> — '+rows.length+' active<br>━━━━━━━━━━━━━━';
      rows.slice(0,5).forEach(function(r){
        h+='<br>🧪 '+PanelAI.esc(r.v.tempEmail||r.k)+' → old @'+PanelAI.esc(r.v.origUsername||'?')+' · '+PanelAI.esc(r.v.status||'waiting')+' · '+PanelAI.ago(r.v.createdAt);
      });
      if(window.PANEL&&PANEL.ROLE==='owner')h+='<br><div style="margin-top:6px"><button class="btn bsm bdn" onclick="PANEL.tab(\'temp\')">🧪 Purge panel kholo</button></div>';
      return h;
    }catch(e){return this.errAns(e)}
  },
  banned:async function(){
    try{
      var s=await db.ref('users').get();var rows=[];
      if(s.exists())s.forEach(function(x){var v=x.val()||{};if(v.banned)rows.push(v)});
      if(!rows.length)return '🚫 Koi banned user nahi.';
      var h='🚫 <b>Banned Users</b> — '+rows.length+'<br>━━━━━━━━━━━━━━';
      rows.slice(0,8).forEach(function(v){h+='<br>🚫 @'+PanelAI.esc(v.username||'?')+' — '+PanelAI.esc(v.email||'—')});
      return h;
    }catch(e){return this.errAns(e)}
  },
  staff:async function(){
    try{
      var s=await db.ref('users').get();var rows=[];
      if(s.exists())s.forEach(function(x){var v=x.val()||{};if(v.role&&v.role!=='user')rows.push({k:x.k,v:v})});
      if(!rows.length)return '👑 Koi staff nahi (sirf owner ho tum).';
      var h='👑 <b>Staff Team</b> — '+rows.length+'<br>━━━━━━━━━━━━━━';
      rows.forEach(function(r){
        h+='<br>'+(r.v.role==='owner'?'👑':(r.v.role==='admin'?'🛡️':'🧹'))+' <b>'+PanelAI.esc((r.v.role||'').toUpperCase())+'</b> @'+PanelAI.esc(r.v.username||'?')+' — '+PanelAI.esc(r.v.email||'—');
      });
      return h;
    }catch(e){return this.errAns(e)}
  },
  vault:async function(){
    try{
      var s=await db.ref('recoveryVaults').get();
      var n=s.exists()?s.numChildren():0;
      var h='🗄️ <b>Vault Registry</b> — '+n+' encrypted vaults active.<br>';
      if(window.PANEL&&PANEL.ROLE==='owner')h+='🔑 Owner Passwords tab me har user ka <b>real email + password + DOB</b> milta hai (recoveryPrivate se, plaintext — jaise user ne spec diya).<br>';
      h+='🔐 .vexa files AES-256-GCM encrypted hain — staff ke paas sirf metadata.<br><div style="margin-top:6px"><button class="btn bsm" onclick="PANEL.tab(\''+(PANEL&&PANEL.ROLE==='owner'?'passwords':'registry')+'\')">🗄️ Vault view kholo</button></div>';
      return h;
    }catch(e){return this.errAns(e)}
  },
  posts:async function(){
    try{
      var s=await db.ref('posts').get();
      if(!s.exists())return '📸 Koi post nahi.';
      var rows=[];s.forEach(function(x){var v=x.val()||{};rows.push({k:x.k,v:v})});
      rows.sort(function(a,b){return (b.v.createdAt||0)-(a.v.createdAt||0)});
      var h='📸 <b>Recent Posts</b> — '+rows.length+' total<br>━━━━━━━━━━━━━━';
      rows.slice(0,5).forEach(function(r){h+='<br>📷 @'+PanelAI.esc(r.v.username||r.v.by||'?')+' — '+PanelAI.esc(String(r.v.text||r.v.caption||'')).slice(0,60)+' · ♥'+(r.v.likes?Object.keys(r.v.likes).length:0)+' · '+PanelAI.ago(r.v.createdAt)});
      h+='<br><div style="margin-top:6px"><button class="btn bsm" onclick="PANEL.tab(\'posts\')">📸 Posts tab kholo</button></div>';
      return h;
    }catch(e){return this.errAns(e)}
  },
  version:async function(){
    try{
      var s=await db.ref('versionApp').get();var v=s.val()||{};
      return '📱 <b>App Version</b><br>• Latest: <b>'+this.esc(v.latest||'—')+'</b><br>• Note: '+this.esc(v.note||'—')+'<br>• APK: '+this.esc(v.apkUrl||'—')+'<br>• Updated: '+this.ago(v.updatedAt)+' by '+this.esc(v.updatedBy||'—');
    }catch(e){return this.errAns(e)}
  },
  help:function(){
    return '❓ <b>AI Assistant Commands</b><br>━━━━━━━━━━━━━━<br>• <b>stats</b> — live counts (users/posts/reports)<br>• <b>find @username</b> — kisi bhi user ka full detail card<br>• <b>reports</b> — open reports summary<br>• <b>recovery</b> — pending recovery queue<br>• <b>temp</b> — temp accounts status<br>• <b>banned</b> — banned users list<br>• <b>staff</b> — staff team list<br>• <b>health</b> — rules self-check (permission_denied detector)<br>• <b>vault</b> — vault registry status<br>• <b>posts</b> — recent posts<br>• <b>version</b> — app version info<br><br><b>Kaise karein?</b><br>• User ban karna ho → Users tab → Manage → Ban<br>• Role set karna ho → Users tab → Manage → Role Set (owner)<br>• Panel password → Security tab (owner)<br>• Users load na ho → <b>health</b> type karo';
  },
  errAns:function(e){
    var m=(e&&e.message)||String(e||'');
    if(/permission/i.test(m))return this.health();
    return '⚠️ Data load fail: '+this.esc(m);
  }
};
window.PanelAI=PanelAI;
