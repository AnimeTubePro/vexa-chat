/* ═══════════════════════════════════════════════════════════════
   💰 VEXA ADS — Google AdSense Manager v1.0 (production-ready)
   ═══════════════════════════════════════════════════════════════
   Rules (spec-compliant):
   • Ads ONLY on public feed screens (home / posts) + desktop sidebar.
   • NEVER on: login/signup/forgot (ye pages ads.js load hi nahi karte),
     private chat, group chat, calls (voice/video), games panel,
     recovery center, settings, security screens, profiles.
   • Library ensureLib() YAHIN encrypted inject karta hai — duplicate guard.
   • Har <ins> unit sirf ek baar push hota hai (dataset.pushed flag) —
     rerenders me repeated push NAHI.
   • Reserved min-height containers → koi layout shift nahi.
   • Ad load fail → silent skip, website kabhi nahi tootti.
   • Firebase listeners / WebRTC calls ko touch nahi karta.
   • Consent: default NON-PERSONALIZED ads; user opt-in kar sakta hai.
     13 saal se kam age → hamesha non-personalized (age-restricted).
   • Koi programmatic click / user ko click bolna — kabhi nahi (policy).

   Public API (window.VexaAds):
     initializeAdSense()            → library once + NPA flag set
     renderFeedAd(id)               → top-of-feed unit (#vexaFeedAd / #vexaHomeAd)
     renderPostAd(container)        → koi bhi ek unit safely mount
     isAdAllowedOnCurrentPage()     → zone check (spec §3)
     onScreen(sc)                   → V.go hook (sidebar + feed ad)
     onFeedRendered(feedEl)         → Posts.load hook (inline ads, har 6 posts)
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* 🔐 ENCRYPTED AD IDENTITY — source me plaintext NAHI, runtime par decode hota hai */
var _AK=90;
function _AD(x){var b=atob(x),o='';for(var i=0;i<b.length;i++)o+=String.fromCharCode(b.charCodeAt(i)^_AK);return o}
var CLIENT=_AD('OTt3Ki84d2xqa2hvYm1saGttamtoa2g=');
var SLOT=_AD('Ymxva29oY25uaA==');
var FEED_INTERVAL=6;      /* har 6 posts ke baad ek ad (spec §2B) */
var MAX_INLINE=3;         /* ek feed load me max 3 inline ads */
var inited=false;
var CONSENT_KEY='vexaAdConsent';

/* ── helpers ── */
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

function currentScreen(){
  var act=document.querySelector('.scr.act');
  return act?act.id.replace('sc-',''):'';
}
function overlayOpen(){
  /* private overlays: chat, calls, game panel — ads inme KABHI nahi */
  var ids=['chatV','callO','gpan'];
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);
    if(el&&el.classList.contains('open'))return true;
  }
  return false;
}
function appVisible(){
  var ab=document.getElementById('authBox');
  if(ab&&!ab.classList.contains('hidden'))return false;
  var app=document.getElementById('app');
  return !!(app&&app.classList.contains('act'));
}

/* ── spec §3: STRICT NO-AD ZONES — sirf home/posts allowed ── */
function isAdAllowedOnCurrentPage(){
  var sc=currentScreen();
  if(sc!=='home'&&sc!=='posts')return false;
  if(overlayOpen())return false;
  if(!appVisible())return false;
  return true;
}

/* ── age-restriction (spec §7): <13 → hamesha non-personalized ── */
function userAge(){
  try{
    if(typeof me!=='undefined'&&me&&me.dob&&typeof V!=='undefined'&&V.age){
      var a=V.age(me.dob);
      if(a!==null)return a;
    }
  }catch(e){}
  return null;
}
function npaRequired(){
  var c=lsGet(CONSENT_KEY);
  if(c==='personalized'){
    var a=userAge();
    if(a!==null&&a<13)return true;
    return false;
  }
  return true; /* default: non-personalized (safest for all regions) */
}
function applyNpaFlag(){
  try{
    window.adsbygoogle=window.adsbygoogle||[];
    window.adsbygoogle.requestNonPersonalizedAds=npaRequired()?1:0;
  }catch(e){}
}

