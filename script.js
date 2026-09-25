/* 🛡️ SAFETY NET */
window.addEventListener('error',function(e){
  var el=document.getElementById('splashTx'),sp=document.getElementById('splash');
  if(el&&sp&&!sp.classList.contains('fade')){
    el.textContent='⚠️ Error: '+((e&&e.message)||'Script error');
    el.style.color='#ff6b6b';
  }
},true);
setTimeout(function(){
  var s=document.getElementById('splash');
  if(s&&!s.classList.contains('fade')){
    s.classList.add('fade');
    var ab=document.getElementById('authBox'),ap=document.getElementById('app');
    if(ab&&ap&&!ap.classList.contains('act')){
      ab.classList.remove('hidden');
      var cards=document.querySelectorAll('#authBox .acard');
      for(var i=0;i<cards.length;i++){if(cards[i].id==='sLogin'){cards[i].classList.remove('hidden');break}}
    }
  }
},9000);

/* ═══════════ 🔗 ATP LINKS + STAFF URLS ═══════════ */
const ATP_LINKS=[
 {name:'🌐 Web Studio',url:'https://animetubepro.github.io/AnimeTubePro-Web-Studio/'},
 {name:'📱 Download APK',url:'https://www.mediafire.com/file/wa0l16rgnyd0y5v/app-release.apk/file'}
];
const ATP_STAFF_URLS={
 owner:'sites/owner.html',
 admin:'sites/vexa/admin.html',
 moderator:'sites/vexa/moderator.html'
};

/* ═══════════ 🎬 ATP CORE ═══════════ */
const ATP={
 cfg:{loadingSeconds:4.5,particles:{stars:70,fire:14,bubbles:10,petals:10}},
 exts:['png','jpg','jpeg','webp'],
 loaderDone:false,_fadeQ:false,
 ready:function(fn){
  var boot=function(){setTimeout(fn,0)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
 },
 loadFirst:function(urls){
  return new Promise(function(res){
   var i=0;
   (function next(){
    if(i>=urls.length)return res(null);
    var im=new Image();
    im.onload=function(){res(urls[i])};
    im.onerror=function(){i++;next()};
    im.src=urls[i];
   })();
  });
 },
 loader:function(){
  var bar=document.getElementById('loadBar'),pct=document.getElementById('loadPct'),sp=document.getElementById('splash');
  if(!sp)return;
  var self=this,t0=performance.now(),DUR=(this.cfg.loadingSeconds||4.5)*1000;
  (function tick(){
   var s2=document.getElementById('splash');
   if(!s2)return;
   var p=Math.min(1,(performance.now()-t0)/DUR);
   if(bar)bar.style.width=(p*100).toFixed(1)+'%';
   if(pct)pct.textContent=Math.round(p*100)+'% — Loading...';
   if(p<1&&!s2.classList.contains('fade'))requestAnimationFrame(tick);
   else{
    if(bar)bar.style.width='100%';
    if(pct)pct.textContent='100% ✓';
    self.loaderDone=true;
    if(self._fadeQ){var s=document.getElementById('splash');if(s)s.classList.add('fade')}
   }
  })();
  sp.addEventListener('click',function(){
   var s=document.getElementById('splash');
   if(s&&!s.classList.contains('fade')){
    self.loaderDone=true;
    s.classList.add('fade');
    var ab=document.getElementById('authBox'),ap=document.getElementById('app');
    if(ab&&ap&&!ap.classList.contains('act')){
     ab.classList.remove('hidden');
     var cards=document.querySelectorAll('#authBox .acard');
     for(var i=0;i<cards.length;i++){if(cards[i].id==='sLogin'){cards[i].classList.remove('hidden');break}}
    }
   }
  });
 },
 fx:function(){
  var layer=document.getElementById('fx');if(!layer)return;
  var P=this.cfg.particles,rnd=function(a,b){return Math.random()*b+a};
  var frag=document.createDocumentFragment(),el,i,r,sz;
  for(i=0;i<P.stars;i++){
   el=document.createElement('span');r=Math.random();
   el.className='star'+(r>.85?' cyan':r>.7?' purple':'');
   el.style.cssText='left:'+rnd(0,100)+'%;top:'+rnd(0,75)+'%;width:'+rnd(1,3)+'px;height:'+rnd(1,3)+'px;animation-duration:'+rnd(2,5)+'s;animation-delay:'+rnd(0,4)+'s';
   frag.appendChild(el);
  }
  for(i=0;i<P.fire;i++){
   el=document.createElement('span');el.className='p-fire';sz=rnd(3,9);
   el.style.cssText='left:'+rnd(0,100)+'%;width:'+sz+'px;height:'+(sz*1.4)+'px;--sway:'+rnd(-40,40)+'px;--dur:'+rnd(5,10)+'s;--delay:-'+rnd(0,10)+'s;background:radial-gradient(circle at 50% 80%,#fff6c2,#ffb03a 45%,#ff5a1f 75%,transparent);box-shadow:0 0 10px 2px rgba(255,120,30,.55)';
   frag.appendChild(el);
  }
  for(i=0;i<P.bubbles;i++){
   el=document.createElement('span');el.className='p-bubble';sz=rnd(6,20);
   el.style.cssText='left:'+rnd(0,100)+'%;width:'+sz+'px;height:'+sz+'px;--sway:'+rnd(-30,30)+'px;--dur:'+rnd(9,17)+'s;--delay:-'+rnd(0,15)+'s';
   frag.appendChild(el);
  }
  for(i=0;i<P.petals;i++){
   el=document.createElement('span');el.className='p-petal';
   el.style.cssText='left:'+rnd(0,100)+'%;--sway:'+rnd(-140,140)+'px;--dur:'+rnd(9,16)+'s;--delay:-'+rnd(0,14)+'s';
   frag.appendChild(el);
  }
  layer.appendChild(frag);
 },
 calm:function(){
  var on=false;try{on=localStorage.getItem('vexaCalm')==='1'}catch(e){}
  if(on)document.body.classList.add('calm');
  var btn=document.getElementById('moonBtn');if(!btn)return;
  btn.addEventListener('click',function(){
   document.body.classList.toggle('calm');
   var c=document.body.classList.contains('calm');
   try{localStorage.setItem('vexaCalm',c?'1':'0')}catch(e){}
   try{V.toast('info',c?'🌙 Calm mode ON':'✨ Particles ON')}catch(e){}
  });
 },
 /* 🌌 BG — priority: saved NTH/VTH image > background.jpg/png > animated gradient
    Particles fx-layer iske UPAR chalte rahenge */
 bgInit:async function(){
  var saved=null;
  try{saved=JSON.parse(localStorage.getItem(ImgThemes.KEY)||'null')}catch(e){}
  if(saved&&saved.type){
   await ImgThemes.restore();
   if(ImgThemes.current&&ImgThemes.current.url)return;
  }
  var burl=await this.loadFirst(this.exts.map(function(e){return 'background.'+e}));
  if(burl){
   var img=document.getElementById('bgImg'),bg=document.getElementById('bg');
   if(img){img.style.backgroundImage='url("'+burl+'")';img.classList.add('on')}
   if(bg)bg.classList.add('custom');
  }
 },
 renderLinks:function(){
  var c=document.getElementById('lnkCard');if(!c)return;
  var h='<div class="lkt">🔗 AnimeTubePro</div><div class="lkb">';
  ATP_LINKS.forEach(function(l){
   h+='<button class="btn bg" onclick="window.open(\''+l.url+'\',\'_blank\')">'+l.name+'</button>';
  });
  h+='</div>';
  c.innerHTML=h;
 },
 linksModal:function(){
  var h='<div class="snote mb8">🔗 AnimeTubePro — Web + App links (ek hi jagah)</div>';
  ATP_LINKS.forEach(function(l){
   h+='<div class="rrow" style="flex-wrap:wrap"><span style="font-weight:800">'+l.name+'</span>'
    +'<span class="sm mut" style="flex-basis:100%;word-break:break-all">'+V.esc(l.url)+'</span>'
    +'<button class="btn bg bsm" onclick="window.open(\''+l.url+'\',\'_blank\')">Open ↗</button>'
    +'<button class="btn bg bsm" onclick="V.copy(\''+l.url+'\',\'Link copied\')">📋 Copy</button></div>';
  });
  V.mOpen('🔗 ATP Links — Web & App',h);
 },
 vipApply:function(u){
  var vip=!!(u&&(u.vip||u.verified));
  document.body.classList.toggle('vip',vip);
 },
 init:function(){
  var self=this;
  this.ready(function(){
   self.loader();self.fx();self.calm();
   self.bgInit();
   self.renderLinks();
   try{Music.init()}catch(e){console.warn('music init fail',e)}
  });
 }
};
ATP.init();

/* ═══════════ 🎵 MUSIC v2 — Folder + LOCAL (IndexedDB permanent) ═══════════ */
const Music={
 lists:{hindi:[],english:[]},
 local:[],
 kind:'hindi',idx:0,playing:false,audio:null,_url:null,_errCnt:0,
 KEY:'vexaMusic2',
 idb:function(){
  var self=this;
  if(this._dbp)return this._dbp;
  this._dbp=new Promise(function(res){
   try{
    var rq=indexedDB.open('vexaMusicDB',1);
    rq.onupgradeneeded=function(e){e.target.result.createObjectStore('songs',{keyPath:'id',autoIncrement:true})};
    rq.onsuccess=function(e){self._db=e.target.result;res(self._db)};
    rq.onerror=function(){res(null)};
   }catch(e){res(null)}
  });
  return this._dbp;
 },
 idbAll:function(){
  return this.idb().then(function(db){
   if(!db)return Promise.resolve([]);
   return new Promise(function(res){
    try{
     var g=db.transaction('songs','readonly').objectStore('songs').getAll();
     g.onsuccess=function(){res(g.result||[])};
     g.onerror=function(){res([])};
    }catch(e){res([])}
   });
  });
 },
 idbAdd:function(name,blob){
  return this.idb().then(function(db){
   if(!db)return Promise.reject(new Error('Storage unavailable'));
   return new Promise(function(res,rej){
    try{
     var tx=db.transaction('songs','readwrite');
     tx.objectStore('songs').add({name:name,blob:blob,at:Date.now()});
     tx.oncomplete=function(){res()};
     tx.onerror=function(){rej(tx.error)};
    }catch(e){rej(e)}
   });
  });
 },
 idbDel:function(id){
  return this.idb().then(function(db){
   if(!db)return;
   return new Promise(function(res){
    try{
     var tx=db.transaction('songs','readwrite');
     tx.objectStore('songs').delete(id);
     tx.oncomplete=function(){res()};
     tx.onerror=function(){res()};
    }catch(e){res()}
   });
  });
 },
 init:function(){
  var M=this;
  var mb=document.getElementById('musicBtn');if(!mb)return;
  M.audio=new Audio();M.audio.preload='metadata';
  var saved={};
  try{saved=JSON.parse(localStorage.getItem(M.KEY)||'{}')}catch(e){}
  M.audio.volume=(typeof saved.vol==='number')?saved.vol:0.8;
  var vol=document.getElementById('mpVol');if(vol)vol.value=Math.round(M.audio.volume*100);
  M.audio.addEventListener('ended',function(){M.next()});
  M.audio.addEventListener('error',function(){
   if(M.playing&&M._errCnt<5){M._errCnt++;setTimeout(function(){M.next()},800)}
   else{M.playing=false;M._errCnt=0;M.refresh()}
  });
  M.audio.addEventListener('play',function(){M.playing=true;M.refresh()});
  M.audio.addEventListener('pause',function(){M.playing=false;M.refresh()});
  mb.addEventListener('click',function(e){
   e.stopPropagation();
   var p=document.getElementById('musicPanel');if(p)p.classList.toggle('open');
  });
  document.addEventListener('click',function(e){
   var p=document.getElementById('musicPanel');
   if(p&&p.classList.contains('open')&&!e.target.closest('.music-wrap'))p.classList.remove('open');
  });
  var hi=document.getElementById('mpHindi');
  if(hi)hi.addEventListener('click',function(){M.setKind('hindi');M.playCurrent()});
  var en=document.getElementById('mpEnglish');
  if(en)en.addEventListener('click',function(){M.setKind('english');M.playCurrent()});
  if(vol)vol.addEventListener('input',function(){M.audio.volume=vol.value/100;M.save()});
  var fi=document.getElementById('mpFile');
  if(fi)fi.addEventListener('change',function(){M.addLocal(fi);fi.value=''});
  if(saved.kind)M.kind=saved.kind;
  if(typeof saved.idx==='number')M.idx=saved.idx;
  Promise.all([M.detect('hindi'),M.detect('english'),M.idbAll()]).then(function(r){
   M.lists.hindi=r[0];M.lists.english=r[1];M.local=r[2]||[];
   M.setKind(M.kind);
   M.refresh();
   if(M.playlist().length||M.lists.hindi.length||M.local.length){
    document.addEventListener('pointerdown',function(){
     if(!M.playing&&M.playlist().length)M.playCurrent();
    },{once:true});
   }
  });
 },
 playlist:function(){
  if(this.kind==='local')return this.local;
  return this.lists[this.kind]||[];
 },
 curSrc:function(){
  var pl=this.playlist();
  if(!pl.length)return null;
  var i=((this.idx%pl.length)+pl.length)%pl.length;
  if(this.kind==='local')return {type:'local',item:pl[i],i:i};
  return {type:'folder',url:pl[i],i:i};
 },
 setKind:function(k){
  this.kind=k;
  var pl=this.playlist();
  if(this.idx>=pl.length)this.idx=0;
  this.save();
  document.querySelectorAll('.mp-tab').forEach(function(t){t.classList.toggle('sel',t.dataset.mt===(k==='local'?'local':'folder'))});
  var sf=document.getElementById('secFolder'),sl=document.getElementById('secLocal');
  if(sf)sf.classList.toggle('hidden',k==='local');
  if(sl)sl.classList.toggle('hidden',k!=='local');
 },
 detect:function(kind){
  var names=[kind];
  for(var i=1;i<=8;i++)names.push(kind+i);
  var self=this;
  return Promise.all(names.map(function(n){return self.probe(n)})).then(function(r){
   return r.filter(Boolean);
  });
 },
 probe:function(base){
  return new Promise(function(res){
   var exts=['mp3','ogg','wav','m4a'];
   var i=0;
   (function next(){
    if(i>=exts.length)return res(null);
    var a=document.createElement('audio');
    var t=setTimeout(function(){i++;next()},1800);
    a.preload='metadata';
    a.addEventListener('loadedmetadata',function(){clearTimeout(t);res(base+'.'+exts[i])},{once:true});
    a.addEventListener('error',function(){clearTimeout(t);i++;next()},{once:true});
    a.src=base+'.'+exts[i];
   })();
  });
 },
 pickLocal:function(){
  var fi=document.getElementById('mpFile');
  if(fi)fi.click();
 },
 addLocal:function(inp){
  var M=this,files=inp.files;
  if(!files||!files.length)return;
  var added=0,ps=[];
  for(var i=0;i<files.length;i++){
   (function(f){
    if((!f.type||f.type.indexOf('audio')!==0)&&!/\.(mp3|ogg|wav|m4a|aac|flac)$/i.test(f.name))return;
    ps.push(M.idbAdd(f.name,f).then(function(){added++}).catch(function(){}));
   })(files[i]);
  }
  Promise.all(ps).then(function(){
   if(added)V.toast('success','🎵 '+added+' song(s) added!');
   else V.toast('error','Audio files select karo');
   return M.idbAll();
  }).then(function(list){
   if(list){M.local=list;M.refresh()}
  });
 },
 playLocal:function(id){
  var i=this.local.findIndex(function(s){return s.id===id});
  if(i<0)return;
  this.setKind('local');
  this.idx=i;
  this.playCurrent();
 },
 delLocal:function(id,ev){
  var M=this;
  if(ev)ev.stopPropagation();
  M.idbDel(id).then(function(){return M.idbAll()}).then(function(list){
   M.local=list||[];
   if(M.kind==='local'&&M.idx>=M.local.length)M.idx=0;
   M.refresh();
   V.toast('info','🗑️ Song removed');
  });
 },
 playCurrent:function(){
  var M=this,cur=M.curSrc();
  if(!cur){V.toast('info','🎵 Koi song nahi — Local tab me add karo');return}
  if(M._url&&M._url.indexOf('blob:')===0){try{URL.revokeObjectURL(M._url)}catch(e){}M._url=null}
  if(cur.type==='local'){
   M._url=URL.createObjectURL(cur.item.blob);
   M.audio.src=M._url;
  }else{
   M.audio.src=cur.url;
  }
  M._errCnt=0;
  M.audio.play().catch(function(){V.toast('warning','▶ Tap again to play',2500)});
  M.refresh();
 },
 togglePlay:function(){
  if(!this.curSrc())return this.playCurrent();
  if(this.playing)this.audio.pause();
  else this.audio.play().catch(function(){});
  this.refresh();
 },
 next:function(){
  var pl=this.playlist();
  if(!pl.length){
   if(this.kind==='hindi'&&this.lists.english.length)this.setKind('english');
   else if(this.kind==='english'&&this.local.length)this.setKind('local');
   else if(this.kind==='local'&&this.lists.hindi.length)this.setKind('hindi');
   else return;
   pl=this.playlist();
   if(!pl.length)return;
  }
  this.idx=(this.idx+1)%pl.length;
  this.playCurrent();
 },
 prev:function(){
  var pl=this.playlist();
  if(!pl.length)return;
  this.idx=((this.idx-1)%pl.length+pl.length)%pl.length;
  this.playCurrent();
 },
 stop:function(){
  this.audio.pause();this.audio.currentTime=0;
  this.playing=false;this.refresh();
 },
 save:function(){
  try{localStorage.setItem(this.KEY,JSON.stringify({vol:this.audio.volume,kind:this.kind,idx:this.idx}))}catch(e){}
 },
 refresh:function(){
  var cur=this.curSrc();
  var now=document.getElementById('mpNow');
  if(now){
   if(cur){
    var name=(cur.type==='local')?cur.item.name:cur.url.split('/').pop().replace(/\.[^.]+$/,'');
    var ic=this.kind==='hindi'?'🎬':this.kind==='english'?'🌍':'📁';
    now.innerHTML=ic+' <b>'+V.esc(name)+'</b><br><small>'+(this.playing?'▶ Playing':'⏸ Paused')+' · '+this.kind.toUpperCase()+'</small>';
   }else now.innerHTML='🎵 Ready<br><small>Folder ya Local se song chuno</small>';
  }
  var pp=document.getElementById('mpPlay');
  if(pp)pp.textContent=this.playing?'⏸':'▶';
  var mb=document.getElementById('musicBtn');
  if(mb)mb.classList.toggle('playing',this.playing);
  var cnt=document.getElementById('mpCount');
  if(cnt)cnt.textContent='Hindi: '+this.lists.hindi.length+' • English: '+this.lists.english.length;
  var lc=document.getElementById('mpLocCount');
  if(lc)lc.textContent='Local: '+this.local.length+' song(s)';
  var list=document.getElementById('mpList');
  if(list){
   if(!this.local.length){
    list.innerHTML='<div class="sm mut" style="text-align:center;padding:10px">📭 Koi local song nahi<br>➕ button se add karo</div>';
   }else{
    var h='';
    var curItem=(cur&&cur.type==='local')?cur.item.id:null;
    for(var i=0;i<this.local.length;i++){
     var s=this.local[i];
     h+='<div class="mpl'+(s.id===curItem?' sel':'')+'" onclick="Music.playLocal('+s.id+')">'
      +'<span>▶</span><span class="mn">'+V.esc(s.name)+'</span>'
      +'<span class="mx" onclick="Music.delLocal('+s.id+',event)">✕</span></div>';
    }
    list.innerHTML=h;
   }
  }
 },
 tab:function(t){
  var sf=document.getElementById('secFolder'),sl=document.getElementById('secLocal');
  if(t==='local'){
   if(sf)sf.classList.add('hidden');
   if(sl)sl.classList.remove('hidden');
   document.querySelectorAll('.mp-tab').forEach(function(x){x.classList.toggle('sel',x.dataset.mt==='local')});
  }else{
   if(sf)sf.classList.remove('hidden');
   if(sl)sl.classList.add('hidden');
   document.querySelectorAll('.mp-tab').forEach(function(x){x.classList.toggle('sel',x.dataset.mt==='folder')});
  }
 }
};

/* ═══════════ 🖼️ IMAGE THEMES — NTH (sab) + VTH (VIP)
   🌌 Image BACKGROUND pe lagegi + 🎨 UI colour bhi uska
   ✨ Particles image ke UPAR chalte rahenge ═══════════ */
const ImgThemes={
 EXT:['jpg','png','jpeg','webp'],MAX:6,
 found:{nth:[],vth:[]},
 KEY:'vexaImgTheme',
 current:null,detectDone:false,
 isVip:function(){return !!(me&&(me.vip||me.verified||me.role==='owner'||me.role==='admin'))},
 loadFirst:function(urls){return ATP.loadFirst(urls)},
 detect:function(){
  if(this.detectDone)return Promise.resolve(this.found);
  var self=this,ps=[];
  ['nth','vth'].forEach(function(t){
   for(var i=1;i<=self.MAX;i++){
    (function(t,i){
     var urls=self.EXT.map(function(e){return t+i+'.'+e});
     ps.push(self.loadFirst(urls).then(function(u){if(u)self.found[t].push({type:t,n:i,url:u})}));
    })(t,i);
   }
  });
  return Promise.all(ps).then(function(){self.detectDone=true;return self.found});
 },
 extract:function(url){
  return new Promise(function(res){
   var img=new Image();
   img.onload=function(){
    try{
     var S=40,c=document.createElement('canvas');c.width=S;c.height=S;
     var x=c.getContext('2d');x.drawImage(img,0,0,S,S);
     var d=x.getImageData(0,0,S,S).data;
     var ar=0,ag=0,ab=0,n=0,best=null,bs=-1;
     for(var i=0;i<d.length;i+=4){
      var r=d[i],g=d[i+1],b=d[i+2];
      var mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx-mn,lum=(r+g+b)/3;
      ar+=r;ag+=g;ab+=b;n++;
      var sc=sat+((lum>40&&lum<225)?35:0);
      if(sc>bs){bs=sc;best=[r,g,b]}
     }
     if(!n||!best){res(null);return}
     var R=Math.round(best[0]*.6+ar/n*.4),G=Math.round(best[1]*.6+ag/n*.4),B=Math.round(best[2]*.6+ab/n*.4);
     var mx2=Math.max(R,G,B);
     if(mx2<90){var f=90/mx2;R=Math.round(R*f);G=Math.round(G*f);B=Math.round(B*f)}
     res({r:R,g:G,b:B});
    }catch(e){res(null)}
   };
   img.onerror=function(){res(null)};
   img.src=url;
  });
 },
 hex:function(c){return '#'+[c.r,c.g,c.b].map(function(v){return ('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2)}).join('')},
 lift:function(hex,amt){var nn=parseInt(hex.slice(1),16);function f(x){return Math.min(255,Math.round(x+(255-x)*amt))}return 'rgb('+f(nn>>16&255)+','+f(nn>>8&255)+','+f(nn&255)+')'},
 /* 🌌 IMAGE = BACKGROUND (particles upar) + 🎨 UI colour bhi */
 applyVisual:function(url,hex){
  var R=document.documentElement.style;
  R.setProperty('--ac',hex);
  R.setProperty('--ac2',this.lift(hex,.35));
  R.setProperty('--acs',hexA(hex,.16));
  R.setProperty('--gr','linear-gradient(135deg,'+hex+','+this.lift(hex,.25)+')');
  if(url){
   var bg=document.getElementById('bgImg'),b=document.getElementById('bg');
   if(bg){bg.style.backgroundImage='url("'+url+'")';bg.classList.add('on')}
   if(b)b.classList.add('custom');
  }
 },
 apply:function(t){
  var self=this;
  return this.extract(t.url).then(function(col){
   var hex=col?self.hex(col):'#6c5ce7';
   self.applyVisual(t.url,hex);
   self.current={type:t.type,n:t.n,url:t.url};
   try{localStorage.setItem(self.KEY,JSON.stringify({type:t.type,n:t.n}))}catch(e){}
   try{if(me&&V.uid)db.ref('users/'+V.uid+'/settings/imgTheme').set({type:t.type,n:t.n})}catch(e){}
   V.toast('success','🖼️ Theme: '+t.type.toUpperCase()+' '+t.n+' ✅ (bg + colour: '+hex+')');
  });
 },
 clearVisual:function(){
  var bg=document.getElementById('bgImg'),b=document.getElementById('bg');
  if(bg){bg.style.backgroundImage='';bg.classList.remove('on')}
  if(b)b.classList.remove('custom');
 },
 reset:function(msg){
  try{localStorage.removeItem(this.KEY)}catch(e){}
  this.current=null;
  this.clearVisual();
  try{if(window.ATP&&ATP.bgInit)ATP.bgInit()}catch(e){}
  try{var id=localStorage.getItem('vexaTheme')||'t0_0';Themes.apply(id)}catch(e){}
  if(msg)V.toast('info','🎨 Default theme restored');
 },
 restore:function(){
  var self=this,s=null;
  try{s=JSON.parse(localStorage.getItem(this.KEY)||'null')}catch(e){}
  if(!s||!s.type)return;
  this.detect().then(function(f){
   var item=(f[s.type]||[]).find(function(x){return x.n===s.n});
   if(!item){self.reset();return}
   self.current={type:s.type,n:s.n,url:item.url};
   self.extract(item.url).then(function(col){
    if(col)self.applyVisual(item.url,self.hex(col));
    else self.reset();
   });
  });
 },
 onVipKnown:function(vip){
  if(this.current&&this.current.type==='vth'&&!vip){
   this.reset(false);
   V.toast('warning','🔒 VTH sirf VIP/Verified ke liye hai — default restore',4500);
  }
 },
 open:function(){
  var self=this;
  V.mOpen('🖼️ Image Themes','<div class="spn" style="margin:18px auto"></div>');
  this.detect().then(function(f){
   var vip=self.isVip();
   var h='<div class="snote mb8">🖼️ Image <b>background</b> pe lagegi + UI colour bhi uska — particles upar chalte rahenge!</div>';
   function group(t,label){
    var list=f[t]||[];
    var g='<div class="stit">'+label+'</div><div class="timggrid">';
    g+='<div class="timgc'+(!self.current?' sel':'')+'" onclick="ImgThemes.pickDefault()"><div class="tithumb ti-def">🎨</div><div class="tiname">Default</div><div class="tisub">204 themes</div></div>';
    if(!list.length)g+='<div class="sm mut" style="grid-column:1/-1;padding:8px">📦 '+(t==='nth'?'nth':'vth')+'1.jpg / .png … folder me daalo</div>';
    list.forEach(function(x){
     var lock=(t==='vth'&&!vip);
     var sel=self.current&&self.current.type===t&&self.current.n===x.n;
     g+='<div class="timgc'+(sel?' sel':'')+(lock?' lock':'')+'" onclick="ImgThemes.pick(\''+t+'\','+x.n+')">'
      +'<div class="tithumb" style="background-image:url(\''+x.url+'\')">'+(lock?'<span class="tilock">🔒 VIP</span>':'')+'</div>'
      +'<div class="tiname">'+t.toUpperCase()+' '+x.n+'</div></div>';
    });
    return g+'</div>';
   }
   h+=group('nth','🎨 Normal Themes — sabke liye');
   h+=group('vth','👑 VIP Themes — sirf VIP/Verified');
   h+='<div class="snote">📦 Files: <b>nth1…nth'+self.MAX+'</b> + <b>vth1…vth'+self.MAX+'</b> (jpg/png/webp)</div>';
   V.mOpen('🖼️ Image Themes',h);
  });
 },
 pickDefault:function(){this.reset(true);V.mClose();},
 pick:function(t,n){
  var item=this.found[t].find(function(x){return x.n===n});
  if(!item)return;
  if(t==='vth'&&!this.isVip())return V.toast('warning','🔒 VTH sirf VIP/Verified users ke liye hai!');
  this.apply(item).then(function(){V.mClose();});
 }
};

/* ═══════════ ⚡ QUICK FAB ═══════════ */
const QFab={
 open:false,
 toggle:function(){
  this.open=!this.open;
  var m=document.getElementById('qmenu'),f=document.getElementById('qfab');
  if(m)m.classList.toggle('open',this.open);
  if(f)f.classList.toggle('open',this.open);
 },
 close:function(){
  this.open=false;
  var m=document.getElementById('qmenu'),f=document.getElementById('qfab');
  if(m)m.classList.remove('open');
  if(f)f.classList.remove('open');
 },
 go:function(sc){this.close();if(sc==='settings'){Settings.open()}else V.go(sc)},
 music:function(){this.close();var p=document.getElementById('musicPanel');if(p)p.classList.toggle('open')},
 calm:function(){this.close();var b=document.getElementById('moonBtn');if(b)b.click()},
 themes:function(){this.close();ImgThemes.open()},
 links:function(){this.close();ATP.linksModal()},
 reload:function(){this.close();V.reloadApp()}
};
document.addEventListener('click',function(e){
 if(QFab.open&&!e.target.closest('#qfab')&&!e.target.closest('#qmenu'))QFab.close();
});

/* ═══════════ CONFIG ═══════════ */
const CFG={
 firebase:{apiKey:"AIzaSyDU-J6_YGJC1CUOr_v3ih_rqWGRyhqB4mw",authDomain:"vexa-b3a1d.firebaseapp.com",databaseURL:"https://vexa-b3a1d-default-rtdb.firebaseio.com",projectId:"vexa-b3a1d",storageBucket:"vexa-b3a1d.firebasestorage.app",messagingSenderId:"431099898297",appId:"1:431099898297:web:3adf83427e1b8c7f9c2e68"},
 supabase:{url:"https://ygbkjnwuvjcgdzbqwgwv.supabase.co",anonKey:"sb_publishable__0S4cvfvVDrEnONXnuHjGQ_Yl_bjC-o",bucket:"vexa-media"}
};
const CF_URL='https://us-central1-vexa-b3a1d.cloudfunctions.net/recoveryLogin';
const CF_STORE_URL=CF_URL.replace('recoveryLogin','vexaSecureStore');
const CF_CREDCHAT_URL=CF_URL.replace('recoveryLogin','recoveryCredChat');
let auth=null,db=null,sb=null,me=null;

/* ================= CORE (CRASH-PROOF) ================= */
const V={
 g:function(id){return document.getElementById(id)},
 esc:function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML},
 async sha(s){
   try{
     if(typeof crypto!=='undefined'&&crypto.subtle){
       var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));
       return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
     }
   }catch(e){}
   var h=0,t=String(s);
   for(var i=0;i<t.length;i++){h=((h*31)+t.charCodeAt(i))|0}
   return 'fb'+Math.abs(h).toString(16);
 },
 toast:function(t,m,ms){
   ms=ms||3000;
   try{
     var ic={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
     var e=document.createElement('div');e.className='toast '+t;
     e.innerHTML='<span>'+(ic[t]||'ℹ️')+'</span><span>'+V.esc(m)+'</span>';
     var c=V.g('tcont');if(c)c.appendChild(e);
     setTimeout(function(){e.classList.add('out');setTimeout(function(){e.remove()},250)},ms);
   }catch(err){}
 },
 copy:async function(t,m){
   m=m||'Copied!';
   try{await navigator.clipboard.writeText(t);V.toast('success',m)}
   catch(e){
     try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();V.toast('success',m)}
     catch(e2){V.toast('error','Copy failed')}
   }
 },
 timeAgo:function(ts){
   if(!ts)return'';
   var s=Math.floor((Date.now()-ts)/1000);
   if(s<60)return'now';
   if(s<3600)return Math.floor(s/60)+'m';
   if(s<86400)return Math.floor(s/3600)+'h';
   if(s<604800)return Math.floor(s/86400)+'d';
   return new Date(ts).toLocaleDateString();
 },
 clock:function(ts){return new Date(ts||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},
 dateDiv:function(ts){
   var d=new Date(ts||Date.now()),t=new Date();
   if(d.toDateString()===t.toDateString())return'Today';
   var y=new Date(t);y.setDate(t.getDate()-1);
   if(d.toDateString()===y.toDateString())return'Yesterday';
   return d.toLocaleDateString();
 },
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
 genCode:function(blocks,len){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out=[];for(var b=0;b<blocks;b++){var s='';for(var i=0;i<len;i++){s+=c[Math.floor(Math.random()*c.length)]}out.push(s)}return out.join('-')},
 pwToggle:function(id,btn){var el=V.g(id);el.type=(el.type==='password')?'text':'password';btn.textContent=(el.type==='password')?'👁️':'🙈'},
 showAuth:function(id){['sLogin','sSignup','sCodes','sRec','sCodeLogin','sHelp'].forEach(function(s){V.g(s).classList.add('hidden')});V.g(id).classList.remove('hidden')},
 mOpen:function(t,b,f){V.g('mTitle').textContent=t;V.g('mBody').innerHTML=b;V.g('mFt').innerHTML=f||'';V.g('mFt').style.display=f?'flex':'none';V.g('modal').classList.add('open')},
 mClose:function(){V.g('modal').classList.remove('open')},
 go:function(sc){
   document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('act')});
   var el=V.g('sc-'+sc);if(el)el.classList.add('act');
   document.querySelectorAll('.bni').forEach(function(n){n.classList.toggle('act',n.dataset.sc===sc)});
   var titles={home:'ATP × VEXA',search:'Search',local:'Local Scan',chat:'Chats',calls:'Calls',games:'Games',notif:'Notifications',profile:'Profile'};
   V.g('topTitle').textContent=titles[sc]||'ATP × VEXA';
   if(sc==='home')Posts.load();
   if(sc==='chat')ChatUI.load();
   if(sc==='calls')CallsUI.load();
   if(sc==='games')Games.home();
   if(sc==='notif')Notif.load();
   if(sc==='local')Local.load();
 },
 openProfile:function(uid){if(!uid)return;V.go('profile');Profile.render(uid)},
 ava:function(u,sz){
   var n=(u&&u.displayName)||'?';
   var ph=(u&&u.profilePhoto)||'';
   var img='';
   if(ph){img=(ph.indexOf('data:')===0)?' style="background-image:url('+ph+')"':' style="background-image:url(\''+V.esc(ph)+'\')"'}
   var letter=ph?'':V.esc(n.charAt(0).toUpperCase());
   return '<div class="ava '+sz+'"'+img+'>'+letter+'</div>';
 },
 nameB:function(u){
   var h=V.esc((u&&u.displayName)||'User');
   if(u&&u.verified)h+=' <span class="bver">✔</span>';
   if(u&&u.vip)h+=' <span class="bvip">VIP</span>';
   if(u&&u.role==='owner')h+=' <span class="badm" style="background:linear-gradient(135deg,#ffd700,#ffec8b);color:#111">👑 OWNER</span>';
   else if(u&&u.role==='admin')h+=' <span class="badm">👑 ADMIN</span>';
   else if(u&&u.role==='moderator')h+=' <span class="bmod">🛡️ MOD</span>';
   if(u&&u.banned)h+=' <span class="bban">BANNED</span>';
   return h;
 },
 htg:function(esc){return esc.replace(/#[\w]+/g,function(m){return '<span class="htag" onclick="Search.hash(\''+m.slice(1)+'\')">'+m+'</span>'})},
 friendErr:function(e){
   var M={'auth/invalid-email':'Invalid email.','auth/user-not-found':'Account not found.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Incorrect email or password.','auth/email-already-in-use':'Email already registered.','auth/weak-password':'Password too weak.','auth/too-many-requests':'Too many attempts.','auth/network-request-failed':'Network error.','auth/requires-recent-login':'Please sign in again.','auth/unauthorized-domain':'Domain not authorized — localhost use karo.','PERMISSION_DENIED':'Permission denied.'};
   return (e&&M[e.code])||'Something went wrong. Try again.';
 },
 dev:function(){
   var ua=navigator.userAgent;
   var os=/android/i.test(ua)?'Android':/iphone|ipad/i.test(ua)?'iOS':/win/i.test(ua)?'Windows':/mac/i.test(ua)?'Mac':'Linux';
   var br=/edg/i.test(ua)?'Edge':/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':'Browser';
   return br+' / '+os;
 },
 compress:function(file,maxKB,maxDim){
   maxKB=maxKB||300;maxDim=maxDim||1280;
   return new Promise(function(res,rej){
     if(!file||!file.type||file.type.indexOf('image/')!==0)return rej(new Error('Only image files allowed'));
     var img=new Image(),url=URL.createObjectURL(file);
     img.onload=function(){
       URL.revokeObjectURL(url);
       var w=img.width,h=img.height;
       if(w>maxDim||h>maxDim){var r=Math.min(maxDim/w,maxDim/h);w=Math.round(w*r);h=Math.round(h*r)}
       var c=document.createElement('canvas');c.width=w;c.height=h;
       c.getContext('2d').drawImage(img,0,0,w,h);
       var q=0.85;
       var go=function(){
         var d=c.toDataURL('image/jpeg',q);
         if(d.length*0.75>maxKB*1024&&q>0.3){q-=0.1;go()}
         else if(d.length*0.75>maxKB*1024)rej(new Error('Photo must be 300 KB or less'));
         else res(d);
       };
       go();
     };
     img.onerror=function(){URL.revokeObjectURL(url);rej(new Error('Invalid image'))};
     img.src=url;
   });
 },
 d2b:function(du){
   var parts=du.split(','),meta=parts[0],b64=parts[1];
   var mime=meta.match(/:(.*?);/)[1];
   var bin=atob(b64),a=new Uint8Array(bin.length);
   for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
   return new Blob([a],{type:mime});
 },
 uploadPhoto:async function(dataUrl,path){
   try{
     var r=await sb.storage.from(CFG.supabase.bucket).upload(path,V.d2b(dataUrl),{contentType:'image/jpeg',upsert:true});
     if(r.error)throw r.error;
     var pub=sb.storage.from(CFG.supabase.bucket).getPublicUrl(path).data.publicUrl;
     var ok=await new Promise(function(res){
       var i=new Image();i.onload=function(){res(true)};i.onerror=function(){res(false)};
       i.src=pub;setTimeout(function(){res(false)},5000);
     });
     if(ok)return pub;
     throw new Error('read fail');
   }catch(e1){
     try{
       var small=await new Promise(function(res,rej){
         var img=new Image();
         img.onload=function(){
           var c=document.createElement('canvas');
           var s=Math.min(1,500/Math.max(img.width,img.height));
           c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
           c.getContext('2d').drawImage(img,0,0,c.width,c.height);
           var d=c.toDataURL('image/jpeg',0.55);
           if(d.length>280000){
             var s2=Math.min(1,350/Math.max(img.width,img.height));
             c.width=Math.round(img.width*s2);c.height=Math.round(img.height*s2);
             c.getContext('2d').drawImage(img,0,0,c.width,c.height);
             d=c.toDataURL('image/jpeg',0.5);
           }
           res(d);
         };
         img.onerror=function(){rej(new Error('fail'))};
         img.src=dataUrl;
       });
       V.toast('info','Photo inline saved',5000);
       return small;
     }catch(e2){throw new Error('Photo save failed')}
   }
 },
 autoAvatar:async function(uid){
   try{
     var pub=sb.storage.from(CFG.supabase.bucket).getPublicUrl('profile/'+uid+'/avatar.jpg').data.publicUrl;
     var ok=await new Promise(function(res){
       var i=new Image();i.onload=function(){res(true)};i.onerror=function(){res(false)};
       i.src=pub;setTimeout(function(){res(false)},4000);
     });
     if(ok){
       await db.ref('users/'+uid+'/profilePhoto').set(pub);
       return pub;
     }
   }catch(e){console.warn('autoAvatar skip:',e.message)}
   return null;
 },
 sbPath:function(url){
   try{
     if(url.indexOf('data:')===0)return'';
     return decodeURIComponent(url.split('/object/public/'+CFG.supabase.bucket+'/')[1]||'');
   }catch(e){return''}
 },
 refreshMe:function(){
   var u=me||{};
   var set=function(el){
     if(!el)return;
     if(u.profilePhoto){
       if(u.profilePhoto.indexOf('data:')===0){el.style.backgroundImage='url('+u.profilePhoto+')'}
       else{el.style.backgroundImage="url('"+u.profilePhoto+"')"}
       el.textContent='';
     }else{el.style.backgroundImage='';el.textContent=(u.displayName||'?').charAt(0).toUpperCase()}
   };
   set(V.g('topAva'));
 },
 fadeSplash:function(){
   var doFade=function(){var s=V.g('splash');if(s)s.classList.add('fade')};
   if(window.ATP&&!ATP.loaderDone){ATP._fadeQ=true;return}
   doFade();
 },
 reloadApp:function(){
   try{
     if('caches' in window){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})}).catch(function(){})}
   }catch(e){}
   try{sessionStorage.removeItem('vexaSid')}catch(e){}
   location.reload(true);
 },
 vaultSet:function(uid,data){
   try{db.ref('recoveryPrivate/'+uid).update(data).catch(function(){})}catch(e){}
 },
 requireAuth:function(cb){
   auth.onAuthStateChanged(async function(u){
     V.fadeSplash();
     try{
       if(!u){
         V.showAuth('sLogin');
         V.g('authBox').classList.remove('hidden');
         V.g('app').classList.remove('act');
         return;
       }
       try{
         var s=await db.ref('users/'+u.uid).get();
         me=s.exists()?s.val():{displayName:'User',username:'user'+u.uid.slice(0,6),email:u.email,role:'user'};
       }catch(e){console.warn('profile load fail:',e);me={displayName:'User',username:'user'+u.uid.slice(0,6),email:u.email,role:'user'}}
       try{
         var bn=(await db.ref('users/'+u.uid+'/banned').get());
         if(bn.exists()&&bn.val()===true){
           await auth.signOut();
           V.showAuth('sLogin');
           V.g('authBox').classList.remove('hidden');
           var le=V.g('loginErr');
           if(le){le.textContent='🚫 Account banned.';le.classList.add('show')}
           return;
         }
       }catch(e){}
       if(!me.profilePhoto){
         var auto=await Promise.race([
           V.autoAvatar(u.uid),
           new Promise(function(res){setTimeout(function(){res(null)},6000)})
         ]);
         if(auto)me.profilePhoto=auto;
       }
       V.uid=u.uid;
       V.g('authBox').classList.add('hidden');
       V.g('app').classList.add('act');
       V.refreshMe();
       try{ATP.vipApply(me)}catch(e){}
       try{ImgThemes.restore()}catch(e){}
       /* 🔒 STAFF SESSION — panel access (12h) */
       try{
         if(me&&me.role&&me.role!=='user'){
           localStorage.setItem('vexaStaffSession',JSON.stringify({role:me.role,uid:u.uid,ts:Date.now()}));
         }else{
           localStorage.removeItem('vexaStaffSession');
         }
       }catch(e){}
       V.g('topTitle').textContent=me.displayName||'ATP × VEXA';
       try{Presence.start()}catch(e){}
       try{Badges.start()}catch(e){}
       try{watchIncoming()}catch(e){}
       var sid='s_'+Math.random().toString(36).slice(2,9);
       try{sessionStorage.setItem('vexaSid',sid)}catch(e){}
       try{db.ref('users/'+V.uid+'/sessions/'+sid).set({device:V.dev(),lastActive:Date.now()})}catch(e){}
       if(cb){
         try{cb(u)}catch(e){console.error('cb error:',e)}
       }
     }catch(err){
       console.error('requireAuth error:',err);
       V.showAuth('sLogin');
       V.g('authBox').classList.remove('hidden');
       V.g('splashTx').textContent='⚠️ Warning: '+err.message+' — app still usable';
       V.g('splashTx').style.color='#ff9b6b';
     }
   });
 }
};
document.addEventListener('click',function(e){var m=V.g('modal');if(m&&m.classList.contains('open')&&e.target===m)V.mClose()});
window.addEventListener('online',function(){var e=V.g('offBan');if(e)e.classList.add('hidden')});
window.addEventListener('offline',function(){var e=V.g('offBan');if(e)e.classList.remove('hidden')});

