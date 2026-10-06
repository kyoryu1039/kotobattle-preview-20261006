'use strict';
(()=>{
const IMG = {
        "パラボラアンテナ": "parabola_antenna.png", "ネスカフェアンバサダー": "nescafe_ambassador.png",
        "にんじんしりしり": "ninjin_shirishiri.png", "そぼろごはん": "soboro_gohan.png",
        "ニシローランドゴリラ": "western_lowland_gorilla.png", "毛むくじゃら": "kemukujara.png",
        "九品仏": "kuhonbutsu.png", "けんちん汁": "kenchin_jiru.png",
        "カムチャッカ半島": "kamchatka_peninsula.png", "タランチュラ": "tarantula.png",
        "ハシビロコウ": "shoebill.png", "バルサミコ酢": "balsamic_vinegar.png",
        "ピロリ菌": "helicobacter_pylori.png", "トリニダード・トバゴ": "trinidad_and_tobago.png",
        "カラメル色素": "caramel_color.png", "バビロン捕囚": "babylonian_captivity.png",
        "鳥取砂丘": "tottori_sand_dunes.png", "プラシーボ効果": "placebo_effect.png",
        "渡来人": "torai_jin.png", "さるびあ丸": "sarubia_maru.png",
        "ペペロンチーノ": "peperoncino.png", "ポリプロピレン": "polypropylene.png",
        "サラエボ事件": "sarajevo_incident.png", "クマンバチ": "kumabachi.png",
        "県庁所在地": "prefectural_capital.png", "照り焼きチキン": "teriyaki_chicken.png",
        "ねるねるねるね": "nerunerunerune.png", "スルメイカ": "surume_ika.png",
        "本質": "essence.png", "見える化": "mieruka.png",
        "自分ごと化": "jibungotoka.png", "解像度": "resolution.png"
      };
const TYPES_RING = ['ヒストリー', 'ジオ', 'コンセプト', 'サイエンス', 'アニマル', 'ヒューマン', 'フード'];
      
      const typeMult = (atk, def) => {
        const n = TYPES_RING.length; const i = TYPES_RING.indexOf(atk); const j = TYPES_RING.indexOf(def);
        if (i < 0 || j < 0) return 1;
        const st = [(i + 1) % n, (i + 2) % n]; const wk = [(i - 1 + n) % n, (i - 2 + n) % n];
        if (st.includes(j)) return 1.5; if (wk.includes(j)) return 0.67; return 1;
      };
      const PRANK = { S: 170, A: 165, B: 160, C: 150, D: 145, X: 150 };
      const HP_BASE = { S: 560, A: 540, B: 520, C: 500, D: 480, X: 500 };
      const toKatakana = s => (s || '').replace(/[ぁ-ん]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
      const visualLen = s => (s || '').replace(/[・\s]/g, '').length;
      const reKanaH = /[ぁ-ゟ]/g, reKanaK = /[゠-ヿー]/g, reKanji = /[一-龥々〆ヵヶ]/g;
      function countClass(name) {
        const H = (name.match(reKanaH) || []).length; const K = (name.match(reKanaK) || []).length; const J = (name.match(reKanji) || []).length;
        return { H, K, J, total: H + K + J };
      }
      const reSmallK = /[ァィゥェォャュョヮㇰ-ㇿ]/g, reSokuon = /ッ/g, reVoiced = /[ガ-ポヴ]/g, rePlosiveEnd = /[ツックキチテトプピペポカタ]$/;
      function calcAttackDefense(name, yomiKatakana) {
        let atkP = 17.5, defP = 17.5; const cls = countClass(name);
        if (cls.J + cls.K === 0) { atkP += 12.5; defP += 12.5; } else { const r = cls.K / (cls.J + cls.K); atkP += 25 * r; defP += 25 * (1 - r); }
        const Lph = yomiKatakana.length || 1;
        const d = (yomiKatakana.match(reVoiced) || []).length / Lph; const s = (yomiKatakana.match(reSokuon) || []).length / Lph;
        const m = (yomiKatakana.match(reSmallK) || []).length / Lph; const e = rePlosiveEnd.test(yomiKatakana) ? 1 : 0;
        const s_raw = 0.6 * d + 0.25 * (s + m) + 0.15 * e;
        const L = 0.05, U = 0.45; const s_ph = Math.max(-1, Math.min(1, ((s_raw - L) / (U - L)) * 2 - 1));
        const atk_ph = 20 * (0.5 + 0.5 * s_ph); atkP += atk_ph; defP += 20 - atk_ph;
        const T = visualLen(name); const s_len = Math.max(-1, Math.min(1, (6 - T) / 6));
        const atk_len = 20 * (0.5 + 0.5 * s_len); atkP += atk_len; defP += 20 - atk_len;
        return { atkP, defP, T };
      }
      function calcEvasion(name, T, rank) {
        const cls = countClass(name); const hiraRatio = cls.total ? (cls.H / cls.total) : 0;
        const rankAdj = ({ S: -1, A: -0.5, B: 0, C: 0.5, D: 1, X: 0 })[rank] ?? 0;
        let eva = 10 + 8 * hiraRatio - 0.5 * (T - 5) + rankAdj; eva = Math.round(eva * 10) / 10;
        return Math.max(5, Math.min(35, eva));
      }
      function makeWordObject([name, rank, type, yomiH]) {
        const y = toKatakana(yomiH || name); const { atkP, defP, T } = calcAttackDefense(name, y);
        const ATK = Math.round(PRANK[rank] * (atkP / 100)); const DEF = Math.round(PRANK[rank] * (defP / 100));
        const HP = Math.round(HP_BASE[rank] + 20 * (T - 5)); const EVA = calcEvasion(name, T, rank);
        return {
          name, rank, type, yomi: y, maxhp: HP, hp: HP, atk: ATK, def: DEF, eva: EVA,
          shield: 0, eva60: 0, atk13: 0, lock: 0, doom: 0, selfHurt: 0, stun: false, endure: false
        };
      }

      const SKILLS = {
        "パラボラアンテナ": ["妨害電波", "威力2.2倍。相手の必殺ゲージを0にする。"],
        "ネスカフェアンバサダー": ["一杯いかが", "攻撃後、味方全員HP60回復。"],
        "にんじんしりしり": ["なんくるないさー", "威力1.6倍。致死ダメージをHP1で1回耐える。"],
        "そぼろごはん": ["そぼろ乱舞", "3回連続攻撃（0.75→0.5→0.25倍）。"],
        "ニシローランドゴリラ": ["マウンテンビート", "威力1.5倍。3ターンの間、自分攻撃1.3倍。"],
        "毛むくじゃら": ["ムクジャララ", "威力1.4倍。3ターンの間、回避率60%固定。"],
        "九品仏": ["仏の顔も三度まで", "威力1.6倍。次の被弾2回まで被ダメ半減。"],
        "けんちん汁": ["長寿の秘訣", "威力1.2倍。自分HP150回復。"],
        "カムチャッカ半島": ["言論統制", "相手：4ターンの間、交代封印。"], "タランチュラ": ["言葉狩り", "相手：次のターン行動不能。"],
        "ハシビロコウ": ["言論統制", "相手：4ターンの間、交代封印。"], "バルサミコ酢": ["言論統制", "相手：4ターンの間、交代封印。"],
        "ピロリ菌": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"], "トリニダード・トバゴ": ["言葉狩り", "相手：次のターン行動不能。"],
        "カラメル色素": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"], "バビロン捕囚": ["言論統制", "相手：4ターンの間、交代封印。"],
        "鳥取砂丘": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"], "プラシーボ効果": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"],
        "渡来人": ["文字化け", "相手：3ターン経過後に即死。"], "さるびあ丸": ["言葉狩り", "相手：次のターン行動不能。"],
        "ペペロンチーノ": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"], "ポリプロピレン": ["言論統制", "相手：4ターンの間、交代封印。"],
        "サラエボ事件": ["言葉狩り", "相手：次のターン行動不能。"], "クマンバチ": ["言論統制", "相手：4ターンの間、交代封印。"],
        "県庁所在地": ["文字化け", "相手：3ターン経過後に即死。"], "照り焼きチキン": ["言論統制", "相手：4ターンの間、交代封印。"],
        "ねるねるねるね": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"], "スルメイカ": ["ゲシュタルト崩壊", "相手：3ターンの間、確率(33%)で自傷ダメ。"],
        "本質": ["鏡文字", "相手の必殺をコピー（威力2倍）。"], "見える化": ["鏡文字", "相手の必殺をコピー（威力2倍）。"],
        "自分ごと化": ["鏡文字", "相手の必殺をコピー（威力2倍）。"], "解像度": ["鏡文字", "相手の必殺をコピー（威力2倍）。"]
      };
      const WORDS_BASE = [
        ["パラボラアンテナ", "S", "サイエンス", "ぱらぼらあんてな"], ["ネスカフェアンバサダー", "S", "ヒューマン", "ねすかふぇあんばさだー"],
        ["にんじんしりしり", "A", "フード", "にんじんしりしり"], ["そぼろごはん", "A", "フード", "そぼろごはん"],
        ["ニシローランドゴリラ", "A", "アニマル", "にしろーらんどごりら"], ["毛むくじゃら", "A", "アニマル", "けむくじゃら"],
        ["九品仏", "A", "ジオ", "くほんぶつ"], ["けんちん汁", "A", "フード", "けんちんじる"],
        ["カムチャッカ半島", "B", "ジオ", "かむちゃっかはんとう"], ["タランチュラ", "B", "アニマル", "たらんちゅら"],
        ["ハシビロコウ", "B", "アニマル", "はしびろこう"], ["バルサミコ酢", "B", "フード", "ばるさみこす"],
        ["ピロリ菌", "B", "サイエンス", "ぴろりきん"], ["トリニダード・トバゴ", "B", "ジオ", "とりにだーどとばご"],
        ["カラメル色素", "B", "サイエンス", "からめるしきそ"], ["バビロン捕囚", "C", "ヒストリー", "ばびろんほしゅう"],
        ["鳥取砂丘", "C", "ジオ", "とっとりさきゅう"], ["プラシーボ効果", "C", "サイエンス", "ぷらしーぼこうか"],
        ["渡来人", "C", "ヒューマン", "とらいじん"], ["さるびあ丸", "C", "ジオ", "さるびあまる"],
        ["ペペロンチーノ", "C", "フード", "ぺぺろんちーの"], ["ポリプロピレン", "C", "サイエンス", "ぽりぷろぴれん"],
        ["サラエボ事件", "C", "ヒストリー", "さらえぼじけん"], ["クマンバチ", "D", "アニマル", "くまんばち"],
        ["県庁所在地", "D", "ジオ", "けんちょうしょざいち"], ["照り焼きチキン", "D", "フード", "てりやきちきん"],
        ["ねるねるねるね", "D", "フード", "ねるねるねるね"], ["スルメイカ", "D", "アニマル", "するめいか"],
        ["本質", "X", "コンセプト", "ほんしつ"], ["見える化", "X", "コンセプト", "みえるか"],
        ["自分ごと化", "X", "コンセプト", "じぶんごとか"], ["解像度", "X", "コンセプト", "かいぞうど"]
      ];
const COLORS = {"ヒストリー":"#ec4899","ジオ":"#6366f1","コンセプト":"#d946ef","サイエンス":"#06b6d4","アニマル":"#22c55e","ヒューマン":"#84cc16","フード":"#f59e0b"};
const WORDS = WORDS_BASE.map((v,id)=>({...makeWordObject(v),id,image:IMG[v[0]],skill:SKILLS[v[0]],color:COLORS[v[2]]}));
globalThis.KotoData={WORDS,TYPES_RING,COLORS,typeMult,makeWordObject};
})();

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

