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