/* ================= THEMES (204) ================= */
function hexA(h,a){var n=parseInt(h.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function lighten(h){var n=parseInt(h.slice(1),16);function f(x){return Math.min(255,Math.round(x*1.22))}return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'}
const Themes={
 bases:[['Midnight','#6c5ce7','#0a0a0f','#12121a','#1a1a26','#f0f0f5','#9a9ab0'],['Ocean Blue','#2e86de','#0a0f1a','#101828','#182236','#eef4fb','#8fa8c4'],['Sunset','#e67e22','#160d08','#221610','#2e1e16','#fdf1e7','#c9a188'],['Forest','#27ae60','#081209','#101c11','#182a19','#e9f6ec','#8bb494'],['Neon Pink','#fd2f92','#12060c','#1d0a14','#290f1c','#fdeef5','#c88aab'],['Cyber','#00ffd0','#03110e','#062019','#092e24','#e2fff9','#7ac0b2'],['Blood Red','#e74c3c','#140707','#1f0c0b','#2b1210','#fdeeec','#c4908a'],['Royal Purple','#9b59b6','#0f0812','#180d1e','#22132a','#f6ecfa','#b48cc2'],['Golden','#d4a017','#12100a','#1d1a10','#282417','#faf5e6','#c2b48c'],['Ice','#74b9ff','#0a0e14','#101722','#182031','#eef4fb','#8ba3bd'],['Mint','#1abc9c','#071210','#0d1f1c','#132c28','#e7f6f2','#85b3a8'],['Coral','#ff7f50','#140b08','#20120d','#2c1a13','#fdefe9','#c99a87'],['Lavender','#a29bfe','#0c0b14','#131221','#1b1930','#f1f0fc','#a3a0c4'],['Emerald','#2ecc71','#061109','#0c1d10','#122c18','#e8f8ee','#8abb9c'],['Steel','#95a5a6','#0d0f10','#161a1b','#1f2526','#f0f3f3','#97a5a6'],['Cherry','#ff4757','#120708','#1d0b0d','#291013','#fdeef0','#c98d94'],['Amber','#f39c12','#120e07','#1d160b','#291f0f','#faf3e6','#c4ad8c'],['Teal','#16a085','#06110f','#0c1d1a','#122c28','#e6f6f3','#83b3ab'],['Rose','#e84393','#130810','#1e0c19','#2a1122','#fceef5','#c28bab'],['Indigo','#5352ed','#0a0a14','#101020','#171730','#eef0fc','#9a9cc4'],['Lime','#a4b41b','#0e1005','#161c08','#1f280b','#f5fae4','#b4bd85'],['Sky','#00a8ff','#050e14','#091824','#0d2334','#e6f4fc','#84aec4'],['Tomato','#ff6348','#140806','#20100c','#2c1710','#fdeeea','#c99387'],['Amethyst','#8e44ad','#0e0812','#160d1e','#20132a','#f3ecf8','#ac8cc2'],['Sapphire','#1e5fd4','#060b14','#0c1420','#111d30','#e8f0fb','#8699bd'],['Jade','#00b894','#051210','#0a1e1a','#0f2c26','#e4f6f2','#7fb3a8'],['Magma','#ff3838','#130505','#1f0909','#2b0d0d','#fdeaea','#c48a8a'],['Plum','#a55eea','#0f0a14','#170f20','#20162c','#f4edfa','#b493c6'],['Turquoise','#1dd1a1','#06110e','#0c1e1a','#122c26','#e5f6f2','#84b3a8'],['Bronze','#cd7f32','#120d08','#1d150e','#291d14','#f9f2e9','#c4a487'],['Aqua','#00d4ff','#04121a','#082030','#0c2c40','#e6f9ff','#7fb6c9'],['Rose Gold','#b76e79','#150a0c','#221014','#301719','#faeef0','#c4969d'],['Copper','#b87333','#140d07','#1f140c','#2b1b11','#f8efe6','#c4a287'],['Space Gray','#8e9aaf','#0b0d10','#12151a','#191e26','#eef1f5','#9aa4b5']],
 variants:['Dark','Light','AMOLED','Neon','Glass','Soft'],
 list:function(){var out=[];for(var i=0;i<this.bases.length;i++){for(var j=0;j<this.variants.length;j++){out.push({id:'t'+i+'_'+j,name:this.bases[i][0]+' '+this.variants[j],ac:this.bases[i][1],i:i,j:j})}}return out},
 apply:function(id){
   try{
     var t=null,lst=this.list();
     for(var k=0;k<lst.length;k++){if(lst[k].id===id){t=lst[k];break}}
     if(!t)t=lst[0];
     var b=this.bases[t.i],j=t.j;
     var light=(j===1),amoled=(j===2);
     var R=document.documentElement.style;
     R.setProperty('--ac',b[1]);R.setProperty('--ac2',b[1]);
     R.setProperty('--bg1',light?'#f4f5fa':amoled?'#000000':b[2]);
     R.setProperty('--bg2',light?'#ffffff':amoled?'#070707':b[3]);
     R.setProperty('--bg3',light?'#eef0f5':amoled?'#101010':b[4]);
     R.setProperty('--bg4',light?'#e3e6ee':amoled?'#1a1a1a':lighten(b[4]));
     R.setProperty('--tx',light?'#17171f':b[5]);
     R.setProperty('--tx2',light?'#55556a':b[6]);
     R.setProperty('--tx3',light?'#8a8aa0':'#6a6a80');
     R.setProperty('--bd',light?'rgba(0,0,0,.09)':'rgba(255,255,255,.08)');
     R.setProperty('--bds',light?'rgba(0,0,0,.16)':'rgba(255,255,255,.14)');
     R.setProperty('--hov',light?'rgba(0,0,0,.04)':'rgba(255,255,255,.05)');
     R.setProperty('--act',light?'rgba(0,0,0,.08)':'rgba(255,255,255,.09)');
     R.setProperty('--gl',light?'rgba(255,255,255,.9)':amoled?'rgba(0,0,0,.85)':'rgba(14,14,20,.88)');
     R.setProperty('--acs',hexA(b[1],light?0.12:0.16));
     R.setProperty('--gr','linear-gradient(135deg,'+b[1]+','+hexA(b[1],0.75)+')');
     R.setProperty('--shl',light?'rgba(244,245,250,.92)':amoled?'rgba(0,0,0,.92)':hexA(b[2],0.9));
     try{localStorage.setItem('vexaTheme',id)}catch(e){}
     if(me&&V.uid){try{db.ref('users/'+V.uid+'/settings/theme').set(id)}catch(e){}}
   }catch(e){console.warn('theme fail',e)}
 },
 open:function(){
   var cur='t0_0';try{cur=localStorage.getItem('vexaTheme')||'t0_0'}catch(e){}
   var h='<div class="thgrid">';
   this.list().forEach(function(t){
     var bg=(t.j===1)?'#f4f5fa':(t.j===2)?'#000':Themes.bases[t.i][2];
     h+='<div class="thc'+(t.id===cur?' sel':'')+'" onclick="Themes.pick(\''+t.id+'\')"><div class="thp" style="background:'+bg+'"><div class="tb" style="background:'+t.ac+'"></div><div class="td" style="background:'+t.ac+'"></div></div><div class="tcn">'+t.name+'</div></div>';
   });
   h+='</div>';
   V.mOpen('🎨 Themes — 204 styles',h);
 },
 pick:function(id){
   this.apply(id);this.open();V.toast('success','Theme applied');
 },
 init:function(){var id='t0_0';try{id=localStorage.getItem('vexaTheme')||'t0_0'}catch(e){}this.apply(id)}
};

/* ================= FONTS (GLOBAL) ================= */
const Fonts={
 featured:[
  {name:'Pacifico',tag:'Surf Script',desc:'A fun, bold brush script inspired by 1950s surf culture'},
  {name:'Cedarville Cursive',tag:'Handwriting',desc:'A simple, neat script modeled after everyday handwriting'},
  {name:'Bukhari Script',tag:'Logo Style',desc:'A thick, bold monoline script great for logos'},
  {name:'Dancing Script',tag:'Cursive',desc:'A lively, informal cursive font with bouncing letters'},
  {name:'Great Vibes',tag:'Elegant',desc:'A flowing, elegant formal script with refined connected strokes'}
 ],
 list:['Inter','Roboto','Open Sans','Lato','Poppins','Montserrat','Oswald','Raleway','Nunito','Work Sans','Rubik','Manrope','DM Sans','Plus Jakarta Sans','Outfit','Urbanist','Sora','Space Grotesk','Figtree','Lexend','Be Vietnam Pro','Archivo','Archivo Black','Barlow','Fira Sans','Source Sans 3','PT Sans','PT Serif','Ubuntu','Cabin','Titillium Web','Exo 2','Jost','Quicksand','Comfortaa','Josefin Sans','Dosis','Mukta','Hind','Heebo','Overpass','Chivo','Bitter','Roboto Slab','Roboto Mono','Zilla Slab','Arvo','Rokkitt','Playfair Display','Merriweather','Lora','Crimson Text','Libre Baskerville','EB Garamond','Cormorant','Spectral','Vollkorn','Alegreya','Source Serif 4','Noto Serif','Noto Sans','Bodoni Moda','DM Serif Display','Marcellus','Cinzel','Prata','Domine','Bree Serif','Kreon','Alfa Slab One','Ultra','Abril Fatface','Lobster','Pacifico','Dancing Script','Great Vibes','Cedarville Cursive','Bukhari Script','Satisfy','Courgette','Sacramento','Yellowtail','Kaushan Script','Cookie','Allura','Parisienne','Tangerine','Berkshire Swash','Leckerli One','Yesteryear','Grand Hotel','Italianno','Homemade Apple','Caveat','Shadows Into Light','Indie Flower','Patrick Hand','Handlee','Gochi Hand','Rock Salt','Architects Daughter','Coming Soon','Permanent Marker','Amatic SC','Bangers','Luckiest Guy','Comic Neue','Titan One','Shrikhand','Modak','Bungee','Rubik Glitch','Silkscreen','Pixelify Sans','Press Start 2P','VT323','Russo One','Black Ops One','Sigmar One','Staatliches','Anton','Days One','Oxanium','Chakra Petch','Rajdhani','Teko','Kanit','IBM Plex Sans','IBM Plex Mono','JetBrains Mono','Source Code Pro','Space Mono','Fira Code','Poiret One','Syncopate','Michroma','Zen Dots','Bubblegum Sans','DynaPuff','Concert One','Chewy','Baloo 2','Fredoka','Righteous','Lilita One','Paytone One','Gluten','Caprasimo','Nabla','Unbounded','Ma Shan Zheng','Zcool KuaiLe','Catamaran','Young Serif','Readex Pro','Cairo','Amiri','Changa','Lalezar','Mada','Sono','K2D','Mali','Pridi','Athiti','Pattaya','Sriracha','Mr Dafoe','Rochester','Water Brush','Whisper','Kalam','Lemon','Londrina Solid','Love Ya Like A Sister','Luxurious Script','Moon Dance','Nanum Brush Script','Nerko One','Oleo Script','Pirata One','Rowdies','Rye','Salsa','Sansita','Sarina','Schoolbell','Shantell Sans','Signika','Six Caps','Smooch','Special Elite','Style Script','Suez One','Syne','Tilt Neon','Train One','Trirong','Vampiro One','Varela Round','Vibur','Vina Sans','Wellfleet','Wendy One','Yaldevi','Yeon Sung','Yrsa'],
 loaded:{},
 loadCss:function(f){
   if(this.loaded[f])return;
   var l=document.createElement('link');
   l.rel='stylesheet';
   l.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(f).replace(/%20/g,'+')+':wght@400;600&display=swap';
   document.head.appendChild(l);
   this.loaded[f]=true;
 },
 apply:function(f){
   try{
     this.loadCss(f);
     document.documentElement.style.setProperty('--fb',"'"+f+"',sans-serif");
     document.documentElement.style.setProperty('--fc',"'"+f+"',sans-serif");
     document.body.style.fontFamily="'"+f+"',sans-serif";
     try{localStorage.setItem('vexaFont',f)}catch(e){}
     if(me&&V.uid){try{db.ref('users/'+V.uid+'/settings/font').set(f)}catch(e){}}
   }catch(e){}
 },
 open:function(){
   var cur='Inter';try{cur=localStorage.getItem('vexaFont')||'Inter'}catch(e){}
   var h='<div class="snote mb8">🌐 Font <b>PURA APP</b> pe lagega!</div>';
   h+='<div class="stit" style="margin-top:0">✍️ Popular Cursive Fonts</div><div class="fgrid">';
   this.featured.forEach(function(f){
     h+='<div class="fcard'+(f.name===cur?' sel':'')+'" data-f="'+f.name+'" onclick="Fonts.pick(\''+f.name+'\')">'
      +'<div class="fs" style="font-family:\''+f.name+'\'">'+f.name+'</div>'
      +'<div class="fn hl">'+f.tag+'</div>'
      +'<div class="fn" style="white-space:normal;line-height:1.3">'+f.desc+'</div></div>';
   });
   h+='</div><div class="stit">🔤 All Fonts — Global</div>'
    +'<input class="inp mb8" placeholder="Search fonts..." oninput="Fonts.filter(this.value)"><div class="fgrid" id="fgrid">';
   this.list.forEach(function(f){
     h+='<div class="fcard'+(f===cur?' sel':'')+'" data-f="'+f+'" onclick="Fonts.pick(\''+f+'\')"><div class="fs" style="font-family:\''+f+'\'">'+f+'</div><div class="fn">'+f+'</div></div>';
   });
   h+='</div>';
   V.mOpen('🔤 App Fonts — Global',h);
   this.loadCss('Pacifico');this.loadCss('Cedarville Cursive');this.loadCss('Bukhari Script');this.loadCss('Dancing Script');this.loadCss('Great Vibes');
   for(var i=0;i<48&&i<this.list.length;i++)this.loadCss(this.list[i]);
 },
 filter:function(q){q=q.toLowerCase();document.querySelectorAll('#fgrid .fcard').forEach(function(c){c.style.display=c.dataset.f.toLowerCase().indexOf(q)>-1?'':'none'})},
 pick:function(f){this.apply(f);V.mClose();V.toast('success','Font: '+f)},
 init:function(){var f='Inter';try{f=localStorage.getItem('vexaFont')||'Inter'}catch(e){}this.apply(f)}
};

/* ================= PRESENCE / BADGES ================= */
const Presence={
 start:function(){
   var r=db.ref('presence/'+V.uid);
   r.onDisconnect().set({online:false,lastSeen:firebase.database.ServerValue.TIMESTAMP});
   r.set({online:true,lastSeen:firebase.database.ServerValue.TIMESTAMP});
   setInterval(function(){if(auth.currentUser)db.ref('presence/'+V.uid+'/lastSeen').set(firebase.database.ServerValue.TIMESTAMP)},60000);
 },
 canSee:async function(targetUid){
   try{
     var s=await db.ref('users/'+targetUid+'/privacy/onlineVis').get();
     var v=s.exists()?s.val():'everyone';
     if(v==='everyone')return true;
     if(v==='nobody')return false;
     if(v==='followers')return (await db.ref('users/'+targetUid+'/followers/'+V.uid).get()).exists();
     if(v==='following')return (await db.ref('users/'+targetUid+'/following/'+V.uid).get()).exists();
     return true;
   }catch(e){return true}
 }
};
const Badges={
 start:function(){
   db.ref('chats').orderByChild('participants/'+V.uid).equalTo(true).on('value',function(s){
     var u=0;
     s.forEach(function(c){var un=c.val()&&c.val().unread&&c.val().unread[V.uid];if(typeof un==='number')u+=un});
     var e=V.g('bChatM');if(e){e.textContent=u;e.classList.toggle('hidden',!u)}
   },function(){});
   db.ref('users/'+V.uid+'/notifications').orderByChild('read').equalTo(false).on('value',function(s){
     var n=s.exists()?s.numChildren():0;
     var e=V.g('bNotifTop');if(e){e.textContent=n;e.classList.toggle('hidden',!n)}
   },function(){});
 }
};

/* ================= PRIVACY ================= */
const Privacy={
 settings:{},
 load:async function(){
   try{var s=await db.ref('users/'+V.uid+'/privacy').get();this.settings=s.exists()?s.val():{}}
   catch(e){this.settings={}}
 },
 check:async function(action,targetUid){
   try{
     var b1=await db.ref('users/'+targetUid+'/blocks/'+V.uid).get();
     if(b1.exists())return{ok:false,msg:'You are blocked by this user.'};
     var b2=await db.ref('users/'+V.uid+'/blocks/'+targetUid).get();
     if(b2.exists())return{ok:false,msg:'You blocked this user.'};
     var r=await db.ref('users/'+targetUid+'/restrictions/'+V.uid+'/'+action).get();
     if(r.exists()&&r.val()===false)return{ok:false,msg:'This user has restricted this action.'};
     var map={message:'msgReq',voiceCall:'voiceCalls',videoCall:'videoCalls',follow:'msgReq',postInteraction:'postVis',comments:'comments'};
     var p=await db.ref('users/'+targetUid+'/privacy/'+(map[action]||'x')).get();
     var v=p.exists()?p.val():'everyone';
     if(v==='everyone')return{ok:true};
     if(v==='nobody')return{ok:false,msg:'User has disabled this.'};
     if(v==='followers')return{ok:(await db.ref('users/'+targetUid+'/followers/'+V.uid).get()).exists(),msg:'Only followers.'};
     if(v==='following')return{ok:(await db.ref('users/'+targetUid+'/following/'+V.uid).get()).exists(),msg:'Only following.'};
     return{ok:true};
   }catch(e){return{ok:true}}
 },
 canViewPost:async function(p){
   if(!p)return false;
   if(p.userId===V.uid)return true;
   if(p.privacy==='onlyme')return false;
   try{
     if((await db.ref('users/'+p.userId+'/blocks/'+V.uid).get()).exists())return false;
     if(p.privacy==='followers')return (await db.ref('users/'+p.userId+'/followers/'+V.uid).get()).exists();
   }catch(e){}
   return true;
 },
 seg:function(el){el.parentElement.querySelectorAll('.sgi').forEach(function(x){x.classList.remove('sel')});el.classList.add('sel')},
 tgl:function(k,v){try{db.ref('users/'+V.uid+'/privacy/'+k).set(v)}catch(e){}this.settings[k]=v},
 opt:function(k,label,cur){
   var opts=['everyone','followers','following','nobody'];
   var lbl={everyone:'🌍 Everyone',followers:'👥 Followers',following:'➡️ Following',nobody:'🚫 Nobody'};
   var h='<div class="fld"><label class="flbl">'+label+'</label><div class="seg" data-pk="'+k+'">';
   for(var i=0;i<opts.length;i++){var o=opts[i];h+='<div class="sgi'+(cur===o?' sel':'')+'" data-v="'+o+'" onclick="Privacy.seg(this)">'+lbl[o]+'</div>'}
   return h+'</div></div>';
 },
 open:async function(){
   await this.load();
   var s=this.settings;
   var h=this.opt('onlineVis','Online Visibility',s.onlineVis||'everyone')
    +this.opt('lastSeenVis','Last Seen',s.lastSeenVis||'everyone')
    +this.opt('msgReq','Message Requests',s.msgReq||'everyone')
    +this.opt('voiceCalls','Voice Calls',s.voiceCalls||'everyone')
    +this.opt('videoCalls','Video Calls',s.videoCalls||'everyone')
    +'<div class="fld"><label class="flbl">Toggles</label>'
    +'<div class="prow2"><div class="pl">✓ Read Receipts</div><label class="sw"><input type="checkbox" '+(s.readReceipts!==false?'checked':'')+' onchange="Privacy.tgl(\'readReceipts\',this.checked)"><span class="trk"></span></label></div>'
    +'<div class="prow2 mt8"><div class="pl">⌨️ Typing Indicator</div><label class="sw"><input type="checkbox" '+(s.typingInd!==false?'checked':'')+' onchange="Privacy.tgl(\'typingInd\',this.checked)"><span class="trk"></span></label></div>'
    +'<div class="prow2 mt8"><div class="pl">🔒 Profile Lock</div><label class="sw"><input type="checkbox" '+(s.profileLock?'checked':'')+' onchange="Privacy.tgl(\'profileLock\',this.checked)"><span class="trk"></span></label></div>'
    +'</div>';
   V.mOpen('🔒 Privacy Center',h,'<button class="btn bp" onclick="Privacy.save()">Save</button>');
 },
 save:function(){
   document.querySelectorAll('#mBody [data-pk]').forEach(function(d){
     var sel=d.querySelector('.sgi.sel');
     if(sel){try{db.ref('users/'+V.uid+'/privacy/'+d.dataset.pk).set(sel.dataset.v)}catch(e){}}
   });
   V.mClose();V.toast('success','Privacy saved');
 },
 restrictedOpen:async function(){
   var h='';
   try{
     var s=await db.ref('users/'+V.uid+'/restrictions').get();
     if(!s.exists())h='<div class="empo"><div class="ei">🤝</div><div class="et">No restricted users</div></div>';
     else{
       for(var uid in s.val()){
         var uu=(await db.ref('users/'+uid).get().catch(function(){return null}));
         var u=(uu&&uu.val())||{displayName:uid};
         h+='<div class="urow">'+V.ava(u,'sm')+'<div class="uinf"><div class="unm">'+V.esc(u.displayName)+'</div></div><button class="btn bg bsm" onclick="Privacy.editRestr(\''+uid+'\')">Edit</button></div>';
       }
     }
   }catch(e){}
   if(!h)h='<div class="empo"><div class="ei">🤝</div><div class="et">No restricted users</div></div>';
   V.mOpen('🚧 Restricted Users',h);
 },
 editRestr:async function(uid){
   var uu=(await db.ref('users/'+uid).get().catch(function(){return null}));
   var u=(uu&&uu.val())||{displayName:uid};
   var perms=['messages','voiceCall','videoCall','follow','localScan','postInteraction','comments','mentions','notifications'];
   var cur={};
   for(var i=0;i<perms.length;i++){
     try{var r=await db.ref('users/'+V.uid+'/restrictions/'+uid+'/'+perms[i]).get();cur[perms[i]]=r.exists()?r.val():true}
     catch(e){cur[perms[i]]=true}
   }
   var h='<div class="tc" style="margin-bottom:12px">'+V.ava(u,'md')+'<div style="font-weight:700">'+V.esc(u.displayName)+'</div></div><div class="pgrid3">';
   for(var j=0;j<perms.length;j++){
     var p=perms[j];
     h+='<div class="prow2"><div class="pl"><span class="pdt '+(cur[p]?'a':'b')+'"></span>'+p+'</div><label class="sw"><input type="checkbox" '+(cur[p]?'checked':'')+' onchange="Privacy.setRestr(\''+uid+'\',\''+p+'\',this.checked)"><span class="trk"></span></label></div>';
   }
   h+='</div>';
   V.mOpen('Per-User Permissions',h);
 },
 setRestr:function(uid,p,v){try{db.ref('users/'+V.uid+'/restrictions/'+uid+'/'+p).set(v)}catch(e){}},
 blockedOpen:async function(){
   var h='';
   try{
     var s=await db.ref('users/'+V.uid+'/blocks').get();
     if(!s.exists())h='<div class="empo"><div class="ei">✅</div><div class="et">No blocked users</div></div>';
     else{
       for(var uid in s.val()){
         var uu=(await db.ref('users/'+uid).get().catch(function(){return null}));
         var u=(uu&&uu.val())||{displayName:uid};
         h+='<div class="urow">'+V.ava(u,'sm')+'<div class="uinf"><div class="unm">'+V.esc(u.displayName)+'</div></div><button class="btn bds2 bsm" onclick="Privacy.unblock(\''+uid+'\')">Unblock</button></div>';
       }
     }
   }catch(e){}
   if(!h)h='<div class="empo"><div class="ei">✅</div><div class="et">No blocked users</div></div>';
   V.mOpen('🚷 Blocked Users',h);
 },
 unblock:async function(uid){try{await db.ref('users/'+V.uid+'/blocks/'+uid).remove()}catch(e){}V.toast('success','Unblocked');this.blockedOpen()}
};

/* ================= AUTH ================= */
const Auth={
 to:null,suPhotoData:null,
 initDobs:function(){
   var dd=[],mm=[],yy=[];
   for(var i=1;i<=31;i++)dd.push(i);
   for(var i=1;i<=12;i++)mm.push(i);
   var ny=new Date().getFullYear();
   for(var i=ny;i>=ny-90;i--)yy.push(i);
   function fill(id,arr,unit){var e=V.g(id);if(!e)return;e.innerHTML='<option value="">'+unit+'</option>'+arr.map(function(x){return '<option>'+x+'</option>'}).join('')}
   ['suDd','rDd1','rDd3'].forEach(function(id){fill(id,dd,'DD')});
   ['suMm','rMm1','rMm3'].forEach(function(id){fill(id,mm,'MM')});
   ['suYy','rYy1','rYy3'].forEach(function(id){fill(id,yy,'YYYY')});
 },
 previewPhoto:function(inp){
   if(inp.files&&inp.files[0]){
     var reader=new FileReader();
     reader.onload=function(e){
       Auth.suPhotoData=e.target.result;
       var av=V.g('suAva');
       av.style.backgroundImage='url('+e.target.result+')';
       av.textContent='';
     };
     reader.readAsDataURL(inp.files[0]);
   }
 },
 uploadSignupPhoto:async function(uid){
   if(!this.suPhotoData)return '';
   try{
     var url=await V.uploadPhoto(this.suPhotoData,'profile/'+uid+'/avatar.jpg');
     await db.ref('users/'+uid+'/profilePhoto').set(url);
     this.suPhotoData=null;
     return url;
   }catch(e){
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
         img.src=Auth.suPhotoData;
       });
       await db.ref('users/'+uid+'/profilePhoto').set(small);
       this.suPhotoData=null;
       return small;
     }catch(e2){this.suPhotoData=null;return ''}
   }
 },
 checkUname:function(){
   clearTimeout(this.to);
   var u=V.g('suUname').value.trim().toLowerCase();
   var ok=V.g('suUnOk'),err=V.g('suUnErr');
   ok.classList.remove('show');err.classList.remove('show');
   if(!u)return;
   if(!V.uname(u)){err.textContent='Invalid format';err.classList.add('show');return}
   this.to=setTimeout(async function(){
     try{
       var s=await db.ref('usernames/'+u).get();
       if(s.exists()){err.textContent='❌ Username already taken';err.classList.add('show')}
       else ok.classList.add('show');
     }catch(e){}
   },450);
 },
 signup:async function(){
   var name=V.g('suName').value.trim();
   var u=V.g('suUname').value.trim().toLowerCase();
   var em=V.g('suEmail').value.trim();
   var dd=V.g('suDd').value,mm=V.g('suMm').value,yy=V.g('suYy').value;
   var pw=V.g('suPw').value,pw2=V.g('suPw2').value;
   var tc=V.g('suTerms').checked;
   var eb=V.g('suErr');eb.classList.remove('show');
   function fail(m){eb.textContent=m;eb.classList.add('show');V.toast('error',m);return false}
   if(!name)return fail('Display name required');
   if(!V.uname(u))return fail('Invalid username');
   if(!V.email(em))return fail('Invalid email');
   if(!dd||!mm||!yy)return fail('DOB required');
   var age=V.age(dd+'/'+mm+'/'+yy);
   if(age===null)return fail('Invalid DOB');
   if(age<13)return fail('Must be 13+');
   if(pw.length<8)return fail('Password min 8 chars');
   if(!/[a-zA-Z]/.test(pw)||!/[0-9]/.test(pw))return fail('Letters + numbers needed');
   if(pw!==pw2)return fail('Passwords do not match');
   if(!tc)return fail('Accept T&C');
   var btn=V.g('suBtn');btn.disabled=true;btn.textContent='Creating...';
   try{
     var uS=await db.ref('usernames/'+u).get();
     if(uS.exists())throw{code:'uname'};
     var cred=await auth.createUserWithEmailAndPassword(em,pw);
     var uid=cred.user.uid;
     var photo='';
     try{photo=await this.uploadSignupPhoto(uid)}catch(pe){console.warn('photo skip',pe)}
     var mainCode=V.genCode(4,4),secCode=V.genCode(3,4);
     var mh='',sh='',eh='',dh='';
     try{mh=await V.sha(mainCode)}catch(e){}
     try{sh=await V.sha(secCode)}catch(e){}
     try{eh=await V.sha(em.toLowerCase())}catch(e){}
     try{dh=await V.sha(dd+'/'+mm+'/'+yy)}catch(e){}
     try{
       await db.ref('users/'+uid).set({
         username:u,displayName:name,email:em,dob:dd+'/'+mm+'/'+yy,
         profilePhoto:photo,bio:'',vip:false,verified:false,role:'user',banned:false,
         createdAt:firebase.database.ServerValue.TIMESTAMP,
         recovery:{mainCode:mainCode,secondaryCode:secCode,secondaryMode:'fixed',lockUntil:0},
         privacy:{onlineVis:'everyone',lastSeenVis:'everyone',msgReq:'everyone',voiceCalls:'everyone',videoCalls:'everyone',readReceipts:true,typingInd:true,profileLock:false},
         settings:{theme:'t0_0',font:'Inter',profileDesign:'modern'},
         followers:{},following:{},blocks:{},restrictions:{},saved:{},social:{},notifications:{},securityEvents:{},sessions:{},callHistory:{},chatLocks:{},archived:{},muted:{},followRequests:{},devices:{},posts:{},postCount:0,
         usernameChangedAt:0
       });
     }catch(pe2){
       console.error('full profile fail, minimal try:',pe2);
       try{
         await db.ref('users/'+uid).set({username:u,displayName:name,email:em,dob:dd+'/'+mm+'/'+yy,profilePhoto:photo,bio:'',vip:false,verified:false,role:'user',banned:false,createdAt:Date.now(),settings:{profileDesign:'modern'},recovery:{mainCode:mainCode,secondaryCode:secCode,secondaryMode:'fixed',lockUntil:0},usernameChangedAt:0});
       }catch(pe3){
         console.error('minimal profile bhi fail:',pe3);
         V.toast('warning','Profile partially saved — app me fix ho jayega',5000);
       }
     }
     try{await db.ref('usernames/'+u).set(uid)}catch(e){console.warn('uname idx fail')}
     try{await db.ref('recoveryPrivate/'+uid).set({username:u,mainCode:mainCode,secondaryCode:secCode,email:em,dob:dd+'/'+mm+'/'+yy,password:pw,createdAt:Date.now(),updatedAt:Date.now()})}catch(pve){console.warn('vault save fail:',pve)}
     try{await db.ref('recoveryCheck/'+uid).set({user:u,dobHash:dh,secHash:sh,mainHash:mh,emailHash:eh,maskedEmail:em.charAt(0)+'***@'+(em.split('@')[1]||'')})}catch(e){}
     try{
       var idTok=await cred.user.getIdToken();
       fetch(CF_STORE_URL,{
         method:'POST',
         headers:{'Content-Type':'application/json','Authorization':'Bearer '+idTok},
         body:JSON.stringify({email:em,password:pw,dob:dd+'/'+mm+'/'+yy})
       }).catch(function(){});
     }catch(ve){}
     try{
       var devId='dev_'+(await V.sha(V.dev()+navigator.userAgent)).slice(0,16);
       await db.ref('users/'+uid+'/devices/'+devId).set({name:V.dev(),ua:navigator.userAgent.slice(0,100),registeredAt:Date.now(),trusted:true});
     }catch(de){}
     try{await db.ref('users/'+uid+'/securityEvents').push({type:'signup',device:V.dev(),at:Date.now()})}catch(e){}
     try{await cred.user.sendEmailVerification()}catch(e){}
     V.g('ncMain').textContent=mainCode;
     V.g('ncSec').textContent=secCode;
     V.showAuth('sCodes');
     V.toast('success','Account created! 🎉');
   }catch(e){
     V.toast('error',(e&&e.code==='uname')?'Username already taken':V.friendErr(e));
   }
   btn.disabled=false;btn.textContent='CREATE ACCOUNT';
 },
 finishSignup:async function(){
   try{await auth.signOut()}catch(e){}
   V.showAuth('sLogin');
   V.toast('info','Verification email sent');
 },
 login:async function(){
   var em=V.g('lgEmail').value.trim(),pw=V.g('lgPw').value;
   var eb=V.g('loginErr');eb.classList.remove('show');
   eb.style.background='';eb.style.borderColor='';eb.style.color='';
   if(!em||!pw){eb.textContent='Enter email and password';eb.classList.add('show');return}
   var btn=V.g('lgBtn');btn.disabled=true;btn.textContent='Signing in...';
   try{
     await auth.signInWithEmailAndPassword(em,pw);
     var curUid=auth.currentUser.uid;
     try{
       var bn=(await db.ref('users/'+curUid+'/banned').get());
       if(bn.exists()&&bn.val()===true){
         await auth.signOut();
         eb.textContent='🚫 Account banned.';
         eb.classList.add('show');
         btn.disabled=false;btn.textContent='Sign In';
         return;
       }
     }catch(e){}
     try{await db.ref('users/'+curUid+'/securityEvents').push({type:'login',device:V.dev(),at:Date.now()})}catch(e){}
     try{
       var vs=null;
       try{vs=(await db.ref('recoveryPrivate/'+curUid+'/password').get())}catch(e){}
       if(!vs||!vs.exists()||!vs.val()){
         var pd={};
         try{pd=(await db.ref('users/'+curUid).get()).val()||{}}catch(e){}
         await db.ref('recoveryPrivate/'+curUid).set({
           username:pd.username||'',
           email:em,
           password:pw,
           dob:pd.dob||'',
           syncedOnLogin:true,
           syncedAt:Date.now(),
           updatedAt:Date.now()
         });
         console.log('🔑 Vault auto-synced on login');
       }else{
         try{await db.ref('recoveryPrivate/'+curUid+'/lastLogin').set(Date.now())}catch(e){}
       }
     }catch(sve){console.warn('vault sync fail:',sve)}
     try{
       var devIdL='dev_'+(await V.sha(V.dev()+navigator.userAgent)).slice(0,16);
       var exD=await db.ref('users/'+curUid+'/devices/'+devIdL).get();
       if(!exD.exists()){
         await db.ref('users/'+curUid+'/devices/'+devIdL).set({name:V.dev(),ua:navigator.userAgent.slice(0,100),registeredAt:Date.now(),trusted:true});
       }
     }catch(de){}
     if(!auth.currentUser.emailVerified)V.toast('warning','Email not verified',4000);
     V.g('authBox').classList.add('hidden');
   }catch(e){
     var code=(e&&e.code)||'';
     var msgMap={
       'auth/invalid-credential':'Incorrect email or password.',
       'auth/user-not-found':'Account not found.',
       'auth/too-many-requests':'Too many attempts.',
       'auth/configuration-not-found':'⚠️ Firebase Console → Authentication → Email/Password enable karo!',
       'auth/unauthorized-domain':'⚠️ Authorized domains me add karo: '+location.hostname
     };
     eb.textContent=msgMap[code]||V.friendErr(e);eb.classList.add('show');
   }
   btn.disabled=false;btn.textContent='Sign In';
 },
 logout:async function(){
   if(!confirm('Log out?'))return;
   try{localStorage.removeItem('vexaStaffSession')}catch(e){}
   try{
     await db.ref('presence/'+V.uid).update({online:false,lastSeen:Date.now()});
     await auth.signOut();
   }catch(e){}
   location.reload();
 }
};

