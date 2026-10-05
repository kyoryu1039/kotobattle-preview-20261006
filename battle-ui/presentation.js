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
      webp: `images/webp/${base}.webp`, png: `images/webp/${base}.webp`,
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
