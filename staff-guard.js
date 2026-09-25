/* 🔒 STAFF GUARD — Direct panel access block */
(function(){
  var REDIRECT='../index.html';
  var s=null;
  try{s=JSON.parse(localStorage.getItem('vexaStaffSession')||'null')}catch(e){}
  var role=(typeof PANEL_ROLE!=='undefined')?PANEL_ROLE:'';
  var ok=false;
  var VALID=12*60*60*1000;
  if(s&&s.role&&s.uid&&(Date.now()-s.ts)<VALID){
    if(role==='owner')         ok=(s.role==='owner');
    else if(role==='admin')    ok=(s.role==='owner'||s.role==='admin');
    else if(role==='moderator')ok=(s.role==='owner'||s.role==='admin'||s.role==='moderator');
    else ok=true;
  }
  if(!ok){
    try{
      sessionStorage.setItem('vexaGuardMsg','🔒 Direct access blocked! Pehle VEXA app me login karo ('+(role||'panel')+' panel).');
    }catch(e){}
    location.replace(REDIRECT);
  }
})();