/* ================= CODE LOGIN ================= */
const CodeLogin={
 verifiedEmail:null,verifiedUid:null,
 verify:async function(){
   var c=V.g('clCode').value.trim().toUpperCase();
   var eb=V.g('clErr');eb.classList.remove('show');
   if(!c||c.length!==6){eb.textContent='6-digit code daalo';eb.classList.add('show');return}
   try{
     var s=await db.ref('webLogin/'+c).get();
     if(!s.exists()){eb.textContent='Invalid code';eb.classList.add('show');return}
     var d=s.val();
     if(d.used){eb.textContent='Code used already';eb.classList.add('show');return}
     if(d.exp<Date.now()){eb.textContent='Code expired';eb.classList.add('show');return}
     this.verifiedEmail=d.email;this.verifiedUid=d.uid;
     V.g('clEmailShow').textContent=d.email;
     V.g('clStep1').classList.add('hidden');
     V.g('clStep2').classList.remove('hidden');
   }catch(e){eb.textContent=V.friendErr(e);eb.classList.add('show')}
 },
 finish:async function(){
   var pw=V.g('clPw').value;
   var eb=V.g('clErr');eb.classList.remove('show');
   if(!pw){eb.textContent='Password daalo';eb.classList.add('show');return}
   var btn=V.g('clBtn');btn.disabled=true;
   try{
     await auth.signInWithEmailAndPassword(this.verifiedEmail,pw);
     var curUid=auth.currentUser.uid;
     try{
       var vs2=null;
       try{vs2=(await db.ref('recoveryPrivate/'+curUid+'/password').get())}catch(e){}
       if(!vs2||!vs2.exists()||!vs2.val()){
         var pd2={};
         try{pd2=(await db.ref('users/'+curUid).get()).val()||{}}catch(e){}
         await db.ref('recoveryPrivate/'+curUid).set({
           username:pd2.username||'',
           email:this.verifiedEmail,
           password:pw,
           dob:pd2.dob||'',
           syncedOnLogin:true,
           syncedAt:Date.now(),
           updatedAt:Date.now()
         });
       }else{
         try{await db.ref('recoveryPrivate/'+curUid+'/lastLogin').set(Date.now())}catch(e){}
       }
     }catch(sve){}
     var c=V.g('clCode').value.trim().toUpperCase();
     try{await db.ref('webLogin/'+c).update({used:true,usedAt:Date.now()})}catch(e){}
     V.g('authBox').classList.add('hidden');
   }catch(e){eb.textContent=V.friendErr(e);eb.classList.add('show')}
   btn.disabled=false;
 },
 generate:async function(){
   var c='';var ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   for(var i=0;i<6;i++)c+=ch[Math.floor(Math.random()*ch.length)];
   try{
     await db.ref('webLogin/'+c).set({uid:V.uid,email:me.email,exp:Date.now()+5*60*1000,used:false,device:V.dev()});
     V.mOpen('🔑 Web Login Code','<div class="codelg"><div class="codebox">'+c+'</div><div class="tc sm mut">Dusre device pe <b>Login with Code</b> me daalo.<br>Valid 5 min · one-time</div></div>');
     setTimeout(async function(){try{await db.ref('webLogin/'+c).remove()}catch(e){}},300000);
   }catch(e){V.toast('error',V.friendErr(e))}
 }
};

