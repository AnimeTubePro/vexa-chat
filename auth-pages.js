/* ═══════════════════════════════════════════════════════════
   VEXA AUTH PAGES — auth-pages.js (v1.0)
   ─────────────────────────────────────────────────────────
   Standalone Login / Signup / Forgot Password pages ka shared
   module. Same Firebase project + same logic jo script.js
   (Auth.login / Auth.signup / ForgotPw.send) me hai — data
   bilkul same tarike se likha jaata hai.
   Pages: login.html · signup.html · forgot.html
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── same Firebase project (vexa-b3a1d) — script.js se match ── */
const AX_CFG={
  apiKey:"AIzaSyDU-J6_YGJC1CUOr_v3ih_rqWGRyhqB4mw",
  authDomain:"vexa-b3a1d.firebaseapp.com",
  databaseURL:"https://vexa-b3a1d-default-rtdb.firebaseio.com",
  projectId:"vexa-b3a1d",
  storageBucket:"vexa-b3a1d.firebasestorage.app",
  messagingSenderId:"431099898297",
  appId:"1:431099898297:web:3adf83427e1b8c7f9c2e68"
};
const AX_SB_CFG={
  url:"https://ygbkjnwuvjcgdzbqwgwv.supabase.co",
  anonKey:"sb_publishable__0S4cvfvVDrEnONXnuHjGQ_Yl_bjC-o",
  bucket:"vexa-media"
};
const AX_VER='3.0.0'; /* script.js Ver.CURRENT se sync rakhna */