/* ── spec §4: library SIRF EK BAAR — duplicate guard ── */
function ensureLib(){
  if(window.adsbygoogle&&window.adsbygoogle.loaded)return true;
  var s=document.querySelector('script[src*="adsbygoogle.js"]');
  if(!s){
    /* loader yahin encrypted inject hota hai (source me plaintext nahi) */
    s=document.createElement('script');
    s.async=true;
    s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+CLIENT;
    s.setAttribute('crossorigin','anonymous');
    document.head.appendChild(s);
  }
  return true;
}

/* ── spec §6: initializeAdSense ── */
function initializeAdSense(){
  if(inited)return true;              /* duplicate-init detection */
  if(!appVisible())return false;      /* login/recovery screens pe init nahi */
  ensureLib();
  applyNpaFlag();
  inited=true;
  return true;
}

/* ── ad unit builder ── */
function buildUnit(){
  var ins=document.createElement('ins');
  ins.className='adsbygoogle';
  ins.style.display='block';
  ins.setAttribute('data-ad-client',CLIENT);
  ins.setAttribute('data-ad-slot',SLOT);
  ins.setAttribute('data-ad-format','auto');
  ins.setAttribute('data-full-width-responsive','true');
  return ins;
}
function safePush(ins){
  if(!ins||ins.dataset.pushed==='1')return;   /* repeated push guard */
  try{
    (window.adsbygoogle=window.adsbygoogle||[]).push({});
    ins.dataset.pushed='1';
  }catch(e){
    /* inventory unavailable / ad-blocker / no fill → silent skip,
       website kabhi break nahi hoti (spec §4) */
  }
}

/* ── safe mount into any container ── */
function mount(container){
  if(!container||container.dataset.mounted==='1')return;
  if(!isAdAllowedOnCurrentPage())return;
  if(!initializeAdSense())return;
  var slot=container.querySelector('.vexa-ad-slot');
  if(!slot)return;
  container.dataset.mounted='1';
  slot.innerHTML='';
  var ins=buildUnit();
  slot.appendChild(ins);
  safePush(ins);
}

/* ── spec §6: renderFeedAd — top-of-feed unit (posts=#vexaFeedAd, home=#vexaHomeAd) ── */
function renderFeedAd(id){
  try{mount(document.getElementById(id||'vexaFeedAd'))}catch(e){}
}

/* ── spec §6: renderPostAd — inline unit between posts ── */
function renderPostAd(container){
  try{mount(container)}catch(e){}
}

/* ── Posts.load hook: feed ad + inline ads har FEED_INTERVAL posts ── */
function onFeedRendered(feedEl){
  if(!feedEl)return;
  if(!isAdAllowedOnCurrentPage())return;
  renderFeedAd();
  /* purane inline containers hatao (re-render hygiene) */
  var olds=feedEl.querySelectorAll('.vexa-inline-ad');
  for(var i=0;i<olds.length;i++){if(olds[i].parentNode)olds[i].parentNode.removeChild(olds[i])}
  /* direct .pcard children */
  var kids=[];
  for(var c=0;c<feedEl.children.length;c++){
    var k=feedEl.children[c];
    if(k&&k.classList&&k.classList.contains('pcard'))kids.push(k);
  }
  var total=Math.min(MAX_INLINE,Math.floor(kids.length/FEED_INTERVAL));
  var inserted=0;
  for(var n=FEED_INTERVAL;n<=kids.length&&inserted<total;n+=FEED_INTERVAL){
    var ad=document.createElement('div');
    ad.className='vexa-ad-container vexa-inline-ad';
    ad.innerHTML='<span class="vexa-ad-label">Advertisement</span><div class="vexa-ad-slot"></div>';
    var ref=kids[n-1];
    if(ref.nextSibling)feedEl.insertBefore(ad,ref.nextSibling);
    else feedEl.appendChild(ad);
    inserted++;
    renderPostAd(ad);
  }
}