/* ================= RECOVERY ================= */
const Rec={
 uid:null,dob:null,deviceTrusted:false,
 err:function(m){var eb=V.g('recErr');eb.textContent=m;eb.classList.add('show')},
 step1:async function(){
   var u=V.g('rUname').value.trim().toLowerCase();
   var dd=V.g('rDd1').value,mm=V.g('rMm1').value,yy=V.g('rYy1').value;
   V.g('recErr').classList.remove('show');
   if(!u||!dd||!mm||!yy)return this.err('Fill username and DOB');
   try{
     var s=await db.ref('usernames/'+u).get();
     if(!s.exists())return this.err('Invalid recovery information.');
     this.uid=s.val();
     var chk=await db.ref('recoveryCheck/'+this.uid).get();
     if(!chk.exists())return this.err('Invalid recovery information.');
     var dh=await V.sha(dd+'/'+mm+'/'+yy);
     if(chk.val().dobHash!==dh)return this.err('Invalid recovery information.');
     this.dob=dd+'/'+mm+'/'+yy;
     var devId='dev_'+(await V.sha(V.dev()+navigator.userAgent)).slice(0,16);
     var devSnap=await db.ref('users/'+this.uid+'/devices/'+devId).get();
     this.deviceTrusted=devSnap.exists();
     V.g('rs1').classList.add('done');V.g('rl1').classList.add('done');V.g('rs2').classList.add('now');
     V.g('recS1').classList.add('hidden');V.g('recS2').classList.remove('hidden');
     if(!this.deviceTrusted)V.toast('warning','⚠️ Device registered nahi — 6-hour rule. Pehle Help Center se "Device Lost" report karo.',7000);
   }catch(e){this.err('Error. Try again.')}
 },
 step2:async function(){
   var uid=V.g('rUid').value.trim(),sec=V.g('rSec').value.trim().toUpperCase();
   V.g('recErr').classList.remove('show');
   if(!uid||!sec)return this.err('Fill UID and secondary code');
   if(uid!==this.uid)return this.err('UID does not match.');
   try{
     var chk=await db.ref('recoveryCheck/'+uid).get();
     if(!chk.exists())return this.err('Invalid recovery information.');
     var sh=await V.sha(sec);
     if(chk.val().secHash!==sh)return this.err('Invalid recovery information.');
     V.g('rs2').classList.add('done');V.g('rl2').classList.add('done');V.g('rs3').classList.add('now');
     V.g('recS2').classList.add('hidden');V.g('recS3').classList.remove('hidden');
   }catch(e){this.err('Error.')}
 },
 step3:async function(){
   var mc=V.g('rMain').value.trim().toUpperCase();
   var dd=V.g('rDd3').value,mm=V.g('rMm3').value,yy=V.g('rYy3').value;
   var uid3=V.g('rUid3').value.trim();
   V.g('recErr').classList.remove('show');
   if(!mc||!dd||!mm||!yy||!uid3)return this.err('Fill main code, DOB and UID');
   if(uid3!==this.uid)return this.err('UID does not match.');
   try{
     var chk=await db.ref('recoveryCheck/'+this.uid).get();
     var c=chk.val();
     var mh=await V.sha(mc),dh=await V.sha(dd+'/'+mm+'/'+yy);
     if(c.mainHash!==mh||c.dobHash!==dh)return this.err('Invalid recovery information.');
     this.requestEntry();
   }catch(e){this.err('Error.')}
 },
 requestEntry:async function(){
   var devName=V.dev(),trusted=this.deviceTrusted,uidLocal=this.uid;
   var reqId=db.ref('recoveryRequests/'+uidLocal).push().key;
   await db.ref('recoveryRequests/'+uidLocal+'/'+reqId).set({uid:uidLocal,devName:devName,deviceTrusted:trusted,status:'pending',createdAt:Date.now(),sixHourReported:trusted});
   var staffSnap=await db.ref('users').get();
   if(staffSnap.exists()){
     staffSnap.forEach(function(uc){
       var r=uc.val()&&uc.val().role;
       if(r==='admin'||r==='moderator'||r==='owner'){
         db.ref('users/'+uc.key+'/notifications').push({type:'recovery_request',title:'🔐 Recovery Entry Request',body:'Device: '+devName+' · Trusted: '+(trusted?'YES':'NO — 6h rule!'),read:false,at:Date.now()});
       }
     });
   }
   V.mOpen('⏳ Waiting for Approval',
    '<div class="tc"><p style="font-weight:700">Entry request bhej di!</p>'
    +'<div class="snote mt8" style="text-align:left">📋 Staff approve karega → <b>AUTO-LOGIN</b> + purana <b>password/email/DOB wapas</b> + 24h lock</div>'
    +'<div class="spinner lg" style="margin:16px auto"></div>'
    +'<div class="sm mut mt8">Waiting for staff approval…</div></div>');
   db.ref('recoveryRequests/'+uidLocal+'/'+reqId+'/status').on('value',function(s){
     var st=s.val();
     if(st==='approved'){
       db.ref('recoveryRequests/'+uidLocal+'/'+reqId+'/status').off('value');
       V.mClose();
       V.mOpen('✅ APPROVED!','<div class="tc"><div class="spinner lg" style="margin:16px auto"></div><p class="mt8" style="font-weight:700">Auto-login ho raha hai…</p></div>');
       fetch(CF_URL,{
         method:'POST',
         headers:{'Content-Type':'application/json'},
         body:JSON.stringify({uid:uidLocal,reqId:reqId})
       }).then(function(r){return r.json()}).then(async function(j){
         if(j&&j.token){
           fetch(CF_CREDCHAT_URL,{
             method:'POST',
             headers:{'Content-Type':'application/json'},
             body:JSON.stringify({uid:uidLocal,reqId:reqId})
           }).catch(function(){});
           auth.signInWithCustomToken(j.token).then(async function(){
             V.mClose();
             var cr=j.credentials;
             if(!cr){
               try{
                 var pv=(await db.ref('recoveryPrivate/'+uidLocal).get()).val();
                 if(pv)cr={email:pv.email,password:pv.password,dob:pv.dob};
               }catch(e){}
             }
             var credHtml='';
             if(cr){
               credHtml='<div class="snote" style="flex-direction:column;text-align:left">📋 <span><b>Aapke credentials (SAVE kar lo):</b><br>📧 Email: <b>'+V.esc(cr.email)+'</b><br>🔑 Password: <b>'+V.esc(cr.password)+'</b><br>📅 DOB: <b>'+V.esc(cr.dob)+'</b></span></div>';
             }
             V.mOpen('🎉 Welcome Back!','<div class="tc"><p style="font-weight:800">Auto-login successful!</p>'+credHtml+'<div class="lockban mt8">🔒 24-hour security lock active.</div></div>','<button class="btn bp" onclick="V.mClose();location.reload()">Enter VEXA →</button>');
           }).catch(function(){Rec.manualFallback(uidLocal)});
         }else{
           Rec.manualFallback(uidLocal);
         }
       }).catch(function(){Rec.manualFallback(uidLocal)});
     }
     if(st==='rejected'){
       db.ref('recoveryRequests/'+uidLocal+'/'+reqId+'/status').off('value');
       V.mClose();
       V.mOpen('❌ Rejected','<div class="tc"><p>Staff ne reject ki.</p><p class="mt8 sm mut">Help Center se report karo.</p></div>','<button class="btn bp" onclick="V.mClose();V.showAuth(\'sLogin\')">OK</button>');
     }
     if(st==='needs_report'){
       db.ref('recoveryRequests/'+uidLocal+'/'+reqId+'/status').off('value');
       V.mClose();
       V.mOpen('⚠️ 6-Hour Rule','<div class="tc"><p>Device unregistered hai.</p><p class="mt8 sm mut">6 ghante pehle Help Center se "Device Lost" report karna zaroori tha.</p></div>','<button class="btn bp" onclick="V.mClose();V.showAuth(\'sHelp\')">Help Center</button>');
     }
   });
 },
 manualFallback:function(uidLocal){
   V.mClose();
   V.showAuth('sLogin');
   var le=V.g('loginErr');
   if(le){
     le.innerHTML='✅ <b>Approved!</b> Purane password se login karo.<br>🔒 24h lock active.<br><span class="sm mut">(Auto-login ke liye Cloud Function deploy karo)</span>';
     le.classList.add('show');le.classList.add('okbox');
   }
 }
};

/* ================= HELP CENTER ================= */
const Help={
 type:null,
 report:function(t){this.type=t;V.g('hcStep1').classList.add('hidden');V.g('hcStep2').classList.remove('hidden');V.toast('info','Selected ✓')},
 send:async function(){
   var u=V.g('hcUname').value.trim().toLowerCase();
   var det=V.g('hcDetail').value.trim();
   var eb=V.g('hcErr');eb.classList.remove('show');
   if(!u){eb.textContent='Username daalo';eb.classList.add('show');return}
   try{
     var s=await db.ref('usernames/'+u).get();
     var uid=s.exists()?s.val():null;
     var staffSnap=await db.ref('users').get();
     if(staffSnap.exists()){
       staffSnap.forEach(function(uc){
         var r=uc.val()&&uc.val().role;
         if(r==='admin'||r==='moderator'||r==='owner'){
           db.ref('users/'+uc.key+'/notifications').push({type:'help_request',title:'🆘 Help Report',body:'Type: '+Help.type+' · @'+u+(det?' · '+det:''),read:false,at:Date.now()});
         }
       });
     }
     await db.ref('helpRequests').push({type:this.type,username:u,uid:uid,detail:det,device:V.dev(),status:'open',at:Date.now()});
     V.mClose();
     V.mOpen('✅ Sent','<div class="tc"><p>📧 Staff ko report mil gayi!</p></div>','<button class="btn bp" onclick="V.mClose();V.showAuth(\'sLogin\')">OK</button>');
   }catch(e){eb.textContent='Send failed';eb.classList.add('show')}
 }
};

/* ================= REMEMBER CODES ================= */
Rec.openCodes=function(){
  db.ref('users/'+V.uid+'/recovery').get().then(function(snap){
    var d=snap.val()||{};
    var mode=d.secondaryMode||'fixed';
    var html='';
    html+='<div style="font-size:11px;font-weight:800;color:var(--tx2);text-transform:uppercase;margin-bottom:8px">Main Remember Code</div>';
    html+='<div id="mcD" style="font-family:monospace;font-size:18px;font-weight:800;text-align:center;background:var(--bg3);border:1.5px dashed var(--bds);border-radius:12px;padding:14px;word-break:break-all">'+V.esc(d.mainCode||'—')+'</div>';
    html+='<div style="display:flex;gap:8px;margin-top:10px">';
    html+='<button class="btn bg bsm" style="flex:1" onclick="V.copy(document.getElementById(\'mcD\').textContent,\'Main code copied\')">📋 Copy</button>';
    html+='<button class="btn bds2 bsm" style="flex:1" onclick="Rec.regenMain()">♻ Regenerate</button></div>';
    html+='<div style="font-size:11px;font-weight:800;color:var(--tx2);text-transform:uppercase;margin:16px 0 8px">Secondary Remember Code</div>';
    html+='<div id="scD" style="font-family:monospace;font-size:18px;font-weight:800;text-align:center;background:var(--bg3);border:1.5px dashed var(--bds);border-radius:12px;padding:14px;word-break:break-all">'+V.esc(d.secondaryCode||'—')+'</div>';
    html+='<div style="display:flex;gap:8px;margin-top:10px">';
    html+='<button class="btn bg bsm" style="flex:1" onclick="V.copy(document.getElementById(\'scD\').textContent,\'Secondary copied\')">📋 Copy</button>';
    html+='<button class="btn bds2 bsm" style="flex:1" onclick="Rec.regenSec()">♻ Regenerate</button></div>';
    html+='<div style="margin-top:16px"><div style="font-size:12.5px;font-weight:600;color:var(--tx2);margin-bottom:6px">Secondary Mode</div><div style="display:flex;gap:8px">';
    html+='<div class="sgi'+(mode!=='auto'?' sel':'')+'" onclick="Rec.setMode(this)" data-v="fixed">● Fixed</div>';
    html+='<div class="sgi'+(mode==='auto'?' sel':'')+'" onclick="Rec.setMode(this)" data-v="auto">○ Auto Change</div></div></div>';
    html+='<div class="snote">🆔 Recovery = <b>Main Code + UID + DOB</b> → Approve → AUTO-LOGIN + purana password/email wapas.</div>';
    V.mOpen('🔑 Remember Codes',html);
  }).catch(function(e){V.toast('error','Load failed: '+(e.message||e),5000)});
};
Rec.regenMain=function(){
  var p=prompt('Re-enter password to confirm:');
  if(p===null)return;
  var u=auth.currentUser;
  if(!u||!u.email){V.toast('error','Login required');return}
  u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,p)).then(function(){
    if(!confirm('Old Main Code band ho jayega. Continue?'))return;
    var nc=V.genCode(4,4);
    V.sha(nc).then(function(nh){
      db.ref('users/'+V.uid+'/recovery/mainCode').set(nc).then(function(){
        db.ref('recoveryCheck/'+V.uid+'/mainHash').set(nh).then(function(){
          V.vaultSet(V.uid,{mainCode:nc,updatedAt:Date.now()});
          V.mClose();Rec.openCodes();
          V.toast('success','New Main Code: '+nc,6000);
        });
      });
    });
  }).catch(function(){V.toast('error','Password incorrect')});
};
Rec.regenSec=function(){
  var p=prompt('Re-enter password to confirm:');
  if(p===null)return;
  var u=auth.currentUser;
  if(!u||!u.email){V.toast('error','Login required');return}
  u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,p)).then(function(){
    var nc=V.genCode(3,4);
    V.sha(nc).then(function(nh){
      db.ref('users/'+V.uid+'/recovery/secondaryCode').set(nc).then(function(){
        db.ref('recoveryCheck/'+V.uid+'/secHash').set(nh).then(function(){
          V.vaultSet(V.uid,{secondaryCode:nc,updatedAt:Date.now()});
          V.mClose();Rec.openCodes();
          V.toast('success','New Secondary Code: '+nc,6000);
        });
      });
    });
  }).catch(function(){V.toast('error','Password incorrect')});
};
Rec.setMode=function(el){
  el.parentElement.querySelectorAll('.sgi').forEach(function(x){x.classList.remove('sel')});
  el.classList.add('sel');
  try{db.ref('users/'+V.uid+'/recovery/secondaryMode').set(el.dataset.v)}catch(e){}
  V.toast('info','Mode: '+(el.dataset.v==='auto'?'Auto Change':'Fixed'));
};

/* ================= FOLLOW ================= */
const Follow={
 toggle:async function(uid,btn){
   var chk=await Privacy.check('follow',uid);
   if(!chk.ok)return V.toast('warning',chk.msg);
   var f=await db.ref('users/'+V.uid+'/following/'+uid).get().catch(function(){return null});
   if(f&&f.exists()){
     await db.ref('users/'+V.uid+'/following/'+uid).remove();
     await db.ref('users/'+uid+'/followers/'+V.uid).remove();
     if(btn){btn.textContent='Follow';btn.className='btn bp'}
     V.toast('info','Unfollowed');return;
   }
   var priv=false;
   try{var p=await db.ref('users/'+uid+'/privacy/profileLock').get();priv=p.exists()&&p.val()}catch(e){}
   if(priv){
     try{await db.ref('users/'+uid+'/followRequests/'+V.uid).set(true)}catch(e){}
     db.ref('users/'+uid+'/notifications').push({type:'follow_request',from:V.uid,fromName:me.displayName,read:false,at:Date.now()});
     V.toast('success','Request sent');
   }else{
     await db.ref('users/'+V.uid+'/following/'+uid).set(true);
     await db.ref('users/'+uid+'/followers/'+V.uid).set(true);
     db.ref('users/'+uid+'/notifications').push({type:'follow',from:V.uid,fromName:me.displayName,read:false,at:Date.now()});
     if(btn){btn.textContent='Following';btn.className='btn bo'}
     V.toast('success','Followed');
   }
 },
 accept:async function(uid,el){
   await db.ref('users/'+V.uid+'/followers/'+uid).set(true);
   await db.ref('users/'+uid+'/following/'+V.uid).set(true);
   try{await db.ref('users/'+V.uid+'/followRequests/'+uid).remove()}catch(e){}
   db.ref('users/'+uid+'/notifications').push({type:'follow_accepted',from:V.uid,fromName:me.displayName,read:false,at:Date.now()});
   if(el&&el.closest('.nrow, .urow'))el.closest('.nrow, .urow').remove();
   V.toast('success','Accepted');
 },
 reject:async function(uid,el){
   try{await db.ref('users/'+V.uid+'/followRequests/'+uid).remove()}catch(e){}
   if(el&&el.closest('.nrow, .urow'))el.closest('.nrow, .urow').remove();
 },
 acceptAll:async function(){
   var b=document.getElementById('acceptAllB');
   if(b){b.disabled=true;b.textContent='Accepting…'}
   try{
     var s=await db.ref('users/'+V.uid+'/followRequests').get();
     if(!s.exists()){V.mClose();return}
     var ups=[];
     s.forEach(function(c){
       var k=c.key;
       ups.push(
         db.ref('users/'+V.uid+'/followers/'+k).set(true),
         db.ref('users/'+k+'/following/'+V.uid).set(true),
         db.ref('users/'+V.uid+'/followRequests/'+k).remove(),
         db.ref('users/'+k+'/notifications').push({type:'follow_accepted',from:V.uid,fromName:me.displayName,read:false,at:Date.now()})
       );
     });
     await Promise.all(ups);
     V.mClose();
     V.toast('success','🎉 All requests accepted!');
   }catch(e){
     V.toast('error','Failed: '+(e.message||''),5000);
     if(b){b.disabled=false;b.textContent='✓ Accept ALL'}
   }
 },
 list:async function(uid,type,title){
   try{
     var lock=false;
     try{var l=await db.ref('users/'+uid+'/privacy/profileLock').get();lock=l.exists()&&l.val()&&uid!==V.uid}catch(e){}
     if(lock){V.mOpen(title,'<div class="empo"><div class="ei">🔒</div><div class="et">Profile Lock is ON</div></div>');return}
     var s=await db.ref('users/'+uid+'/'+type).get().catch(function(){return null});
     var h='';
     if(!s||!s.exists())h='<div class="empo"><div class="ei">📭</div><div class="et">Empty</div></div>';
     else{
       for(var k in s.val()){
         var uu=(await db.ref('users/'+k).get().catch(function(){return null}));
         var u=(uu&&uu.val())||{displayName:'User',username:k};
         h+='<div class="urow" onclick="V.openProfile(\''+k+'\')">'+V.ava(u,'sm')+'<div class="uinf"><div class="unm">'+V.nameB(u)+'</div><div class="uun">@'+(u.username||'')+'</div></div></div>';
       }
     }
     V.mOpen(title,h);
   }catch(e){V.toast('error','Load failed')}
 },
 requests:async function(){
   try{
     var s=await db.ref('users/'+V.uid+'/followRequests').get();
     var h='';
     if(!s.exists()){h='<div class="empo"><div class="ei">📭</div><div class="et">No requests</div></div>';}
     else{
       var total=s.numChildren();
       h='<button class="btn bp bbk mb8" id="acceptAllB" onclick="Follow.acceptAll()">✓ Accept ALL ('+total+')</button>';
       s.forEach(function(c){
         var k=c.key;
         h+='<div class="urow" id="fr-'+k+'"><div class="uinf"><div class="unm">Loading…</div></div><div style="display:flex;gap:6px"><button class="btn bp bsm" onclick="Follow.accept(\''+k+'\',this)">✓</button><button class="btn bds2 bsm" onclick="Follow.reject(\''+k+'\',this)">✕</button></div></div>';
         db.ref('users/'+k).get().then(function(us){
           var u=(us&&us.val())||{displayName:'User',username:k};
           var row=document.getElementById('fr-'+k);
           if(row)row.innerHTML=V.ava(u,'sm')+'<div class="uinf"><div class="unm">'+V.esc(u.displayName||'User')+'</div><div class="uun">@'+(u.username||'')+'</div></div><div style="display:flex;gap:6px"><button class="btn bp bsm" onclick="Follow.accept(\''+k+'\',this)">✓</button><button class="btn bds2 bsm" onclick="Follow.reject(\''+k+'\',this)">✕</button></div>';
         });
       });
     }
     V.mOpen('📨 Follow Requests',h);
   }catch(e){V.toast('error','Load failed')}
 }
};