const AX={
  auth:null,db:null,sb:null,
  _unameTo:null,_lastReset:0,_photoData:null,

  /* ═══ BOOT ═══ */
  boot:function(){
    try{
      firebase.initializeApp(AX_CFG);
      this.auth=firebase.auth();
      try{this.db=firebase.database()}catch(_de){this.db=null} /* forgot.html pe DB SDK nahi — auth-only page */
      try{if(window.supabase)this.sb=supabase.createClient(AX_SB_CFG.url,AX_SB_CFG.anonKey)}catch(e){}
    }catch(be){console.error('AX boot fail',be);return}
    /* DOB selects bharo (signup page) */
    this.initDobs();
    /* Enter key submit */
    var self=this;
    document.querySelectorAll('[data-enter]').forEach(function(el){
      el.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();var fn=el.getAttribute('data-enter');if(self[fn])self[fn]()}});
    });
    /* login.html: already logged in → seedha app kholo */
    if(document.body.getAttribute('data-page')==='login'){
      this.auth.onAuthStateChanged(function(u){
        if(u&&!self._busy)location.replace('index.html');
      });
    }
  },

  /* ═══ HELPERS (script.js V.* jaise hi) ═══ */
  g:function(id){return document.getElementById(id)},
  esc:function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;')},
  email:function(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)},
  uname:function(u){return /^[a-zA-Z0-9_]{4,20}$/.test(u)},
  age:function(str){
    try{
      var p=str.split('/');var d=+p[0],m=+p[1],y=+p[2];
      if(!d||!m||!y)return null;
      var b=new Date(y,m-1,d),t=new Date();
      var a=t.getFullYear()-b.getFullYear();
      var mo=t.getMonth()-b.getMonth();
      if(mo<0||(mo===0&&t.getDate()-b.getDate()<0))a--;
      return a;
    }catch(e){return null}
  },
  genCode:function(blocks,len){
    var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out=[];
    for(var b=0;b<blocks;b++){var s='';for(var i=0;i<len;i++){s+=c[Math.floor(Math.random()*c.length)]}out.push(s)}
    return out.join('-');
  },
  sha:async function(s){
    try{
      if(typeof crypto!=='undefined'&&crypto.subtle){
        var buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));
        return Array.from(new Uint8Array(buf)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
      }
    }catch(e){}
    var h=0,t=String(s);
    for(var i=0;i<t.length;i++){h=((h*31)+t.charCodeAt(i))|0}
    return 'fb'+Math.abs(h).toString(16);
  },
  dev:function(){
    var ua=navigator.userAgent;
    var os=/android/i.test(ua)?'Android':/iphone|ipad/i.test(ua)?'iOS':/win/i.test(ua)?'Windows':/mac/i.test(ua)?'Mac':'Linux';
    var br=/edg/i.test(ua)?'Edge':/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':'Browser';
    return br+' / '+os;
  },
  friendErr:function(e){
    var M={'auth/invalid-email':'Invalid email.','auth/user-not-found':'Account not found.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Incorrect email or password.','auth/email-already-in-use':'Email already registered.','auth/weak-password':'Password too weak.','auth/too-many-requests':'Too many attempts.','auth/network-request-failed':'Network error.','auth/requires-recent-login':'Please sign in again.','auth/unauthorized-domain':'Domain not authorized — is page ko hosting (https) pe kholo.','auth/operation-not-allowed':'Sign-in method Firebase Console me enable nahi hai.','auth/admin-restricted-operation':'Ye operation restricted hai — Firebase Console → Authentication me provider enable karo.','auth/user-disabled':'Account disabled.','auth/configuration-not-found':'⚠️ Firebase Console → Authentication → Email/Password enable karo!','PERMISSION_DENIED':'Permission denied — Rules check karo.'};
    return (e&&M[e.code])||'Something went wrong. Try again.';
  },
  toast:function(type,msg,ms){
    ms=ms||3200;
    try{
      var ic={ok:'✅',err:'❌',warn:'⚠️',info:'ℹ️'};
      var t=document.createElement('div');
      t.className='ap-toast '+(type==='ok'?'ok':type==='err'?'err':type==='warn'?'warn':'');
      t.innerHTML='<span>'+(ic[type]||'ℹ️')+'</span><span>'+this.esc(msg)+'</span>';
      var c=this.g('apToast')||this.g('apToasts');if(c)c.appendChild(t);
      setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .25s';setTimeout(function(){t.remove()},260)},ms);
    }catch(e){}
  },
  errBox:function(id,msg,ok){
    var eb=this.g(id);if(!eb)return;
    eb.classList.toggle('okbox',!!ok);
    eb.textContent=msg;
    eb.classList.add('show');
  },

  /* ═══ password show/hide ═══ */
  pwToggle:function(id,btn){
    var i=this.g(id);if(!i)return;
    var show=i.type==='password';
    i.type=show?'text':'password';
    if(btn)btn.textContent=show?'🙈':'👁️';
  },

  /* ═══ DOB selects ═══ */
  initDobs:function(){
    var dd=[],mm=[],yy=[];
    for(var i=1;i<=31;i++)dd.push(i);
    for(var i=1;i<=12;i++)mm.push(i);
    var ny=new Date().getFullYear();
    for(var i=ny;i>=ny-90;i--)yy.push(i);
    function fill(id,arr,unit){var e=document.getElementById(id);if(!e)return;e.innerHTML='<option value="">'+unit+'</option>'+arr.map(function(x){return '<option>'+x+'</option>'}).join('')}
    fill('suDd',dd,'DD');fill('suMm',mm,'MM');fill('suYy',yy,'YYYY');
  },

  /* ═══════════ LOGIN PAGE ═══════════ */
  _busy:false,
  /* ⚡v2.8.3: error box id resolve — login.html me 'loginErr' hai, AX 'lgErr' expect karta hai */
  _lgErr:function(){return this.g('lgErr')||this.g('loginErr')},
  login:async function(){
    var em=(this.g('lgEmail')||{}).value||'';em=em.trim();
    var pw=(this.g('lgPw')||{}).value||'';
    var eb=this._lgErr();if(eb){eb.classList.remove('show');eb.textContent=''}
    if(!em||!pw){if(eb){eb.textContent='Enter email and password';eb.classList.add('show')}return}
    var btn=this.g('lgBtn');
    this._busy=true;
    if(btn){btn.disabled=true;btn.textContent='Signing in...'}
    try{
      await this.auth.signInWithEmailAndPassword(em,pw);
      var uid=this.auth.currentUser.uid;
      /* banned check (script.js Auth.login jaisa) */
      try{
        var bn=await this.db.ref('users/'+uid+'/banned').get();
        if(bn.exists()&&bn.val()===true){
          await this.auth.signOut();
          if(eb){eb.textContent='🚫 Account banned.';eb.classList.add('show')}
          if(btn){btn.disabled=false;btn.textContent='Sign In'}
          this._busy=false;
          return;
        }
      }catch(e){}
      try{await this.db.ref('users/'+uid+'/securityEvents').push({type:'login',device:this.dev(),at:Date.now()})}catch(e){}
      try{await this.db.ref('users/'+uid+'/lastLoginAt').set(Date.now())}catch(e){}
      try{
        var devId='dev_'+(await this.sha(this.dev()+navigator.userAgent)).slice(0,16);
        var exD=await this.db.ref('users/'+uid+'/devices/'+devId).get();
        if(!exD.exists()){
          await this.db.ref('users/'+uid+'/devices/'+devId).set({name:this.dev(),ua:navigator.userAgent.slice(0,100),registeredAt:Date.now(),trusted:true});
        }
      }catch(de){}
      try{await this.db.ref('users/'+uid).update({appVer:AX_VER,appVerAt:Date.now()})}catch(ave){}
      /* ✅ success → main app */
      if(btn)btn.textContent='✅ Signing in…';
      location.replace('index.html');
      return;
    }catch(e){
      var msgMap={
        'auth/invalid-credential':'Incorrect email or password.',
        'auth/user-not-found':'Account not found.',
        'auth/wrong-password':'Incorrect password.',
        'auth/too-many-requests':'Too many attempts.',
        'auth/configuration-not-found':'⚠️ Firebase Console → Authentication → Email/Password enable karo!',
        'auth/operation-not-allowed':'⚠️ Firebase Console → Authentication → Sign-in method me Email/Password ENABLE karo!',
        'auth/admin-restricted-operation':'⚠️ Ye sign-in method restricted hai — Firebase Console me provider ENABLE karo.',
        'auth/unauthorized-domain':'⚠️ Authorized domains me add karo: '+location.hostname
      };
      var m=msgMap[(e&&e.code)||'']||this.friendErr(e);
      if(eb){eb.textContent=m;eb.classList.add('show')}else this.errBox('lgErr',m);
    }
    if(btn){btn.disabled=false;btn.textContent='Sign In'}
    this._busy=false;
  },

  /* ═══════════ SIGNUP PAGE ═══════════ */
  previewPhoto:function(inp){
    if(inp.files&&inp.files[0]){
      var self=this;
      var reader=new FileReader();
      reader.onload=function(e){
        AX._photoData=e.target.result;
        var av=self.g('suAva');
        if(av){av.style.backgroundImage='url('+e.target.result+')';av.textContent=''}
      };
      reader.readAsDataURL(inp.files[0]);
    }
  },
  d2b:function(du){
    var parts=du.split(','),meta=parts[0],b64=parts[1];
    var mime=meta.match(/:(.*?);/)[1];
    var bin=atob(b64),a=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
    return new Blob([a],{type:mime});
  },
  uploadSignupPhoto:async function(uid){
    if(!this._photoData||!this.sb)return '';
    var self=this;
    try{
      var r=await this.sb.storage.from(AX_SB_CFG.bucket).upload('profile/'+uid+'/avatar.jpg',this.d2b(this._photoData),{contentType:'image/jpeg',upsert:true});
      if(r.error)throw r.error;
      var pub=this.sb.storage.from(AX_SB_CFG.bucket).getPublicUrl('profile/'+uid+'/avatar.jpg').data.publicUrl;
      var ok=await new Promise(function(res){
        var i=new Image();i.onload=function(){res(true)};i.onerror=function(){res(false)};
        i.src=pub;setTimeout(function(){res(false)},5000);
      });
      if(ok){await this.db.ref('users/'+uid+'/profilePhoto').set(pub);self._photoData=null;return pub}
      throw new Error('read fail');
    }catch(e1){
      /* fallback: chhota dataURL direct save (script.js jaisa) */
      try{
        var small=await new Promise(function(res,rej){
          var img=new Image();
          img.onload=function(){
            var c=document.createElement('canvas');
            var s=Math.min(1,200/Math.max(img.width,img.height));
            c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
            c.getContext('2d').drawImage(img,0,0,c.width,c.height);
            res(c.toDataURL('image/jpeg',0.7));
          };
          img.onerror=function(){rej(new Error('fail'))};
          img.src=self._photoData;
        });
        await this.db.ref('users/'+uid+'/profilePhoto').set(small);
        this._photoData=null;
        return small;
      }catch(e2){this._photoData=null;return ''}
    }
  },
  checkUname:function(){
    var self=this;
    clearTimeout(this._unameTo);
    var u=(this.g('suUname')||{}).value||'';u=u.trim().toLowerCase();
    var ok=this.g('suUnOk'),err=this.g('suUnErr');
    if(ok)ok.classList.remove('show');
    if(err)err.classList.remove('show');
    if(!u)return;
    if(!this.uname(u)){if(err){err.textContent='Invalid format';err.classList.add('show')}return}
    if(!this.db)return;
    this._unameTo=setTimeout(async function(){
      try{
        var s=await self.db.ref('usernames/'+u).get();
        if(s.exists()){if(err){err.textContent='❌ Username already taken';err.classList.add('show')}}
        else if(ok)ok.classList.add('show');
      }catch(e){}
    },450);
  },
  signup:async function(){
    var self=this;
    var name=(this.g('suName')||{}).value||'';name=name.trim();
    var u=(this.g('suUname')||{}).value||'';u=u.trim().toLowerCase();
    var em=(this.g('suEmail')||{}).value||'';em=em.trim();
    var dd=(this.g('suDd')||{}).value||'',mm=(this.g('suMm')||{}).value||'',yy=(this.g('suYy')||{}).value||'';
    var pw=(this.g('suPw')||{}).value||'',pw2=(this.g('suPw2')||{}).value||'';
    var tc=!!(this.g('suTerms')||{}).checked;
    var fail=function(m){self.errBox('suErr',m);self.toast('err',m);return false};
    var suEb=this.g('suErr');
    if(suEb){suEb.classList.remove('show');suEb.textContent=''}
    if(!name)return fail('Display name required');
    if(!this.uname(u))return fail('Invalid username');
    if(!this.email(em))return fail('Invalid email');
    if(!dd||!mm||!yy)return fail('DOB required');
    var age=this.age(dd+'/'+mm+'/'+yy);
    if(age===null)return fail('Invalid DOB');
    if(age<13)return fail('Must be 13+');
    if(pw.length<8)return fail('Password min 8 chars');
    if(!/[a-zA-Z]/.test(pw)||!/[0-9]/.test(pw))return fail('Letters + numbers needed');
    if(pw!==pw2)return fail('Passwords do not match');
    if(!tc)return fail('Accept T&C');
    var btn=this.g('suBtn');
    if(btn){btn.disabled=true;btn.textContent='Creating...'}
    try{
      var uS=await this.db.ref('usernames/'+u).get();
      if(uS.exists())throw{code:'uname'};
      var cred=await this.auth.createUserWithEmailAndPassword(em,pw);
      var uid=cred.user.uid;
      var photo='';
      try{photo=await this.uploadSignupPhoto(uid)}catch(pe){console.warn('photo skip',pe)}
      var mainCode=this.genCode(4,4),secCode=this.genCode(3,4);
      var mh='',sh='',eh='',dh='';
      try{mh=await this.sha(mainCode)}catch(e){}
      try{sh=await this.sha(secCode)}catch(e){}
      try{eh=await this.sha(em.toLowerCase())}catch(e){}
      try{dh=await this.sha(dd+'/'+mm+'/'+yy)}catch(e){}
      try{
        await this.db.ref('users/'+uid).set({
          username:u,displayName:name,email:em,dob:dd+'/'+mm+'/'+yy,
          profilePhoto:photo,bio:'',vip:false,verified:false,role:'user',banned:false,
          appVer:AX_VER,
          createdAt:firebase.database.ServerValue.TIMESTAMP,
          recovery:{mainCode:mainCode,secondaryCode:secCode,secondaryMode:'fixed'},
          privacy:{onlineVis:'everyone',lastSeenVis:'everyone',msgReq:'everyone',voiceCalls:'everyone',videoCalls:'everyone',readReceipts:true,typingInd:true,profileLock:false},
          settings:{theme:'t0_0',font:'Inter',profileDesign:'modern'},
          followers:{},following:{},blocks:{},restrictions:{},saved:{},social:{},notifications:{},securityEvents:{},sessions:{},callHistory:{},chatLocks:{},archived:{},muted:{},followRequests:{},devices:{},posts:{},postCount:0,chats:{},
          usernameChangedAt:0
        });
      }catch(pe2){
        console.error('full profile fail, minimal try:',pe2);
        try{
          await this.db.ref('users/'+uid).set({username:u,displayName:name,email:em,dob:dd+'/'+mm+'/'+yy,profilePhoto:photo,bio:'',vip:false,verified:false,role:'user',banned:false,appVer:AX_VER,createdAt:Date.now(),settings:{profileDesign:'modern'},recovery:{mainCode:mainCode,secondaryCode:secCode,secondaryMode:'fixed'},usernameChangedAt:0});
        }catch(pe3){
          console.error('minimal profile bhi fail:',pe3);
          this.toast('warn','Profile partially saved — app me fix ho jayega',5000);
        }
      }
      try{await this.db.ref('usernames/'+u).set(uid)}catch(e){console.warn('uname idx fail')}
      /* one-way hashes (recoveryCheck) — vault v1.0 pattern */
      try{await this.db.ref('recoveryCheck/'+uid).set({user:u,dobHash:dh,secHash:sh,mainHash:mh,emailHash:eh,maskedEmail:em.charAt(0)+'***@'+(em.split('@')[1]||'')})}catch(e){}
      try{
        var devId='dev_'+(await this.sha(this.dev()+navigator.userAgent)).slice(0,16);
        await this.db.ref('users/'+uid+'/devices/'+devId).set({name:this.dev(),ua:navigator.userAgent.slice(0,100),registeredAt:Date.now(),trusted:true});
      }catch(de){}
      try{await this.db.ref('users/'+uid+'/securityEvents').push({type:'signup',device:this.dev(),at:Date.now()})}catch(e){}
      try{await cred.user.sendEmailVerification()}catch(e){}
      /* codes screen dikhao (page ke andar hi) — ⚡v2.8.3: signup.html ids fallback */
      var mc=this.g('spMain')||this.g('scMain'),sc=this.g('spSec')||this.g('scSec');
      if(mc)mc.textContent=mainCode;
      if(sc)sc.textContent=secCode;
      var formEl=this.g('suForm')||this.g('suCard'),codesEl=this.g('suCodes')||this.g('scCard');
      if(formEl)formEl.classList.add('hidden');
      if(codesEl)codesEl.classList.remove('hidden');
      if(!formEl||!codesEl)this.toast('ok','Main Code: '+mainCode+' · Secondary: '+secCode+' — sambhal ke rakho!',9000);
      this.toast('ok','Account created! 🎉');
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){
      if(e&&e.code==='uname')this.errBox('suErr','❌ Username already taken');
      else this.errBox('suErr',this.friendErr(e));
      this.toast('err',this.g('suErr').textContent);
    }
    if(btn){btn.disabled=false;btn.textContent='CREATE ACCOUNT'}
  },
  copyCode:function(id){
    var el=this.g(id);if(!el)return;
    var self=this;
    var t=el.textContent;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(function(){self.toast('ok','Copied!')}).catch(function(){self._copyFallback(t)});
    }else this._copyFallback(t);
  },
  _copyFallback:function(t){
    try{
      var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      this.toast('ok','Copied!');
    }catch(e){this.toast('err','Copy fail — manually select karo')}
  },
  goApp:function(){location.href='index.html'},
  goLogin:function(){location.href='login.html'},
  goSignup:function(){location.href='signup.html'},
  goForgot:function(){location.href='forgot.html'},
  goHelp:function(){location.href='index.html#help'},
  goHack:function(){location.href='index.html#hack'},

  /* ═══════════ FORGOT PASSWORD PAGE ═══════════ */
  sendReset:async function(){
    var self=this;
    var em=(this.g('fpEmail')||{}).value||'';em=em.trim();
    var eb=this.g('fpErr');
    if(eb){eb.classList.remove('show');eb.textContent=''}
    if(!this.email(em)){this.errBox('fpErr','Valid Gmail/email daalo');return}
    var now=Date.now();
    if(now-this._lastReset<60000){this.errBox('fpErr','⏳ 1 minute wait karo — link already bheja ja chuka hai');return}
    var btn=this.g('fpBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ Sending…'}
    try{
      await this.auth.sendPasswordResetEmail(em);
      this._lastReset=Date.now();
      this.g('fpStep1').classList.add('hidden');
      this.g('fpStep2').classList.remove('hidden');
      this.g('fpEmailShow').textContent=em;
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){
      var mmap={
        'auth/user-not-found':'🔴 Ye email kisi VEXA account se linked nahi hai. Signup wala email daalo.',
        'auth/invalid-email':'🔴 Email format galat hai.',
        'auth/too-many-requests':'🔴 Bahut zyada requests — 15 min baad try karo.',
        'auth/network-request-failed':'🔴 Network error — internet check karo.'
      };
      this.errBox('fpErr',mmap[(e&&e.code)||'']||('🔴 '+this.friendErr(e)));
    }
    if(btn){btn.disabled=false;btn.textContent='📨 Reset Link Bhejo'}
  }
};

