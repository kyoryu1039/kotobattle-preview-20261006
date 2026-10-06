'use strict';
// Presentation only. Cancellation owns every animation and delayed callback.
(() => {
  function create({view, options, current, sound, tone}) {
    const V=KotoView, P=KotoPresent, animations=new Set(), delays=new Map();
    const $=view.$, layer=$('fxLayer');
    const duration=n=>options.reduced?Math.min(n,180):n/options.speed;
    const alive=token=>current()===token;
    function delay(n,token) { if(!alive(token))return Promise.resolve(false);return new Promise(resolve=>{const id=setTimeout(()=>{delays.delete(id);resolve(alive(token));},n);delays.set(id,resolve);}); }
    function wait(n,token=current()) { return delay(duration(n),token); }
    function hold(n,token=current()) { return delay(n,token); }
    async function animate(el,frames,n=300,token=current()) {
      if(!el||!alive(token))return false;
      if(options.reduced)return true;
      const a=el.animate(frames,{duration:duration(n),easing:'cubic-bezier(.2,.8,.2,1)',fill:'none'});animations.add(a);
      try { await a.finished; return alive(token); } catch { return false; } finally { animations.delete(a); }
    }
    function cancel() {
      for(const a of animations)a.cancel();animations.clear();
      for(const [id,resolve] of delays){clearTimeout(id);resolve(false);}delays.clear();
      layer.replaceChildren();$('jankenReveal').hidden=true;$('skillCutIn').hidden=true;
      view.root.querySelectorAll('[data-pressed]').forEach(el=>delete el.dataset.pressed);
      view.root.querySelectorAll('[data-attacking]').forEach(el=>delete el.dataset.attacking);
      view.root.querySelectorAll('[data-status-flash]').forEach(el=>delete el.dataset.statusFlash);
      view.root.querySelectorAll('[data-dodging]').forEach(el=>delete el.dataset.dodging);
      view.root.querySelectorAll('[data-entering]').forEach(el=>delete el.dataset.entering);
    }
    function position(side) {const b=view.cardEl(side).getBoundingClientRect(),r=$('duelStage').getBoundingClientRect();return {x:b.left+b.width/2-r.left,y:b.top+b.height*.5-r.top};}
    async function enter(side,token=current()) {
      if(!alive(token))return;
      const target=view.cardEl(side),p=position(side),node=document.createElement('div');
      node.className='entry-fx';node.dataset.side=side;node.style.cssText=`--x:${p.x}px;--y:${p.y}px`;
      node.innerHTML='<i class="entry-beam"></i><i class="entry-ring"></i><i class="entry-glow"></i>';
      layer.append(node);target.dataset.entering='true';
      try{
        if(options.reduced)await hold(1000,token);
        else await Promise.all([
          animate(node,[{opacity:0,transform:'translate(-50%,-50%) scale(.45)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.2},{opacity:1,transform:'translate(-50%,-50%) scale(1.08)',offset:.74},{opacity:0,transform:'translate(-50%,-50%) scale(1.35)'}],options.speed===2?2600:1450,token),
          animate(target,[{filter:'brightness(1.8) saturate(1.5)'},{filter:'brightness(1.3) saturate(1.25)',offset:.35},{filter:'brightness(1)'}],900,token)
        ]);
      }finally{node.remove();if(alive(token))delete target.dataset.entering;}
    }
    async function impact(side,{heal=false,amount=null,label='',family='strike',special=false}={},token=current()) {
      if(!alive(token))return;
      const p=position(side),color=heal?'#5dff9d':family==='debuff'?'#cf8cff':family==='guard'?'#70cdff':'#ffe598';
      const node=document.createElement('div');node.style.cssText=`--x:${p.x}px;--y:${p.y}px;--c:${color}`;
      node.innerHTML=`<div class="impact ${special?'impact-special':''}"><i class="impact-flash"></i><i class="impact-star"></i><i class="impact-ring"></i><i class="impact-slash"></i></div><div class="damage-num ${heal?'heal':''} ${special?'special-damage':''}">${amount===null?'':`${heal?'+':'−'}${amount}`}<small>${V.escape(label)}</small></div>`;
      layer.append(node);const impact=node.querySelector('.impact'),number=node.querySelector('.damage-num');
      const numberDuration=options.speed===2?2600:1800;
      const flash=animate(impact,[{opacity:0,transform:'scale(.25) rotate(-15deg)'},{opacity:1,transform:`scale(${special?1.35:1}) rotate(0deg)`,offset:.12},{opacity:.75,offset:.35},{opacity:0,transform:`scale(${special?1.9:1.5}) rotate(12deg)`}],420,token).then(()=>{impact.hidden=true;});
      const work=[flash,animate(number,[{opacity:0,transform:'translate(-50%,-20%) scale(1.5)'},{opacity:1,transform:'translate(-50%,-55%) scale(1)',offset:.14},{opacity:1,transform:'translate(-50%,-60%) scale(1)',offset:.8},{opacity:0,transform:'translate(-50%,-95%) scale(.95)'}],numberDuration,token)];
      if(!options.reduced)for(let i=0;i<14;i++){const spark=document.createElement('i');spark.className='spark';impact.append(spark);const angle=i*Math.PI/7,reach=special?120:85;work.push(animate(spark,[{opacity:1,transform:'translate(0,0) scale(1.8)'},{opacity:0,transform:`translate(${Math.cos(angle)*reach}px,${Math.sin(angle)*reach}px) rotate(120deg) scale(.4)`}],460,token));}
      if(options.reduced){impact.hidden=true;await hold(1050,token);}else await Promise.all(work);
      node.remove();
    }
    async function reveal(my,theirs,result,token) {
      if(!alive(token))return;
      const r=$('jankenReveal'),names={G:'グー',C:'チョキ',P:'パー'};
      r.dataset.result=result===1?'win':result===-1?'lose':'draw';
      const hand=(h,who,win)=>`<div class="reveal-side" data-result="${win?'win':result?'lose':'draw'}"><span class="reveal-hand" data-hand="${h}">${V.icon('hand-'+h,'hand-ico')}</span><small>${who}</small></div>`;
      r.innerHTML=hand(my,'あなた',result===1)+`<div class="reveal-center"><b>${result===1?'あなたの攻撃':result===-1?'相手の攻撃':'あいこ'}</b><span>${names[my]} × ${names[theirs]}</span></div>`+hand(theirs,'相手',result===-1);
      r.hidden=false;tone('place');await Promise.all([animate(r,[{opacity:0,transform:'translateY(-50%) scaleX(.75)'},{opacity:1,transform:'translateY(-50%) scaleX(1)'}],140,token),...Array.from(r.querySelectorAll('.reveal-hand'),(h,i)=>animate(h,[{transform:`translateX(${i?90:-90}px) rotate(${i?18:-18}deg) scale(.7)`},{transform:'translateX(0) rotate(0deg) scale(1.1)',offset:.75},{transform:'scale(1)'}],260,token))]);
      if(!await hold(options.speed===2?450:650,token))return;r.hidden=true;
    }
    function statusHeadline(family,description) {
      if(family==='copy')return '技をコピー';
      for(const [part,label] of [['交代封印','交代封印'],['行動不能','行動不能'],['自傷ダメ','自傷付与'],['即死','文字化け'],['自分攻撃1.3倍','攻撃UP'],['回避率60%','回避UP'],['被ダメ半減','ダメージ半減'],['HP1で1回耐える','根性']])if(description.includes(part))return label;
      return P.FAMILY[family]?.label||'状態変化';
    }
    async function statusEffect(side,family,{description=''}={},token=current()) {
      if(!alive(token))return;
      const p=position(side),x=Math.max(112,Math.min(p.x,$('duelStage').clientWidth-112)),node=document.createElement('div'),target=view.cardEl(side);
      node.className='status-burst';node.dataset.family=family;
      node.style.cssText=`--x:${x}px;--y:${p.y}px`;
      node.innerHTML=`<i class="status-halo" aria-hidden="true"></i><div class="status-core">${V.icon(P.FAMILY[family]?.icon||'fx-debuff')}<strong>${V.escape(P.FAMILY[family]?.label||'状態変化')}</strong><b>${V.escape(statusHeadline(family,description))}</b><small>${V.escape(description)}</small></div>`;
      target.dataset.statusFlash=family;layer.append(node);
      try{
        if(options.reduced)await hold(1050,token);
        else await Promise.all([
          animate(node,[{opacity:0,transform:'translateY(12px) scale(.75)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.2},{opacity:1,transform:'translateY(0) scale(1)',offset:.78},{opacity:0,transform:'translateY(-12px) scale(1.1)'}],options.speed===2?2100:1400,token),
          animate(target,[{filter:'brightness(1)'},{filter:'brightness(1.6) saturate(1.3)',offset:.4},{filter:'brightness(1)'}],520,token)
        ]);
      }finally{node.remove();if(alive(token))delete target.dataset.statusFlash;}
    }
    async function cutIn(w,event,token) {
      if(!alive(token))return;
      const el=$('skillCutIn'),dim=document.createElement('div');dim.className='duel-dim';dim.style.opacity='.55';layer.append(dim);
      el.style.setProperty('--type',w.color);el.dataset.family=event.effectFamily;
      const source=event.copyFrom===null?w:KotoData.WORDS[event.copyFrom];
      const explanation=event.copyFrom===null?source.skill[1]:`${source.skill[1]} コピーで威力2倍。`;
      el.innerHTML=`<span class="cutin-streaks" aria-hidden="true"></span>`+V.card(w,{size:'md'})+`<div class="cutin-text"><div class="cutin-kind">${V.icon(P.FAMILY[event.family].icon)}必殺技 <span>${V.escape(P.FAMILY[event.effectFamily].label)}</span></div><h2 class="cutin-title">${V.escape(event.title)}</h2><div class="cutin-owner">${V.escape(w.name)}${event.copyFrom!==null?` → ${V.escape(source.name)}の技`:''}</div><p class="cutin-description">${V.escape(explanation)}</p></div>`;
      V.imageFallbacks(el);el.hidden=false;sound('skill');await Promise.all([animate(el,[{opacity:0,transform:'translate(-80px,-50%) skewX(-6deg)'},{opacity:1,transform:'translate(0,-50%) skewX(0deg)'}],180,token),animate(el.querySelector('.kcard'),[{transform:'rotate(-16deg) scale(.7)'},{transform:'rotate(-6deg) scale(1.08)',offset:.8},{transform:'rotate(-6deg) scale(1)'}],300,token)]);
      if(!await hold(options.speed===2?1600:2200,token)){dim.remove();return;}await animate(el,[{opacity:1,transform:'translate(0,-50%)'},{opacity:0,transform:'translate(50px,-50%)'}],130,token);if(alive(token))el.hidden=true;dim.remove();
    }
    async function attack(ev,token,onImpact) {
      const attacker=view.cardEl(ev.attacker),defender=view.cardEl(ev.side),a=position(ev.attacker),d=position(ev.side);
      const len=Math.hypot(d.x-a.x,d.y-a.y)||1,dx=(d.x-a.x)/len,dy=(d.y-a.y)/len;
      const travel=Math.min(len*.64,view.root.clientWidth<700?225:440),tilt=ev.attacker==='A'?6:-6;
      attacker.dataset.attacking='true';
      const focus=document.createElement('div');focus.className='attack-focus';focus.style.cssText=`--focus-x:${d.x}px;--focus-y:${d.y}px`;if(!options.reduced)layer.append(focus);
      const trail=document.createElement('div');trail.className='attack-trail';trail.style.cssText=`left:${a.x}px;top:${a.y}px;width:${len}px;--angle:${Math.atan2(dy,dx)}rad;--trail-color:${ev.special?'#ffc746':'#66d8ff'}`;
      if(!options.reduced)layer.append(trail);
      try{
        tone('swing');
        if(!await animate(attacker,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${-dx*18}px,${-dy*18}px) rotate(${-tilt}deg) scale(1.04)`,offset:.5},{transform:`translate(${dx*travel}px,${dy*travel}px) rotate(${tilt}deg) scale(1.09)`}],330,token))return;
        if(!alive(token))return;onImpact();sound('hit');
        const label=ev.endure?'根性':ev.guard?'防御':ev.total>1?`${ev.hit+1} HIT`:ev.special?'必殺':'';
        await Promise.all([impact(ev.side,{amount:ev.amount,label,family:ev.family,special:ev.special},token),animate(defender,[{transform:'translate(0,0)'},{transform:`translate(${dx*12}px,${dy*12}px) rotate(${tilt}deg)`,offset:.15},{transform:`translate(${-dx*7}px,${-dy*7}px) rotate(${-tilt*.5}deg)`,offset:.35},{transform:'translate(0,0)'}],380,token),animate(attacker,[{transform:`translate(${dx*travel}px,${dy*travel}px) rotate(${tilt}deg) scale(1.09)`,offset:0},{transform:`translate(${dx*travel}px,${dy*travel}px) rotate(${tilt}deg) scale(1.09)`,offset:.32},{transform:'translate(0,0) rotate(0deg) scale(1)'}],460,token),animate(view.root.querySelector('.arena-bg'),[{transform:'translate(0,0) scale(1.02)'},{transform:'translate(-5px,3px) scale(1.02)',offset:.2},{transform:'translate(4px,-3px) scale(1.02)',offset:.4},{transform:'translate(0,0) scale(1)'}],300,token)]);
      }finally{trail.remove();focus.remove();if(alive(token))delete attacker.dataset.attacking;}
    }
    async function miss(side,token){
      if(!alive(token))return;
      const root=view.cardEl(side),p=position(side),x=Math.max(108,Math.min(p.x,$('duelStage').clientWidth-108)),node=document.createElement('div'),shift=side==='A'?-52:52;
      node.className='dodge-fx';node.dataset.side=side;node.style.cssText=`--x:${x}px;--y:${p.y}px`;
      node.innerHTML='<i class="dodge-ring" aria-hidden="true"></i><i class="dodge-streak" aria-hidden="true"></i><strong>回避！</strong><small>MISS</small>';
      layer.append(node);root.dataset.dodging='true';
      try{
        await Promise.all([
          animate(root,[{transform:'translateX(0)'},{transform:`translateX(${shift}px) skewY(-5deg)`,offset:.3},{transform:`translateX(${shift}px) skewY(-5deg)`,offset:.58},{transform:'translateX(0)'}],650,token),
          options.reduced?hold(1050,token):animate(node,[{opacity:0,transform:'translateY(20px) scale(.75)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.2},{opacity:1,transform:'translateY(0) scale(1)',offset:.78},{opacity:0,transform:'translateY(-20px) scale(1.1)'}],options.speed===2?1900:1350,token)
        ]);
      }finally{node.remove();if(alive(token))delete root.dataset.dodging;}
    }
    return {animate,wait,hold,cancel,impact,reveal,statusEffect,cutIn,attack,miss,enter,activeCount:()=>animations.size+delays.size};
  }
  globalThis.KotoEffects={create};
})();