'use strict';
// Presentation-only definitions: icons, rarity/type labels and per-image art
// framing. Battle numbers always come from KotoData / KotoEngine.
(() => {
  const D = globalThis.KotoData;

  const TYPES = {
    'ヒストリー': {key: 'history', icon: 'type-history'},
    'ジオ': {key: 'geo', icon: 'type-geo'},
    'コンセプト': {key: 'concept', icon: 'type-concept'},
    'サイエンス': {key: 'science', icon: 'type-science'},
    'アニマル': {key: 'animal', icon: 'type-animal'},
    'ヒューマン': {key: 'human', icon: 'type-human'},
    'フード': {key: 'food', icon: 'type-food'}
  };
  const RANKS = {
    S: {metal: 'rainbow', label: '虹'}, A: {metal: 'gold', label: '金'}, B: {metal: 'silver', label: '銀'},
    C: {metal: 'bronze', label: '銅'}, D: {metal: 'iron', label: '灰'}, X: {metal: 'violet', label: '紫'}
  };
  const FAMILY = {
    strike: {icon: 'fx-strike', label: '強打'}, multi: {icon: 'fx-multi', label: '連撃'},
    heal: {icon: 'fx-heal', label: '回復'}, buff: {icon: 'fx-buff', label: '強化'},
    guard: {icon: 'fx-guard', label: '防御'}, debuff: {icon: 'fx-debuff', label: '妨害'},
    copy: {icon: 'fx-copy', label: 'コピー'}
  };
  // Display rules from the plan: attack/defence bars use 120, evasion 30%.
  const BAR_BASE = {atk: 120, def: 120, eva: 30};

  // Measured by tools/inventory.py: [content fill, centre x, centre y].
  // Images are framed to a common visual size without editing the PNG files.
  const ART = {parabola_antenna:[.831,.504,.502],nescafe_ambassador:[.862,.492,.508],ninjin_shirishiri:[.838,.493,.508],soboro_gohan:[.779,.5,.52],western_lowland_gorilla:[.836,.506,.486],kemukujara:[.853,.504,.508],kuhonbutsu:[.832,.5,.492],kenchin_jiru:[.801,.5,.516],kamchatka_peninsula:[.832,.565,.5],tarantula:[.951,.497,.506],shoebill:[.866,.484,.5],balsamic_vinegar:[.801,.552,.495],helicobacter_pylori:[.889,.458,.501],trinidad_and_tobago:[.894,.51,.488],caramel_color:[.823,.5,.479],babylonian_captivity:[.909,.505,.496],tottori_sand_dunes:[.818,.497,.547],placebo_effect:[.639,.488,.489],torai_jin:[.936,.505,.517],sarubia_maru:[.847,.488,.497],peperoncino:[.888,.501,.537],polypropylene:[.85,.5,.5],sarajevo_incident:[.911,.486,.523],kumabachi:[.8,.499,.5],prefectural_capital:[.83,.5,.475],teriyaki_chicken:[.823,.506,.515],nerunerunerune:[.853,.501,.498],surume_ika:[.863,.485,.509],essence:[.828,.51,.493],mieruka:[.83,.5,.492],jibungotoka:[.933,.471,.514],resolution:[.787,.502,.466]};
  const TARGET_FILL = .9;

  function art(w) {
    const base = w.image.replace(/\.png$/, '');
    const [fill, cx, cy] = ART[base] || [TARGET_FILL, .5, .5];
    const scale = Math.max(.92, Math.min(1.3, TARGET_FILL / fill));
    return {
      mobile: `images/webp/${base}_mobile.webp`, webp: `images/webp/${base}.webp`, png: `images/webp/${base}.webp`,
      style: `--art-scale:${scale.toFixed(3)};--art-x:${((.5 - cx) * 100).toFixed(1)}%;--art-y:${((.5 - cy) * 100).toFixed(1)}%`
    };
  }
  function hpLevel(hp,maxhp) { return hp*5<=maxhp?'low':hp*2<=maxhp?'mid':'high'; }
  function family(name) {
    return globalThis.KotoEngine ? KotoEngine.family(name) : 'strike';
  }

  // Gear outline generated once: eight squared teeth around a ring.
  function gearPath() {
    const pts = [], teeth = 8, ro = 11, ri = 8.6;
    for (let i = 0; i < teeth; i++) {
      const a = i / teeth * Math.PI * 2, w = Math.PI / teeth * .52;
      for (const [r, t] of [[ri, a - w * 1.25], [ro, a - w * .7], [ro, a + w * .7], [ri, a + w * 1.25]]) pts.push([12 + r * Math.cos(t), 12 + r * Math.sin(t)]);
    }
    return 'M' + pts.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z';
  }

  const HAND_STYLE = 'style="fill:var(--hand-fill,#fff);stroke:var(--hand-line,#1b2232);stroke-width:3.4;stroke-linejoin:round"';
  const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-defs" aria-hidden="true" focusable="false"><defs>
  <symbol id="type-history" viewBox="0 0 24 24"><path d="M12 1.8 2 6.6V9h20V6.6Z"/><path d="M4 10.2h3v7.6H4Zm6.5 0h3v7.6h-3Zm6.5 0h3v7.6h-3ZM2 19h20v3.2H2Z"/></symbol>
  <symbol id="type-geo" viewBox="0 0 24 24"><path d="M1.5 21 9 7.5l4.3 7.4 2.4-3.6L22.5 21Z"/><circle cx="18.2" cy="5.4" r="2.8"/></symbol>
  <symbol id="type-concept" viewBox="0 0 24 24"><path d="M12 1.6a7.2 7.2 0 0 0-4.2 13V17h8.4v-2.4A7.2 7.2 0 0 0 12 1.6Z"/><path d="M8.8 18.2h6.4v1.9H8.8Zm1.3 2.6h3.8v1.7h-3.8Z"/></symbol>
  <symbol id="type-science" viewBox="0 0 24 24"><path d="M8.6 1.8h6.8V4h-1.2v5.1l5.9 10A2 2 0 0 1 18.4 22H5.6a2 2 0 0 1-1.7-2.9l5.9-10V4H8.6Z"/></symbol>
  <symbol id="type-animal" viewBox="0 0 24 24"><ellipse cx="4.6" cy="10.4" rx="2.3" ry="2.9"/><ellipse cx="9" cy="5.4" rx="2.4" ry="3"/><ellipse cx="15" cy="5.4" rx="2.4" ry="3"/><ellipse cx="19.4" cy="10.4" rx="2.3" ry="2.9"/><path d="M12 11.2c-3.4 0-6.6 4-6.6 6.8 0 2.2 1.7 3.4 3.5 3.4 1.4 0 2-.7 3.1-.7s1.7.7 3.1.7c1.8 0 3.5-1.2 3.5-3.4 0-2.8-3.2-6.8-6.6-6.8Z"/></symbol>
  <symbol id="type-human" viewBox="0 0 24 24"><circle cx="12" cy="6.6" r="4.6"/><path d="M3.2 22c0-5 3.9-8.6 8.8-8.6s8.8 3.6 8.8 8.6Z"/></symbol>
  <symbol id="type-food" viewBox="0 0 24 24"><path d="M5.2 1.8v6.4a2.3 2.3 0 0 0 1.7 2.2V22h2.4V10.4A2.3 2.3 0 0 0 11 8.2V1.8H9.7v5.4h-.9V1.8H7.6v5.4h-.9V1.8Z"/><path d="M18.8 1.8C16.5 3.3 14.6 6 14.6 9.6v4.2h2.5V22h2.4V1.8Z"/></symbol>
  <symbol id="stat-atk" viewBox="0 0 24 24"><path d="M21.8 2.2 21 7l-9.6 9.6-4-4L17 3Z"/><path d="m5 11.8 7.2 7.2-1.6 1.6-7.2-7.2Z"/><path d="m6.4 16 1.6 1.6-4.2 4.2-1.6-1.6Z"/></symbol>
  <symbol id="stat-def" viewBox="0 0 24 24"><path d="M12 1.6 3.6 4.8v6.4c0 5.2 3.6 9.6 8.4 11.2 4.8-1.6 8.4-6 8.4-11.2V4.8Z"/></symbol>
  <symbol id="stat-eva" viewBox="0 0 24 24"><circle cx="15.6" cy="3.6" r="2.4"/><path d="M13.6 6.8 8.4 8.6 6.4 12.6l1.8.9 1.6-3 1.7-.5L9 16.3l-4.4 1.5.6 2 5.6-1.6 1.7-3.4 2.6 2.6V22h2.2v-5.3l-3.1-3.2 1.2-3.2 1.6 2.1h3.8v-2.1h-2.8l-2.5-3.4Z"/></symbol>
  <symbol id="fx-strike" viewBox="0 0 24 24"><path d="M14.2 1.5 3.8 13.6h6.6L9 22.5l11.2-13h-6.8Z"/></symbol>
  <symbol id="fx-multi" viewBox="0 0 24 24"><path d="M2.4 17.6 12.6 3.4h2.8L5.2 17.6Zm4.8 2.6L17.4 6h2.8L10 20.2Zm5.6 1.4 8.4-11.8h2.4l-8.4 11.8Z"/></symbol>
  <symbol id="fx-heal" viewBox="0 0 24 24"><path d="M8.8 2.4h6.4v6.4h6.4v6.4h-6.4v6.4H8.8v-6.4H2.4V8.8h6.4Z"/></symbol>
  <symbol id="fx-buff" viewBox="0 0 24 24"><path d="M12 1.6 3.4 11.2h5.2V22h6.8V11.2h5.2Z"/></symbol>
  <symbol id="fx-guard" viewBox="0 0 24 24"><path d="M12 1.6 3.6 4.8v6.4c0 5.2 3.6 9.6 8.4 11.2 4.8-1.6 8.4-6 8.4-11.2V4.8Zm0 3.2 5.2 2v4.4c0 3.4-2.1 6.5-5.2 7.8Z"/></symbol>
  <symbol id="fx-debuff" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4Zm0 3a7.2 7.2 0 0 1 5.8 11.5L7.7 6.2A7.2 7.2 0 0 1 12 4.8ZM6.2 7.7l10.1 10.1A7.2 7.2 0 0 1 6.2 7.7Z"/></symbol>
  <symbol id="fx-copy" viewBox="0 0 24 24"><path d="M8 1.8h12.2a2 2 0 0 1 2 2V16h-3V4.8H8Z"/><path d="M1.8 7.6h14.4v14.6H1.8Z"/></symbol>
  <symbol id="ui-back" viewBox="0 0 24 24"><path d="M15.6 3.2 6.8 12l8.8 8.8 2.4-2.4L11.6 12 18 5.6Z"/></symbol>
  <symbol id="ui-gear" viewBox="0 0 24 24"><path fill-rule="evenodd" d="${gearPath()}"/></symbol>
  <symbol id="ui-swap" viewBox="0 0 24 24"><path d="M7.2 2.6 2 7.8l5.2 5.2V9.4h11.2V6.2H7.2Zm9.6 8.4v3.6H5.6v3.2h11.2v3.6l5.2-5.2Z"/></symbol>
  <symbol id="ui-history" viewBox="0 0 24 24"><path d="M3 4h18v3H3Zm0 6.5h18v3H3ZM3 17h12v3H3Z"/></symbol>
  <symbol id="hand-G" viewBox="-8 -7 80 78"><g ${HAND_STYLE}><rect x="12" y="24" width="40" height="31" rx="11"/><rect x="14.5" y="12.5" width="11.5" height="19" rx="5.75"/><rect x="25.2" y="10" width="11.5" height="20" rx="5.75"/><rect x="35.9" y="11" width="11.5" height="19" rx="5.75"/><rect x="45" y="15.5" width="9.5" height="16" rx="4.75"/><rect x="9" y="31" width="26" height="11" rx="5.5" transform="rotate(-6 22 36.5)"/></g></symbol>
  <symbol id="hand-C" viewBox="-8 -7 80 78"><g ${HAND_STYLE}><rect x="16" y="2.5" width="11.5" height="34" rx="5.75" transform="rotate(-15 21.75 34)"/><rect x="31.5" y="1.5" width="11.5" height="35" rx="5.75" transform="rotate(13 37.25 34)"/><rect x="13" y="29" width="37" height="29" rx="11.5"/><rect x="35.5" y="26.5" width="10.5" height="14" rx="5.25"/><rect x="44.5" y="29.5" width="8.5" height="13" rx="4.25"/><rect x="9" y="38" width="24" height="11" rx="5.5" transform="rotate(-18 21 43.5)"/></g></symbol>
  <symbol id="hand-P" viewBox="-12 -7 84 78"><g ${HAND_STYLE}><rect x="5" y="24" width="10.5" height="24" rx="5.25" transform="rotate(-40 10.25 46)"/><rect x="15.5" y="5" width="10.5" height="31" rx="5.25" transform="rotate(-13 20.75 36)"/><rect x="26.8" y="1.5" width="10.5" height="35" rx="5.25"/><rect x="38" y="4" width="10.5" height="32" rx="5.25" transform="rotate(11 43.25 36)"/><rect x="47" y="12.5" width="9.5" height="25" rx="4.75" transform="rotate(24 51.75 37.5)"/><rect x="14" y="27" width="37" height="32" rx="12.5"/></g></symbol>
</defs></svg>`;

  function installSprite(doc = document) {
    if (doc.getElementById('type-history')) return;
    doc.body.insertAdjacentHTML('afterbegin', SPRITE);
  }

  globalThis.KotoPresent = {TYPES, RANKS, FAMILY, BAR_BASE, art, family, hpLevel, installSprite,
    typeIcon: type => (TYPES[type] || TYPES['コンセプト']).icon, typeKey: type => (TYPES[type] || {key: 'concept'}).key,
    colors: D.COLORS};
})();

'use strict';
// Shared rendering for cards, the battle screen and fixed review states.
// The view reads engine state and never changes HP, gauges or turn order.
(() => {
  const P = globalThis.KotoPresent;
  const E = globalThis.KotoEngine;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
  const pct = (v, max) => Math.max(0, Math.min(1, v / max));
  const fmtEva = v => `${Number.isInteger(v) ? v : v.toFixed(1)}`;
  const nameParts = {
    'ニシローランドゴリラ': ['ニシローランド', 'ゴリラ'],
    'ネスカフェアンバサダー': ['ネスカフェ', 'アンバサダー'],
    'トリニダード・トバゴ': ['トリニダード・', 'トバゴ']
  };
  const cardName = name => nameParts[name]
    ? nameParts[name].map(part => `<span class="name-part">${escape(part)}</span>`).join('<wbr>')
    : escape(name);

  function picture(w, cls = '', {lazy = false} = {}) {
    const a = P.art(w);
    return `<picture class="art-pic ${cls}" style="${a.style}"><source type="image/webp" media="(max-width:600px)" ${lazy?'data-srcset':'srcset'}="${a.mobile}"><source type="image/webp" ${lazy?'data-srcset':'srcset'}="${a.webp}"><img ${lazy?'data-src':'src'}="${a.png}" alt="${escape(w.name)}" draggable="false" decoding="async" fetchpriority="${lazy?'low':'high'}"></picture><span class="art-fallback" hidden>${escape(w.name.slice(0, 1))}</span>`;
  }

  // Card face. Name and move text are DOM text so long names wrap (max 2 lines).
  function card(w, {size = 'lg', extra = '', lazy = false} = {}) {
    const fam = P.family(w.name);
    return `<div class="kcard kcard-${size}" data-rank="${w.rank}" data-type="${P.typeKey(w.type)}" style="--type:${w.color}" ${extra}>
      <div class="kcard-frame"><div class="kcard-body">
        <div class="kcard-art">${picture(w,'',{lazy})}</div>
        <div class="kcard-type">${icon(P.typeIcon(w.type))}<span>${escape(w.type)}</span></div>
        <div class="kcard-name" lang="ja"><b>${cardName(w.name)}</b></div>
        <div class="kcard-move" data-family="${fam}">${icon(P.FAMILY[fam].icon)}<b>${escape(w.skill[0])}</b></div>
      </div></div>
      <div class="kcard-rank rank-badge" data-rank="${w.rank}" aria-label="レア度 ${w.rank}"><span>${w.rank}</span></div>
    </div>`;
  }

  function mini(u, i, {dead = false, label = ''} = {}) {
    const typeShort={'ヒストリー':'歴史','ジオ':'地理','コンセプト':'概念','サイエンス':'科学','アニマル':'動物','ヒューマン':'人物','フード':'食'};
    return `<button class="mini" type="button" data-bench="${i}" data-level="${P.hpLevel(u.hp,u.maxhp)}" data-rank="${u.rank}" style="--type:${u.color}" ${dead ? 'data-dead="true"' : ''} aria-label="${escape(label || u.name)} ${escape(u.type)} HP ${u.hp} / ${u.maxhp}${dead ? ' 戦闘不能' : ''}">
      <span class="mini-frame"><span class="mini-art">${picture(u)}</span><span class="mini-type" title="${escape(u.type)}"><span>${escape(typeShort[u.type]||u.type)}</span></span></span>
      <span class="mini-rank rank-badge" data-rank="${u.rank}"><span>${u.rank}</span></span>
      <span class="mini-hp" aria-hidden="true"><i style="transform:scaleX(${pct(u.hp, u.maxhp)})"></i></span>
      ${dead ? '<span class="mini-down">戦闘不能</span>' : ''}
    </button>`;
  }

  function stats(w) {
    const rows = [['atk', '攻撃', w.atk, String(w.atk)], ['def', '防御', w.def, String(w.def)], ['eva', '回避', w.eva, fmtEva(w.eva) + '<small>%</small>']];
    return rows.map(([k, label, v, text]) => `<div class="stat-row stat-${k}" role="group" aria-label="${label} ${k === 'eva' ? fmtEva(v) + '%' : v}">
      ${icon('stat-' + k, 'stat-ico')}<span class="stat-label">${label}</span><b class="stat-value">${text}</b>
      <span class="stat-bar" aria-hidden="true"><i style="transform:scaleX(${pct(v, P.BAR_BASE[k])})"></i></span></div>`).join('');
  }

  function statuses(w) {
    const out = [];
    const add = (fam, text, tone) => out.push(`<span class="status-chip" data-tone="${tone}">${icon(P.FAMILY[fam].icon)}${text}</span>`);
    if (w.atk13) add('buff', `攻撃↑ <b>${w.atk13}</b>`, 'buff');
    if (w.eva60) add('buff', `回避↑ <b>${w.eva60}</b>`, 'buff');
    if (w.shield) add('guard', `防御 <b>${w.shield}</b>`, 'guard');
    if (w.endure) add('guard', '根性', 'guard');
    if (w.lock) add('debuff', `封印 <b>${w.lock}</b>`, 'debuff');
    if (w.stun) add('debuff', '行動不能', 'debuff');
    if (w.selfHurt) add('debuff', `崩壊 <b>${w.selfHurt}</b>`, 'debuff');
    if (w.doom) add('debuff', `文字化け <b>${w.doom}</b>`, 'debuff');
    return out.join('');
  }

  function battleMarkup() {
    const hand = (h, name, key) => `<button class="hand-btn" type="button" data-hand="${h}" aria-label="${name}を出す"><span class="hand-face">${icon('hand-' + h, 'hand-ico')}<span class="hand-name">${name}</span></span><kbd>${key}</kbd></button>`;
    return `<header class="battle-head">
      <button id="leaveBattle" class="metal-btn" type="button" aria-label="対戦をやめて編成に戻る">${icon('ui-back')}</button>
      <h1 class="battle-title">ことばバトル</h1>
      <button class="round-badge" id="battleHistoryButton" type="button" aria-label="対戦の効果と履歴を読む"><small>履歴</small><b id="roundLabel">01</b></button>
      <button id="battleSettingsButton" class="metal-btn" type="button" aria-label="設定と履歴">${icon('ui-gear')}</button>
    </header>
      <section class="side side-enemy battle-hud enemy-hud" aria-label="相手">
        <div class="side-info">
          <div class="hp-block" id="enemyHp"></div>
          <div class="stat-panel" id="enemyStats"></div>
          <div class="status-row" id="enemyStatus" aria-label="相手の状態"></div>
          <button class="skill-peek" id="enemySkillInfo" type="button" aria-label="相手のカードと必殺技の詳細を見る"><small>必殺技の詳細 ›</small><span>✦ <b id="enemySkillName">必殺技</b></span></button>
        </div>
      </section>
    <div class="duel" id="duelStage" aria-label="対戦フィールド">
      <div class="arena-bg" aria-hidden="true"></div>
      <div class="summon-ring ring-enemy" aria-hidden="true"></div>
      <div class="summon-ring ring-ally" aria-hidden="true"></div>
      <div class="card-slot enemy" id="enemyCard"></div>
      <div class="vs-row" aria-hidden="false"><div class="vs-mark" aria-hidden="true">VS</div><div class="affinity" id="affinityNote"></div></div>
      <div class="card-slot ally" id="allyCard"></div>
      <div id="fxLayer" class="fx-layer" aria-hidden="true"></div>
      <div id="jankenReveal" class="janken-reveal" hidden></div>
      <div id="skillCutIn" class="skill-cutin" hidden></div>
      <div class="battle-message" id="battleMessage" role="status" aria-live="polite"></div>
    </div>
      <section class="side side-ally battle-hud ally-hud" aria-label="あなた">
        <div class="side-info">
          <div class="hp-block" id="allyHp"></div>
          <div class="stat-panel" id="allyStats"></div>
          <div class="status-row" id="allyStatus" aria-label="あなたの状態"></div>
        </div>
      </section>
          <div class="bench-panel"><span class="bench-label">控え</span><div class="bench" id="allyBench"></div>
            <button id="switchButton" class="switch-btn" type="button" aria-label="カードを交代">${icon('ui-swap')}<span>交代</span></button></div>
    <section class="control-dock" aria-label="対戦操作">
      <div class="special-panel">
        <button class="special-info skill-peek" id="allySkillInfo" type="button" aria-label="自分のカードと必殺技の詳細を見る"><span class="skill-caption"><span id="skillStateLabel">必殺技</span><small>詳細 ›</small></span><b id="allySkillName">必殺技</b></button>
        <button id="skillButton" class="gauge-panel" type="button" aria-pressed="false" aria-describedby="skillHint gaugeLabel">
          <span class="special-icon" id="skillGlyph" aria-hidden="true">${icon('fx-copy')}</span>
          <span class="gauge-copy"><span class="gauge-title" id="skillTitle">必殺技</span><small id="skillHint" class="sr-only">ゲージをためる</small></span>
          <span class="gauge-meter"><span class="gauge-count" id="gaugeLabel"><b>0</b><small>/6</small></span><span class="gauge-pips" id="gaugeTrack" aria-hidden="true"></span></span>
        </button>
      </div>
      <div class="dock-row">
        <div class="timer-panel"><span id="inputHint">手を選ぶ</span><span class="timer-value" id="timerLabel">15<small>秒</small></span></div>
      </div>
      <div class="hands">${hand('G', 'グー', 1)}${hand('C', 'チョキ', 2)}${hand('P', 'パー', 3)}</div>
    </section><div id="matchIntro" class="match-intro" hidden role="region" aria-label="対戦開始"></div>`;
  }

  function matchIntro(state) {
    return `<div class="intro-content"><p class="eyebrow">WORD DUEL</p><h2>対戦開始</h2><div class="intro-match"><div><span class="owner-tag you">あなた</span>${card(E.active(state,'A'),{size:'md'})}</div><strong>VS</strong><div><span class="owner-tag cpu">相手 CPU</span>${card(E.active(state,'B'),{size:'md'})}</div></div><p id="introLoadStatus" role="status">対戦の画像を準備中…</p><button id="introSkip" class="primary-button" type="button" disabled>読み込み中…</button></div>`;
  }

  const deferredArt = new Set();
  function loadPicture(pic) {
    const img=pic.querySelector('img[data-src]');
    for(const source of pic.querySelectorAll('source[data-srcset]')){source.srcset=source.dataset.srcset;source.removeAttribute('data-srcset');}
    if(img){img.src=img.dataset.src;img.removeAttribute('data-src');}
    deferredArt.delete(pic);
  }
  const artObserver = typeof IntersectionObserver==='function' ? new IntersectionObserver(entries=>{
    for(const e of entries)if(e.isIntersecting){artObserver.unobserve(e.target);loadPicture(e.target);}
  },{rootMargin:'180px 0px'}) : null;

  function imageFallbacks(root) {
    for(const pic of deferredArt)if(!pic.isConnected){artObserver?.unobserve(pic);deferredArt.delete(pic);}
    root.querySelectorAll('.art-pic img').forEach(img => {
      const fallback = img.closest('.art-pic').nextElementSibling;
      fallback.hidden = !!img.naturalWidth;
      img.onload = () => { img.closest('.art-pic').hidden = false; fallback.hidden = true; };
      img.onerror = () => {
        const pic = img.closest('.art-pic'), sources = pic.querySelectorAll('source');
        if (sources.length) { sources.forEach(s=>s.remove()); img.src = img.getAttribute('src'); return; }
        pic.hidden = true; pic.nextElementSibling.hidden = false;
      };
      if(img.hasAttribute('data-src')){
        const pic=img.closest('.art-pic');
        if(artObserver){deferredArt.add(pic);artObserver.observe(pic);}else loadPicture(pic);
      }
    });
  }

  // Battle view with keyed updates: a card's DOM is kept while it stays in play.
  function createBattleView(root, {onDetail = () => {}} = {}) {
    root.classList.add('mock-layout');
    root.innerHTML = battleMarkup();
    const $ = id => root.querySelector('#' + id);
    const keys = {};
    const once = (k, v) => { if (keys[k] === v) return false; keys[k] = v; return true; };
    const sideName = side => side === 'A' ? 'ally' : 'enemy';
    new ResizeObserver(() => {
      const note=$('affinityNote').getBoundingClientRect(),stage=$('duelStage').getBoundingClientRect();
      if(stage.height)root.style.setProperty('--msg-top',`${note.top+note.height/2-stage.top}px`);
    }).observe($('duelStage'));

    function renderSide(state, side, {instant = false} = {}) {
      const n = sideName(side), w = E.active(state, side), key = `${state[side].index}:${w.id}`;
      const slot = $(n + 'Card');
      if (once(n + 'card', key)) {
        slot.innerHTML = `<button class="card-hit" type="button" aria-label="${escape(w.name)}の詳細">${card(w, {size: 'lg'})}</button>`;
        slot.querySelector('button').onclick = () => onDetail(side, state[side].index);
        if(side==='B')$('enemySkillInfo').onclick=()=>onDetail(side,state[side].index);
        imageFallbacks(slot);
        $(n + 'Stats').innerHTML = stats(w);
        const owner = side === 'A' ? '<span class="owner-tag you">あなた</span>' : '<span class="owner-tag cpu">相手 CPU</span>';
        $(n + 'Hp').innerHTML = `<div class="hp-head">${owner}<b class="hp-name">${escape(w.name)}</b></div>
          <div class="hp-line"><span class="hp-num" aria-label="HP"><b class="hp-cur"></b><span class="hp-sep">/</span><span class="hp-max">${w.maxhp}</span></span>
          <span class="hp-bar" data-side="${n}"><i class="hp-ghost"></i><i class="hp-fill"></i></span></div>`;
        $(n+'SkillName').textContent=w.skill[0];
        if (side === 'A') {
          $('skillGlyph').innerHTML = icon(P.FAMILY[P.family(w.name)].icon);
          root.style.setProperty('--ally-aura', w.color);
        } else root.style.setProperty('--enemy-aura', w.color);
        instant = true;
      }
      const hp = $(n + 'Hp'), ratio = pct(w.hp, w.maxhp);
      hp.querySelector('.hp-cur').textContent = w.hp;
      hp.dataset.level = P.hpLevel(w.hp,w.maxhp);
      for (const el of hp.querySelectorAll('.hp-fill,.hp-ghost')) {
        if (instant) { el.style.transition = 'none'; el.style.transform = `scaleX(${ratio})`; el.getBoundingClientRect(); el.style.transition = ''; }
        else el.style.transform = `scaleX(${ratio})`;
      }
      const st = statuses(w);
      if (once(n + 'status', st)) $(n + 'Status').innerHTML = st;
      if(side==='A'){
        const benchHtml = state[side].team.map((u, i) => i === state[side].index ? '' : mini(u, i, {dead: u.hp <= 0})).join('');
        if (once(n + 'bench', benchHtml)) {
          const bench = $(n + 'Bench');
          bench.innerHTML = benchHtml;
          imageFallbacks(bench);
          bench.querySelectorAll('[data-bench]').forEach(b => b.onclick = () => onDetail(side, +b.dataset.bench));
        }
      }
    }

    function renderAffinity(state) {
      const a = E.active(state, 'A'), b = E.active(state, 'B');
      const mine = E.typeMult(a.type, b.type), theirs = E.typeMult(b.type, a.type);
      const result = mine > 1 ? `<span class="aff-label">相性有利</span><span class="aff-mult">×${mine}</span>`
        : mine < 1 ? `<span class="aff-label">相性不利</span><span class="aff-mult">×${mine}</span>`
        : `<span class="aff-label">相性</span><span class="aff-mult">×1</span>`;
      const html = `<span class="aff-direction">あなたの攻撃</span>${result}`;
      const el = $('affinityNote');
      if (once('aff', html)) { el.innerHTML = html; el.dataset.tone = mine > 1 ? 'good' : mine < 1 ? 'bad' : 'even'; }
      el.setAttribute('aria-label', `自分の攻撃 ×${mine}（${a.type}→${b.type}）。相手の攻撃 ×${theirs}`);
      el.title = `自分の攻撃 ×${mine} / 相手の攻撃 ×${theirs}`;
    }

    // ui: {phase, armed, timeLeft, enabled, switchEnabled, skillEnabled}
    function renderControls(state, ui) {
      root.dataset.phase = ui.phase;
      $('allySkillInfo').disabled = !ui.enabled;
      $('enemySkillInfo').disabled = !ui.enabled;
      root.querySelectorAll('button[data-hand]').forEach(b => { b.disabled = !ui.enabled; });
      const sw = $('switchButton');
      sw.disabled = !ui.switchEnabled;
      const sp = state.A.sp, ready = sp >= 6;
      const skill = $('skillButton');
      skill.disabled = !ui.skillEnabled;
      skill.dataset.state = ui.armed ? 'armed' : ready ? 'ready' : 'charging';
      skill.setAttribute('aria-pressed', String(!!ui.armed));
      skill.setAttribute('aria-label', ui.armed ? `必殺技ON。次の勝利で発動。押すとOFF。ゲージ ${sp}/6` : ready ? `必殺技をONにする。ゲージ ${sp}/6` : `必殺技ゲージ ${sp}/6`);
      $('skillTitle').textContent = ui.armed ? '✓ ON' : ready ? '発動準備' : 'ためる';
      $('allySkillInfo').dataset.state = skill.dataset.state;
      $('skillStateLabel').textContent=ui.armed?'必殺技・発動待ち':ready?'必殺技・使用可能':'必殺技';
      $('skillButton').style.setProperty('--charge',`${sp/6*100}%`);
      $('skillHint').textContent = ui.armed ? '次の勝利で発動' : ready ? 'タップしてON' : `あと${6-sp}で使える`;
      $('gaugeLabel').innerHTML = `<b>${sp}</b><small>/6</small>`;
      const pips = Array.from({length: 6}, (_, i) => `<i class="${i < sp ? 'on' : ''}"></i>`).join('');
      if (once('pips', pips)) $('gaugeTrack').innerHTML = pips;
      $('inputHint').textContent = ui.phase === 'forced' ? '次のカード' : '手を選ぶ';
      $('timerLabel').innerHTML = ui.enabled ? `${ui.timeLeft}<small>秒</small>` : '<span class="timer-wait">—</span>';
      $('timerLabel').dataset.urgent = String(ui.enabled && ui.timeLeft <= 5);
      $('roundLabel').textContent = String(state.round).padStart(2, '0');
      $('battleSettingsButton').disabled = !!ui.lockMenu;
      $('battleHistoryButton').disabled = !ui.enabled;
    }

    function render(state, ui, opts = {}) {
      renderSide(state, 'B', opts);
      renderSide(state, 'A', opts);
      renderAffinity(state);
      renderControls(state, ui);
    }
    function reset() { for (const k of Object.keys(keys)) delete keys[k]; }
    function cardEl(side) { return $(sideName(side) + 'Card'); }
    return {root, $, render, renderControls, reset, cardEl, sideName};
  }

  globalThis.KotoView = {escape, icon, card, mini, stats, statuses, picture, imageFallbacks, battleMarkup, matchIntro, createBattleView, fmtEva};
})();

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
    // Reading time is independent of animation speed and reduced-motion mode.
    const readingTime=text=>Math.max(1400,Math.min(2400,900+text.length*32));
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
        await Promise.all([
          animate(node,[{opacity:0,transform:'translateY(12px) scale(.9)'},{opacity:1,transform:'translateY(0) scale(1)'}],180,token),
          animate(target,[{filter:'brightness(1)'},{filter:'brightness(1.6) saturate(1.3)',offset:.4},{filter:'brightness(1)'}],520,token)
        ]);
        if(!await hold(readingTime(description),token))return;
        await animate(node,[{opacity:1},{opacity:0}],160,token);
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
      if(!await hold(readingTime(explanation),token)){dim.remove();return;}await animate(el,[{opacity:1,transform:'translate(0,-50%)'},{opacity:0,transform:'translate(50px,-50%)'}],130,token);if(alive(token))el.hidden=true;dim.remove();
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
  let audioContext,introResolve;
  const assetLoads=new Map(),mobileArt=()=>matchMedia('(max-width:600px)').matches;
  const assetUrl=w=>KotoPresent.art(w)[mobileArt()?'mobile':'webp'];
  const materials=['moon-arena-preview.webp','arena-hud-plate.webp','arena-card-podium.webp','mosaic.png','sparkle.png'].map(n=>'battle-ui/assets/img/'+n);
  function loadAsset(url){
    if(assetLoads.has(url))return assetLoads.get(url);
    const preload=[...document.querySelectorAll('link[rel="preload"][as="image"]')].find(l=>l.getAttribute('href')===url&&(!l.media||matchMedia(l.media).matches));
    const promise=new Promise((resolve,reject)=>{
      if(preload){
        if(preload.dataset.loaded==='true'){resolve();return;}
        if(preload.dataset.failed==='true'){reject(Error('Preload failed'));return;}
        const t=setTimeout(()=>reject(Error('Preload timeout')),12000);
        preload.addEventListener('load',()=>{clearTimeout(t);resolve();},{once:true});preload.addEventListener('error',()=>{clearTimeout(t);reject(Error('Preload failed'));},{once:true});return;
      }
      const img=new Image(),timer=setTimeout(()=>reject(Error('Image load timeout')),12000);
      img.fetchPriority='high';img.onload=()=>{clearTimeout(timer);img.decode().catch(()=>{}).then(resolve);};img.onerror=()=>{clearTimeout(timer);reject(Error('Image load failed'));};img.src=url;
    }).catch(e=>{assetLoads.delete(url);throw e;});
    assetLoads.set(url,promise);return promise;
  }
  async function prepareAssets(urls,progress){
    const unique=[...new Set(urls)];let done=0;
    progress?.(0,unique.length);
    await Promise.all(unique.map(async url=>{await loadAsset(url);progress?.(++done,unique.length);}));
  }
  async function bootSetup(){
    const cover=$('bootLoading'),status=$('bootStatus'),retry=$('bootRetry');
    retry.hidden=true;
    try{
      await Promise.all([...document.querySelectorAll('link[data-game-style]')].map(link=>link.dataset.loaded==='true'?Promise.resolve():new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Style load timeout')),12000);link.addEventListener('load',()=>{clearTimeout(t);resolve();},{once:true});link.addEventListener('error',()=>{clearTimeout(t);reject(Error('Style load failed'));},{once:true});})));
      if(!$('wordGrid').childElementCount){filters();renderSetup();}
      await new Promise(r=>requestAnimationFrame(r));
      const visible=[...document.querySelectorAll('#setupScreen .art-pic')].filter(p=>p.getBoundingClientRect().top<innerHeight+50);
      const art=visible.map(p=>mobileArt()?p.querySelector('source[media]').getAttribute('srcset')||p.querySelector('source[media]').dataset.srcset:p.querySelector('source:not([media])').getAttribute('srcset')||p.querySelector('source:not([media])').dataset.srcset);
      await prepareAssets([...materials,...art],(n,total)=>{status.textContent=`カードを準備中 ${Math.round(n/total*100)}%`;});
      await Promise.all(visible.map(p=>p.querySelector('img').decode().catch(()=>{})));
      cover.hidden=true;
    }
    catch{status.textContent='読み込みが進まないため、もう一度お試しください';retry.hidden=false;retry.onclick=()=>location.reload();}
  }
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function randomTeam(){const a=D.WORDS.map(w=>w.id),r=[];for(let i=0;i<3;i++)r.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);return r;}
  function tone(kind='select'){
    if(!options.se)return;
    try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;o.type=kind==='swing'?'triangle':'sine';o.frequency.setValueAtTime(kind==='swing'?120:kind==='win'?660:kind==='place'?280:480,t);o.frequency.exponentialRampToValueAtTime(kind==='swing'?880:kind==='win'?990:220,t+.12);g.gain.setValueAtTime(options.se*(kind==='swing'?.08:.12),t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.16);}catch{}
  }
  function sound(kind){const a=audio[kind];if(!a||!options.se)return;const copy=a.cloneNode();copy.volume=options.se;voices.add(copy);copy.play().catch(()=>voices.delete(copy));copy.onended=()=>voices.delete(copy);}
  function music(){audio.bgm.volume=options.bgm;if(options.bgm)audio.bgm.play().catch(()=>{});else audio.bgm.pause();}
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2300);}
  function card(w,lazy=false){return V.card(w,{size:'md',lazy});}
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
    $('wordGrid').innerHTML=list.map(w=>{const chosen=team.indexOf(w.id);return `<div class="word-entry ${chosen>=0?'in-team':''}" data-word="${w.id}"><button class="word-pick" data-pick="${w.id}" type="button" aria-label="${escape(w.name)}を${slot+1}枚目にセット">${card(w,true)}${chosen>=0?`<span class="chosen-badge" aria-label="${chosen+1}枚目に編成中">✓</span>`:''}</button><button class="word-more" data-detail="${w.id}" type="button" aria-label="${escape(w.name)}の詳細を見る">ⓘ</button></div>`;}).join('');
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
  function showScreen(which){screen=which;for(const n of ['setup','battle','result'])$(n+'Screen').hidden=n!==which;document.body.classList.toggle('in-battle',which==='battle');document.body.classList.toggle('in-result',which==='result');$(which+'Screen').classList.remove('screen-enter');requestAnimationFrame(()=>$(which+'Screen').classList.add('screen-enter'));if(which!=='battle')audio.bgm.pause();window.scrollTo(0,0);}
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
      message(`${w.name}の必殺技「${ev.title}」`,4500);await fx.cutIn(w,ev,token);if(token!==epoch)return;renderBattle();
      const source=ev.copyFrom===null?w:D.WORDS[ev.copyFrom];
      const statusCopy={title:source.skill[0],description:source.skill[1]};
      log.push(`必殺技の効果：${ev.title} — ${statusCopy.description}${ev.copyFrom!==null?' コピーで威力2倍。':''}`);
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
  function clean(){epoch++;if(introResolve){introResolve(false);introResolve=null;}$('matchIntro').hidden=true;pauseTimers();clearTimeout(toastTimer);clearTimeout(messageTimer);$('toast').hidden=true;$('battleMessage').classList.remove('show');fx.cancel();for(const a of voices)a.pause();voices.clear();if(forcedResolve){forcedResolve(null);forcedResolve=null;}$('panelDialog').dataset.forced='false';if($('panelDialog').open)$('panelDialog').close();}
  async function start(){
    clean();cpu=randomTeam();state=E.create(team,cpu);log=[];armed=false;phase='animating';const token=epoch;
    battleView.reset();showScreen('battle');renderBattle();$('inputHint').textContent='準備中';
    const intro=$('matchIntro');delete intro.dataset.ready;intro.innerHTML=V.matchIntro(state);V.imageFallbacks(intro);intro.hidden=false;
    const skipped=new Promise(resolve=>{introResolve=resolve;});
    $('introSkip').onclick=()=>introResolve?.(true);
    const assets=[...state.A.team,...state.B.team].map(assetUrl).concat(materials,`battle-ui/assets/img/${mobileArt()?'moon-arena-mobile.webp':'moon-arena.webp'}`);
    let prepared=false;
    while(token===epoch&&!prepared){
      try{await prepareAssets(assets,(n,total)=>{if(token===epoch)$('introLoadStatus').textContent=`対戦の画像を準備中 ${Math.round(n/total*100)}%`;});prepared=true;}
      catch{if(token!==epoch)return;$('introLoadStatus').textContent='画像を読み込めませんでした';$('introSkip').disabled=false;$('introSkip').textContent='もう一度読み込む';await skipped;if(token!==epoch)return;introResolve=null;$('introSkip').disabled=true;await start();return;}
    }
    if(token!==epoch)return;
    intro.dataset.ready='true';$('introLoadStatus').textContent='準備完了。じゃんけんで攻撃を決めよう';$('introSkip').disabled=false;$('introSkip').textContent='対戦へ ›';
    await skipped;
    if(token!==epoch)return;
    introResolve=null;
    intro.hidden=true;
    const fronts=[...document.querySelectorAll('#allyCard .art-pic img,#enemyCard .art-pic img')];
    Promise.all(fronts.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))).then(()=>{if(token===epoch&&screen==='battle')music();});
    message(`対戦開始！ ${affinityText()}`,1400);
    await Promise.all(['allyCard','enemyCard'].map((id,i)=>animate($(id),[{opacity:0,transform:`translateX(${i?70:-70}px) rotate(${i?15:-15}deg)`},{opacity:1,transform:getComputedStyle($(id)).transform}],650,token)));
    if(token===epoch)beginInput();
  }
  function finish(){
    phase='ended';pauseTimers();controls();audio.bgm.pause();const win=state.winner==='A';
    $('resultScreen').dataset.outcome=win?'win':'lose';$('resultTitle').textContent=win?'YOU WIN':'YOU LOSE';
    $('resultOutcome').textContent=win?'勝利':'敗北';$('resultCopy').textContent=win?'3枚でつかんだ勝利。次の対戦へ。':'相性と交代を見直して、もう一度挑戦しよう。';
    $('resultEmblem').innerHTML=V.icon(win?'fx-guard':'stat-atk');
    $('resultStats').innerHTML=`<div><small>ラウンド</small><b>${state.round}</b></div><div><small>撃破</small><b>${state.B.team.filter(w=>w.hp<=0).length}<span>/3</span></b></div><div><small>生存</small><b>${state.A.team.filter(w=>w.hp>0).length}<span>/3</span></b></div>`;
    $('resultCards').innerHTML=state.A.team.map((w,i)=>`<div class="result-card" data-alive="${w.hp>0}" data-featured="${win&&i===state.A.index}">${card(w)}<p class="result-hp">${w.hp>0?`HP ${w.hp} / ${w.maxhp}`:'戦闘不能'}</p></div>`).join('');
    $('rematchButton').textContent=win?'もう一度対戦 ›':'もう一度挑戦 ›';$('backToSetup').textContent=win?'編成を変える':'編成を見直す';
    imageFallbacks($('resultCards'));if(win)tone('win');showScreen('result');
  }
  $('randomTeam').onclick=()=>{team=randomTeam();storage.set('currentTeam',team);slot=0;renderSetup();tone('place');};
  $('searchInput').oninput=renderGrid;$('startBattle').onclick=start;$('rematchButton').onclick=start;
  $('backToSetup').onclick=()=>{clean();phase='idle';showScreen('setup');renderSetup();};$('leaveBattle').onclick=()=>{if(!confirm('対戦を終了して編成に戻りますか？'))return;clean();phase='idle';showScreen('setup');renderSetup();};
  $('rulesButton').onclick=openRules;$('settingsButton').onclick=openSettings;$('battleSettingsButton').onclick=openSettings;
  $('battleHistoryButton').onclick=openHistory;
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
  requestAnimationFrame(bootSetup);
})();