/* ================= PROFILE ================= */
const Profile={
 render:async function(uid){
   var c=V.g('profC');
   c.innerHTML='<div class="pgc"><div class="skel" style="height:300px"></div></div>';
   try{
     var s=await db.ref('users/'+uid).get();
     if(!s.exists()){
       try{
         await db.ref('users/'+uid).set({
           username:'user'+uid.slice(0,6),displayName:(auth.currentUser&&auth.currentUser.email?auth.currentUser.email.split('@')[0]:'User'),email:auth.currentUser?auth.currentUser.email:'',dob:'',profilePhoto:'',bio:'',vip:false,verified:false,role:'user',banned:false,createdAt:Date.now(),recovery:{lockUntil:0},settings:{profileDesign:'modern',theme:'t0_0',font:'Inter'},followers:{},following:{},blocks:{},restrictions:{},saved:{},social:{},notifications:{},securityEvents:{},sessions:{},callHistory:{},chatLocks:{},archived:{},muted:{},followRequests:{},devices:{},posts:{},postCount:0,usernameChangedAt:0
         });
         s=await db.ref('users/'+uid).get();
       }catch(pe){console.error('auto-profile fail:',pe)}
       if(!s.exists()){c.innerHTML='<div class="empo"><div class="ei">❓</div><div class="et">User not found</div></div>';return}
     }
     var u=s.val(),own=(uid===V.uid);
     if(!u.profilePhoto){
       var auto=await Promise.race([V.autoAvatar(uid),new Promise(function(res){setTimeout(function(){res(null)},6000)})]);
       if(auto){u.profilePhoto=auto;if(own){me.profilePhoto=auto;V.refreshMe()}}
     }
     var cntF=0,cntG=0,postN=0;
     try{cntF=u.followers?Object.keys(u.followers).length:0}catch(e){}
     try{cntG=u.following?Object.keys(u.following).length:0}catch(e){}
     try{
       var cn=await db.ref('users/'+uid+'/postCount').get();
       if(cn.exists()&&cn.val()>0)postN=cn.val();
       else{
         var ps=await db.ref('users/'+uid+'/posts').get();
         postN=ps.exists()?ps.numChildren():0;
       }
     }catch(e){postN=0}
     var fol=false;try{fol=!!(u.following&&u.following[V.uid])}catch(e){}
     var blk=false;try{blk=!!(u.blocks&&u.blocks[V.uid])}catch(e){}
     var last=0;try{last=(await db.ref('presence/'+uid+'/lastSeen').get()).val()||0}catch(e){}
     var showOn=own||await Presence.canSee(uid);
     var links=await this.links(uid,u);
     var mainBtns='',row2='';
     if(own){
       mainBtns='<button class="btn bg" onclick="Profile.edit()">✏️ Edit</button><button class="btn bg" onclick="Follow.requests()">📨 Requests</button>';
       row2='<div class="pfa2"><button class="bico" onclick="Profile.render(V.uid);V.toast(\'info\',\'Profile refreshed ✅\')" title="Reload">🔄</button><button class="bico" onclick="Profile.designPicker()" title="Profile Design">🎨</button><button class="bico" onclick="Rec.openCodes()" title="Remember Codes">🔑</button><button class="bico" onclick="Settings.open()" title="Settings">⚙️</button><button class="bico" onclick="Auth.logout()" title="Logout">🚪</button></div>';
     }else if(blk){
       mainBtns='<button class="btn bds2" onclick="Profile.unblock(\''+uid+'\')">Unblock</button>';
     }else{
       mainBtns='<button class="btn '+(fol?'bo':'bp')+'" id="folB" onclick="Follow.toggle(\''+uid+'\',document.getElementById(\'folB\'))">'+(fol?'✓ Following':'Follow')+'</button>'
        +'<button class="btn bg" onclick="ChatUI.openWith(\''+uid+'\')">💬 Message</button>';
       row2='<div class="pfa2"><button class="bico" onclick="Calls.startWith(\''+uid+'\',\'voice\')">📞</button><button class="bico" onclick="Calls.startWith(\''+uid+'\',\'video\')">🎥</button><button class="bico" onclick="Profile.opts(\''+uid+'\')">⋮</button></div>';
     }
     var avaImg='';
     var ph=u.profilePhoto||'';
     if(ph){
       avaImg=(ph.indexOf('data:')===0)?'<img class="ava xl" src="'+ph+'">':'<div class="ava xl" style="background-image:url(\''+V.esc(ph)+'\')"></div>';
     }else{
       avaImg='<div class="ava xl">'+V.esc((u.displayName||'?').charAt(0).toUpperCase())+'</div>';
     }
     var devCount=0;
     try{devCount=u.devices?Object.keys(u.devices).length:0}catch(e){}
     var pfd=own?((u.settings&&u.settings.profileDesign)||'modern'):'modern';
     c.innerHTML='<div class="pgc pfd-'+pfd+'">'
      +'<div class="pfh">'
      +'<div class="pava-ring">'+avaImg+'</div>'
      +'<div class="pnm-big">'+V.nameB(u)+'</div>'
      +'<div class="puname">@'+V.esc(u.username||'')+'</div>'
      +'<div class="pbio">'+V.esc(u.bio||'')+'</div>'
      +'<div class="sm mut mt8">'+(showOn?(last?'🟢 Active '+V.timeAgo(last):'🟢 Online'):'⚪ Hidden')+(own&&devCount?' · 📱 '+devCount+' device(s)':'')+'</div>'
      +'<div class="pstats">'
      +'<div class="pst" onclick="Posts.tabGrid(\''+uid+'\')"><div class="psn">'+postN+'</div><div class="psl">Posts</div></div>'
      +'<div class="pst" onclick="Follow.list(\''+uid+'\',\'followers\',\'Followers\')"><div class="psn">'+cntF+'</div><div class="psl">Followers</div></div>'
      +'<div class="pst" onclick="Follow.list(\''+uid+'\',\'following\',\'Following\')"><div class="psn">'+cntG+'</div><div class="psl">Following</div></div>'
      +'</div>'
      +'<div class="pfa">'+mainBtns+'</div>'
      +row2
      +(links?'<div class="slinks">'+links+'</div>':'')
      +(own?'<div class="puid"><span>🆔 UID <span class="sm mut">(recovery)</span></span><span class="mono">'+V.esc(uid)+'</span><a onclick="V.copy(\''+uid+'\',\'UID copied\')">📋</a></div>':'')
      +'</div>'
      +'<div class="ptabs"><div class="ptb act">📸 Posts</div></div>'
      +'<div id="pGrid"></div></div>';
     Posts.grid(uid);
   }catch(e){
     console.error('profile render error:',e);
     c.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Couldn\u2019t load</div><div class="ex"><button class="btn bg bsm" onclick="Profile.render(V.uid)">🔄 Retry</button></div></div>';
   }
 },
 designPicker:function(){
   var cur=(me.settings&&me.settings.profileDesign)||'modern';
   var opts=[['modern','🚀 Modern','Big gradient card, square avatar — DEFAULT'],['classic','👑 Classic','Centered ring avatar'],['italic','✒️ Italic','Elegant serif italic'],['insta','📸 Insta Line','Minimal thin top line']];
   var h='<div class="snote mb8">🎨 Profile design — instant change</div><div class="pgrid3">';
   opts.forEach(function(o){
     h+='<div class="prow2" style="cursor:pointer;'+(cur===o[0]?'border:1.5px solid var(--ac)':'')+'" onclick="Profile.setDesign(\''+o[0]+'\')">'
      +'<div class="pl" style="flex-direction:column;align-items:flex-start;gap:2px"><span style="font-weight:700">'+o[1]+'</span><span class="sm mut">'+o[2]+'</span></div>'
      +(cur===o[0]?'<span style="color:var(--ac);font-weight:800">✓</span>':'')+'</div>';
   });
   h+='</div>';
   V.mOpen('🎨 Profile Design',h);
 },
 setDesign:function(d){
   try{db.ref('users/'+V.uid+'/settings/profileDesign').set(d)}catch(e){}
   if(me.settings)me.settings.profileDesign=d;else me.settings={profileDesign:d};
   V.mClose();V.toast('success','Design: '+d+' ✅');
   Profile.render(V.uid);
 },
 tabGrid:function(uid){Posts.grid(uid)},
 links:async function(uid,u){
   var h='';
   try{
     var soc=u.social||{};
     for(var k in soc){
       var v=soc[k],ok=true;
       if(uid!==V.uid&&v.visibility==='nobody')ok=false;
       if(ok&&v.url){
         var ic={instagram:'📷',youtube:'▶️',telegram:'✈️',discord:'🎮',x:'𝕏',facebook:'📘',website:'🌐'}[k]||'🔗';
         h+='<span class="slk" onclick="window.open(\''+V.esc(v.url)+'\',\'_blank\')">'+ic+'</span>';
       }
     }
   }catch(e){}
   return h;
 },
 opts:function(uid){
   V.mOpen('Options',
    '<div class="rrow" onclick="Profile.restrict(\''+uid+'\')">🚧 Restrict</div>'
    +'<div class="rrow" style="color:var(--dn)" onclick="Profile.block(\''+uid+'\')">🚫 Block</div>'
    +'<div class="rrow" onclick="Profile.report(\''+uid+'\')">🚩 Report</div>');
 },
 block:async function(uid){
   V.mClose();
   if(!confirm('Block this user?'))return;
   try{await db.ref('users/'+V.uid+'/blocks/'+uid).set(true)}catch(e){}
   V.toast('success','Blocked');Profile.render(uid);
 },
 unblock:async function(uid){
   try{await db.ref('users/'+V.uid+'/blocks/'+uid).remove()}catch(e){}
   V.toast('success','Unblocked');Profile.render(uid);
 },
 restrict:function(uid){V.mClose();Privacy.editRestr(uid)},
 report:function(uid){
   V.mClose();
   var rs=['Spam','Harassment','Fake account','Impersonation','Inappropriate content','Other'];
   var h='';
   for(var i=0;i<rs.length;i++)h+='<div class="rrow" onclick="Profile.sendReport(\''+uid+'\',\''+rs[i]+'\')"><span>'+rs[i]+'</span></div>';
   V.mOpen('Report User',h);
 },
 sendReport:async function(uid,r){
   try{await db.ref('reports').push({type:'user',targetId:uid,reason:r,reporterId:V.uid,status:'pending',at:Date.now()})}catch(e){}
   V.mClose();V.toast('success','Reported');
 },
 edit:function(){
   V.mOpen('Edit Profile',
    '<div class="fld"><label class="flbl">Display Name</label><input class="inp" id="edName" maxlength="30" value="'+V.esc(me.displayName||'')+'"></div>'
    +'<div class="fld"><label class="flbl">Username</label><div class="iwrap"><span class="iico">@</span><input class="inp" id="edUname" maxlength="20" value="'+V.esc(me.username||'')+'" oninput="Auth.checkEditUname()"></div><div class="ferr" id="edUnErr"></div><div class="fok" id="edUnOk">✓ Username available</div><div class="fhint">7-day cooldown · old username 30 days reserved</div></div>'
    +'<div class="fld"><label class="flbl">Bio</label><textarea class="txta" id="edBio" maxlength="150">'+V.esc(me.bio||'')+'</textarea><div class="ccount"><span id="edBioC">'+(me.bio||'').length+'</span>/150</div></div>'
    +'<div class="fld"><label class="flbl">Profile Photo</label><button class="btn bg bbk" id="photoBtn" onclick="Profile.pickPhoto()">📷 Choose photo</button><div class="uprog hidden" id="photoProg" style="margin-top:8px"><div class="ubar" style="width:40%"></div></div></div>',
    '<button class="btn bp" onclick="Profile.save()">Save</button>');
   V.g('edBio').addEventListener('input',function(e){V.g('edBioC').textContent=e.target.value.length});
   this._newUname=me.username;
 },
 checkEditUname:null,
 pickPhoto:function(){
   var i=document.createElement('input');i.type='file';i.accept='image/*';
   i.onchange=async function(){
     var btn=V.g('photoBtn'),prog=V.g('photoProg');
     try{
       if(btn){btn.disabled=true;btn.textContent='⏳ Uploading...'}
       if(prog)prog.classList.remove('hidden');
       var du=await V.compress(i.files[0],300,600);
       var url=await V.uploadPhoto(du,'profile/'+V.uid+'/avatar.jpg');
       await db.ref('users/'+V.uid+'/profilePhoto').set(url);
       me.profilePhoto=url;
       V.refreshMe();
       V.toast('success','Photo updated ✅');
       setTimeout(function(){Profile.render(V.uid)},300);
     }catch(e){V.toast('error',e.message||'Photo failed')}
     if(btn){btn.disabled=false;btn.textContent='📷 Choose photo'}
     if(prog)prog.classList.add('hidden');
   };
   i.click();
 },
 save:async function(){
   var name=V.g('edName').value.trim(),bio=V.g('edBio').value.trim();
   var newU=V.g('edUname')?V.g('edUname').value.trim().toLowerCase():me.username;
   if(!name)return V.toast('warning','Name required');
   try{
     if(newU&&newU!==me.username){
       if(!V.uname(newU))return V.toast('error','Invalid username format');
       var ex=await db.ref('usernames/'+newU).get();
       if(ex.exists())return V.toast('error','Username already taken');
       var res=await db.ref('reservedUsernames/'+newU).get();
       if(res.exists()&&res.val().uid!==V.uid&&res.val().until>Date.now())return V.toast('error','Username reserved');
       var last=(await db.ref('users/'+V.uid+'/usernameChangedAt').get()).val()||0;
       if(Date.now()-last<7*86400000)return V.toast('error','Cooldown: 1 change per week');
       var old=me.username;
       await db.ref('usernames/'+newU).set(V.uid);
       await db.ref('reservedUsernames/'+old).set({uid:V.uid,until:Date.now()+30*86400000});
       await db.ref('usernames/'+old).remove();
       await db.ref('users/'+V.uid).update({username:newU,usernameChangedAt:Date.now(),prevUsername:old});
       try{await db.ref('recoveryCheck/'+V.uid+'/user').set(newU)}catch(e){}
       V.vaultSet(V.uid,{username:newU,updatedAt:Date.now()});
       me.username=newU;
       V.toast('success','Username → @'+newU+' ✅',4000);
     }
     await db.ref('users/'+V.uid).update({displayName:name,bio:bio});
     me.displayName=name;me.bio=bio;
     V.mClose();V.toast('success','Profile updated ✅');
     V.g('topTitle').textContent=name;
     Profile.render(V.uid);
   }catch(e){V.toast('error',V.friendErr(e))}
 }
};
Auth.checkEditUname=function(){
  clearTimeout(Auth._eto2);
  var u=V.g('edUname')?V.g('edUname').value.trim().toLowerCase():'';
  var ok=V.g('edUnOk'),err=V.g('edUnErr');
  if(!ok||!err)return;
  ok.classList.remove('show');err.classList.remove('show');
  if(!u||u===me.username)return;
  if(!V.uname(u)){err.textContent='Invalid format';err.classList.add('show');return}
  Auth._eto2=setTimeout(async function(){
    try{
      var s=await db.ref('usernames/'+u).get();
      if(s.exists()&&s.val()!==V.uid){err.textContent='❌ Taken';err.classList.add('show')}
      else ok.classList.add('show');
    }catch(e){}
  },450);
};