/* ── desktop sidebar (spec §2C) — sirf wide screens + allowed zones ── */
function toggleSidebar(show){
  var sb=document.getElementById('vexaSidebarAd');
  if(!sb)return;
  var wide=window.matchMedia&&window.matchMedia('(min-width:1180px)').matches;
  var on=!!show&&wide&&isAdAllowedOnCurrentPage();
  sb.classList.toggle('on',on);
  if(on)renderPostAd(sb);
}

/* ── V.go hook ── */
function onScreen(sc){
  if(sc==='home'||sc==='posts'){
    if(overlayOpen())return;
    toggleSidebar(true);
    renderFeedAd(sc==='home'?'vexaHomeAd':'vexaFeedAd');
    consentCheck();
  }else{
    toggleSidebar(false);
  }
}

/* ── private overlay khule to sidebar hatao (chat/calls/games) ── */
function watchOverlays(){
  if(!window.MutationObserver)return;
  ['chatV','callO','gpan'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    new MutationObserver(function(){
      if(overlayOpen()){toggleSidebar(false)}
      else{var sc=currentScreen();if(sc==='home'||sc==='posts')toggleSidebar(true)}
    }).observe(el,{attributes:true,attributeFilter:['class']});
  });
}

/* ── consent popup (spec §7) — ⚡v2.4: chhota centered card + Accept buttons
   + Account Creation Policy (Police ke saath). Sirf login ke baad, feed screens pe, sirf pehli baar ── */
function consentCheck(){
  if(lsGet(CONSENT_KEY))return;
  if(document.getElementById('vexaConsent'))return;
  if(!appVisible())return;   /* login/signup/recovery screens pe popup KABHI nahi */
  var b=document.createElement('div');
  b.id='vexaConsent';
  b.className='vexa-consent';
  b.innerHTML='<div class="vc-t">💰 Ads Notice</div>'
   +'<div class="vc-txt">VEXA free hai — Google AdSense ads se chalta hai. Ads sirf Home/Posts feed me aate hain, private chat/calls me kabhi nahi.'
   +'<span class="vc-pol">👮 <b>Account Policy:</b> 13+ saal · sahi info · 1 account · rules follow karo — warna VEXA Police action. <a href="privacy.html" target="_blank" rel="noopener">Privacy</a> · <a href="terms.html" target="_blank" rel="noopener">Terms</a> · <a href="javascript:void(0)" onclick="try{V.go(&quot;police&quot;)}catch(e){}">Police</a></span></div>'
   +'<div class="vc-btns"><button type="button" class="vc-b vc-yes">✅ Accept</button><button type="button" class="vc-b vc-no">🔒 Accept (N-P ads)</button></div>';
  document.body.appendChild(b);
  setTimeout(function(){b.classList.add('show')},60);
  function choose(v){
    lsSet(CONSENT_KEY,v);
    applyNpaFlag();
    b.classList.remove('show');
    setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},300);
  }
  b.querySelector('.vc-yes').addEventListener('click',function(){choose('personalized')});
  b.querySelector('.vc-no').addEventListener('click',function(){choose('npa')});
}

/* ── boot ── */
document.addEventListener('DOMContentLoaded',function(){
  watchOverlays();
  var sc=currentScreen();
  if(sc==='home'||sc==='posts')onScreen(sc);
});
window.addEventListener('resize',function(){
  var sc=currentScreen();
  toggleSidebar(sc==='home'||sc==='posts');
});

/* ── public API ── */
window.VexaAds={
  initializeAdSense:initializeAdSense,
  renderFeedAd:renderFeedAd,
  renderPostAd:renderPostAd,
  isAdAllowedOnCurrentPage:isAdAllowedOnCurrentPage,
  onScreen:onScreen,
  onFeedRendered:onFeedRendered
};
})();