window.AX=AX;
document.addEventListener('DOMContentLoaded',function(){AX.boot()});

/* ═══════════════════════════════════════════════════════════════════════
   ⚡v2.8.3 — AP COMPATIBILITY BRIDGE (CRITICAL LOGIN FIX)
   ─────────────────────────────────────────────────────────────────────
   login.html / signup.html AP.* functions call karte hain, lekin module
   ka object AX hai — is wajah se "AP is not defined" aata tha aur login
   page hamesha "Session check ho raha hai…" spinner pe atka rehta tha.
   Ye bridge poora AP API provide karta hai (AX backed) + Code Login +
   boot card-switching bhi handle karta hai.
   ═══════════════════════════════════════════════════════════════════════ */
window.AP={
  /* ── boot: page arg set karo + spinner hatao + form dikhao ── */
  boot:function(page){
    try{
      if(page)document.body.setAttribute('data-page',page);
      var w=document.getElementById('apWait'),f=document.getElementById('apForm');
      if(w)w.classList.add('hidden');
      if(f)f.classList.remove('hidden');
      /* signup page pe enter-key handlers bhi wire karo (data-enter attrs) */
    }catch(e){console.warn('AP.boot',e)}
    AX.boot();
  },
  /* ── straight aliases (AX me already hain) ── */
  login:function(){return AX.login.apply(AX,arguments)},
  signup:function(){return AX.signup.apply(AX,arguments)},
  sendReset:function(){return AX.sendReset.apply(AX,arguments)},
  checkUname:function(){return AX.checkUname.apply(AX,arguments)},
  previewPhoto:function(){return AX.previewPhoto.apply(AX,arguments)},
  pwToggle:function(){return AX.pwToggle.apply(AX,arguments)},
  copy:function(id,msg){return AX.copyCode(id)},
  /* ── signup complete → login page ── */
  finishSignup:async function(){
    try{if(AX.auth)await AX.auth.signOut()}catch(e){}
    location.href='login.html';
  },
  /* ── LOGIN WITH CODE card switching (login.html) ── */
  codeOpen:function(){
    var lc=document.getElementById('loginCard'),cc=document.getElementById('clCard');
    if(lc)lc.classList.add('hidden');
    if(cc){cc.classList.remove('hidden');var i=document.getElementById('clCode');if(i)i.focus()}
  },
  clBack:function(){
    var lc=document.getElementById('loginCard'),cc=document.getElementById('clCard');
    if(cc)cc.classList.add('hidden');
    if(lc)lc.classList.remove('hidden');
    var s1=document.getElementById('clStep1'),s2=document.getElementById('clStep2');
    if(s1)s1.classList.remove('hidden');
    if(s2)s2.classList.add('hidden');
  },
  /* ── CODE LOGIN (script.js CodeLogin jaisa — webLogin/{code}) ── */
  _clEmail:null,_clUid:null,
  clVerify:async function(){
    var c=(document.getElementById('clCode')||{}).value||'';c=c.trim().toUpperCase();
    var eb=document.getElementById('clErr');if(eb){eb.classList.remove('show');eb.textContent=''}
    if(!c||c.length!==6){if(eb){eb.textContent='6-digit code daalo';eb.classList.add('show')}return}
    if(!AX.db){if(eb){eb.textContent='Database load nahi hua — page refresh karo';eb.classList.add('show')}return}
    try{
      var s=await AX.db.ref('webLogin/'+c).get();
      if(!s.exists()){if(eb){eb.textContent='Invalid code';eb.classList.add('show')}return}
      var d=s.val();
      if(d.used){if(eb){eb.textContent='Code used already';eb.classList.add('show')}return}
      if(d.exp&&d.exp<Date.now()){if(eb){eb.textContent='Code expired';eb.classList.add('show')}return}
      AP._clEmail=d.email;AP._clUid=d.uid;
      var sh=document.getElementById('clEmailShow');if(sh)sh.textContent=d.email;
      var s1=document.getElementById('clStep1'),s2=document.getElementById('clStep2');
      if(s1)s1.classList.add('hidden');
      if(s2)s2.classList.remove('hidden');
    }catch(e){if(eb){eb.textContent=AX.friendErr(e);eb.classList.add('show')}}
  },
  clFinish:async function(){
    var pw=(document.getElementById('clPw')||{}).value||'';
    var eb=document.getElementById('clErr');if(eb){eb.classList.remove('show');eb.textContent=''}
    if(!pw){if(eb){eb.textContent='Password daalo';eb.classList.add('show')}return}
    if(!AP._clEmail){if(eb){eb.textContent='Pehle code verify karo';eb.classList.add('show')}return}
    var btn=document.getElementById('clBtn');
    if(btn){btn.disabled=true;btn.textContent='Signing in…'}
    try{
      await AX.auth.signInWithEmailAndPassword(AP._clEmail,pw);
      location.replace('index.html');
    }catch(e){
      if(eb){eb.textContent=AX.friendErr(e);eb.classList.add('show')}
      if(btn){btn.disabled=false;btn.textContent='Sign In'}
    }
  },
  /* ── 2FA challenge (graceful — SMS 2FA configured nahi to friendly msg) ── */
  _2faRes:null,
  twoFaResolve:async function(){
    var eb=document.getElementById('twoFaMsg');
    var code=(document.getElementById('twoFaCode')||{}).value||'';
    try{
      if(AP._2faRes){
        var cred=await AP._2faRes.resolve(firebase.auth.PhoneAuthProvider.credential(AP._2faRes.hint.phoneNumber,code));
        location.replace('index.html');
        return;
      }
      if(eb){eb.textContent='Koi pending 2FA challenge nahi hai — seedha Sign In karo.';eb.classList.add('show')}
    }catch(e){if(eb){eb.textContent=AX.friendErr(e);eb.classList.add('show')}}
  },
  twoFaBack:function(){
    var t2=document.getElementById('twoFaSec'),lc=document.getElementById('loginCard');
    if(t2)t2.classList.add('hidden');
    if(lc)lc.classList.remove('hidden');
  }
};
