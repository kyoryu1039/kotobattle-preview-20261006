'use strict';
(() => {
  const D=KotoData,E=KotoEngine,V=KotoView,$=id=>document.getElementById(id);
  const storage={get(k,fallback){try{return JSON.parse(localStorage.getItem('koto-duel-'+k))??fallback;}catch{return fallback;}},set(k,v){try{localStorage.setItem('koto-duel-'+k,JSON.stringify(v));}catch{}}};
  const defaults={bgm:.12,se:.45,speed:1,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  const options={...defaults,...storage.get('settings',{})};
  for(const k of ['bgm','se'])options[k]=Math.max(0,Math.min(1,Number(options[k])||0));
  options.speed=options.speed===2?2:1;
  let team=storage.get('currentTeam',[0,2,3]),cpu=[],slot=0,filter='all',state=null,screen='setup',phase='idle',armed=false,epoch=0,timer=null,cpuTimer=null,timeLeft=15,cpuChecked=false,log=[],dialogReturn=null,forcedResolve=null,toastTimer,messageTimer;
  if(!Array.isArray(team)||team.length!==3||new Set(team).size!==3||team.some(id=>!D.WORDS[id]))team=[0,2,3];
  const voices=new Set();
  KotoPresent.installSprite();
  const battleView=V.createBattleView($('battleScreen'),{onDetail(side,index){if(phase==='input'&&!$('panelDialog').open)openDetail(state[side].team[index]);}});
  const fx=KotoEffects.create({view:battleView,options,current:()=>epoch,sound,tone});
  const {animate,wait,hold,impact,reveal,statusEffect,enter}=fx;
  const audio={bgm:new Audio('audio/Hypnagogiaondo.mp3'),hit:new Audio('audio/hit.mp3'),skill:new Audio('audio/skill.mp3'),ko:new Audio('audio/ko.mp3')};
  audio.bgm.loop=true;audio.bgm.preload='none';
  for(const a of Object.values(audio))a.preload='none';
  let audioContext;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function randomTeam(){const a=D.WORDS.map(w=>w.id),r=[];for(let i=0;i<3;i++)r.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);return r;}
  function tone(kind='select'){
    if(!options.se)return;
    try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;o.type=kind==='swing'?'triangle':'sine';o.frequency.setValueAtTime(kind==='swing'?120:kind==='win'?660:kind==='place'?280:480,t);o.frequency.exponentialRampToValueAtTime(kind==='swing'?880:kind==='win'?990:220,t+.12);g.gain.setValueAtTime(options.se*(kind==='swing'?.08:.12),t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.16);}catch{}
  }
  function sound(kind){const a=audio[kind];if(!a||!options.se)return;const copy=a.cloneNode();copy.volume=options.se;voices.add(copy);copy.play().catch(()=>voices.delete(copy));copy.onended=()=>voices.delete(copy);}
  function music(){audio.bgm.volume=options.bgm;if(options.bgm)audio.bgm.play().catch(()=>{});else audio.bgm.pause();}
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2300);}
  function card(w){return V.card(w,{size:'md'});}
  function imageFallbacks(root){V.imageFallbacks(root);}
  function selectSlot(index){slot=index;tone();renderSetup();}
  function setWord(id){
    const old=team.indexOf(id),selected=slot;
    if(old!==-1&&old!==selected)[team[old],team[selected]]=[team[selected],team[old]];
    else team[selected]=id;
    storage.set('currentTeam',team);slot=(slot+1)%3;tone('place');renderSetup();
  }
  function renderSetup(){
    const root=$('teamSlots');root.innerHTML=team.map((id,i)=>{const w=D.WORDS[id],selected=slot===i;return `<button class="team-slot ${selected?'selected':''}" data-slot="${i}" data-rank="${w.rank}" style="--type:${w.color}" aria-pressed="${selected}" aria-label="${i+1}枚目 ${escape(w.name)} を変更"><span class="slot-no">${i===0?'先頭':'控え '+i}</span>${card(w)}</button>`;}).join('');
    root.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>selectSlot(+b.dataset.slot));imageFallbacks(root);
    $('selectionTarget').textContent=`${slot+1}枚目にセットするカードを選ぶ`;
    renderGrid();
  }
  function renderGrid(){
    const q=$('searchInput').value.trim(),kana=q.replace(/[ぁ-ん]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));const list=D.WORDS.filter(w=>(filter==='all'||w.type===filter)&&(!q||w.name.includes(q)||w.yomi.includes(kana)||w.skill[0].includes(q)));
    $('wordGrid').innerHTML=list.map(w=>{const chosen=team.indexOf(w.id);return `<div class="word-entry ${chosen>=0?'in-team':''}" data-word="${w.id}"><button class="word-pick" data-pick="${w.id}" type="button" aria-label="${escape(w.name)}を${slot+1}枚目にセット">${card(w)}${chosen>=0?`<span class="chosen-badge" aria-label="${chosen+1}枚目に編成中">✓</span>`:''}</button><button class="word-more" data-detail="${w.id}" type="button" aria-label="${escape(w.name)}の詳細を見る">ⓘ</button></div>`;}).join('');
    $('emptySearch').hidden=list.length>0;imageFallbacks($('wordGrid'));
    $('wordGrid').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>setWord(+b.dataset.pick));
    $('wordGrid').querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetail(D.WORDS[+b.dataset.detail],true));
  }
  function filters(){
    $('typeFilters').innerHTML=['all',...D.TYPES_RING].map(t=>`<button class="filter ${filter===t?'active':''}" aria-pressed="${filter===t}" data-type="${t}" style="--card-color:${D.COLORS[t]||'var(--gold)'}">${t==='all'?'すべて':`<span class="filter-dot"></span>${t}`}</button>`).join('');
    $('typeFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{filter=b.dataset.type;filters();renderGrid();});
  }
  function pauseTimers(){clearInterval(timer);clearTimeout(cpuTimer);timer=null;cpuTimer=null;}
  function openPanel(label,content,{forced=false}={}){
    if(!$('panelDialog').open){dialogReturn=document.activeElement;pauseTimers();}
    $('dialogLabel').textContent=label;$('dialogContent').innerHTML=content;$('closeDialog').hidden=forced;$('panelDialog').dataset.forced=String(forced);
    if(!$('panelDialog').open)$('panelDialog').showModal();imageFallbacks($('dialogContent'));
  }
  function closePanel(){if($('panelDialog').dataset.forced==='true')return;$('panelDialog').close();}
  function openDetail(w,editable=false){
    tone();const hp=w.hp??w.maxhp;
    openPanel('CARD DETAILS',`<div class="detail-top">${card(w)}<div><h2>${escape(w.name)}</h2><p>${w.type} / RANK ${w.rank}</p></div></div><div class="detail-stats">${[['HP',hp],['攻撃',w.atk],['防御',w.def],['回避',w.eva+'%']].map(([k,v])=>`<div class="detail-stat"><small>${k}</small><b>${v}</b></div>`).join('')}</div><div class="skill-description"><h3>✦ ${escape(w.skill[0])}</h3>${escape(w.skill[1])}</div>${editable?`<div class="dialog-actions"><button id="addToTeam" class="primary-button">${slot+1}枚目にセット <span>＋</span></button></div>`:''}`);
    if(editable)$('addToTeam').onclick=()=>{setWord(w.id);closePanel();};
  }
  function applySettings(){document.body.classList.toggle('motion-reduced',options.reduced);document.body.classList.toggle('speed-fast',options.speed===2);}
  function openSettings(){
    openPanel('SOUND & MOTION',`<h2>音と演出の設定</h2><label class="setting-row">BGM<input id="bgmRange" type="range" min="0" max="100" value="${options.bgm*100}" aria-label="BGM音量"></label><label class="setting-row">効果音<input id="seRange" type="range" min="0" max="100" value="${options.se*100}" aria-label="効果音音量"></label><label class="setting-row">演出速度<select id="speedSelect"><option value="1" ${options.speed===1?'selected':''}>標準</option><option value="2" ${options.speed===2?'selected':''}>高速 ×2</option></select></label><label class="setting-row">動きを控えめに<input id="reducedCheck" type="checkbox" ${options.reduced?'checked':''}></label><p class="panel-copy">音量を0にするとミュートになります。<br>設定はこの端末に保存されます。</p>${screen==='battle'?'<button id="historyButton" class="subtle-button">対戦履歴を見る</button>':''}`);
    const save=()=>{options.bgm=+$('bgmRange').value/100;options.se=+$('seRange').value/100;options.speed=+$('speedSelect').value;options.reduced=$('reducedCheck').checked;storage.set('settings',options);applySettings();if(screen==='battle')music();};
    ['bgmRange','seRange','speedSelect','reducedCheck'].forEach(id=>$(id).oninput=save);
    if($('historyButton'))$('historyButton').onclick=openHistory;
  }
  function openRules(){openPanel('HOW TO PLAY',`<h2>遊び方</h2><div class="panel-copy"><p><strong>1. 自分の3枚を選ぶ</strong><br>枠を選び、一覧のカードをタップ。左の1枚目からフィールドに出ます。CPUの3枚は対戦ごとにランダムです。</p><p><strong>2. じゃんけんで攻撃権を決める</strong><br>勝てばあなたが攻撃、負ければ相手が攻撃。あいこは攻撃せず、必殺ゲージが進みます。</p><p><strong>3. ゲージ6で必殺技をON</strong><br>ボタンを押してON。次にじゃんけんに勝ったとき発動します。もう一度押すとOFFにできます。技の内容は「技を見る」で確認できます。</p><p><strong>4. 相性と交代を使う</strong><br>有利な相手には×1.5、不利なら×0.67。自主交代はゲージが0になり、相手の攻撃を受けます。</p><p><strong>5. 相手の3枚を倒せば勝利</strong><br>HPが0になったら交代。残りのカードがなくなったチームの負けです。</p><p>タイプの輪：${D.TYPES_RING.join(' → ')} → ヒストリー。各タイプは次の2タイプに有利、前の2タイプに不利です。</p></div>`);}
  function showScreen(which){screen=which;for(const n of ['setup','battle','result'])$(n+'Screen').hidden=n!==which;document.body.classList.toggle('in-battle',which==='battle');$(which+'Screen').classList.remove('screen-enter');requestAnimationFrame(()=>$(which+'Screen').classList.add('screen-enter'));if(which!=='battle')audio.bgm.pause();window.scrollTo(0,0);}
  function uiState(){
    const enabled=screen==='battle'&&phase==='input'&&!$('panelDialog').open&&!state?.ended;
    const a=state&&E.active(state,'A');
    return {phase,armed,timeLeft,enabled,switchEnabled:enabled&&!a.lock&&state.A.team.some((w,i)=>i!==state.A.index&&w.hp>0),skillEnabled:enabled&&state.A.sp>=6,lockMenu:phase!=='input'};
  }
  function renderBattle(){battleView.render(state,uiState());}
  function controls(){if(state)battleView.renderControls(state,uiState());}
  function message(text,duration=2200){
    clearTimeout(messageTimer);$('battleMessage').textContent=text;$('battleMessage').classList.add('show');
    messageTimer=setTimeout(()=>$('battleMessage').classList.remove('show'),duration);
    log.push(text);if(log.length>100)log.shift();
  }
  function affinityText(){
    const a=E.active(state,'A'),b=E.active(state,'B'),mult=E.typeMult(a.type,b.type);
    return mult>1?`相性有利！ あなたの攻撃 ×${mult}`:mult<1?`相性不利。あなたの攻撃 ×${mult}`:'相性は互角。あなたの攻撃 ×1';
  }
  async function playEvent(ev,token){
    if(token!==epoch)return;
    const side=ev.side,root=$(side==='A'?'allyCard':'enemyCard'),w=E.active(state,side);
    if(ev.kind==='skill'){
      if(side==='A')armed=false;
      message(`${w.name}の必殺技「${ev.title}」`,3000);await fx.cutIn(w,ev,token);if(token!==epoch)return;await hold(850,token);if(token!==epoch)return;renderBattle();
      const source=ev.copyFrom===null?w:D.WORDS[ev.copyFrom];
      const statusCopy={title:source.skill[0],description:source.skill[1]};
      if(ev.family==='copy')await statusEffect(side,'copy',statusCopy,token);
      const family=ev.effectFamily;
      if(['buff','guard','debuff'].includes(family))await statusEffect(family==='debuff'?E.other(side):side,family,statusCopy,token);
      return;
    }
    if(ev.kind==='hit'){
      message(`${E.active(state,ev.attacker).name}の攻撃${ev.total>1?` ${ev.hit+1}/${ev.total}`:''}`);
      await fx.attack(ev,token,()=>{renderBattle();message(`${w.name}に${ev.amount}ダメージ${ev.endure?' · 根性でHP1':ev.guard?' · 防御で軽減':''}`);});return;
    }
    if(ev.kind==='miss'){message(`${w.name}は攻撃を回避！`);await fx.miss(side,token);return;}
    if(ev.kind==='heal'){renderBattle();message(`${ev.all?'味方全員':'自分'}のHPが${ev.amount}回復`);tone('win');await impact(side,{heal:true,amount:ev.amount,label:'RECOVER'});return;}
    if(ev.kind==='drain'){renderBattle();message(`${w.name}の必殺ゲージが消えた`);await impact(side,{label:'ゲージ消失',family:'debuff'},token);return;}
    if(ev.kind==='skip'){renderBattle();message(`${w.name}は行動不能。この攻撃はお休み。`);await wait(700,token);return;}
    if(ev.kind==='doom'||ev.kind==='selfHit'){renderBattle();message(ev.kind==='doom'?`${w.name}は文字化けで倒れた`:`${w.name}に崩壊ダメージ`);sound('hit');await impact(side,{amount:ev.kind==='doom'?null:100,label:ev.kind==='doom'?'文字化け':'崩壊',family:'debuff'});return;}
    if(ev.kind==='ko'){
      message(`${w.name}は戦闘不能`);sound('ko');await animate(root,[{opacity:1,transform:getComputedStyle(root).transform},{opacity:.25,transform:'rotate(16deg) translateY(24px)'}],500);
      if(token!==epoch)return;
      if(E.judgeWinner(state)){finish();return;}
      const indices=state[side].team.map((u,i)=>u.hp>0?i:-1).filter(i=>i>=0);
      let idx=indices[0];
      if(side==='A'){phase='forced';controls();idx=await chooseSwitch(true);if(idx===null||token!==epoch)return;}
      await switchAnimation(side,idx,token);if(token!==epoch)return;phase='animating';controls();
    }
  }
  async function runAttack(side,sp,token,tick=true){const iterator=E.attack(state,side,sp,{tick});let n=iterator.next(),special=false;while(!n.done){if(n.value.kind==='skill')special=true;await playEvent({...n.value,special},token);if(token!==epoch||state.ended)return {ko:true};n=iterator.next();}return n.value;}
  async function switchAnimation(side,index,token){
    const root=$(side==='A'?'allyCard':'enemyCard');await animate(root,[{opacity:1,transform:getComputedStyle(root).transform},{opacity:0,transform:`translateX(${side==='A'?-50:50}px) rotate(-12deg)`}],220);
    if(token!==epoch)return;E.switchTo(state,side,index);if(side==='A')armed=false;renderBattle();tone('place');message(`${E.active(state,side).name}がフィールドに登場！ ${affinityText()}`,3000);
    await Promise.all([animate(root,[{opacity:0,transform:`translateX(${side==='A'?-50:50}px) rotate(12deg)`},{opacity:1,transform:getComputedStyle(root).transform}],420,token),enter(side,token)]);
    await hold(650,token);
  }
  async function pick(hand){
    if(phase!=='input'||$('panelDialog').open||!state||state.ended)return;
    pauseTimers();phase='animating';controls();battleView.root.querySelector('button[data-hand="'+hand+'"]').dataset.pressed='true';const token=epoch,cpuHand=['G','C','P'][Math.floor(state.rng()*3)],result=E.judge(hand,cpuHand);
    try{
      await reveal(hand,cpuHand,result,token);if(token!==epoch)return;
      let outcome={ko:false};if(result)outcome=await runAttack(result>0?'A':'B',result>0?armed:true,token);
      if(token!==epoch||state.ended)return;
      if(!outcome.ko)E.charge(state);else if(state.A.sp<6)armed=false;
      state.round++;renderBattle();beginInput();
    }catch(err){console.error(err);if(token===epoch){message('操作を再開しました。もう一度手を選べます。');beginInput();}}
  }
  function beginInput(){if(state.ended||screen!=='battle')return;phase='input';timeLeft=15;cpuChecked=false;battleView.root.querySelectorAll('[data-pressed]').forEach(el=>delete el.dataset.pressed);controls();resumeTimers();}
  function resumeTimers(){
    pauseTimers();if(phase!=='input'||$('panelDialog').open||screen!=='battle'||document.hidden)return;
    controls();timer=setInterval(()=>{if(phase!=='input'||$('panelDialog').open)return;timeLeft=Math.max(0,timeLeft-1);controls();if(!timeLeft)pick(['G','C','P'][Math.floor(state.rng()*3)]);},1000);
    if(!cpuChecked)cpuTimer=setTimeout(async()=>{
      if(phase!=='input'||$('panelDialog').open)return;cpuChecked=true;
      const a=E.active(state,'A'),b=E.active(state,'B');
      if(E.typeMult(b.type,a.type)>.7||b.lock||b.hp<=0)return;
      const idx=state.B.team.findIndex((w,i)=>i!==state.B.index&&w.hp>0&&E.typeMult(w.type,a.type)>=1.5);
      if(idx<0||state.rng()>=.7)return;
      pauseTimers();phase='animating';controls();const token=epoch;
       try{await switchAnimation('B',idx,token);if(token!==epoch)return;message(`相手が交代！ ${affinityText()} あなたの攻撃チャンス`,2600);await hold(1000,token);if(token!==epoch)return;const out=await runAttack('A',armed,token,false);if(token!==epoch||state.ended)return;if(!out.ko)E.charge(state);state.round++;renderBattle();beginInput();}catch(e){console.error(e);if(token===epoch)beginInput();}
    },1200);
  }
  function chooseSwitch(forced=false){
    if(!forced&&(phase!=='input'||E.active(state,'A').lock))return;
    const b=E.active(state,'B');
    openPanel(forced?'CHOOSE YOUR NEXT CARD':'SWITCH CARD',`<h2>${forced?'次に出すカードを選ぶ':'カードを交代する'}</h2><p class="panel-copy">${forced?'残っているカードで、対戦を続けよう。':'交代すると必殺ゲージは0になり、相手の攻撃を受けます。'}</p>${state.A.team.map((w,i)=>w.hp>0&&i!==state.A.index?`<button class="switch-choice" data-switch="${i}"><img src="images/webp/${w.image.replace(/\.png$/, '.webp')}" alt=""><span><b>${escape(w.name)}</b><small>HP ${w.hp} / ${w.maxhp} · 相手への攻撃 ×${E.typeMult(w.type,b.type)}<br>✦ ${escape(w.skill[0])}</small></span></button>`:'').join('')}`,{forced});
    controls();
    const promise=new Promise(resolve=>{if(forced)forcedResolve=resolve;$('dialogContent').querySelectorAll('[data-switch]').forEach(btn=>btn.onclick=async()=>{
      const idx=+btn.dataset.switch;forcedResolve=null;$('panelDialog').dataset.forced='false';phase='animating';$('panelDialog').close();controls();tone('place');
      if(forced){resolve(idx);return;}
      const token=epoch;try{await switchAnimation('A',idx,token);if(token!==epoch)return;const out=await runAttack('B',true,token,false);if(token!==epoch||state.ended)return;if(!out.ko)E.charge(state);state.round++;renderBattle();beginInput();}catch(e){console.error(e);if(token===epoch)beginInput();}resolve(idx);
    });});return promise;
  }
  function clean(){epoch++;pauseTimers();clearTimeout(toastTimer);clearTimeout(messageTimer);$('toast').hidden=true;$('battleMessage').classList.remove('show');fx.cancel();for(const a of voices)a.pause();voices.clear();if(forcedResolve){forcedResolve(null);forcedResolve=null;}$('panelDialog').dataset.forced='false';if($('panelDialog').open)$('panelDialog').close();}
  async function start(){
    clean();cpu=randomTeam();state=E.create(team,cpu);log=[];armed=false;phase='animating';const token=epoch;
    battleView.reset();showScreen('battle');renderBattle();music();$('inputHint').textContent='準備中';
    for(let i=0;i<80;i++){
      const loaded=[...document.querySelectorAll('#allyCard .art-pic img,#enemyCard .art-pic img')].every(img=>img.complete);
      if(loaded&&document.fonts.status==='loaded')break;
      if(!await hold(50,token))return;
    }
    if(token!==epoch)return;
    message(`対戦開始！ ${affinityText()}`,2800);
    await Promise.all(['allyCard','enemyCard'].map((id,i)=>animate($(id),[{opacity:0,transform:`translateX(${i?70:-70}px) rotate(${i?15:-15}deg)`},{opacity:1,transform:getComputedStyle($(id)).transform}],650,token)));
    if(token===epoch)beginInput();
  }
  function finish(){phase='ended';pauseTimers();controls();audio.bgm.pause();const win=state.winner==='A';$('resultTitle').textContent=win?'YOU WIN':'YOU LOSE';$('resultCopy').textContent=win?'相手のカード3枚が戦闘不能になりました。':'自分のカード3枚が戦闘不能になりました。';$('resultCards').innerHTML=state.A.team.map(w=>`<div>${card(w)}<p class="result-hp">${w.hp>0?`HP ${w.hp} / ${w.maxhp}`:'戦闘不能'}</p></div>`).join('');imageFallbacks($('resultCards'));if(win)tone('win');showScreen('result');}
  $('randomTeam').onclick=()=>{team=randomTeam();storage.set('currentTeam',team);slot=0;renderSetup();tone('place');};
  $('searchInput').oninput=renderGrid;$('startBattle').onclick=start;$('rematchButton').onclick=start;
  $('backToSetup').onclick=()=>{clean();phase='idle';showScreen('setup');renderSetup();};$('leaveBattle').onclick=()=>{if(!confirm('対戦を終了して編成に戻りますか？'))return;clean();phase='idle';showScreen('setup');renderSetup();};
  $('rulesButton').onclick=openRules;$('settingsButton').onclick=openSettings;$('battleSettingsButton').onclick=openSettings;
  document.querySelectorAll('[data-hand]').forEach(b=>b.onclick=()=>pick(b.dataset.hand));$('switchButton').onclick=()=>chooseSwitch();$('allySkillInfo').onclick=()=>{if(state&&phase==='input')openDetail(E.active(state,'A'));};$('skillButton').onclick=()=>{if(phase==='input'&&state.A.sp>=6){armed=!armed;tone();controls();message(armed?'必殺技 ON！ 次に勝つと発動':'必殺技 OFF',2800);}};
  function openHistory(){openPanel('DUEL HISTORY',`<h2>対戦の履歴</h2><ul class="history-list">${log.slice().reverse().map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`);}
  $('closeDialog').onclick=closePanel;
  $('panelDialog').addEventListener('cancel',e=>{if($('panelDialog').dataset.forced==='true')e.preventDefault();});
  $('panelDialog').addEventListener('keydown',e=>{if(e.key==='Escape'&&$('panelDialog').dataset.forced==='true'){e.preventDefault();e.stopPropagation();}});
  $('panelDialog').addEventListener('click',e=>{const r=$('panelDialog').getBoundingClientRect();if(e.target===$('panelDialog')&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closePanel();});
  $('panelDialog').addEventListener('close',()=>{if(dialogReturn?.isConnected)dialogReturn.focus();if(screen==='battle'&&state){controls();resumeTimers();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseTimers();audio.bgm.pause();}else if(screen==='battle'){music();resumeTimers();}});
  document.addEventListener('keydown',e=>{if($('panelDialog').open||screen!=='battle'||phase!=='input')return;if(['1','2','3'].includes(e.key)){e.preventDefault();pick(['G','C','P'][+e.key-1]);}});
  applySettings();
  filters();renderSetup();
})();