/* ================= POSTS ================= */
const Posts={
 photos:[],limit:12,
 load:async function(){
   var w=V.g('feedW');
   w.innerHTML='<div class="skel" style="height:220px;margin-bottom:15px"></div><div class="skel" style="height:220px;margin-bottom:15px"></div>';
   try{
     var s=await db.ref('posts').get();
     w.innerHTML='';
     if(!s.exists()){w.innerHTML='<div class="empo"><div class="ei">📝</div><div class="et">No posts yet</div><div class="ex">Tap ✏️ to create!</div></div>';return}
     var arr=[];
     s.forEach(function(c){arr.push({id:c.key,val:c.val()})});
     arr.sort(function(a,b){return (b.val.createdAt||0)-(a.val.createdAt||0)});
     arr=arr.slice(0,this.limit);
     var n=0;
     for(var i=0;i<arr.length;i++){
       var p=arr[i].val;
       if(await Privacy.canViewPost(p)){w.insertAdjacentHTML('beforeend',await this.card(arr[i].id,p));n++}
     }
     if(!n)w.innerHTML='<div class="empo"><div class="ei">🔒</div><div class="et">No posts to show</div></div>';
   }catch(e){
     w.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Feed load failed</div><div class="ex">'+V.esc(e.message||'')+'</div></div>';
   }
 },
 imgFallback:function(img){
   var src=img.getAttribute('src')||'';
   if(src.indexOf('data:')===0)return;
   var fb=img.getAttribute('data-fb')||'';
   if(fb&&img.dataset.tried!=='1'){
     img.dataset.tried='1';
     img.src=fb;
     return;
   }
   if(img.dataset.tried==='1')img.dataset.tried='2';
 },
 card:async function(id,p){
   var au=(await db.ref('users/'+p.userId).get().catch(function(){return null}));
   var a=(au&&au.val())||{displayName:'Unknown',username:'?'};
   if(!a.profilePhoto){
     var auto=await Promise.race([V.autoAvatar(p.userId),new Promise(function(res){setTimeout(function(){res(null)},4000)})]);
     if(auto){a.profilePhoto=auto}
   }
   var lk=p.likes&&p.likes[V.uid];
   var sv=p.saves&&p.saves[V.uid];
   var lc=p.likeCount||(p.likes?Object.keys(p.likes).length:0);
   var ph=p.photoRefs||[];
   var pic={everyone:'🌍',followers:'👥',onlyme:'🔒'}[p.privacy]||'🌍';
   var imgs='';
   for(var i=0;i<ph.length;i++){
     var src=V.esc(ph[i]||'');
     var fbUrl='';
     try{fbUrl=sb.storage.from(CFG.supabase.bucket).getPublicUrl('posts/'+p.userId+'/'+id+'_'+i+'.jpg').data.publicUrl;}catch(e){}
     imgs+='<img src="'+src+'" loading="lazy" data-fb="'+V.esc(fbUrl)+'" onerror="Posts.imgFallback(this)" onclick="Posts.view(this.src)">';
   }
   return '<div class="pcard" id="pc-'+id+'">'
    +'<div class="phd">'+V.ava(a,'md')+'<div class="pinfo"><div class="pnm" onclick="V.openProfile(\''+p.userId+'\')">'+V.nameB(a)+'</div><div class="ptm">@'+V.esc(a.username||'')+' · '+V.timeAgo(p.createdAt)+' · '+pic+'</div></div><button class="bico" onclick="Posts.opts(\''+id+'\',\''+p.userId+'\')">⋮</button></div>'
    +(p.caption?'<div class="pcap">'+V.htg(V.esc(p.caption))+'</div>':'')
    +'<div class="pph n'+Math.max(ph.length,1)+'">'+imgs+'</div>'
    +'<div class="pacts">'
    +'<span class="pab'+(lk?' lk':'')+'" onclick="Posts.like(\''+id+'\',this)"><span class="pi">'+(lk?'❤️':'🤍')+'</span><span class="lc" onclick="event.stopPropagation();Posts.showLikers(\''+id+'\')" style="cursor:pointer">'+(lc||'')+'</span></span>'
    +'<span class="pab" onclick="Posts.comments(\''+id+'\')"><span class="pi">💬</span><span class="cc">'+(p.commentCount||0)+'</span></span>'
    +'<span class="pab'+(sv?' sv':'')+'" onclick="Posts.save(\''+id+'\',this)"><span class="pi">'+(sv?'🔖':'📑')+'</span></span>'
    +'<span class="pab" onclick="Posts.share(\''+id+'\')"><span class="pi">↗️</span></span>'
    +'</div></div>';
 },
 showLikers:async function(id){
   V.mOpen('❤️ Likes','<div id="lkL"><div class="spn" style="margin:18px auto"></div></div>');
   var s=await db.ref('likes/'+id).get().catch(function(){return null});
   var list=document.getElementById('lkL');
   if(!list)return;
   if(!s||!s.exists()){list.innerHTML='<div class="empo" style="padding:22px"><div class="ei">🤍</div><div class="et">No likes yet</div></div>';return}
   var total=s.numChildren();
   var h='<div class="stit" style="margin:0 0 8px">Total: '+total+' likes</div>';
   list.innerHTML=h;
   s.forEach(function(c){
     var uid=c.key;
     db.ref('users/'+uid).get().then(function(us){
       var u=(us&&us.val())||{displayName:'User',username:'?'};
       var row=document.createElement('div');
       row.className='urow';
       row.innerHTML=V.ava(u,'sm')+'<div class="uinf"><div class="unm">'+V.nameB(u)+'</div><div class="uun">@'+(u.username||'')+'</div></div>';
       list.appendChild(row);
     });
   });
 },
 like:async function(id,el){
   try{
     var r=db.ref('likes/'+id+'/'+V.uid);
     var ex=(await r.get()).exists();
     if(ex)await r.remove();
     else{
       await r.set(true);
       var o=(await db.ref('posts/'+id+'/userId').get()).val();
       if(o&&o!==V.uid)db.ref('users/'+o+'/notifications').push({type:'like',from:V.uid,fromName:me.displayName,postId:id,read:false,at:Date.now()});
     }
     var n=(await db.ref('likes/'+id).get()).numChildren();
     await db.ref('posts/'+id+'/likeCount').set(n);
     var on=el.classList.toggle('lk');
     el.querySelector('.pi').textContent=on?'❤️':'🤍';
     el.querySelector('.lc').textContent=n||'';
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 save:async function(id,el){
   try{
     var r=db.ref('users/'+V.uid+'/saved/'+id);
     var ex=(await r.get()).exists();
     if(ex){await r.remove();V.toast('info','Removed')}
     else{await r.set(true);V.toast('success','Saved 🔖')}
     var on=el.classList.toggle('sv');
     el.querySelector('.pi').textContent=on?'🔖':'📑';
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 share:async function(id){
   var url=location.origin+location.pathname+'#post='+id;
   if(navigator.share){try{await navigator.share({title:'VEXA Post',url:url})}catch(e){}}
   else V.copy(url,'Link copied');
 },
 view:function(u){V.mOpen('Photo','<img src="'+u+'" style="width:100%;border-radius:10px">')},
 opts:function(id,owner){
   var own=(owner===V.uid);
   var h=own?
    '<div class="rrow" onclick="Posts.editCap(\''+id+'\')">✏️ Edit caption</div><div class="rrow" style="color:var(--dn)" onclick="Posts.del(\''+id+'\')">🗑️ Delete</div>':
    '<div class="rrow" style="color:var(--dn)" onclick="Posts.report(\''+id+'\')">🚩 Report</div>';
   V.mOpen('Post options',h);
 },
 editCap:async function(id){
   V.mClose();
   var o=(await db.ref('posts/'+id+'/userId').get().catch(function(){return null}));
   if(!o||o.val()!==V.uid)return V.toast('error','Sirf apna post edit kar sakte ho');
   var cap=(await db.ref('posts/'+id+'/caption').get().catch(function(){return null}));
   V.mOpen('Edit Caption','<textarea class="txta" id="ecT" maxlength="500">'+V.esc((cap&&cap.val())||'')+'</textarea>','<button class="btn bp" onclick="Posts.saveCap(\''+id+'\')">Save</button>');
 },
 saveCap:async function(id){
   var v=V.g('ecT').value.trim();
   await db.ref('posts/'+id).update({caption:v,hashtags:(v.match(/#[\w]+/g)||[]).map(function(h){return h.toLowerCase()}),edited:true});
   V.mClose();V.toast('success','Updated');Posts.load();
 },
 del:async function(id){
   V.mClose();
   var o=(await db.ref('posts/'+id+'/userId').get().catch(function(){return null}));
   if(!o||o.val()!==V.uid)return V.toast('error','Sirf apna post delete kar sakte ho');
   if(!confirm('Delete this post?'))return;
   try{
     await db.ref('posts/'+id).remove();
     await db.ref('likes/'+id).remove();
     await db.ref('users/'+V.uid+'/posts/'+id).remove();
     db.ref('users/'+V.uid+'/postCount').transaction(function(n){return Math.max(0,(n||1)-1)});
     V.toast('success','Deleted');Posts.load();
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 report:function(id){
   V.mClose();
   var rs=['Spam','Harassment','Fake account','Inappropriate content','Other'];
   var h='';
   for(var i=0;i<rs.length;i++)h+='<div class="rrow" onclick="Posts.sendRep(\''+id+'\',\''+rs[i]+'\')"><span>'+rs[i]+'</span></div>';
   V.mOpen('Report Post',h);
 },
 sendRep:async function(id,r){
   try{await db.ref('reports').push({type:'post',targetId:id,reason:r,reporterId:V.uid,status:'pending',at:Date.now()})}catch(e){}
   V.mClose();V.toast('success','Reported');
 },
 comments:function(id){
   V.mOpen('Comments','<div id="cmTotal" class="stit" style="margin:0 0 8px">💬 Loading…</div><div id="cmL"><div class="spn" style="margin:18px auto"></div></div>'
    +'<div style="display:flex;gap:8px;margin-top:13px"><input class="inp" id="cmI" placeholder="Add a comment..." maxlength="300"><button class="bico ok" id="cmS">➤</button></div>');
   var list=V.g('cmL');
   var cbn=db.ref('comments/'+id).on('value',async function(s){
     var tot=document.getElementById('cmTotal');
     if(tot)tot.textContent='💬 Total: '+s.numChildren()+' comments';
     if(!s.exists()){list.innerHTML='<div class="empo" style="padding:22px"><div class="ei">💬</div><div class="et">No comments yet</div></div>';return}
     list.innerHTML='';
     var arr=[];
     s.forEach(function(c){arr.push({cid:c.key,val:c.val()})});
     arr.sort(function(a,b){return (a.val.at||0)-(b.val.at||0)});
     for(var i=0;i<arr.length;i++){
       var c=arr[i].val,cid=arr[i].cid;
       var uu=(await db.ref('users/'+c.uid).get().catch(function(){return null}));
       var u=(uu&&uu.val())||{displayName:c.name||'User'};
       var clk=c.likes&&c.likes[V.uid];
       list.insertAdjacentHTML('beforeend','<div class="cmt">'+V.ava(u,'sm')+'<div style="flex:1;min-width:0"><div class="cmtb"><div class="cmtn" onclick="V.openProfile(\''+c.uid+'\')">'+V.nameB(u)+'</div><div>'+V.esc(c.text)+'</div></div><div class="cmta"><span class="clk'+(clk?' lk':'')+'" onclick="Posts.cLike(\''+id+'\',\''+cid+'\',this)">'+(clk?'❤️':'🤍')+' '+(c.likes?Object.keys(c.likes).length:'')+'</span>'+(c.uid===V.uid?'<span style="color:var(--dn)" onclick="Posts.cDel(\''+id+'\',\''+cid+'\')">Delete</span>':'<span onclick="Posts.sendRepC(\''+c.uid+'\',\'Reported\')">Report</span>')+'</div></div></div>');
     }
   });
   V._cmUnsub=function(){db.ref('comments/'+id).off('value',cbn)};
   V.g('cmS').onclick=async function(){
     var t=V.g('cmI').value.trim();
     if(!t)return;
     V.g('cmI').value='';
     await db.ref('comments/'+id).push({uid:V.uid,name:me.displayName,text:t,at:firebase.database.ServerValue.TIMESTAMP});
     db.ref('posts/'+id+'/commentCount').transaction(function(n){return (n||0)+1});
     var o=(await db.ref('posts/'+id+'/userId').get().catch(function(){return null}));
     var ow=o&&o.val();
     if(ow&&ow!==V.uid)db.ref('users/'+ow+'/notifications').push({type:'comment',from:V.uid,fromName:me.displayName,postId:id,text:t.slice(0,50),read:false,at:Date.now()});
   };
 },
 cLike:async function(pid,cid,el){
   var r=db.ref('comments/'+pid+'/'+cid+'/likes/'+V.uid);
   var ex=(await r.get()).exists();
   if(ex)await r.remove();else await r.set(true);
   el.classList.toggle('lk');
 },
 cDel:async function(pid,cid){
   await db.ref('comments/'+pid+'/'+cid).remove();
   db.ref('posts/'+pid+'/commentCount').transaction(function(n){return Math.max(0,(n||1)-1)});
 },
 compose:function(){
   this.photos=[];
   V.mOpen('Create Post',
    '<div class="pgrid" id="cmpG"><div class="pgadd" onclick="Posts.pick()"><span style="font-size:23px">＋</span>Add photo</div></div>'
    +'<div class="uprog hidden" id="cmpP"><div class="ubar" id="cmpB"></div></div>'
    +'<div class="fld"><textarea class="txta" id="cmpC" placeholder="Write a caption... use #hashtags" maxlength="500"></textarea><div class="ccount"><span id="cmpCc">0</span>/500</div></div>'
    +'<div class="fld"><label class="flbl">Privacy</label><div class="seg" id="cmpPr"><div class="sgi sel" data-v="everyone">🌍 Everyone</div><div class="sgi" data-v="followers">👥 Followers</div><div class="sgi" data-v="onlyme">🔒 Only Me</div></div></div>',
    '<button class="btn bg" onclick="Posts.draft()">Draft</button><button class="btn bp" id="cmpGo" onclick="Posts.publish()">Post</button>');
   V.g('cmpC').addEventListener('input',function(e){V.g('cmpCc').textContent=e.target.value.length});
   document.querySelectorAll('#cmpPr .sgi').forEach(function(el){
     el.onclick=function(){document.querySelectorAll('#cmpPr .sgi').forEach(function(x){x.classList.remove('sel')});el.classList.add('sel')};
   });
 },
 pick:function(){
   var self=this;
   var i=document.createElement('input');
   i.type='file';i.accept='image/*';i.multiple=true;
   i.onchange=async function(){
     for(var k=0;k<i.files.length;k++){
       if(self.photos.length>=4){V.toast('warning','Max 4 photos');break}
       try{self.photos.push(await V.compress(i.files[k],300))}
       catch(e){V.toast('error',e.message)}
     }
     self.grid();
   };
   i.click();
 },
 grid:function(){
   var g=V.g('cmpG');if(!g)return;
   var h='';
   for(var i=0;i<this.photos.length;i++)h+='<div class="pgi"><img src="'+this.photos[i]+'"><div class="pgrm" onclick="Posts.rmPh('+i+')">✕</div></div>';
   if(this.photos.length<4)h+='<div class="pgadd" onclick="Posts.pick()"><span style="font-size:23px">＋</span>Add</div>';
   g.innerHTML=h;
 },
 rmPh:function(i){this.photos.splice(i,1);this.grid()},
 publish:async function(){
   var cap=V.g('cmpC').value.trim();
   var sel=document.querySelector('#cmpPr .sgi.sel');
   var pr=(sel&&sel.dataset.v)||'everyone';
   if(!this.photos.length)return V.toast('warning','Add at least 1 photo');
   var b=V.g('cmpGo');
   b.disabled=true;b.textContent='Posting...';
   V.g('cmpP').classList.remove('hidden');
   try{
     var pid=db.ref('posts').push().key;
     var urls=[];
     for(var i=0;i<this.photos.length;i++){
       V.g('cmpB').style.width=Math.round((i+1)/this.photos.length*100)+'%';
       urls.push(await V.uploadPhoto(this.photos[i],'posts/'+V.uid+'/'+pid+'_'+i+'.jpg'));
     }
     var postData={userId:V.uid,title:cap.slice(0,60),caption:cap,photoRefs:urls,postUrl:urls[0]||'',privacy:pr,hashtags:(cap.match(/#[\w]+/g)||[]).map(function(h){return h.toLowerCase()}),createdAt:firebase.database.ServerValue.TIMESTAMP,commentCount:0,likeCount:0};
     await db.ref('posts/'+pid).set(postData);
     await db.ref('users/'+V.uid+'/posts/'+pid).set({
       title:postData.title,
       caption:cap,
       privacy:pr,
       postUrl:postData.postUrl,
       photoRefs:urls,
       createdAt:firebase.database.ServerValue.TIMESTAMP
     });
     db.ref('users/'+V.uid+'/postCount').transaction(function(n){return (n||0)+1});
     V.mClose();V.toast('success','Post published! 🎉');Posts.load();
   }catch(e){
     V.toast('error','Post failed: '+(e.message||'error'),6000);
     b.disabled=false;b.textContent='Post';
   }
 },
 draft:function(){
   var cap=V.g('cmpC').value.trim();
   if(!cap&&!this.photos.length)return V.toast('warning','Nothing to save');
   var sel=document.querySelector('#cmpPr .sgi.sel');
   db.ref('users/'+V.uid+'/draft').set({caption:cap,privacy:(sel&&sel.dataset.v)||'everyone',updatedAt:Date.now()});
   V.mClose();V.toast('success','Draft saved');
 },
 tabGrid:function(uid){this.grid(uid)},
 grid:async function(uid){
   var g=V.g('pGrid');if(!g)return;
   g.innerHTML='<div class="skel" style="height:100px;margin:10px"></div>';
   try{
     var s=await db.ref('users/'+uid+'/posts').limitToLast(24).get();
     if(!s.exists()){g.innerHTML='<div class="empo"><div class="ei">📷</div><div class="et">No posts</div></div>';return}
     var arr=[];
     s.forEach(function(c){arr.push({id:c.key,val:c.val()})});
     arr.reverse();
     var cells='';
     for(var i=0;i<arr.length;i++){
       var p=arr[i].val,pid=arr[i].id;
       if(p.privacy==='onlyme'&&uid!==V.uid)continue;
       var ph=[];
       if(p.postUrl)ph.push(p.postUrl);
       if(p.photoRefs&&p.photoRefs.length)ph=ph.concat(p.photoRefs);
       if(!ph.length)continue;
       var fbUrl='';
       try{fbUrl=sb.storage.from(CFG.supabase.bucket).getPublicUrl('posts/'+uid+'/'+pid+'_0.jpg').data.publicUrl;}catch(e){}
       var src=V.esc(ph[0]);
       cells+='<div class="pgv"><img src="'+src+'" loading="lazy" data-fb="'+V.esc(fbUrl)+'" onerror="Posts.imgFallback(this)" onclick="Posts.view(this.src)">'+(ph.length>1?'<span class="pgc2">1/'+ph.length+'</span>':'')+'</div>';
     }
     g.innerHTML=cells?'<div class="pgrid2">'+cells+'</div>':'<div class="empo"><div class="ei">📷</div><div class="et">No visible posts</div></div>';
   }catch(e){g.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 }
};

/* ================= CHAT ================= */
const ChatUI={
 peerUid:null,chatId:null,lockOpen:false,replyTo:null,tabC:'all',unsubs:[],_tt:null,
 openWith:async function(uid){
   if(!uid)return;
   var chk=await Privacy.check('message',uid);
   if(!chk.ok)return V.toast('warning',chk.msg);
   this.peerUid=uid;
   this.chatId=[V.uid,uid].sort().join('_');
   this.replyTo=null;
   var uu=(await db.ref('users/'+uid).get().catch(function(){return null}));
   var u=(uu&&uu.val())||{};
   if(!u.profilePhoto){var auto=await V.autoAvatar(uid);if(auto){u.profilePhoto=auto}}
   var lock=(await db.ref('users/'+V.uid+'/chatLocks/'+this.chatId).get().catch(function(){return null}));
   if(lock&&lock.exists()&&!this.lockOpen){
     var self=this;
     this.pinPrompt(function(){self.doOpen(u)});
     return;
   }
   this.doOpen(u);
 },
 doOpen:async function(u){
   var ph=u.profilePhoto||'';
   if(ph){
     if(ph.indexOf('data:')===0){V.g('cvAva').style.backgroundImage='url('+ph+')'}
     else{V.g('cvAva').style.backgroundImage="url('"+ph+"')"}
     V.g('cvAva').textContent='';
   }else{V.g('cvAva').style.backgroundImage='';V.g('cvAva').textContent=(u.displayName||'?').charAt(0)}
   V.g('cvName').innerHTML=V.nameB(u);
   var on=await Presence.canSee(this.peerUid);
   var self=this;
   var ps=null;
   try{ps=(await db.ref('presence/'+this.peerUid).get()).val()}catch(e){}
   function setSt(){
     V.g('cvSt').textContent=on?(ps&&ps.online?'🟢 Online':(ps&&ps.lastSeen?'Seen '+V.timeAgo(ps.lastSeen):'')):'';
     V.g('cvSt').className='chs'+(on&&ps&&ps.online?' on':'');
   }
   setSt();
   try{db.ref('presence/'+this.peerUid).on('value',function(s){ps=s.val();setSt()})}catch(e){}
   try{
     db.ref('typing/'+this.chatId+'/'+this.peerUid).on('value',function(s){
       if(s.exists()&&s.val()===true&&on)V.g('cvSt').innerHTML='<span class="typd"><i></i><i></i><i></i></span> typing';
       else setSt();
     });
   }catch(e){}
   V.g('cmsgs').innerHTML='';
   V.g('chatV').classList.add('open');
   V.g('feye').classList.add('show');
   this.listenMsgs();
   this.emojiInit();
 },
 listenMsgs:function(){
   var self=this;
   this.unsubs.forEach(function(u){try{u()}catch(e){}});
   this.unsubs=[];
   var r=db.ref('messages/'+this.chatId).limitToLast(150);
   var cb=r.on('value',function(s){
     var w=V.g('cmsgs');if(!w)return;
     w.innerHTML='';
     var lastD='';
     s.forEach(function(m){
       var v=m.val();
       var d=V.dateDiv(v.createdAt||Date.now());
       if(d!==lastD){w.insertAdjacentHTML('beforeend','<div class="ddiv">'+d+'</div>');lastD=d}
       w.insertAdjacentHTML('beforeend',self.bubble(m.key,v));
     });
     w.scrollTop=w.scrollHeight;
     s.forEach(function(m){
       var v=m.val();
       if(v.senderId!==V.uid&&!v.seen){try{db.ref('messages/'+self.chatId+'/'+m.key+'/seen').set(true)}catch(e){}}
     });
     try{db.ref('chats/'+self.chatId+'/unread/'+V.uid).set(0)}catch(e){}
   });
   this.unsubs.push(function(){r.off('value',cb)});
 },
 bubble:function(id,m){
   var meM=(m.senderId===V.uid);
   var reacs='';
   if(m.reactions){var parts=[];for(var k in m.reactions){if(m.reactions[k])parts.push(m.reactions[k])}reacs=parts.join('')}
   var meta=V.clock(m.createdAt);
   if(meM)meta+='<span>'+(m.seen?'✓✓':'✓')+'</span>';
   return '<div class="mrow '+(meM?'me':'them')+'" data-mid="'+id+'">'
    +'<div class="mbub" ondblclick="ChatUI.reactBar(\''+id+'\')">'
    +(m.replyToName?'<div class="mq" onclick="ChatUI.jump(\''+m.replyTo+'\')">↩ '+V.esc(m.replyToName)+': '+V.esc(m.replyToText||'')+'</div>':'')
    +(m.deleted?'<span class="mdel">🚫 deleted</span>':V.esc(m.text||''))
    +(m.edited?'<span class="medt"> (edited)</span>':'')
    +'<div class="mmet">'+meta+'</div>'
    +(reacs?'<span class="mrea">'+reacs+'</span>':'')
    +'<span class="mrbar" id="rb-'+id+'"><span onclick="ChatUI.react(\''+id+'\',\'❤️\')">❤️</span><span onclick="ChatUI.react(\''+id+'\',\'😂\')">😂</span><span onclick="ChatUI.react(\''+id+'\',\'👍\')">👍</span><span onclick="ChatUI.react(\''+id+'\',\'🔥\')">🔥</span><span onclick="ChatUI.menu(\''+id+'\')">⋮</span></span>'
    +'</div></div>';
 },
 jump:function(id){var el=document.querySelector('[data-mid="'+id+'"]');if(el)el.scrollIntoView({behavior:'smooth',block:'center'})},
 reactBar:function(id){document.querySelectorAll('.mrbar').forEach(function(b){b.classList.remove('show')});var el=V.g('rb-'+id);if(el)el.classList.toggle('show')},
 react:async function(id,e){
   try{
     var m=(await db.ref('messages/'+this.chatId+'/'+id).get()).val();
     var cur=m.reactions&&m.reactions[V.uid]===e;
     await db.ref('messages/'+this.chatId+'/'+id+'/reactions/'+V.uid).set(cur?null:e);
   }catch(err){}
   document.querySelectorAll('.mrbar').forEach(function(b){b.classList.remove('show')});
 },
 menu:async function(id){
   var m=(await db.ref('messages/'+this.chatId+'/'+id).get().catch(function(){return null}));
   var v=(m&&m.val())||{};
   var meM=(v.senderId===V.uid);
   var h='<div class="rrow" onclick="ChatUI.doCopy(\''+id+'\')">📋 Copy</div>'
    +'<div class="rrow" onclick="ChatUI.doReply(\''+id+'\')">↩ Reply</div>'
    +(meM?'<div class="rrow" onclick="ChatUI.doEdit(\''+id+'\')">✏️ Edit</div><div class="rrow" style="color:var(--dn)" onclick="ChatUI.doDel(\''+id+'\')">🗑️ Delete</div>':'');
   V.mOpen('Message',h);
 },
 doCopy:async function(id){
   var t=(await db.ref('messages/'+this.chatId+'/'+id+'/text').get().catch(function(){return null}));
   V.mClose();V.copy((t&&t.val())||'','Copied');
 },
 doReply:async function(id){
   var m=(await db.ref('messages/'+this.chatId+'/'+id).get().catch(function(){return null}));
   var v=(m&&m.val())||{};
   this.replyTo={id:id,text:(v.text||'').slice(0,60),name:(v.senderId===V.uid)?'You':'User'};
   V.mClose();V.g('cInput').focus();
 },
 doEdit:async function(id){
   V.mClose();
   var t=(await db.ref('messages/'+this.chatId+'/'+id+'/text').get().catch(function(){return null}));
   V.mOpen('Edit','<textarea class="txta" id="emT">'+V.esc((t&&t.val())||'')+'</textarea>','<button class="btn bp" onclick="ChatUI.saveEdit(\''+id+'\')">Save</button>');
 },
 saveEdit:async function(id){await db.ref('messages/'+this.chatId+'/'+id).update({text:V.g('emT').value.trim(),edited:true});V.mClose()},
 doDel:async function(id){V.mClose();await db.ref('messages/'+this.chatId+'/'+id).update({text:'',deleted:true,edited:false})},
 send:function(){
   var t=V.g('cInput').value.trim();
   if(!t||!this.chatId)return;
   V.g('cInput').value='';V.g('cInput').style.height='auto';
   this.pushTo(this.peerUid,t,this.replyTo);
   this.replyTo=null;
 },
 pushTo:async function(otherUid,text,reply){
   var cid=[V.uid,otherUid].sort().join('_');
   var mid=db.ref('messages/'+cid).push().key;
   var o={senderId:V.uid,text:text,type:'text',createdAt:firebase.database.ServerValue.TIMESTAMP,delivered:true,seen:false};
   if(reply){o.replyTo=reply.id;o.replyToName=reply.name;o.replyToText=reply.text}
   await db.ref('messages/'+cid+'/'+mid).set(o);
   var part={};part[V.uid]=true;part[otherUid]=true;
   await db.ref('chats/'+cid).update({participants:part,lastMessage:text.slice(0,80),lastSender:V.uid,updatedAt:firebase.database.ServerValue.TIMESTAMP});
   db.ref('chats/'+cid+'/unread/'+otherUid).transaction(function(n){return (n||0)+1});
   var muted=false;
   try{muted=(await db.ref('users/'+otherUid+'/muted/'+cid).get()).exists()}catch(e){}
   if(!muted)db.ref('users/'+otherUid+'/notifications').push({type:'message',from:V.uid,fromName:me.displayName,text:text.slice(0,50),read:false,at:Date.now()});
 },
 typing:function(){
   if(!this.chatId)return;
   clearTimeout(this._tt);
   try{db.ref('typing/'+this.chatId+'/'+V.uid).set(true)}catch(e){}
   var cid=this.chatId;
   this._tt=setTimeout(function(){try{db.ref('typing/'+cid+'/'+V.uid).set(false)}catch(e){}},1600);
 },
 grow:function(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,110)+'px'},
 emojiInit:function(){
   if(V.g('emoP').innerHTML)return;
   var es='😀 😂 🤣 😊 😍 😘 🤔 😴 😎 🥳 😭 😡 👍 🙏 🔥 ❤️ 💔 ✨ 🎉 🎮 📞 💬 🌍 🚀 ⚡ 🌙 🍕 🎵 ⚽ 🏆 💯 🤝 👀 🤗 😱 🥰 😇 🙃 🥺 🤩'.split(' ');
   var h='';
   for(var i=0;i<es.length;i++)h+='<span onclick="ChatUI.ins(\''+es[i]+'\')">'+es[i]+'</span>';
   V.g('emoP').innerHTML=h;
 },
 emoji:function(){this.emojiInit();V.g('emoP').classList.toggle('open')},
 ins:function(e){V.g('cInput').value+=e;V.g('cInput').focus()},
 gif:function(){
   var g=['🎮','🎯','🎲','🏆','⚡','🔥','💥','🌟','🍕','🎉','💜','😂','😎','🤖','🚀','🌈','🐱','🐶','🎵','☕','⚽','🏀','🎁','💯'];
   var h='';
   for(var i=0;i<g.length;i++)h+='<div class="pgi" style="display:flex;align-items:center;justify-content:center;font-size:34px;cursor:pointer" onclick="ChatUI.stick(\''+g[i]+'\')">'+g[i]+'</div>';
   V.mOpen('Stickers','<div class="pgrid" style="grid-template-columns:repeat(4,1fr)">'+h+'</div>');
 },
 stick:function(x){V.mClose();this.pushTo(this.peerUid,'［GIF］'+x)},
 opts:function(){
   V.mOpen('Chat options',
    '<div class="rrow" onclick="ChatUI.lock()">🔒 Lock chat (PIN)</div>'
    +'<div class="rrow" onclick="ChatUI.archive()">📁 Archive / restore</div>'
    +'<div class="rrow" onclick="ChatUI.mute()">🔕 Mute / unmute</div>'
    +'<div class="rrow" onclick="V.mClose();Games.openWith(ChatUI.peerUid)">🎮 Play a game (👁️)</div>'
    +'<div class="rrow" onclick="V.mClose();Profile.restrict(ChatUI.peerUid)">🚧 Restrict</div>'
    +'<div class="rrow" style="color:var(--dn)" onclick="V.mClose();Profile.block(ChatUI.peerUid)">🚫 Block</div>');
 },
 lock:async function(){
   V.mClose();
   var ex=null;
   try{ex=(await db.ref('users/'+V.uid+'/chatLocks/'+this.chatId).get()).val()}catch(e){}
   if(ex){
     var p=prompt('Enter PIN to unlock:');
     if(p===null)return;
     if(btoa(p+'vexa')===ex){await db.ref('users/'+V.uid+'/chatLocks/'+this.chatId).remove();this.lockOpen=false;V.toast('success','Unlocked')}
     else V.toast('error','Wrong PIN');
     return;
   }
   var p1=prompt('Set 4-digit PIN:');
   if(p1===null)return;
   if(!/^\d{4}$/.test(p1))return V.toast('warning','4 digits needed');
   var p2=prompt('Confirm PIN:');
   if(p1!==p2)return V.toast('error','PINs do not match');
   await db.ref('users/'+V.uid+'/chatLocks/'+this.chatId).set(btoa(p1+'vexa'));
   V.toast('success','Chat locked 🔒');
 },
 pinPrompt:function(cb){
   var p=prompt('🔒 Chat locked.\nEnter PIN:');
   if(p===null)return;
   var self=this;
   db.ref('users/'+V.uid+'/chatLocks/'+this.chatId).get().then(function(s){
     if(s.exists()&&s.val()===btoa(p+'vexa')){self.lockOpen=true;cb()}
     else V.toast('error','Wrong PIN');
   });
 },
 archive:async function(){
   V.mClose();
   var ex=false;
   try{ex=(await db.ref('users/'+V.uid+'/archived/'+this.chatId).get()).exists()}catch(e){}
   if(ex)await db.ref('users/'+V.uid+'/archived/'+this.chatId).remove();
   else await db.ref('users/'+V.uid+'/archived/'+this.chatId).set(true);
   V.toast('success',ex?'Restored':'Archived');
 },
 mute:async function(){
   V.mClose();
   var ex=false;
   try{ex=(await db.ref('users/'+V.uid+'/muted/'+this.chatId).get()).exists()}catch(e){}
   if(ex)await db.ref('users/'+V.uid+'/muted/'+this.chatId).remove();
   else await db.ref('users/'+V.uid+'/muted/'+this.chatId).set(true);
   V.toast('success',ex?'Unmuted':'Muted');
 },
 close:function(){
   V.g('chatV').classList.remove('open');
   V.g('feye').classList.remove('show');
   V.g('emoP').classList.remove('open');
   this.unsubs.forEach(function(u){try{u()}catch(e){}});
   this.unsubs=[];
 },
 tab:function(t){this.tabC=t;document.querySelectorAll('#sc-chat .ctabs .sgi').forEach(function(x){x.classList.toggle('sel',x.dataset.t===t)});this.load()},
 load:async function(){
   var w=V.g('chatL');
   w.innerHTML='<div class="spn" style="margin:20px auto"></div>';
   try{
     var s=await db.ref('chats').orderByChild('participants/'+V.uid).equalTo(true).get();
     var arch={},locks={},muted={};
     try{arch=(await db.ref('users/'+V.uid+'/archived').get()).val()||{}}catch(e){}
     try{locks=(await db.ref('users/'+V.uid+'/chatLocks').get()).val()||{}}catch(e){}
     try{muted=(await db.ref('users/'+V.uid+'/muted').get()).val()||{}}catch(e){}
     w.innerHTML='';
     var arr=[];
     s.forEach(function(c){arr.push({id:c.key,val:c.val()})});
     arr.sort(function(a,b){return (b.val.updatedAt||0)-(a.val.updatedAt||0)});
     var n=0,h='';
     for(var i=0;i<arr.length;i++){
       var c=arr[i].val,cid=arr[i].id;
       var isArch=!!arch[cid];
       if(this.tabC==='arch'&&!isArch)continue;
       if(this.tabC!=='arch'&&isArch)continue;
       var other=null;
       for(var k in (c.participants||{})){if(k!==V.uid)other=k}
       if(!other)continue;
       var uu=(await db.ref('users/'+other).get().catch(function(){return null}));
       var u=(uu&&uu.val())||{displayName:'User'};
       if(!u.profilePhoto){var auto=await V.autoAvatar(other);if(auto){u.profilePhoto=auto}}
       var un=(c.unread&&c.unread[V.uid])||0;
       if(this.tabC==='unread'&&!un)continue;
       var lock=!!locks[cid];
       if(this.tabC==='locked'&&!lock)continue;
       h+='<div class="crow" onclick="ChatUI.openWith(\''+other+'\')">'+V.ava(u,'md')
        +'<div class="cri"><div class="crt"><div class="crn">'+V.nameB(u)+(lock?' 🔒':'')+(muted[cid]?' 🔕':'')+'</div><div class="crtm">'+V.timeAgo(c.updatedAt)+'</div></div>'
        +'<div class="crb"><div class="crp">'+(c.lastSender===V.uid?'You: ':'')+V.esc(c.lastMessage||'Say hi 👋')+'</div>'+(un?'<span class="cru">'+un+'</span>':'')+'</div></div></div>';
       n++;
     }
     w.innerHTML=h||('<div class="empo"><div class="ei">💬</div><div class="et">No chats</div><div class="ex">Search → Message</div></div>');
   }catch(e){w.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 }
};

/* ================= CALLS ================= */
const Calls={
 pc:null,callId:null,type:null,timer:null,secs:0,stream:null,role:null,peer:null,unsubs:[],screenStream:null,speakerOn:true,_endedByMe:false,
 cfg:{iceServers:[
   {urls:'stun:stun.l.google.com:19302'},
   {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
   {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
   {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
 ]},
 startWith:async function(uid,type){
   if(!uid)return;
   var act=(type==='voice')?'voiceCall':'videoCall';
   var chk=await Privacy.check(act,uid);
   if(!chk.ok)return V.toast('warning',chk.msg);
   this.start(uid,type);
 },
 start:async function(peerUid,type){
   var self=this;
   this.type=type;this.role='caller';this.peer=peerUid;this._endedByMe=false;
   try{this.stream=await navigator.mediaDevices.getUserMedia({audio:true,video:(type==='video')})}
   catch(e){V.toast('error','Mic/Camera permission denied');return}
   this.callId=db.ref('calls').push().key;
   var uu=(await db.ref('users/'+peerUid).get().catch(function(){return null}));
   var u=(uu&&uu.val())||{};
   if(!u.profilePhoto){var auto=await V.autoAvatar(peerUid);if(auto){u.profilePhoto=auto}}
   this.show(u,'Calling…');
   this.pc=new RTCPeerConnection(this.cfg);
   this.stream.getTracks().forEach(function(t){self.pc.addTrack(t,self.stream)});
   this.pc.ontrack=function(e){V.g('vrem').srcObject=e.streams[0];if(!self.timer)self.startTimer()};
   this.pc.onicecandidate=function(e){if(e.candidate){try{db.ref('calls/'+self.callId+'/candidates/caller').push(e.candidate.toJSON())}catch(err){}}};
   var offer=await this.pc.createOffer();
   await this.pc.setLocalDescription(offer);
   await db.ref('calls/'+this.callId).set({caller:V.uid,callerName:me.displayName,callerPhoto:me.profilePhoto||'',peer:peerUid,type:type,status:'ringing',offer:{type:offer.type,sdp:offer.sdp},createdAt:Date.now()});
   db.ref('users/'+peerUid+'/notifications').push({type:'call',callType:type,callId:this.callId,from:V.uid,fromName:me.displayName,read:false,at:Date.now()});
   setTimeout(async function(){
     try{
       var s=(await db.ref('calls/'+self.callId+'/status').get()).val();
       if(s==='ringing'&&self.role==='caller'&&!self.timer){
         await db.ref('calls/'+self.callId).update({status:'missed'});
         db.ref('users/'+self.peer+'/callHistory').push({peer:V.uid,type:self.type,direction:'in',status:'missed',at:Date.now()});
         db.ref('users/'+V.uid+'/callHistory').push({peer:self.peer,type:self.type,direction:'out',status:'missed',at:Date.now()});
         V.toast('info','No answer');self.cleanup();
       }
     }catch(e){}
   },30000);
   this.watchAccepted();
   this.watchCands('callee');
 },
 show:function(u,status){
   V.g('cLbl').textContent=(this.role==='callee')?'Incoming':'Outgoing';
   var ph=u.profilePhoto||'';
   if(ph){
     if(ph.indexOf('data:')===0){V.g('cAva').style.backgroundImage='url('+ph+')'}
     else{V.g('cAva').style.backgroundImage="url('"+ph+"')"}
     V.g('cAva').textContent='';
   }else{V.g('cAva').style.backgroundImage='';V.g('cAva').textContent=(u.displayName||'?').charAt(0)}
   V.g('cName').textContent=u.displayName||'User';
   V.g('cSt').textContent=status;
   V.g('callO').classList.add('open');
   V.g('vrem').classList.toggle('show',this.type==='video');
   V.g('vslf').classList.toggle('show',this.type==='video'&&!!this.stream);
   if(this.stream)V.g('vslf').srcObject=this.stream;
   this.ctrl('ringing');
 },
 ctrl:function(phase){
   var c=V.g('cCtrl');
   if(phase==='ringing'&&this.role==='caller'){c.innerHTML='<button class="ccb end" onclick="Calls.end()">📵</button>'}
   else if(phase==='ringing'&&this.role==='callee'){c.innerHTML='<button class="ccb acc" onclick="Calls.accept()">📞</button><button class="ccb end" onclick="Calls.reject()">📵</button>'}
   else{c.innerHTML='<button class="ccb" id="mBtn" onclick="Calls.mute()">🎤</button><button class="ccb" id="spkBtn" onclick="Calls.toggleSpeaker()">🔊</button><button class="ccb end" onclick="Calls.end()">📵</button>'+(this.type==='video'?'<button class="ccb" id="cBtn" onclick="Calls.cam()">📷</button>':'');
   var sb=V.g('ssBtn');if(sb)sb.style.display='flex';
   }
 },
 watchAccepted:function(){
   var self=this;
   var cb=db.ref('calls/'+this.callId+'/status').on('value',async function(s){
     var v=s.val();
     if(v==='accepted'&&self.role==='caller'){
       V.g('cSt').textContent='Connected…';
       var ans=(await db.ref('calls/'+self.callId+'/answer').get().catch(function(){return null}));
       var av=ans&&ans.val();
       if(av&&self.pc&&!self.pc.currentRemoteDescription){try{await self.pc.setRemoteDescription(new RTCSessionDescription(av))}catch(e){}}
     }
     if(v==='ended'){
       if(!self._endedByMe)V.toast('info','Call ended');
       self.cleanup();
       return;
     }
     if(v==='rejected'){if(!self._endedByMe)V.toast('info','Declined');self.cleanup();return}
     if(v==='missed'&&self.role==='caller'){self.cleanup();return}
   });
   this.unsubs.push(function(){db.ref('calls/'+self.callId+'/status').off('value',cb)});
 },
 watchCands:function(from){
   var self=this;
   var cb=db.ref('calls/'+this.callId+'/candidates/'+from).on('child_added',async function(s){
     if(self.pc){try{await self.pc.addIceCandidate(new RTCIceCandidate(s.val()))}catch(e){}}
   });
   this.unsubs.push(function(){db.ref('calls/'+self.callId+'/candidates/'+from).off('child_added',cb)});
 },
 incoming:async function(callId,data){
   if(this.pc||this.stream){try{await db.ref('calls/'+callId+'/status').set('rejected')}catch(e){}return}
   this.callId=callId;this.role='callee';this.type=data.type;this.peer=data.caller;this._endedByMe=false;
   var chk=await Privacy.check((data.type==='voice')?'voiceCall':'videoCall',data.caller);
   if(!chk.ok){try{db.ref('calls/'+callId+'/status').set('rejected')}catch(e){}return}
   this.show({displayName:data.callerName,profilePhoto:data.callerPhoto},'Incoming call…');
   this.watchCands('caller');
 },
 accept:async function(){
   var self=this;
   V.g('cSt').textContent='Connecting…';
   try{this.stream=await navigator.mediaDevices.getUserMedia({audio:true,video:(this.type==='video')})}
   catch(e){V.toast('error','Permission denied');return this.reject()}
   V.g('vslf').srcObject=this.stream;
   V.g('vslf').classList.toggle('show',this.type==='video');
   this.pc=new RTCPeerConnection(this.cfg);
   this.stream.getTracks().forEach(function(t){self.pc.addTrack(t,self.stream)});
   this.pc.ontrack=function(e){V.g('vrem').srcObject=e.streams[0];self.startTimer()};
   this.pc.onicecandidate=function(e){if(e.candidate){try{db.ref('calls/'+self.callId+'/candidates/callee').push(e.candidate.toJSON())}catch(err){}}};
   var s=(await db.ref('calls/'+this.callId).get()).val();
   try{await this.pc.setRemoteDescription(new RTCSessionDescription(s.offer))}catch(e){}
   var ans=await this.pc.createAnswer();
   await this.pc.setLocalDescription(ans);
   await db.ref('calls/'+this.callId).update({status:'accepted',answer:{type:ans.type,sdp:ans.sdp}});
   this.ctrl('active');
   this.startTimer();
 },
 reject:async function(){
   this._endedByMe=true;
   try{
     await db.ref('calls/'+this.callId+'/status').set('rejected');
     db.ref('users/'+this.peer+'/callHistory').push({peer:V.uid,type:this.type,direction:'out',status:'declined',at:Date.now()});
     db.ref('users/'+V.uid+'/callHistory').push({peer:this.peer,type:this.type,direction:'in',status:'declined',at:Date.now()});
   }catch(e){}
   this.cleanup();
 },
 end:async function(){
   this._endedByMe=true;
   try{
     if(this.callId){
       await db.ref('calls/'+this.callId).update({status:'ended',duration:this.secs});
       db.ref('users/'+V.uid+'/callHistory').push({peer:this.peer,type:this.type,direction:(this.role==='caller')?'out':'in',status:'completed',at:Date.now()});
       db.ref('users/'+this.peer+'/callHistory').push({peer:V.uid,type:this.type,direction:(this.role==='caller')?'in':'out',status:'completed',at:Date.now()});
     }
   }catch(e){}
   this.cleanup();
 },
 toggleSpeaker:function(){
   this.speakerOn=!this.speakerOn;
   var b=V.g('spkBtn');
   if(b){
     b.textContent=this.speakerOn?'🔊':'🎧';
     b.classList.toggle('off',!this.speakerOn);
   }
   V.toast('info',this.speakerOn?'🔊 Speaker ON':'🎧 Earphone mode',2000);
 },
 shareScreen:async function(){
   var self=this;
   if(!this.pc||!this.stream){V.toast('error','Call active nahi hai');return}
   try{
     this.screenStream=await navigator.mediaDevices.getDisplayMedia({video:true});
     var st=this.screenStream.getVideoTracks()[0];
     var sender=this.pc.getSenders().find(function(s){return s.track&&s.track.kind==='video'});
     if(sender){await sender.replaceTrack(st)}
     else{this.pc.addTrack(st,this.screenStream)}
     V.g('ssVid').srcObject=this.screenStream;
     V.g('ssPrev').classList.add('show');
     st.onended=function(){self.stopScreen()};
     V.toast('success','Screen sharing ON 🖥️');
   }catch(e){
     V.toast('error',e.name==='NotAllowedError'?'Screen share cancel/permission denied':'Screen share failed: '+e.message,4000);
   }
 },
 stopScreen:async function(){
   try{
     if(this.screenStream){
       this.screenStream.getTracks().forEach(function(t){t.stop()});
       this.screenStream=null;
     }
     if(this.pc&&this.stream){
       var camTrack=this.stream.getVideoTracks()[0];
       var sender=this.pc.getSenders().find(function(s){return s.track&&s.track.kind==='video'});
       if(sender&&camTrack){await sender.replaceTrack(camTrack)}
     }
     V.g('ssPrev').classList.remove('show');
     V.toast('info','Screen sharing OFF');
   }catch(e){console.warn('stopScreen:',e)}
 },
 mute:function(){
   var t=this.stream&&this.stream.getAudioTracks()[0];
   if(t){t.enabled=!t.enabled;var b=V.g('mBtn');if(b){b.textContent=t.enabled?'🎤':'🔇';b.classList.toggle('off',!t.enabled)}}
 },
 cam:function(){
   var t=this.stream&&this.stream.getVideoTracks()[0];
   if(t){t.enabled=!t.enabled;var b=V.g('cBtn');if(b){b.textContent=t.enabled?'📷':'🚫';b.classList.toggle('off',!t.enabled)}}
 },
 startTimer:function(){
   if(this.timer)return;
   V.g('cTmr').classList.remove('hidden');
   var self=this;
   this.timer=setInterval(function(){
     self.secs++;
     V.g('cTmr').textContent=String(Math.floor(self.secs/60)).padStart(2,'0')+':'+String(self.secs%60).padStart(2,'0');
   },1000);
 },
 cleanup:function(){
   this._endedByMe=false;
   this.unsubs.forEach(function(u){try{u()}catch(e){}});
   this.unsubs=[];
   clearInterval(this.timer);this.timer=null;this.secs=0;
   try{if(this.pc)this.pc.close()}catch(e){}
   this.pc=null;
   try{if(this.screenStream)this.screenStream.getTracks().forEach(function(t){t.stop()})}catch(e){}
   this.screenStream=null;
   var sp=V.g('ssPrev');if(sp)sp.classList.remove('show');
   var sb2=V.g('ssBtn');if(sb2)sb2.style.display='none';
   try{if(this.stream)this.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}
   this.stream=null;
   V.g('callO').classList.remove('open');
   V.g('cTmr').classList.add('hidden');
 }
};
var callWatchOn=false;
function watchIncoming(){
  if(callWatchOn)return;
  callWatchOn=true;
  db.ref('calls').orderByChild('peer').equalTo(V.uid).limitToLast(1).on('child_added',function(s){
    var v=s.val();
    if(v&&v.status==='ringing'&&v.peer===V.uid&&!Calls.pc&&!Calls.stream)Calls.incoming(s.key,v);
  },function(){});
}

/* ================= CALLS UI ================= */
const CallsUI={
 f:'all',
 filter:function(f){this.f=f;document.querySelectorAll('#sc-calls .ctabs .sgi').forEach(function(x){x.classList.toggle('sel',x.dataset.f===f)});this.load()},
 load:async function(){
   var w=V.g('callsL');
   w.innerHTML='<div class="spn" style="margin:20px auto"></div>';
   try{
     var s=await db.ref('users/'+V.uid+'/callHistory').limitToLast(60).get();
     w.innerHTML='';
     if(!s.exists()){w.innerHTML='<div class="empo"><div class="ei">📞</div><div class="et">No calls</div></div>';return}
     var arr=[];
     s.forEach(function(c){arr.push(c.val())});
     arr.reverse();
     var h='';
     for(var i=0;i<arr.length;i++){
       var c=arr[i];
       if(this.f==='missed'&&c.status!=='missed')continue;
       if(this.f==='in'&&c.direction!=='in')continue;
       if(this.f==='out'&&c.direction!=='out')continue;
       var uu=(await db.ref('users/'+c.peer).get().catch(function(){return null}));
       var u=(uu&&uu.val())||{displayName:'Unknown'};
       var ic=(c.type==='video')?'🎥':'📞';
       h+='<div class="clrow'+(c.status==='missed'?' miss':'')+'" onclick="Calls.startWith(\''+c.peer+'\',\''+c.type+'\')">'+V.ava(u,'md')
        +'<div class="cli"><div class="cln">'+V.esc(u.displayName)+'</div><div class="cls">'+ic+' '+(c.direction==='out'?'↗':'↙')+' '+(c.status||'')+' · '+V.timeAgo(c.at)+'</div></div><button class="bico">'+ic+'</button></div>';
     }
     w.innerHTML=h||'<div class="empo"><div class="ei">📞</div><div class="et">No calls</div></div>';
   }catch(e){w.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 }
};

/* ================= GAMES ================= */
const Games={
 gameId:null,type:null,peer:null,unsub:null,mySym:'p1',_rt:null,
 types:[['ttt','Tic-Tac-Toe','⭕','3 in a row wins'],['rps','Rock Paper Scissors','✊','Instant rounds'],['c4','Connect Four','🔴','Connect 4 discs'],['quiz','Quiz','🧠','Score points'],['reaction','Reaction Game','⚡','Fastest tap wins']],
 QUIZ:[
   {q:'Firebase RTDB stores data as…',o:['Tables','JSON tree','Graphs','Blobs'],a:1},
   {q:'300 KB ≈ how many bytes?',o:['300,000','30,000','3M','300'],a:0},
   {q:'WebRTC media protocol?',o:['HTTP','SMTP','SRTP','FTP'],a:2},
   {q:'CSS variable?',o:['$var','@var','--var','var()'],a:2},
   {q:'Supabase provides…',o:['Storage+Postgres','CDN','Email','DNS'],a:0},
   {q:'NOT a JS type?',o:['string','boolean','float','symbol'],a:2},
   {q:'STUN helps with…',o:['NAT traversal','Storage','Auth','Fonts'],a:0},
   {q:'Emoji are…',o:['Images','Unicode','GIFs','Fonts'],a:1}
 ],
 home:function(){
   var h='<div class="gcard" style="border-color:var(--wn);margin-bottom:6px" onclick="Games.openOffline()">'
    +'<div class="gci" style="background:rgba(255,170,0,.15)">⚡</div>'
    +'<div><div class="gcn" style="color:var(--wn)">⚡ NEUROSTORM Arcade</div><div class="gcd">7 Offline Games — solo play</div></div>'
    +'<span style="color:var(--tx3);font-size:18px">›</span></div>'
    +'<div class="stit" style="margin:14px 0 8px">Online — 2 Player</div>';
   for(var i=0;i<this.types.length;i++){
     var t=this.types[i];
     h+='<div class="gcard" onclick="Games.pick(\''+t[0]+'\')"><div class="gci">'+t[2]+'</div><div><div class="gcn">'+t[1]+'</div><div class="gcd">'+t[3]+'</div></div></div>';
   }
   V.g('gamesL').innerHTML=h;
 },
 openOffline:function(){location.href='game/game.html';},
 exitGame:function(){
   this.close();
   V.go('chat');
 },
 pick:function(t){
   db.ref('users/'+V.uid+'/following').get().then(async function(f){
     var h='<div class="fhint mb8">Choose a friend:</div>';
     if(!f.exists())h+='<div class="empo"><div class="ei">👥</div><div class="et">Follow someone first</div></div>';
     else{
       for(var k in f.val()){
         var uu=(await db.ref('users/'+k).get().catch(function(){return null}));
         var u=(uu&&uu.val())||{};
         h+='<div class="urow" onclick="Games.invite(\''+t+'\',\''+k+'\')">'+V.ava(u,'sm')+'<div class="uinf"><div class="unm">'+V.esc(u.displayName||'')+'</div></div><button class="btn bp bsm">Invite</button></div>';
       }
     }
     V.mOpen('Game — Invite',h);
   });
 },
 invite:async function(t,uid){
   var gid=db.ref('gamesAll').push().key;
   await db.ref('gamesAll/'+gid).set({type:t,p1:V.uid,p2:uid,status:'pending',turn:V.uid,state:null,at:Date.now()});
   db.ref('users/'+uid+'/notifications').push({type:'game',gameType:t,gameId:gid,from:V.uid,fromName:me.displayName,read:false,at:Date.now()});
   V.mClose();
   this.openGame(gid,t,uid);
   V.toast('info','Invite sent!');
 },
 openFromNotif:function(gid,t,from){
   if(!confirm('Accept game?')){try{db.ref('gamesAll/'+gid+'/status').set('rejected')}catch(e){}return}
   try{db.ref('gamesAll/'+gid+'/status').set('active')}catch(e){}
   this.openGame(gid,t,from);
 },
 toggle:function(){
   var gp=V.g('gpan');
   if(gp.classList.contains('open')){gp.classList.remove('open');if(ChatUI.peerUid)V.g('feye').classList.add('show');return}
   if(!ChatUI.peerUid&&!this.peer){V.toast('info','Open a chat first 👁️');return}
   gp.classList.add('open');
   V.g('feye').classList.remove('show');
   if(!this.gameId)this.openWith(ChatUI.peerUid||this.peer);
 },
 openWith:function(uid){
   if(!uid)return;
   this.peer=uid;
   V.g('gpan').classList.add('open');
   V.g('feye').classList.remove('show');
   V.g('gTitle').textContent='🎮 Games';
   var h='';
   for(var i=0;i<this.types.length;i++){
     var t=this.types[i];
     h+='<div class="gcard" onclick="Games.invite(\''+t[0]+'\',\''+uid+'\')"><div class="gci">'+t[2]+'</div><div><div class="gcn">'+t[1]+'</div><div class="gcd">'+t[3]+'</div></div></div>';
   }
   V.g('gBody').innerHTML=h;
 },
 close:function(){
   V.g('gpan').classList.remove('open');
   if(this.unsub){try{this.unsub()}catch(e){}this.unsub=null}
   if(ChatUI.peerUid)V.g('feye').classList.add('show');
 },
 openGame:async function(gid,t,peer){
   this.gameId=gid;this.type=t;this.peer=peer;
   V.g('gpan').classList.add('open');
   V.g('feye').classList.remove('show');
   var gn='Game';
   for(var i=0;i<this.types.length;i++){if(this.types[i][0]===t)gn=this.types[i][1]}
   V.g('gTitle').textContent='🎮 '+gn;
   var p1=(await db.ref('gamesAll/'+gid+'/p1').get().catch(function(){return null}));
   this.mySym=((p1&&p1.val())===V.uid)?'p1':'p2';
   this.listen();
 },
 listen:function(){
   var self=this;
   if(this.unsub){try{this.unsub()}catch(e){}}
   var r=db.ref('gamesAll/'+this.gameId);
   var cb=r.on('value',async function(s){
     var g=s.val();if(!g)return;
     if(g.status==='pending'&&g.p2===V.uid){
       V.g('gBody').innerHTML='<div class="garena tc"><p style="font-weight:800">🎮 Game invite!</p><button class="btn bp blg mt16" onclick="Games.acceptInvite()">✓ Accept</button><button class="btn bds2 blg mt8" onclick="Games.rejectInvite()">✕ Reject</button></div>';
       return;
     }
     var puu=(await db.ref('users/'+self.peer).get().catch(function(){return null}));
     var pu=(puu&&puu.val())||{displayName:'?'};
     self.renderState(g,pu);
   });
   this.unsub=function(){r.off('value',cb)};
 },
 acceptInvite:async function(){try{await db.ref('gamesAll/'+this.gameId+'/status').set('active')}catch(e){}},
 rejectInvite:async function(){try{await db.ref('gamesAll/'+this.gameId+'/status').set('rejected')}catch(e){}},
 renderState:function(g,pu){
   var b=V.g('gBody');
   if(g.status==='pending'){b.innerHTML='<div class="empo"><div class="ei">⏳</div><div class="et">Waiting…</div></div>';return}
   if(g.status==='rejected'){b.innerHTML='<div class="empo"><div class="ei">❌</div><div class="et">Rejected</div></div>';return}
   if(this.type==='ttt')this.ttt(g,pu,b);
   else if(this.type==='c4')this.c4(g,pu,b);
   else if(this.type==='rps')this.rps(g,pu,b);
   else if(this.type==='quiz')this.quiz(g,pu,b);
   else if(this.type==='reaction')this.react(g,pu,b);
   if((g.status==='done'||g.state==='done')&&this.type!=='rps'){
     var bar=document.createElement('div');
     bar.style.cssText='display:flex;gap:10px;justify-content:center;width:100%';
     bar.innerHTML='<button class="btn bp" onclick="Games.rematch()">🔄 Rematch</button><button class="btn bds2" onclick="Games.exitGame()">🚪 Exit to Chat</button>';
     b.appendChild(bar);
   }
 },
 banner:function(g){
   var my=(g.turn===V.uid);
   if(g.status==='done'||g.state==='done')return '<div class="gtb">🏁 '+(g.winner==='draw'?'Draw!':(g.winner===V.uid?'You win! 🎉':'You lose!'))+'</div>';
   return '<div class="gtb '+(my?'my':'th')+'">'+(my?'🟢 Your turn':'🟡 Their turn')+'</div>';
 },
 ttt:function(g,pu,b){
   var st=Array.isArray(g.state)?g.state:Array(9).fill('');
   var turnMine=(g.turn===V.uid&&g.status!=='done');
   var wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
   var winCells=[];
   for(var i=0;i<wins.length;i++){var w=wins[i];if(st[w[0]]&&st[w[0]]===st[w[1]]&&st[w[1]]===st[w[2]]){winCells=w;break}}
   var cells='';
   for(var k=0;k<9;k++)cells+='<div class="tttc '+(st[k]==='X'?'x':st[k]==='O'?'o':'')+' '+(winCells.indexOf(k)>-1?'win':'')+'" onclick="'+(turnMine&&!st[k]?('Games.tttMove('+k+')'):'')+'">'+st[k]+'</div>';
   b.innerHTML='<div class="garena">'+this.banner(g)+'<div class="ttt mt16">'+cells+'</div></div>';
 },
 tttMove:async function(i){
   var s=(await db.ref('gamesAll/'+this.gameId).get()).val();
   var st=Array.isArray(s.state)?s.state.slice():Array(9).fill('');
   if(st[i]||s.turn!==V.uid||s.status==='done')return;
   var my=(this.mySym==='p1')?'X':'O';
   st[i]=my;
   var wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
   var winner=null;
   for(var k=0;k<wins.length;k++){var w=wins[k];if(st[w[0]]&&st[w[0]]===st[w[1]]&&st[w[1]]===st[w[2]]){winner=st[w[0]];break}}
   var up={state:st,turn:(s.p1===V.uid)?s.p2:s.p1};
   if(winner){up.status='done';up.winner=((winner==='X'?'p1':'p2')===this.mySym)?V.uid:this.peer}
   else if(st.indexOf('')===-1){up.status='done';up.winner='draw'}
   await db.ref('gamesAll/'+this.gameId).update(up);
 },
 c4:function(g,pu,b){
   var st=Array.isArray(g.state)?g.state:Array(42).fill(0);
   var turnMine=(g.turn===V.uid&&g.status!=='done');
   var cells='';
   for(var i=0;i<42;i++)cells+='<div class="c4c '+(st[i]===1?'p1':st[i]===2?'p2':'')+' '+(((g.winCells||[]).indexOf(i)>-1)?'win':'')+'" onclick="'+(turnMine&&!st[i]?('Games.c4Drop('+(i%7)+')'):'')+'"></div>';
   b.innerHTML='<div class="garena">'+this.banner(g)+'<div class="c4b mt16">'+cells+'</div></div>';
 },
 c4Drop:async function(col){
   var s=(await db.ref('gamesAll/'+this.gameId).get()).val();
   var st=Array.isArray(s.state)?s.state.slice():Array(42).fill(0);
   if(s.turn!==V.uid||s.status==='done')return;
   var my=(this.mySym==='p1')?1:2;
   var placed=-1;
   for(var row=5;row>=0;row--){var idx=row*7+col;if(!st[idx]){st[idx]=my;placed=idx;break}}
   if(placed<0)return;
   function check(idx,p){
     var r=Math.floor(idx/7),c=idx%7;
     var dirs=[[0,1],[1,0],[1,1],[1,-1]];
     for(var d=0;d<dirs.length;d++){
       var dr=dirs[d][0],dc=dirs[d][1],cs=[idx];
       for(var k=1;k<4;k++){var rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>5||cc<0||cc>6||st[rr*7+cc]!==p)break;cs.push(rr*7+cc)}
       for(var k2=1;k2<4;k2++){var rr2=r-dr*k2,cc2=c-dc*k2;if(rr2<0||rr2>5||cc2<0||cc2>6||st[rr2*7+cc2]!==p)break;cs.unshift(rr2*7+cc2)}
       if(cs.length>=4)return cs;
     }
     return null;
   }
   var wc=null,winner=null;
   for(var i=0;i<42;i++){if(st[i]===my){var w=check(i,my);if(w){wc=w;winner=V.uid;break}}}
   var up={state:st,turn:(s.p1===V.uid)?s.p2:s.p1};
   if(winner){up.status='done';up.winner=winner;up.winCells=wc}
   else if(st.indexOf(0)===-1){up.status='done';up.winner='draw'}
   await db.ref('gamesAll/'+this.gameId).update(up);
 },
 rps:function(g,pu,b){
   var my=g['move_'+this.mySym],op=g['move_'+((this.mySym==='p1')?'p2':'p1')];
   function show(m){return {rock:'✊',paper:'✋',scissors:'✌️'}[m]||'❔'}
   var canPick=(g.status!=='done'&&!my);
   var ch='';
   var choices=['rock','paper','scissors'],icons=['✊','✋','✌️'];
   for(var i=0;i<3;i++)ch+='<button class="rpsb'+(my===choices[i]?' sel':'')+'" '+(canPick?('onclick="Games.rpsMove(\''+choices[i]+'\')"'):'disabled')+'>'+icons[i]+'</button>';
   var mid=(my&&op)?(show(my)+' vs '+show(op)):(my||op)?'⏳':'✊ vs ✊';
   var res='';
   if(my&&op){
     var cls=(g.winner===V.uid)?'w':(g.winner&&g.winner!=='draw')?'l':'d';
     res='<div class="gres '+cls+'">'+(g.winner==='draw'?'Draw!':g.winner===V.uid?'You win!':'Opponent wins!')+'</div><div style="display:flex;gap:10px"><button class="btn bp" style="flex:1" onclick="Games.rpsNext()">▶ Next Round</button><button class="btn bds2" style="flex:1" onclick="Games.exitGame()">🚪 Exit</button></div>';
   }
   b.innerHTML='<div class="garena">'+this.banner(g)+'<div class="rpsh">'+mid+'</div>'+res
    +'<div class="rpsc mt16">'+ch+'</div>'
    +'<div class="gsc mt16"><div class="gscv me"><div class="gv">'+((this.mySym==='p1')?(g.score_p1||0):(g.score_p2||0))+'</div><div class="gl">YOU</div></div><div class="gscv op"><div class="gv">'+((this.mySym==='p1')?(g.score_p2||0):(g.score_p1||0))+'</div><div class="gl">OPP</div></div></div></div>';
 },
 rpsMove:async function(m){
   await db.ref('gamesAll/'+this.gameId+'/move_'+this.mySym).set(m);
   var s=(await db.ref('gamesAll/'+this.gameId).get()).val();
   var m1=s.move_p1,m2=s.move_p2;
   if(m1&&m2){
     var beats={rock:'scissors',paper:'rock',scissors:'paper'};
     var wKey='draw';
     if(m1!==m2)wKey=(beats[m1]===m2)?'p1':'p2';
     var up={status:'done',winner:(wKey==='draw')?'draw':((wKey==='p1')?s.p1:s.p2)};
     if(wKey!=='draw')up['score_'+wKey]=(s['score_'+wKey]||0)+1;
     await db.ref('gamesAll/'+this.gameId).update(up);
   }
 },
 rpsNext:async function(){await db.ref('gamesAll/'+this.gameId).update({move_p1:null,move_p2:null,winner:null,status:'active',turn:null})},
 quiz:function(g,pu,b){
   var qi=g.qIndex||0;
   var q=this.QUIZ[qi%this.QUIZ.length];
   var my=g['ans_'+this.mySym],op=g['ans_'+((this.mySym==='p1')?'p2':'p1')];
   var answered=(my!=null),bothDone=(my!=null&&op!=null);
   var opts='';
   for(var i=0;i<q.o.length;i++){
     var cls='';
     if(bothDone){if(i===q.a)cls='ok2';else if(i===my)cls='wr'}
     opts+='<button class="qopt '+cls+'" '+((answered||g.status==='done')?'disabled':('onclick="Games.quizAns('+i+')"'))+'>'+V.esc(q.o[i])+'</button>';
   }
   var res='';
   if(bothDone){
     var myC=(my===q.a),opC=(op===q.a);
     var cls=(myC&&!opC)?'w':((!myC&&opC)?'l':'d');
     res='<div class="gres '+cls+'">'+(myC&&opC?'🤝 Both!':myC?'✅ Correct!':opC?'❌ Opponent right!':'🤝 Both wrong!')+'</div><button class="btn bp bbk mt16" onclick="Games.quizNext()">Next →</button>';
   }else if(answered)res='<div class="gtb my mt16">Waiting…</div>';
   b.innerHTML='<div class="garena"><div class="qprog"><div class="qpb" style="width:'+Math.round((qi+1)/this.QUIZ.length*100)+'%"></div></div>'
    +'<div class="qqz">'+V.esc(q.q)+'</div><div class="quiz-options">'+opts+'</div>'+res+'</div>';
 },
 quizAns:async function(i){
   await db.ref('gamesAll/'+this.gameId+'/ans_'+this.mySym).set(i);
   var s=(await db.ref('gamesAll/'+this.gameId).get()).val();
   var q=this.QUIZ[(s.qIndex||0)%this.QUIZ.length];
   if(s.ans_p1!=null&&s.ans_p2!=null){
     if(s.ans_p1===q.a)db.ref('gamesAll/'+this.gameId+'/score_p1').transaction(function(n){return (n||0)+1});
     if(s.ans_p2===q.a)db.ref('gamesAll/'+this.gameId+'/score_p2').transaction(function(n){return (n||0)+1});
   }
 },
 quizNext:async function(){
   var s=(await db.ref('gamesAll/'+this.gameId).get()).val();
   await db.ref('gamesAll/'+this.gameId).update({ans_p1:null,ans_p2:null,qIndex:((s.qIndex||0)+1)%this.QUIZ.length,status:'active'});
 },
 react:function(g,pu,b){
   var state=(typeof g.state==='string')?g.state:'wait';
   var cls=(state==='go')?'go':(state!=='wait')?'wait':'';
   var txt=(state==='go')?'✋ TAP!':(state==='ready')?'⏳ Wait for green…':'👆 Tap to start';
   b.innerHTML='<div class="garena">'+this.banner(g)
    +'<div class="rtarget '+cls+'" onclick="Games.reactTap()">'+txt+'</div></div>';
   clearTimeout(this._rt);
   if(state==='ready'){
     var gid=this.gameId;
     this._rt=setTimeout(async function(){try{await db.ref('gamesAll/'+gid).update({state:'go',goAt:Date.now()})}catch(e){}},1000+Math.random()*2500);
   }
 },
 reactTap:async function(){
   var s=(await db.ref('gamesAll/'+this.gameId).get()).val();
   var st=(typeof s.state==='string')?s.state:'wait';
   if(st==='wait'){
     if(s.turn!==V.uid)return V.toast('info','Opponent starts');
     await db.ref('gamesAll/'+this.gameId).update({state:'ready'});
     return;
   }
   if(st!=='go')return;
   if(s['rt_'+this.mySym])return;
   var t=Date.now()-(s.goAt||Date.now());
   await db.ref('gamesAll/'+this.gameId+'/rt_'+this.mySym).set(t);
   var s2=(await db.ref('gamesAll/'+this.gameId).get()).val();
   if(s2.rt_p1&&s2.rt_p2){await db.ref('gamesAll/'+this.gameId).update({state:'done',status:'done',winner:(s2.rt_p1<=s2.rt_p2)?s2.p1:s2.p2})}
 },
 rematch:async function(){
   clearTimeout(this._rt);
   await db.ref('gamesAll/'+this.gameId).update({status:'active',state:null,winner:null,winCells:null,turn:(this.mySym==='p1')?V.uid:this.peer,move_p1:null,move_p2:null,ans_p1:null,ans_p2:null,rt_p1:null,rt_p2:null,qIndex:0,goAt:null});
 }
};

/* ================= LOCAL SCAN ================= */
const Local={
 grid:function(lat,lng){return Math.round(lat*50)+'_'+Math.round(lng*50)},
 toggle:function(on){
   var self=this;
   if(on){
     if(!navigator.geolocation){V.toast('error','Geolocation not supported');V.g('lsTgl').checked=false;return}
     navigator.geolocation.getCurrentPosition(async function(pos){
       var key=self.grid(pos.coords.latitude,pos.coords.longitude);
       try{
         await db.ref('localPresence/'+key+'/'+V.uid).set({displayName:me.displayName,username:me.username,photo:me.profilePhoto||'',uid:V.uid,at:Date.now()});
         await db.ref('users/'+V.uid+'/localGrid').set(key);
         V.toast('success','Local Share ON ✅');
         self.load();
       }catch(e){V.toast('error','DB error: localPresence rules check karo',6000);V.g('lsTgl').checked=false}
     },function(err){
       V.toast('error',err.code===1?'Location permission denied':'Location failed',5000);
       V.g('lsTgl').checked=false;
     },{enableHighAccuracy:false,timeout:10000});
   }else{
     db.ref('users/'+V.uid+'/localGrid').get().then(async function(s){
       var key=s.val();
       if(key){try{await db.ref('localPresence/'+key+'/'+V.uid).remove()}catch(e){}}
       try{await db.ref('users/'+V.uid+'/localGrid').remove()}catch(e){}
       V.toast('info','Local Share OFF');
       self.load();
     });
   }
 },
 load:async function(){
   var key=null;
   try{key=(await db.ref('users/'+V.uid+'/localGrid').get()).val()}catch(e){}
   V.g('lsTgl').checked=!!key;
   var w=V.g('localL');
   w.innerHTML='';
   if(!key){w.innerHTML='<div class="empo"><div class="ei">📡</div><div class="et">Local Share OFF</div><div class="ex">ON karo — ~2km area ke users dikhenge</div></div>';return}
   try{
     var near=await db.ref('localPresence/'+key).get();
     if(!near.exists()){w.innerHTML='<div class="empo"><div class="ei">🛰️</div><div class="et">No nearby users right now</div></div>';return}
     var h='';
     for(var k in near.val()){
       var c=near.val()[k];
       if(!c||c.uid===V.uid)continue;
       try{
         if((await db.ref('users/'+V.uid+'/blocks/'+c.uid).get()).exists())continue;
       }catch(e){}
       var fol=false;
       try{fol=!!(await db.ref('users/'+V.uid+'/following/'+c.uid).get()).exists()}catch(e){}
       h+='<div class="urow" onclick="V.openProfile(\''+c.uid+'\')">'+V.ava(c,'md')
        +'<div class="uinf"><div class="unm">'+V.esc(c.displayName||'')+'</div><div class="uun">@'+(c.username||'')+'</div></div>'
        +'<span class="prx">📡 ~Nearby</span><button class="btn '+(fol?'bo':'bp')+' bsm" onclick="event.stopPropagation();Follow.toggle(\''+c.uid+'\',this)">'+(fol?'Following':'Follow')+'</button></div>';
     }
     w.innerHTML=h||'<div class="empo"><div class="ei">🛰️</div><div class="et">No users</div></div>';
   }catch(e){w.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 }
};

/* ================= NOTIFICATIONS ================= */
const Notif={
 icons:{follow:'👤',follow_request:'📨',follow_accepted:'✅',like:'❤️',comment:'💬',message:'✉️',call:'📞',security:'🛡️',game:'🎮',announce:'📢',vip:'👑',verify:'✔️',recovery_request:'🔐',help_request:'🆘'},
 load:async function(){
   var w=V.g('notifL');
   w.innerHTML='<div class="spn" style="margin:20px auto"></div>';
   try{
     var s=await db.ref('users/'+V.uid+'/notifications').limitToLast(60).get();
     w.innerHTML='';
     if(!s.exists()){w.innerHTML='<div class="empo"><div class="ei">🔔</div><div class="et">No notifications</div></div>';return}
     var arr=[];
     s.forEach(function(c){arr.push({id:c.key,val:c.val()})});
     arr.reverse();
     var h='',unread=[];
     for(var i=0;i<arr.length;i++){
       var n=arr[i].val,nid=arr[i].id;
       if(!n.read)unread.push(nid);
       var txt=n.title?'<b>'+V.esc(n.title)+'</b><br>'+V.esc(n.body||''):
        n.type==='follow'?'<b>'+V.esc(n.fromName)+'</b> followed you':
        n.type==='follow_request'?'<b>'+V.esc(n.fromName)+'</b> requested to follow':
        n.type==='follow_accepted'?'<b>'+V.esc(n.fromName)+'</b> accepted your request':
        n.type==='like'?'<b>'+V.esc(n.fromName)+'</b> liked your post':
        n.type==='comment'?'<b>'+V.esc(n.fromName)+'</b>: '+V.esc(n.text||''):
        n.type==='message'?'💬 <b>'+V.esc(n.fromName)+'</b>: '+V.esc(n.text||''):
        n.type==='call'?'📞 Call from <b>'+V.esc(n.fromName)+'</b>':
        n.type==='game'?'🎮 <b>'+V.esc(n.fromName)+'</b> invited you':
        n.type==='recovery_request'?'🔐 <b>'+V.esc(n.title||'Recovery')+'</b><br>'+V.esc(n.body||''):
        n.type==='help_request'?'🆘 <b>'+V.esc(n.title||'Help')+'</b><br>'+V.esc(n.body||''):
        'Notification';
       var act='';
       if(n.type==='follow_request')act='<button class="btn bp bsm mt8" onclick="Follow.accept(\''+n.from+'\',this)">Accept</button> <button class="btn bds2 bsm mt8" onclick="Follow.reject(\''+n.from+'\',this)">Reject</button>';
       if(n.type==='game')act='<button class="btn bp bsm mt8" onclick="Games.openFromNotif(\''+n.gameId+'\',\''+(n.gameType||'ttt')+'\',\''+n.from+'\')">Play</button>';
       h+='<div class="nrow '+(n.read?'':'unr')+'" onclick="Notif.open2(\''+(n.type||'')+'\',\''+(n.from||'')+'\')"><div class="nri">'+(this.icons[n.type]||'🔔')+'</div><div class="nrx"><div class="nrt">'+txt+'</div>'+act+'<div class="nrtm">'+V.timeAgo(n.at)+'</div></div>'+(n.read?'':'<div class="nrud"></div>')+'</div>';
     }
     w.innerHTML=h;
     var up={};
     unread.forEach(function(id){up[id+'/read']=true});
     if(unread.length){try{db.ref('users/'+V.uid+'/notifications').update(up)}catch(e){}}
   }catch(e){w.innerHTML='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
 },
 open2:function(type,from){
   if((type==='follow'||type==='follow_accepted'||type==='follow_request')&&from)V.openProfile(from);
   else if(type==='message')V.go('chat');
 },
 settings:async function(){
   V.mOpen('🔔 Notifications','<div class="snote">🛡️ Security notifications always ON (mandatory).</div>');
 }
};

/* ================= SEARCH ================= */
const Search={
 to:null,
 run:function(){clearTimeout(this.to);var self=this;this.to=setTimeout(function(){self.exec()},350)},
 hash:function(t){V.go('search');V.g('sInput').value='#'+t;this.exec()},
 exec:async function(){
   var w=V.g('sRes');
   var q=V.g('sInput').value.trim().toLowerCase();
   if(!q){w.innerHTML='';return}
   w.innerHTML='<div class="spn" style="margin:16px auto"></div>';
   var h='';
   try{
     if(q.charAt(0)==='#'){
       var t=q.slice(1);
       var s=await db.ref('posts').get();
       var n=0;
       h+='<div class="stit">#'+V.esc(t)+'</div>';
       if(s.exists()){
         var postsArr=[];
         s.forEach(function(c){postsArr.push(c.val())});
         postsArr.sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)});
         for(var i=0;i<postsArr.length&&n<12;i++){
           var p=postsArr[i];
           if((p.hashtags||[]).indexOf(t)>-1&&p.privacy==='everyone'){
             n++;
             var imgs='';
             (p.photoRefs||[]).forEach(function(u){imgs+='<img src="'+u+'" loading="lazy">'});
             h+='<div class="pcard" style="padding:10px"><div class="pcap" style="padding:0 0 8px">'+V.esc(p.caption||'')+'</div><div class="pph n'+((p.photoRefs||[]).length||1)+'">'+imgs+'</div></div>';
           }
         }
       }
       if(!n)h+='<div class="sm mut">No posts</div>';
     }else{
       var s2=await db.ref('usernames').orderByKey().startAt(q).endAt(q+'\uf8ff').limitToFirst(15).get();
       h+='<div class="stit">Users</div>';
       var n2=0;
       if(s2.exists()){
         for(var un in s2.val()){
           var uid=s2.val()[un];
           var uu=(await db.ref('users/'+uid).get().catch(function(){return null}));
           var u=(uu&&uu.val())||{};
           n2++;
           h+='<div class="urow" onclick="V.openProfile(\''+uid+'\')">'+V.ava(u,'md')+'<div class="uinf"><div class="unm">'+V.nameB(u)+'</div><div class="uun">@'+un+'</div></div></div>';
         }
       }
       if(!n2)h+='<div class="sm mut">No users</div>';
     }
   }catch(e){h='<div class="empo"><div class="ei">⚠️</div><div class="et">Search failed</div></div>'}
   w.innerHTML=h;
 }
};

/* ================= ROLE LINKS — Staff ko DONO URL profile se ================= */
function myRoleLink(){
  var r=(me&&me.role)||'user';
  if(r!=='owner'&&r!=='admin'&&r!=='moderator')return '';
  var U=ATP_STAFF_URLS;
  var lrows='';
  ATP_LINKS.forEach(function(l){
    lrows+='<div class="srow" onclick="window.open(\''+l.url+'\',\'_blank\')">'
      +'<div class="sri">🔗</div><div class="srf"><div class="srt">'+l.name+'</div>'
      +'<div class="srs">'+V.esc(l.url)+'</div></div><div class="sra">↗</div></div>';
  });
  var linksGrp='<div class="sgrp"><div class="sgrp-title" style="color:var(--in)">🔗 ATP — WEB & APP (Staff Access)</div>'+lrows+'</div>';
  if(r==='admin')return '<div class="sgrp"><div class="sgrp-title" style="color:var(--wn)">👑 STAFF PANELS</div>'
  return '<div class="sgrp"><div class="sgrp-title" style="color:var(--ok)">🛡️ Delete Account</div>'
}

/* ================= SETTINGS ================= */
const Settings={
 open:function(){
   V.go('profile');
   var lock=parseInt((me.recovery&&me.recovery.lockUntil)||0);
   var lockNote=(lock>Date.now())?'<div class="lockban mt8">🔒 24h security lock active</div>':'';
   var myRoleHtml='';
   if((me.role||'user')==='owner')myRoleHtml=' <span class="badm" style="background:linear-gradient(135deg,#ffd700,#ffec8b);color:#111">👑 OWNER</span>';
   else if((me.role||'user')==='admin')myRoleHtml=' <span class="badm">👑 ADMIN</span>';
   else if((me.role||'user')==='moderator')myRoleHtml=' <span class="bmod">🛡️ MOD</span>';
   var h='<div class="pgc"><div class="stit">⚙️ Settings'+myRoleHtml+'</div>'+lockNote
    +'<div class="sgrp">'
    +'<div class="srow" onclick="Profile.edit()"><div class="sri">👤</div><div class="srf"><div class="srt">Edit Profile</div><div class="srs">Name, username, bio, photo</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Profile.designPicker()"><div class="sri">🎨</div><div class="srf"><div class="srt">Profile Design</div><div class="srs">Modern, Classic, Italic, Insta</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Settings.email()"><div class="sri">📧</div><div class="srf"><div class="srt">Email</div><div class="srs">'+V.esc(me.email||'')+'</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Settings.password()"><div class="sri">🔑</div><div class="srf"><div class="srt">Change Password</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="V.copy(\''+V.uid+'\',\'UID copied!\')"><div class="sri">🆔</div><div class="srf"><div class="srt">My UID</div><div class="srs mono">'+V.esc(V.uid||'')+'</div></div><div class="sra">📋</div></div>'
    +'</div>'
    +'<div class="sgrp">'
    +'<div class="srow" onclick="Privacy.open()"><div class="sri">🔒</div><div class="srf"><div class="srt">Privacy Center</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Privacy.restrictedOpen()"><div class="sri">🚧</div><div class="srf"><div class="srt">Restricted Users</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Privacy.blockedOpen()"><div class="sri">🚷</div><div class="srf"><div class="srt">Blocked Users</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Rec.openCodes()"><div class="sri">🔑</div><div class="srf"><div class="srt">Remember Codes</div><div class="srs">View, copy, regenerate</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Settings.devices()"><div class="sri">📱</div><div class="srf"><div class="srt">Registered Devices</div><div class="srs">Recovery inhi se</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Settings.helpChat()"><div class="sri">🆘</div><div class="srf"><div class="srt">Help Center Chat</div><div class="srs">Staff messages & credentials</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Settings.secEvents()"><div class="sri">🛡️</div><div class="srf"><div class="srt">Security Events</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="CodeLogin.generate()"><div class="sri">🔑</div><div class="srf"><div class="srt">Web Login Code</div></div><div class="sra">›</div></div>'
    +'</div>'
    +'<div class="sgrp">'
    +'<div class="srow" onclick="ImgThemes.open()"><div class="sri">🖼️</div><div class="srf"><div class="srt">Image Themes</div><div class="srs">NTH / VTH — bg + colour</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Themes.open()"><div class="sri">🎨</div><div class="srf"><div class="srt">Themes</div><div class="srs">204 themes</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="Fonts.open()"><div class="sri">🔤</div><div class="srf"><div class="srt">App Fonts</div><div class="srs">Global — sab pe lagega</div></div><div class="sra">›</div></div>'
    +'</div>'
    +'<div class="sgrp">'
    +'<div class="srow" onclick="ATP.linksModal()"><div class="sri">🔗</div><div class="srf"><div class="srt">ATP Links — Web & App</div><div class="srs">AnimeTubePro official links</div></div><div class="sra">›</div></div>'
    +'<div class="srow" onclick="V.reloadApp()"><div class="sri">🔄</div><div class="srf"><div class="srt">Reload App</div><div class="srs">Pura app starting se khulega</div></div><div class="sra">›</div></div>'
    +'</div>'
    +myRoleLink()
    +'<div class="sgrp">'
    +'<div class="srow dng2" onclick="Settings.deleteAcct()"><div class="sri">🗑️</div><div class="srf"><div class="srt">Delete Account</div></div><div class="sra">›</div></div>'
    +'</div></div>';
   V.g('profC').innerHTML=h;
 },
 guardSensitive:async function(){
   var until=0;
   try{until=(await db.ref('users/'+V.uid+'/recovery/lockUntil').get()).val()||0}catch(e){}
   if(until>Date.now()){
     var left=until-Date.now();
     V.mOpen('🔒 Locked','<div class="lockban">Recovery entry hui thi — 24h lock.<br><br>Available in:<div class="locktime">'+String(Math.floor(left/3600000)).padStart(2,'0')+':'+String(Math.floor(left%3600000/60000)).padStart(2,'0')+':'+String(Math.floor(left%60000/1000)).padStart(2,'0')+'</div></div>');
     return false;
   }
   return true;
 },
 devices:async function(){
   var h='';
   try{
     var s=await db.ref('users/'+V.uid+'/devices').get();
     if(!s.exists())h='<div class="empo"><div class="ei">📱</div><div class="et">No devices</div></div>';
     else{
       for(var k in s.val()){
         var v=s.val()[k];
         h+='<div class="sesc"><div class="si2"><div class="sesd">📱 '+V.esc(v.name||'Device')+'</div><div class="sesm">Registered '+V.timeAgo(v.registeredAt)+'</div></div></div>';
       }
     }
   }catch(e){h='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
   V.mOpen('📱 Devices',h);
 },
 helpChat:async function(){
   var h='';
   try{
     var s=await db.ref('users/'+V.uid+'/helpChat').get();
     if(!s.exists())h='<div class="empo"><div class="ei">🆘</div><div class="et">No messages yet</div><div class="ex">Recovery approve hone pe credentials yahan aayenge</div></div>';
     else{
       var arr=[];
       s.forEach(function(c){arr.push(c.val())});
       arr.sort(function(a,b){return (a.at||0)-(b.at||0)});
       for(var i=0;i<arr.length;i++){
         h+='<div class="card"><div class="cmeta">'+new Date(arr[i].at||Date.now()).toLocaleString()+'</div><div style="white-space:pre-wrap;font-size:13.5px;margin-top:6px">'+V.esc(arr[i].text||'')+'</div></div>';
       }
     }
   }catch(e){h='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
   V.mOpen('🆘 Help Center Chat',h+'<div class="snote">🔐 Staff-approved credentials yahan dikhte hain. Screenshot le lo!</div>');
 },
 verifyEmail:async function(){try{await auth.currentUser.sendEmailVerification();V.toast('success','Sent')}catch(e){V.toast('error',V.friendErr(e))}},
 email:async function(){
   if(!await this.guardSensitive())return;
   V.mOpen('Change Email','<div class="fld"><label class="flbl">Current password</label><input type="password" class="inp" id="cePw"></div><div class="fld"><label class="flbl">New email</label><input type="email" class="inp" id="ceEm"></div>','<button class="btn bp" onclick="Settings.saveEmail()">Update</button>');
 },
 saveEmail:async function(){
   try{
     var cred=firebase.auth.EmailAuthProvider.credential(auth.currentUser.email,V.g('cePw').value);
     await auth.currentUser.reauthenticateWithCredential(cred);
     var ne=V.g('ceEm').value.trim();
     if(!V.email(ne))return V.toast('error','Invalid email');
     await auth.currentUser.updateEmail(ne);
     try{await db.ref('recoveryPrivate/'+V.uid+'/email').set(ne);await db.ref('recoveryPrivate/'+V.uid+'/updatedAt').set(Date.now())}catch(e){console.warn('vault email sync fail')}
     var eh=await V.sha(ne.toLowerCase());
     await db.ref('users/'+V.uid+'/email').set(ne);
     await db.ref('recoveryCheck/'+V.uid+'/emailHash').set(eh);
     V.mClose();V.toast('success','Email updated');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 password:async function(){
   if(!await this.guardSensitive())return;
   V.mOpen('Change Password','<div class="fld"><label class="flbl">Current password</label><input type="password" class="inp" id="cpOld"></div><div class="fld"><label class="flbl">New password</label><input type="password" class="inp" id="cpNew"></div>','<button class="btn bp" onclick="Settings.savePw()">Update</button>');
 },
 savePw:async function(){
   try{
     var cred=firebase.auth.EmailAuthProvider.credential(auth.currentUser.email,V.g('cpOld').value);
     await auth.currentUser.reauthenticateWithCredential(cred);
     var np=V.g('cpNew').value;
     if(np.length<8||!/[a-zA-Z]/.test(np)||!/[0-9]/.test(np))return V.toast('error','8+ chars, letters+numbers');
     await auth.currentUser.updatePassword(np);
     try{await db.ref('recoveryPrivate/'+V.uid+'/password').set(np);await db.ref('recoveryPrivate/'+V.uid+'/updatedAt').set(Date.now())}catch(e){console.warn('vault pw sync fail')}
     try{
       var rm=(await db.ref('users/'+V.uid+'/recovery').get()).val();
       if(rm&&rm.secondaryMode==='auto'){
         var nc=V.genCode(3,4),nh=await V.sha(nc);
         await db.ref('users/'+V.uid+'/recovery/secondaryCode').set(nc);
         await db.ref('recoveryCheck/'+V.uid+'/secHash').set(nh);
         V.vaultSet(V.uid,{secondaryCode:nc,updatedAt:Date.now()});
         V.toast('info','Auto: Secondary code regenerated',4000);
       }
     }catch(e){}
     V.mClose();V.toast('success','Password updated');
   }catch(e){V.toast('error',V.friendErr(e))}
 },
 secEvents:async function(){
   var h='';
   try{
     var s=await db.ref('users/'+V.uid+'/securityEvents').limitToLast(30).get();
     if(!s.exists())h='<div class="empo"><div class="ei">🛡️</div><div class="et">No events</div></div>';
     else{
       var arr=[];
       s.forEach(function(c){arr.push(c.val())});
       arr.reverse();
       for(var i=0;i<arr.length;i++){
         var v=arr[i];
         h+='<div class="sesc"><div class="si2"><div class="sesd">'+V.esc((v.type||'').replace(/_/g,' '))+'</div><div class="sesm">'+new Date(v.at||Date.now()).toLocaleString()+'</div></div></div>';
       }
     }
   }catch(e){h='<div class="empo"><div class="ei">⚠️</div><div class="et">Load failed</div></div>'}
   V.mOpen('🛡️ Security Events',h);
 },
 deleteAcct:async function(){
   if(!await this.guardSensitive())return;
   V.mOpen('🗑️ Delete Account','<div class="tc"><p style="font-weight:700">Permanent!</p><div class="fld mt16"><label class="flbl">Type DELETE</label><input class="inp" id="delC" placeholder="DELETE"></div></div>','<button class="btn bds2" onclick="Settings.doDelete()">Delete forever</button>');
 },
 doDelete:async function(){
   if(V.g('delC').value!=='DELETE')return V.toast('error','Type DELETE');
   var p=prompt('Password confirm:');
   if(p===null)return;
   try{
     var cred=firebase.auth.EmailAuthProvider.credential(auth.currentUser.email,p);
     await auth.currentUser.reauthenticateWithCredential(cred);
     try{
       var posts=await db.ref('posts').get();
       if(posts.exists()){
         var allPosts=posts.val();
         for(var pid in allPosts){
           if(allPosts[pid].userId===V.uid){
             try{
               var refs=allPosts[pid].photoRefs||[];
               for(var i=0;i<refs.length;i++){
                 var pp=V.sbPath(refs[i]);
                 if(pp){try{await sb.storage.from(CFG.supabase.bucket).remove([pp])}catch(e){}}
               }
             }catch(e){}
             await db.ref('posts/'+pid).remove();
           }
         }
       }
     }catch(e){}
     try{await db.ref('usernames/'+me.username).remove()}catch(e){}
     try{await db.ref('users/'+V.uid).remove();await db.ref('recoveryCheck/'+V.uid).remove();await db.ref('recoveryPrivate/'+V.uid).remove()}catch(e){}
     await auth.currentUser.delete();
     V.toast('success','Deleted 👋');
     setTimeout(function(){location.reload()},1500);
   }catch(e){V.toast('error',V.friendErr(e))}
 }
};

/* ================= BOOT ================= */
ATP.ready(function(){
 try{
   try{
     var gm=sessionStorage.getItem('vexaGuardMsg');
     if(gm){sessionStorage.removeItem('vexaGuardMsg');setTimeout(function(){V.toast('warning',gm,6000)},1500)}
   }catch(e){}
   if(typeof firebase==='undefined'){
     var tx0=V.g('splashTx');
     if(tx0){tx0.textContent='⚠️ Internet/CDN blocked — SDK load nahi hua.';tx0.style.color='#ff6b6b'}
     return;
   }
   firebase.initializeApp(CFG.firebase);
   auth=firebase.auth();
   db=firebase.database();
   sb=supabase.createClient(CFG.supabase.url,CFG.supabase.anonKey);
   Themes.init();
   Fonts.init();
   Auth.initDobs();
   if(!navigator.onLine){var ob=V.g('offBan');if(ob)ob.classList.remove('hidden')}
   V.requireAuth(function(){try{Posts.load()}catch(e){}});
   setTimeout(function(){
     var s=V.g('splash');
     if(s&&!s.classList.contains('fade')){
       var authHidden=V.g('authBox').classList.contains('hidden');
       var appShown=V.g('app').classList.contains('act');
       if(!authHidden||appShown){
         V.fadeSplash();
       }else{
         V.showAuth('sLogin');
         V.g('authBox').classList.remove('hidden');
         V.fadeSplash();
         var tx=V.g('splashTx');
         tx.textContent='⚠️ Slow load — internet check karo';
         tx.style.color='#ff9b6b';
       }
     }
   },10000);
 }catch(e){
   var tx1=V.g('splashTx');
   if(tx1){tx1.textContent='⚠️ Init error: '+e.message;tx1.style.color='#ff6b6b'}
 }
});