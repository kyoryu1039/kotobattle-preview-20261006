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

  function picture(w, cls = '') {
    const a = P.art(w);
    return `<picture class="art-pic ${cls}" style="${a.style}"><source type="image/webp" srcset="${a.webp}"><img src="${a.png}" alt="${escape(w.name)}" draggable="false" decoding="async"></picture><span class="art-fallback" hidden>${escape(w.name.slice(0, 1))}</span>`;
  }

  // Card face. Name and move text are DOM text so long names wrap (max 2 lines).
  function card(w, {size = 'lg', extra = ''} = {}) {
    const fam = P.family(w.name);
    return `<div class="kcard kcard-${size}" data-rank="${w.rank}" data-type="${P.typeKey(w.type)}" style="--type:${w.color}" ${extra}>
      <div class="kcard-frame"><div class="kcard-body">
        <div class="kcard-art">${picture(w)}</div>
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
    return `<div class="arena-bg" aria-hidden="true"></div>
    <header class="battle-head">
      <button id="leaveBattle" class="metal-btn" type="button" aria-label="対戦をやめて編成に戻る">${icon('ui-back')}</button>
      <h1 class="battle-title">ことばバトル</h1>
      <div class="round-badge" aria-label="ラウンド"><small>ROUND</small><b id="roundLabel">01</b></div>
      <button id="battleSettingsButton" class="metal-btn" type="button" aria-label="設定と履歴">${icon('ui-gear')}</button>
    </header>
    <div class="duel" id="duelStage">
      <section class="side side-enemy" aria-label="相手">
        <div class="side-info">
          <div class="hp-block" id="enemyHp"></div>
          <div class="stat-panel" id="enemyStats"></div>
          <div class="status-row" id="enemyStatus" aria-label="相手の状態"></div>
        </div>
        <div class="card-slot enemy" id="enemyCard"></div>
      </section>
      <div class="vs-row" aria-hidden="false"><div class="vs-mark" aria-hidden="true">VS</div><div class="affinity" id="affinityNote"></div></div>
      <section class="side side-ally" aria-label="あなた">
        <div class="card-slot ally" id="allyCard"></div>
        <div class="side-info">
          <button class="skill-peek" id="allySkillInfo" type="button" aria-label="自分のカードと必殺技の詳細を見る"><span>✦ <b id="allySkillName">必殺技</b></span><small>技を見る ›</small></button>
          <div class="stat-panel" id="allyStats"></div>
          <div class="status-row" id="allyStatus" aria-label="あなたの状態"></div>
          <div class="bench-panel"><span class="bench-label">控え</span><div class="bench" id="allyBench"></div>
            <button id="switchButton" class="switch-btn" type="button" aria-label="カードを交代">${icon('ui-swap')}<span>交代</span></button></div>
        </div>
        <div class="hp-block" id="allyHp"></div>
      </section>
      <div id="fxLayer" class="fx-layer" aria-hidden="true"></div>
      <div id="jankenReveal" class="janken-reveal" hidden></div>
      <div id="skillCutIn" class="skill-cutin" hidden></div>
      <div class="battle-message" id="battleMessage" role="status" aria-live="polite"></div>
    </div>
    <section class="control-dock" aria-label="対戦操作">
      <div class="dock-row">
        <button id="skillButton" class="gauge-panel" type="button" aria-pressed="false" aria-describedby="skillHint gaugeLabel">
          <span class="gauge-copy"><span class="gauge-title" id="skillTitle">必殺技</span><small id="skillHint">ゲージをためる</small></span><span class="gauge-count" id="gaugeLabel"><b>0</b><small>/6</small></span><span class="gauge-pips" id="gaugeTrack" aria-hidden="true"></span>
        </button>
        <div class="timer-panel"><span id="inputHint">手を選ぶ</span><span class="timer-value" id="timerLabel">15<small>秒</small></span></div>
      </div>
      <div class="hands">${hand('G', 'グー', 1)}${hand('C', 'チョキ', 2)}${hand('P', 'パー', 3)}</div>
    </section>`;
  }

  function imageFallbacks(root) {
    root.querySelectorAll('.art-pic img').forEach(img => {
      img.onerror = () => {
        const pic = img.closest('.art-pic'), source = pic.querySelector('source');
        if (source) { source.remove(); img.src = img.getAttribute('src'); return; }
        pic.hidden = true; pic.nextElementSibling.hidden = false;
      };
      if (img.complete && !img.naturalWidth) img.onerror();
    });
  }

  // Battle view with keyed updates: a card's DOM is kept while it stays in play.
  function createBattleView(root, {onDetail = () => {}} = {}) {
    root.innerHTML = battleMarkup();
    const $ = id => root.querySelector('#' + id);
    const keys = {};
    const once = (k, v) => { if (keys[k] === v) return false; keys[k] = v; return true; };
    const sideName = side => side === 'A' ? 'ally' : 'enemy';

    function renderSide(state, side, {instant = false} = {}) {
      const n = sideName(side), w = E.active(state, side), key = `${state[side].index}:${w.id}`;
      const slot = $(n + 'Card');
      if (once(n + 'card', key)) {
        slot.innerHTML = `<button class="card-hit" type="button" aria-label="${escape(w.name)}の詳細">${card(w, {size: 'lg'})}</button>`;
        slot.querySelector('button').onclick = () => onDetail(side, state[side].index);
        imageFallbacks(slot);
        $(n + 'Stats').innerHTML = stats(w);
        const owner = side === 'A' ? '<span class="owner-tag you">あなた</span>' : '<span class="owner-tag cpu">相手 CPU</span>';
        $(n + 'Hp').innerHTML = `<div class="hp-head">${owner}<b class="hp-name">${escape(w.name)}</b></div>
          <div class="hp-line"><span class="hp-num" aria-label="HP"><b class="hp-cur"></b><span class="hp-sep">/</span><span class="hp-max">${w.maxhp}</span></span>
          <span class="hp-bar" data-side="${n}"><i class="hp-ghost"></i><i class="hp-fill"></i></span></div>`;
        if(side==='A')$('allySkillName').textContent=w.skill[0];
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
      const html = mine > 1 ? `<span class="aff-label">相性有利</span><span class="aff-mult">×${mine}</span>`
        : mine < 1 ? `<span class="aff-label">相性不利</span><span class="aff-mult">×${mine}</span>`
        : `<span class="aff-label">相性</span><span class="aff-mult">×1</span>`;
      const el = $('affinityNote');
      if (once('aff', html)) { el.innerHTML = html; el.dataset.tone = mine > 1 ? 'good' : mine < 1 ? 'bad' : 'even'; }
      el.setAttribute('aria-label', `自分の攻撃 ×${mine}（${a.type}→${b.type}）。相手の攻撃 ×${theirs}`);
      el.title = `自分の攻撃 ×${mine} / 相手の攻撃 ×${theirs}`;
    }

    // ui: {phase, armed, timeLeft, enabled, switchEnabled, skillEnabled}
    function renderControls(state, ui) {
      root.querySelectorAll('button[data-hand]').forEach(b => { b.disabled = !ui.enabled; });
      const sw = $('switchButton');
      sw.disabled = !ui.switchEnabled;
      const sp = state.A.sp, ready = sp >= 6;
      const skill = $('skillButton');
      skill.disabled = !ui.skillEnabled;
      skill.dataset.state = ui.armed ? 'armed' : ready ? 'ready' : 'charging';
      skill.setAttribute('aria-pressed', String(!!ui.armed));
      skill.setAttribute('aria-label', ui.armed ? `必殺技ON。次の勝利で発動。押すとOFF。ゲージ ${sp}/6` : ready ? `必殺技をONにする。ゲージ ${sp}/6` : `必殺技ゲージ ${sp}/6`);
      $('skillTitle').textContent = ui.armed ? '必殺技 ON！' : ready ? '必殺技をON' : '必殺技';
      $('skillHint').textContent = ui.armed ? '次の勝利で発動' : ready ? 'タップしてON' : `あと${6-sp}で使える`;
      $('gaugeLabel').innerHTML = `<b>${sp}</b><small>/6</small>`;
      const pips = Array.from({length: 6}, (_, i) => `<i class="${i < sp ? 'on' : ''}"></i>`).join('');
      if (once('pips', pips)) $('gaugeTrack').innerHTML = pips;
      $('inputHint').textContent = ui.phase === 'forced' ? '次のカード' : '手を選ぶ';
      $('timerLabel').innerHTML = ui.enabled ? `${ui.timeLeft}<small>秒</small>` : '<span class="timer-wait">—</span>';
      $('timerLabel').dataset.urgent = String(ui.enabled && ui.timeLeft <= 5);
      $('roundLabel').textContent = String(state.round).padStart(2, '0');
      $('battleSettingsButton').disabled = !!ui.lockMenu;
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

  globalThis.KotoView = {escape, icon, card, mini, stats, statuses, picture, imageFallbacks, battleMarkup, createBattleView, fmtEva};
})();
