'use strict';
(() => {
  const {WORDS, typeMult} = globalThis.KotoData;
  const judge=(a,b)=>a===b?0:((a==='G'&&b==='C')||(a==='C'&&b==='P')||(a==='P'&&b==='G'))?1:-1;
  const clone = id => ({...WORDS[id], skill:[...WORDS[id].skill]});
  const active = (s, side) => s[side].team[s[side].index];
  const other = side => side === 'A' ? 'B' : 'A';
  function create(a,b,rng=Math.random) {return {A:{team:a.map(clone),index:0,sp:0},B:{team:b.map(clone),index:0,sp:0},rng,round:1,ended:false,winner:null};}
  function judgeWinner(s) {for(const side of ['A','B'])if(!s[side].team.some(w=>w.hp>0)){s.ended=true;s.winner=other(side);return s.winner;}return null;}
  function switchTo(s,side,index) {if(index===s[side].index||!s[side].team[index]||s[side].team[index].hp<=0)throw Error('交代できないカードです');s[side].index=index;s[side].sp=0;}
  function charge(s) {for(const side of ['A','B'])s[side].sp=Math.min(6,s[side].sp+1);}
  function damage(s,a,d,mult=1) {return Math.max(1,Math.floor(100*(1+a.atk/100)/(1+d.def/120)*typeMult(a.type,d.type)*(s.rng()*.4+.8)*mult*(a.atk13>0?1.3:1)));}
  function family(name) {
    if(['本質','見える化','自分ごと化','解像度'].includes(name))return 'copy';
    const i=WORDS.find(w=>w.name===name)?.id;
    return i===3?'multi':[1,7].includes(i)?'heal':[4,5].includes(i)?'buff':[2,6].includes(i)?'guard':i===0?'strike':'debuff';
  }
  function skillPre(a,d,name) {
    let mult=1,multi=null;
    switch(name){
      case 'パラボラアンテナ':mult=2.2;break;
      case 'にんじんしりしり':mult=1.6;a.endure=true;break;
      case 'そぼろごはん':multi=[.75,.5,.25];break;
      case 'ニシローランドゴリラ':mult=1.5;a.atk13=3;break;
      case '毛むくじゃら':mult=1.4;a.eva60=3;break;
      case '九品仏':mult=1.6;a.shield=2;break;
      case 'けんちん汁':mult=1.2;break;
      case 'カムチャッカ半島':case 'ハシビロコウ':case 'バルサミコ酢':case 'バビロン捕囚':case 'ポリプロピレン':case 'クマンバチ':case '照り焼きチキン':d.lock=4;break;
      case 'タランチュラ':case 'トリニダード・トバゴ':case 'サラエボ事件':case 'さるびあ丸':d.stun=true;break;
      case 'ピロリ菌':case 'カラメル色素':case '鳥取砂丘':case 'プラシーボ効果':case 'ペペロンチーノ':case 'スルメイカ':case 'ねるねるねるね':d.selfHurt=3;break;
      case '渡来人':case '県庁所在地':d.doom=3;break;
    }
    return {mult,multi};
  }
  // Generators pause at each resolved event. Presentation may await animation or
  // a forced substitution, without rerolling damage or changing turn order.
  function* attack(s,side,spRequested=false,{tick=true}={}) {
    const foe=other(side),a=active(s,side),d=active(s,foe);
    if(tick){
      for(const key of ['eva60','atk13','lock'])if(a[key]>0)a[key]--;
      if(a.doom>0&&--a.doom===0){a.hp=0;yield {kind:'doom',side};yield {kind:'ko',side};return {ko:true};}
      if(a.stun){a.stun=false;yield {kind:'skip',side};return {ko:false};}
    }
    const sp=spRequested&&s[side].sp>=6;
    let name=a.name,mult=1,multi=null,copyFrom=null;
    if(sp){
      s[side].sp=0;
      if(a.rank==='X'){
        const pool=s[foe].team.filter(w=>w.rank!=='X'&&w.hp>0);
        if(pool.length){const w=pool[Math.floor(s.rng()*pool.length)];name=w.name;copyFrom=w.id;const p=skillPre(a,d,name);mult=p.mult*2;multi=p.multi?.map(n=>n*2)||null;}else mult=2;
      }else{const p=skillPre(a,d,name);mult=p.mult;multi=p.multi;}
      yield {kind:'skill',side,name,title:WORDS.find(w=>w.name===name)?.skill[0]||a.skill[0],family:family(a.name),effectFamily:family(name),copyFrom};
    }else if(s.rng()<(d.eva60>0?60:d.eva)/100){yield {kind:'miss',side:foe,attacker:side};return {ko:false};}
    const seq=multi||[mult];
    for(let hit=0;hit<seq.length;hit++){
      let amount=damage(s,a,d,seq[hit]),guard=false;
      if(d.shield>0){d.shield--;amount=Math.max(1,Math.floor(amount*.5));guard=true;}
      const before=d.hp;d.hp=Math.max(0,d.hp-amount);
      let endure=false;
      if(d.hp===0&&d.endure){d.endure=false;d.hp=1;endure=true;}
      yield {kind:'hit',side:foe,attacker:side,amount,before,after:d.hp,guard,endure,hit,total:seq.length,family:sp?family(name):'strike'};
      if(d.hp===0){yield {kind:'ko',side:foe};return {ko:true};}
    }
    if(a.selfHurt>0){
      a.selfHurt--;
      if(s.rng()<.33){const before=a.hp;a.hp=Math.max(0,a.hp-100);yield {kind:'selfHit',side,amount:100,before,after:a.hp};if(a.hp===0){yield {kind:'ko',side};return {ko:true};}}
    }
    if(sp){
      if(name==='パラボラアンテナ'){s[foe].sp=0;yield {kind:'drain',side:foe};}
      if(name==='ネスカフェアンバサダー'){for(const w of s[side].team)w.hp=Math.min(w.maxhp,w.hp+60);yield {kind:'heal',side,amount:60,all:true};}
      if(name==='けんちん汁'){a.hp=Math.min(a.maxhp,a.hp+150);yield {kind:'heal',side,amount:150};}
    }
    return {ko:false};
  }
  globalThis.KotoEngine={create,active,other,judgeWinner,switchTo,charge,damage,attack,family,judge,typeMult};
})();
