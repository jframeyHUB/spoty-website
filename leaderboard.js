// SPOTY homepage leaderboards: sample data, race bars, gentle live ticking.
// Profile photos: drop a file at /assets/people/<id>.jpg and set `photo: true` on that person.

(function () {
  const FLAGS = { gb: 'United Kingdom', ng: 'Nigeria', sg: 'Singapore', it: 'Italy', es: 'Spain', de: 'Germany', ie: 'Ireland' };

  // Illustrated stand-ins until real photos are added.
  // [skin, hairColour, hairStyle, background, shirt]
  const LOOKS = {
    amara: ['#8E5A38', '#1D1411', 'afro', '#FBF1D9', '#0F2742'],
    daniel: ['#F1C7A6', '#6B4423', 'beard', '#E6F1FF', '#1F66D9'],
    liam: ['#E9C29C', '#141414', 'parted', '#E2F8EF', '#3E4C61'],
    sofia: ['#D9A97E', '#3B2416', 'long', '#FFF0E3', '#B44D0C'],
    elena: ['#E0AC7A', '#2A1A12', 'bun', '#E6F1FF', '#0B7A5A'],
    jonas: ['#F3CDB0', '#B8894F', 'short', '#EEF3F8', '#0F2742'],
    chidi: ['#6E4329', '#141414', 'short', '#FBF1D9', '#1F66D9'],
    grace: ['#7A4A2E', '#1D1411', 'long', '#E2F8EF', '#3E4C61'],
    ben: ['#F1C7A6', '#C2873F', 'short', '#FFF0E3', '#0B7A5A'],
    priya: ['#C98E62', '#141414', 'long', '#E6F1FF', '#B44D0C'],
    marcus: ['#5C3A24', '#141414', 'beard', '#EEF3F8', '#0F2742'],
    hannah: ['#F3CDB0', '#8A5A2B', 'bun', '#FBF1D9', '#1F66D9'],
    owen: ['#EBC1A0', '#3B2416', 'parted', '#E2F8EF', '#B44D0C'],
    nina: ['#F3D3BC', '#D8B26A', 'long', '#EEF3F8', '#0B7A5A'],
    jack: ['#EFC3A2', '#7A2E14', 'short', '#E6F1FF', '#3E4C61'],
    maya: ['#B9825A', '#1D1411', 'bun', '#FFF0E3', '#0F2742'],
    kai: ['#E4BC93', '#141414', 'short', '#FBF1D9', '#1F66D9']
  };

  const BOARDS = {
    global: {
      label: 'Global', prize: 'The Wolf',
      people: [
        ['amara', 'Amara Okafor', 'Head of Sales · Fintech', 'ng', 248],
        ['daniel', 'Daniel Hughes', 'Field Sales Manager', 'gb', 231],
        ['liam', 'Liam Chen', 'Account Executive · SaaS', 'sg', 197],
        ['sofia', 'Sofia Rossi', 'Medical Device Sales', 'it', 176],
        ['elena', 'Elena García', 'Enterprise Sales · SaaS', 'es', 162],
        ['jonas', 'Jonas Weber', 'Industrial Sales', 'de', 151],
        ['chidi', 'Chidi Eze', 'Telecoms Sales', 'ng', 139],
        ['grace', 'Grace Okoro', 'SaaS Sales · London', 'gb', 128]
      ]
    },
    national: {
      label: 'United Kingdom', prize: 'President · UK',
      people: [
        ['daniel', 'Daniel Hughes', 'Field Sales Manager · Manchester', 'gb', 231],
        ['grace', 'Grace Okoro', 'SaaS Sales · London', 'gb', 214],
        ['ben', 'Ben Carter', 'Car Sales · Leeds', 'gb', 188],
        ['priya', 'Priya Shah', 'Senior Recruiter · London', 'gb', 173],
        ['marcus', 'Marcus Reid', 'Property Sales · London', 'gb', 160],
        ['hannah', 'Hannah Cole', 'Insurance Sales · Bristol', 'gb', 149],
        ['owen', 'Owen Price', 'Energy Sales · Cardiff', 'gb', 133],
        ['maya', 'Maya Singh', 'Recruitment · Birmingham', 'gb', 121]
      ]
    },
    age: {
      label: 'Ages 25–34', prize: 'Prime Closer · 25–34',
      people: [
        ['grace', 'Grace Okoro', 'Age 28 · SaaS Sales', 'gb', 214],
        ['liam', 'Liam Chen', 'Age 31 · Account Executive', 'sg', 197],
        ['ben', 'Ben Carter', 'Age 33 · Car Sales', 'gb', 188],
        ['nina', 'Nina Petrova', 'Age 26 · Pharma Sales', 'de', 170],
        ['jack', 'Jack Ellis', 'Age 34 · Property Sales', 'ie', 158],
        ['maya', 'Maya Singh', 'Age 25 · Recruitment', 'gb', 144],
        ['kai', 'Kai Tanaka', 'Age 27 · SaaS Sales', 'sg', 131],
        ['owen', 'Owen Price', 'Age 32 · Energy Sales', 'gb', 120]
      ]
    }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function avatarSvg(id) {
    const [skin, hair, style, bg, shirt] = LOOKS[id] || LOOKS.jonas;
    const shade = 'rgba(0,0,0,0.12)';
    let behind = '', front = '';
    if (style === 'afro') behind = `<circle cx="40" cy="31" r="21" fill="${hair}"/><circle cx="23" cy="38" r="8" fill="${hair}"/><circle cx="57" cy="38" r="8" fill="${hair}"/>`;
    if (style === 'long') behind = `<path d="M23 36 C22 16 33 11 40 11 C49 11 58 16 57 36 L59 62 C53 58 51 52 51 46 L29 46 C29 52 27 58 21 62 Z" fill="${hair}"/>`;
    if (style === 'bun') behind = `<circle cx="40" cy="15" r="8" fill="${hair}"/>`;
    if (style === 'afro') front = `<path d="M27 31 C29 23 34 20 40 20 C46 20 51 23 53 31 C48 27 32 27 27 31 Z" fill="${hair}"/>`;
    else if (style === 'long') front = `<path d="M26 31 C27 20 34 17 41 17 C47 17 53 21 54 30 C47 23 35 23 26 31 Z" fill="${hair}"/>`;
    else if (style === 'parted') front = `<path d="M25 33 C24 17 33 13 41 13 C50 13 56 18 55 33 C53 25 49 21 44 20 C38 23 31 25 25 33 Z" fill="${hair}"/>`;
    else front = `<path d="M26 32 C26 18 34 15 40 15 C48 15 55 19 54 32 C52 25 46 22 40 22 C34 22 29 25 26 32 Z" fill="${hair}"/>`;
    if (style === 'beard') front += `<path d="M27 35 C27 47 34 51 40 51 C46 51 53 47 53 35 C52 43 47 47 40 47 C33 47 28 43 27 35 Z" fill="${hair}"/>`;
    return `<svg viewBox="0 0 80 80" aria-hidden="true"><rect width="80" height="80" fill="${bg}"/>${behind}<path d="M12 80 C12 62 26 54 40 54 C54 54 68 62 68 80 Z" fill="${shirt}"/><path d="M33 54 L40 63 L47 54 Z" fill="#fff"/><rect x="34" y="44" width="12" height="13" rx="5" fill="${skin}"/><rect x="34" y="44" width="12" height="13" rx="5" fill="${shade}"/><ellipse cx="40" cy="34" rx="14" ry="16" fill="${skin}"/>${front}<circle cx="35" cy="34" r="1.7" fill="#2B1A12"/><circle cx="45" cy="34" r="1.7" fill="#2B1A12"/><path d="M36 41 Q40 44 44 41" fill="none" stroke="#2B1A12" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }

  function avatar(p, size) {
    const pic = p.photo ? `<img src="/assets/people/${p.id}.jpg" alt="" width="${size}" height="${size}">` : avatarSvg(p.id);
    return `<span class="av" style="--s:${size}px">${pic}<img class="av-flag" src="/assets/flags/${p.country}.svg" alt="${FLAGS[p.country]}" width="18" height="12"></span>`;
  }

  const MEDAL = { 1: ['#E2A925', '#FFF4D6', 'gold'], 2: ['#C3CCD8', '#FFFFFF', 'silver'], 3: ['#C98451', '#F6D9C2', 'bronze'] };
  function rankMark(rank) {
    if (!MEDAL[rank]) return `<span class="rk-num">${rank}</span>`;
    const [fill, ring, name] = MEDAL[rank];
    return `<svg class="rk-medal" viewBox="0 0 30 36" role="img" aria-label="${rank}${['', 'st', 'nd', 'rd'][rank]}, ${name}"><path d="M9 18 L5 34 L10 31 L13 35 L15 22 Z" fill="#0F2742"/><path d="M21 18 L25 34 L20 31 L17 35 L15 22 Z" fill="#1F66D9"/><circle cx="15" cy="13" r="12" fill="${fill}"/><circle cx="15" cy="13" r="9" fill="none" stroke="${ring}" stroke-width="1.2"/><text x="15" y="17.4" text-anchor="middle" font-size="12" font-weight="800" fill="#1B1F24" font-family="Arial, sans-serif">${rank}</text></svg>`;
  }

  const TROPHY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 H17 V9 A5 5 0 0 1 7 9 Z M7 6 H4 A3 3 0 0 0 7 10 M17 6 H20 A3 3 0 0 1 17 10 M12 14 V18 M8 21 H16 M9 18 H15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function makeState(key) {
    const b = BOARDS[key];
    return { key, label: b.label, prize: b.prize, people: b.people.map(([id, name, role, country, votes]) => ({ id, name, role, country, votes })) };
  }

  // ---------- Compact race (hero) ----------
  function renderRace(el, state, limit) {
    const top = state.people.slice(0, limit);
    const lead = top[0].votes;
    el.innerHTML = `
      <div class="race-head"><span class="race-kicker">SPOTY 2027 · ${state.label}</span><span class="race-title">Leaderboard</span></div>
      <ol class="race-list">${top.map((p, i) => raceRow(p, i + 1, lead, state.prize)).join('')}</ol>
      <div class="race-you"><span class="rk"><span class="rk-num">?</span></span><span class="av av-you" style="--s:40px">?</span><span class="race-who"><b>You</b><small>Your place, once you join</small></span><span class="race-votes"><b>?</b><small>votes</small></span></div>
      <p class="race-foot">Sample data · Voting closes 31 Dec 2027</p>`;
  }
  function raceRow(p, rank, lead, prize) {
    const pct = Math.max(8, Math.round((p.votes / lead) * 100));
    const gap = lead - p.votes;
    const sub = rank === 1 ? `<span class="race-prize">${TROPHY}On track for ${prize}</span>` : `<small>${p.role}</small>`;
    return `<li class="race-row${rank === 1 ? ' is-lead' : ''}" data-id="${p.id}">
      <span class="rk">${rankMark(rank)}</span>
      ${avatar(p, rank === 1 ? 48 : 40)}
      <span class="race-who"><b>${p.name}</b>${sub}<span class="bar"><span class="bar-fill" style="width:${pct}%"></span></span></span>
      <span class="race-votes"><b data-votes>${p.votes}</b><small>${rank === 1 ? 'votes' : gap + ' behind'}</small></span>
    </li>`;
  }

  // ---------- Full board (section) ----------
  function renderFull(el, state) {
    const [a, b, c] = state.people;
    const lead = a.votes;
    const pod = (p, rank) => `<li class="pod pod-${rank}" data-id="${p.id}">
        ${rank === 1 ? '<img class="pod-rosette" src="/assets/spoty-mark.svg" alt="" width="34" height="41">' : `<span class="pod-rank">${rank}</span>`}
        ${avatar(p, rank === 1 ? 112 : 84)}
        <b class="pod-name">${p.name}</b><small class="pod-role">${p.role}</small>
        <span class="pod-votes"><b data-votes>${p.votes}</b> votes</span>
        ${rank === 1 ? `<span class="race-prize">${TROPHY}On track for ${state.prize}</span>` : `<small class="pod-gap">${lead - p.votes} behind 1st</small>`}
      </li>`;
    el.innerHTML = `
      <ol class="podium">${pod(b, 2)}${pod(a, 1)}${pod(c, 3)}</ol>
      <ol class="fb-list" start="4">${state.people.slice(3).map((p, i) => fullRow(p, i + 4, lead)).join('')}</ol>
      <div class="fb-row fb-you"><span class="rk"><span class="rk-num">?</span></span><span class="av av-you" style="--s:44px">?</span><span class="fb-who"><b>You</b><small>Create a free profile to take your place</small></span><span class="fb-bar"></span><span class="fb-votes"><b>?</b></span><a class="btn btn-gold btn-sm" href="#join">Join</a></div>`;
  }
  function fullRow(p, rank, lead) {
    const pct = Math.max(8, Math.round((p.votes / lead) * 100));
    return `<li class="fb-row" data-id="${p.id}">
      <span class="rk">${rankMark(rank)}</span>
      ${avatar(p, 44)}
      <span class="fb-who"><b>${p.name}</b><small>${p.role}</small></span>
      <span class="fb-bar"><span class="bar"><span class="bar-fill" style="width:${pct}%"></span></span><small>${lead - p.votes} behind 1st</small></span>
      <span class="fb-votes"><b data-votes>${p.votes}</b><small>votes</small></span>
    </li>`;
  }

  // ---------- Live ticking with smooth overtakes ----------
  function flip(container, render) {
    const before = new Map();
    container.querySelectorAll('[data-id]').forEach((n) => before.set(n.dataset.id, n.getBoundingClientRect()));
    render();
    container.querySelectorAll('[data-id]').forEach((n) => {
      const old = before.get(n.dataset.id);
      if (!old) return;
      const now = n.getBoundingClientRect();
      const dx = old.left - now.left, dy = old.top - now.top;
      if (!dx && !dy) return;
      n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }

  function tick(state, onChange) {
    const pool = state.people.slice(0, 6);
    const p = pool[Math.floor(Math.random() * pool.length)];
    p.votes += 1;
    state.lastId = p.id;
    state.people.sort((x, y) => y.votes - x.votes);
    onChange();
  }

  function pulse(container, id) {
    const n = container.querySelector(`[data-id="${id}"] [data-votes]`);
    if (n) n.animate([{ color: '#0B7A5A', transform: 'scale(1.12)' }, { color: '', transform: 'scale(1)' }], { duration: 900, easing: 'ease-out' });
  }

  // Hero
  const heroEl = document.querySelector('[data-board="hero"]');
  const heroState = makeState('global');
  if (heroEl) renderRace(heroEl, heroState, 5);

  // Full section
  const fullEl = document.querySelector('[data-board="full"]');
  const tabs = document.querySelectorAll('[data-board-tab]');
  const states = { global: makeState('global'), national: makeState('national'), age: makeState('age') };
  let active = 'global';
  if (fullEl) renderFull(fullEl, states[active]);
  tabs.forEach((t) => t.addEventListener('click', () => {
    active = t.dataset.boardTab;
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
    renderFull(fullEl, states[active]);
  }));

  if (!reduceMotion) {
    setInterval(() => {
      if (document.hidden) return;
      if (heroEl) tick(heroState, () => { flip(heroEl, () => renderRace(heroEl, heroState, 5)); pulse(heroEl, heroState.lastId); });
    }, 3200);
    setInterval(() => {
      if (document.hidden || !fullEl) return;
      const s = states[active];
      tick(s, () => { flip(fullEl, () => renderFull(fullEl, s)); pulse(fullEl, s.lastId); });
    }, 4100);
  }
})();
