/* lifeonnfilmm — main.js (vanilla, no build) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const P = window.PHOTOS || [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const FULL = p => `img/full/${p.src}`;
  const SAVE = p => `img/save/${p.src}`; // 3000px copies: what a saved photo is (see README, "Saving photos")
  const saver = !!(navigator.connection && navigator.connection.saveData);
  /* once someone stays on a big photo, quietly swap in the 3000px copy so holding it saves that.
     Flicking through frames never loads it; data saver never does. */
  function upgradeImg(img, p, still) {
    if (fine || saver) return;
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { if (still()) img.src = im.src; };
    im.src = SAVE(p);
  }
  const THUMB = p => `img/thumb/${p.src}`;
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  /* ---------- social links: fill these in ---------- */
  const SOCIAL = {
    instagram: 'https://www.instagram.com/lifeonnfilmm/',
    x: 'https://x.com/tarekmou333',
    youtube: 'https://www.youtube.com/@lifeonnfilm'
  };
  $$('[data-social]').forEach(a => {
    const url = SOCIAL[a.dataset.social];
    if (url) a.href = url; else a.addEventListener('click', e => { e.preventDefault(); flash(); });
  });

  /* ---------- x sticker: latest posts ----------
     /api/tweets (Vercel function, reads the public x.com profile) with js/tweets.json as the
     offline / outage fallback. Renders the 2 latest posts. */
  (() => {
    const list = $('#xFeed'); if (!list) return;
    const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const when = ms => {
      const d = (Date.now() - ms) / 6e4;
      if (d < 60) return `${Math.max(1, Math.round(d))}m ago`;
      if (d < 60 * 24) return `${Math.round(d / 60)}h ago`;
      if (d < 60 * 24 * 10) return `${Math.round(d / 1440)}d ago`;
      const dt = new Date(ms); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
    };
    const render = data => {
      const items = (data.tweets || []).slice(0, 2);
      if (!items.length) { list.innerHTML = '<li class="xfeed-wait">nothing posted yet</li>'; return; }
      list.innerHTML = items.map(t => {
        const ref = t.ref ? `<span class="xfeed-ref"><b>${t.kind === 'repost' ? 'rt' : '&#8627;'} @${esc(t.ref.handle)}</b> ${esc(t.ref.text)}</span>` : '';
        return `<li><a href="${esc(t.url)}" target="_blank" rel="noopener"><span class="xfeed-when">${when(t.ms)}</span>${t.text ? `<span class="xfeed-text">${esc(t.text)}</span>` : ''}${ref}</a></li>`;
      }).join('');
      $$('a', list).forEach(a => a.addEventListener('click', flash));
    };
    const get = async url => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); return r.json(); };
    get('/api/tweets').catch(() => get('js/tweets.json')).then(render).catch(() => { list.innerHTML = '<li class="xfeed-wait">posts offline. tap the sticker.</li>'; });
  })();

  /* ---------- chapters ---------- */
  const CHAPTER_LABEL = {
    'after-dark': 'after dark', 'live': 'live', 'streets': 'streets', 'strays': 'strays',
    'new-york': 'new york', 'new-orleans': 'new orleans', 'london': 'london', 'paris': 'paris', 'dublin': 'dublin',
    'elsewhere': 'elsewhere', 'sun': 'sun'
  };
  const ROLLS = [
    { id: '01', title: 'after dark', chapters: ['after-dark'], stock: 'LIFEONNFILMM 800' },
    { id: '02', title: 'live', chapters: ['live'], stock: 'LIFEONNFILMM 1600' },
    { id: '03', title: 'new york', chapters: ['new-york'], stock: 'LIFEONNFILMM 400' },
    { id: '04', title: 'new orleans', chapters: ['new-orleans'], stock: 'LIFEONNFILMM 400' },
    { id: '05', title: 'urbans', chapters: ['london', 'paris', 'dublin', 'elsewhere'], stock: 'LIFEONNFILMM 400' },
    { id: '06', title: 'streets', chapters: ['streets', 'strays'], stock: 'LIFEONNFILMM 200' },
    { id: '07', title: 'sun', chapters: ['sun'], stock: 'LIFEONNFILMM 100' }
  ];

  /* ---------- boot ---------- */
  const boot = $('#boot');
  const endBoot = () => { document.body.classList.remove('booting'); boot.classList.add('done'); setTimeout(() => boot.remove(), 400); };
  if (reduce || sessionStorage.getItem('booted')) endBoot();
  else { setTimeout(endBoot, 1500); boot.addEventListener('click', endBoot); }
  sessionStorage.setItem('booted', '1');

  /* ---------- grain texture ---------- */
  (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d'); const id = ctx.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ctx.putImageData(id, 0, 0);
    $('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ---------- HUD: timecode + date stamp ---------- */
  const tc = $('#timecode'); const start = performance.now();
  const tick = now => {
    const t = (now - start) / 1000;
    const f = Math.floor((t % 1) * 24), s = Math.floor(t) % 60, m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
    tc.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const stampDate = () => {
    const d = new Date();
    const mon = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
    let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    $('#datestamp').innerHTML = `${mon} ${pad(d.getDate())} ${d.getFullYear()} &nbsp;${pad(h)}:${pad(d.getMinutes())} ${ap}`;
    $('#year').textContent = d.getFullYear();
  };
  stampDate(); setInterval(stampDate, 15000);

  /* ---------- night mode ---------- */
  const nightBtn = $('#nightToggle');
  const setNight = on => { document.body.classList.toggle('night', on); nightBtn.setAttribute('aria-pressed', on); $('#menuNightState').textContent = on ? 'ON' : 'OFF'; try { localStorage.setItem('night', on ? '1' : '0'); } catch (e) {} };
  nightBtn.addEventListener('click', () => { flash(); setNight(!document.body.classList.contains('night')); });
  try { if (localStorage.getItem('night') === '1') setNight(true); } catch (e) {}
  addEventListener('keydown', e => { if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT') { flash(); setNight(!document.body.classList.contains('night')); } });

  $('#menuNight').addEventListener('click', () => { flash(); setNight(!document.body.classList.contains('night')); });

  /* ---------- phone menu: camcorder settings screen ---------- */
  const menu = $('#osdMenu'), menuBtn = $('#menuBtn');
  const setMenu = on => {
    menu.hidden = !on; document.body.classList.toggle('menu-open', on); menuBtn.setAttribute('aria-expanded', on);
    if (on) ($('.osd-menu-list a.is-active', menu) || $('.osd-menu-list a', menu)).focus({ preventScroll: true }); else menuBtn.focus({ preventScroll: true });
  };
  menuBtn.addEventListener('click', () => setMenu(true));
  $('#menuClose').addEventListener('click', () => setMenu(false));
  $$('.osd-menu-list a', menu).forEach(a => a.addEventListener('click', () => { flash(); setMenu(false); }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  $('#menuCount').textContent = P.length;

  /* ---------- flash ---------- */
  const flashEl = $('#flash');
  function flash() { if (reduce) return; flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go'); }

  /* ---------- cursor ---------- */
  const cur = $('#cursor');
  if (fine) {
    document.body.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; const hot = e.target.closest('a,button,.frame,.cell,.poster'); cur.classList.toggle('is-hot', !!hot); });
    const loop = () => { x += (tx - x) * .35; y += (ty - y) * .35; cur.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseleave', () => cur.style.opacity = 0);
    document.addEventListener('mouseenter', () => cur.style.opacity = 1);
  }

  /* ---------- hero ---------- */
  const heroes = P.filter(p => p.hero);
  const stage = $('#heroStage'); const meta = $('#heroMeta');
  let hi = 0, heroTimer;
  heroes.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'hero-frame' + (i === 0 ? ' is-on' : '');
    const img = new Image(); img.src = FULL(p); img.alt = p.caption; img.decoding = 'async'; if (i > 1) img.loading = 'lazy';
    d.appendChild(img); stage.appendChild(d);
  });
  const frames = $$('.hero-frame');
  function showHero(n) {
    hi = (n + heroes.length) % heroes.length;
    frames.forEach((f, i) => { f.classList.toggle('is-on', i === hi); f.classList.remove('glitch'); });
    if (!reduce) { void frames[hi].offsetWidth; frames[hi].classList.add('glitch'); }
    meta.querySelector('.hero-frame').textContent = `FRAME ${pad(heroes[hi].id)}`;
    meta.querySelector('.hero-cap').textContent = heroes[hi].caption;
  }
  function autoHero() { clearInterval(heroTimer); if (!reduce) heroTimer = setInterval(() => showHero(hi + 1), 4800); }
  autoHero();
  $('#heroNext').addEventListener('click', () => { showHero(hi + 1); autoHero(); });
  stage.addEventListener('click', () => { flash(); showHero(hi + 1); autoHero(); });
  let hx0 = null; // phones: swipe the hero sideways
  stage.addEventListener('touchstart', e => { hx0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (hx0 == null) return; const dx = e.changedTouches[0].clientX - hx0; hx0 = null; if (Math.abs(dx) > 40) { showHero(hi + (dx < 0 ? 1 : -1)); autoHero(); } }, { passive: true });

  /* ---------- rolls ---------- */
  const mount = $('#rollsMount');
  ROLLS.forEach(r => {
    const items = P.filter(p => r.chapters.includes(p.chapter));
    const roll = document.createElement('div'); roll.className = 'roll';
    roll.innerHTML = `<div class="roll-head"><span class="roll-id">ROLL ${r.id}</span><h3>${r.title}</h3><span class="roll-exp">${items.length} EXP</span></div>
      <div class="strip-wrap"><div class="strip" tabindex="0" aria-label="${r.title} film strip"><div class="strip-inner">
        <div class="strip-leader">${r.stock}</div>
        ${items.map((p, i) => `<button class="frame" type="button" data-id="${p.id}" data-edge="${r.stock} &nbsp; ${pad(i + 1)}" data-num="${pad(i + 1)}A" aria-label="${p.caption}, frame ${i + 1}" style="aspect-ratio:${p.w}/${p.h}">
            <img src="${THUMB(p)}" alt="${p.caption}" loading="lazy" decoding="async">
            <span class="frame-cap">${p.caption}</span></button>`).join('')}
      </div><div class="strip-end"></div></div></div>`;
    mount.appendChild(roll);
  });
  // drag-to-scroll (mouse); touch scrolls natively
  $$('.strip').forEach(strip => {
    let down = false, sx = 0, sl = 0, moved = 0;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft; strip.classList.add('is-drag'); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); strip.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; strip.classList.remove('is-drag'); });
    strip.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; return; } const f = e.target.closest('.frame'); if (f) openPB(+f.dataset.id); }, true);
    strip.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.shiftKey) { strip.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  });

  /* ---------- rolls on phones: the reel wheel ----------
     The rolls ride a ferris wheel made of film. 12 gondolas hang off a sprocketed rim and stay upright;
     the one at the top sits under the gate marker and fills the gate above. Swipe sideways to spin it
     (it coasts, then settles on a frame), tap a gondola to bring it up, tap the gate to play the roll.
     Gondolas swap their frame at the bottom of the wheel, out of sight, so a roll of any length fits. */
  (() => {
    const reelEl = $('#reel'); if (!reelEl) return;
    const phoneMQ = matchMedia('(max-width: 720px)');
    const SLOTS = 12, STEP = Math.PI * 2 / SLOTS;
    const wheel = $('#reelWheel'), art = $('#wheelArt'), legs = $('#wheelLegs'), gWrap = $('#gondolas'), hub = $('#wheelHub');
    const gate = $('#reelGate'), gateImg = $('#gateImg'), tabs = $('#reelTabs');
    const mod = (a, m) => ((a % m) + m) % m;
    const gs = [];
    let built = false, ri = 0, items = [], p = 0, v = 0, mode = 'idle', tw = null, raf = 0, last = 0;
    let R = 140, cx = 0, cy = 0, size = 60, shown = -1, full = -1, drag = null, quietUntil = 0;

    function build() {
      built = true;
      tabs.innerHTML = ROLLS.map((r, i) => `<button class="reel-tab" type="button" role="tab" data-i="${i}"><sup>${r.id}</sup>${r.title}</button>`).join('');
      tabs.addEventListener('click', e => { const t = e.target.closest('.reel-tab'); if (t && +t.dataset.i !== ri) { flash(); setRoll(+t.dataset.i, true); } });
      // wheel art: spokes out to each gondola, three reel cut-outs, a dashed inner ring, and a rim that is a loop of film
      art.innerHTML =
        Array.from({ length: SLOTS }, (_, k) => { const a = k * STEP; return `<line class="wa-spoke" x1="${(Math.sin(a) * 24).toFixed(2)}" y1="${(-Math.cos(a) * 24).toFixed(2)}" x2="${(Math.sin(a) * 94).toFixed(2)}" y2="${(-Math.cos(a) * 94).toFixed(2)}"/>`; }).join('') +
        [0, 1, 2].map(k => { const a = k * Math.PI * 2 / 3 + Math.PI / 3; return `<circle class="wa-cut" cx="${(Math.sin(a) * 50).toFixed(2)}" cy="${(-Math.cos(a) * 50).toFixed(2)}" r="16"/>`; }).join('') +
        '<circle class="wa-ring" r="72"/><circle class="wa-film" r="100"/><circle class="wa-holes" r="100"/><circle class="wa-film-edge" r="94"/><circle class="wa-film-edge" r="106"/>';
      for (let k = 0; k < SLOTS; k++) {
        const el = document.createElement('div'); el.className = 'gondola';
        el.innerHTML = '<button class="g-card" type="button" tabindex="-1"><img alt="" draggable="false" decoding="async"></button>';
        gWrap.appendChild(el);
        const g = { el, card: el.firstChild, img: el.querySelector('img'), k, idx: -1, rel: 0, sw: 0, sv: 0 };
        g.card.addEventListener('click', () => {
          if (performance.now() < quietUntil) return;
          if (Math.abs(g.rel) < .5) play(); else tweenTo(Math.round(p + g.rel), 380 + 70 * Math.abs(g.rel));
        });
        gs.push(g);
      }
      [gate, wheel].forEach(el => {
        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
      });
      gate.addEventListener('click', () => { if (performance.now() >= quietUntil) play(); });
      gate.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
      $('#wheelPrev').addEventListener('click', () => step(-1));
      $('#wheelNext').addEventListener('click', () => step(1));
      reelEl.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); });
      new ResizeObserver(layout).observe(wheel);
      setRoll(0, false);
      // first time the wheel comes on screen it spins up into place
      new IntersectionObserver(([en], io) => {
        if (!en.isIntersecting) return; io.disconnect();
        if (!reduce) { p -= 7; draw(); tweenTo(Math.round(p + 7), 1500); }
      }, { threshold: .35 }).observe(wheel);
    }

    function layout() {
      const W = wheel.clientWidth, H = wheel.clientHeight; if (!W || !H) return;
      const top = 14;
      R = Math.min(W * .37, (H - top) / 1.7); cx = W / 2; cy = top + R;
      size = Math.round(Math.max(46, Math.min(84, R * .42)));
      Object.assign(art.style, { width: 2 * R + 'px', height: 2 * R + 'px', left: cx - R + 'px', top: cy - R + 'px' });
      legs.innerHTML = `<line x1="${cx}" y1="${cy}" x2="${cx - R * .85}" y2="${cy + R * 2}"/><line x1="${cx}" y1="${cy}" x2="${cx + R * .85}" y2="${cy + R * 2}"/>`;
      const hr = Math.round(R * .3);
      Object.assign(hub.style, { left: cx + 'px', top: cy + 'px', width: hr * 2 + 'px', height: hr * 2 + 'px' });
      Object.assign($('#wheelPrev').style, { left: cx - hr - 24 + 'px', top: cy + 'px' });
      Object.assign($('#wheelNext').style, { left: cx + hr + 24 + 'px', top: cy + 'px' });
      gs.forEach(g => { g.idx = -1; }); // sizes changed: re-hang every frame
      draw();
    }

    function setImg(g, ph) {
      const land = ph.w >= ph.h;
      const w = land ? size : Math.round(size * ph.w / ph.h), h = land ? Math.round(size * ph.h / ph.w) : size;
      g.img.style.width = w + 'px'; g.img.style.height = h + 'px';
      g.img.src = THUMB(ph); g.img.alt = ph.caption; g.card.setAttribute('aria-label', ph.caption);
    }

    function draw() {
      const n = items.length; if (!n || !R) return;
      art.style.transform = `rotate(${(-p * STEP).toFixed(4)}rad)`;
      gs.forEach(g => {
        const rel = mod(g.k - p + SLOTS / 2, SLOTS) - SLOTS / 2; // this gondola's place relative to the top, in frames
        const idx = mod(Math.round(p + rel), n);
        if (g.idx !== idx) { g.idx = idx; setImg(g, items[idx]); }
        const a = rel * STEP, c = Math.cos(a), near = Math.max(0, 1 - Math.abs(rel));
        g.rel = rel;
        g.el.style.transform = `translate3d(${(cx + R * Math.sin(a)).toFixed(1)}px,${(cy - R * c).toFixed(1)}px,0)`;
        g.card.style.transform = `translateX(-50%) rotate(${g.sw.toFixed(2)}deg) scale(${(1 + .22 * near).toFixed(3)})`;
        g.el.style.zIndex = near > .5 ? 3 : 2;
        g.el.style.opacity = Math.max(0, Math.min(1, (c + .8) / .45)).toFixed(2); // gone by the bottom, where frames swap
        g.el.classList.toggle('is-gate', Math.abs(rel) < .5);
      });
      const cur = mod(Math.round(p), n);
      if (cur !== shown) showGate(cur);
    }

    function showGate(i) {
      shown = i; full = -1; const ph = items[i];
      gateImg.src = THUMB(ph); gateImg.alt = ph.caption;
      $('#gateCap').textContent = ph.caption;
      $('#gateEdge').textContent = `${ROLLS[ri].stock}  ${pad(i + 1)}A`;
      $('#hubNum').textContent = pad(i + 1);
    }
    // once the wheel stops, the gate gets the full-size file (so holding it saves the real thing)
    function settle() {
      const ph = items[shown]; if (!ph) return;
      if (!reduce) { gateImg.classList.remove('glitch'); void gateImg.offsetWidth; gateImg.classList.add('glitch'); }
      if (full === shown) return;
      const want = shown, im = new Image();
      im.onload = () => {
        if (shown !== want) return; gateImg.src = im.src; full = want;
        setTimeout(() => upgradeImg(gateImg, ph, () => shown === want && mode === 'idle'), 1200);
      };
      im.src = FULL(ph);
    }
    function play() { const ph = items[shown]; if (ph) openPB(ph.id, items); }

    function setRoll(i, anim) {
      ri = i; const r = ROLLS[i];
      items = P.filter(x => r.chapters.includes(x.chapter));
      gs.forEach(g => { g.idx = -1; }); shown = -1;
      $$('.reel-tab', tabs).forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i); });
      const t = tabs.children[i];
      tabs.scrollTo({ left: t.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      $('#reelId').textContent = `ROLL ${r.id}/${pad(ROLLS.length)} · ${items.length} EXP`;
      $('#reelStock').textContent = r.stock;
      $('#hubOf').textContent = `/ ${pad(items.length)}`;
      mode = 'idle'; v = 0;
      if (anim && !reduce) { p = -6; draw(); tweenTo(0, 1100); } else { p = 0; draw(); settle(); }
    }

    /* motion: drag -> coast (momentum) -> tween onto the nearest frame */
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function tweenTo(b, d) {
      if (reduce) { p = b; v = 0; mode = 'idle'; draw(); settle(); return; }
      mode = 'tween'; tw = { a: p, b, t0: performance.now(), d }; kick();
    }
    function step(d) { tweenTo((mode === 'tween' ? tw.b : Math.round(p)) + d, 320); }
    function loop(now) {
      raf = 0; const f = Math.min(3, (now - last) / 16.67); last = now;
      if (mode === 'coast') {
        p += v * f; v *= Math.pow(.95, f);
        if (Math.abs(v) < .045) tweenTo(Math.round(p + v * 12), 300);
      } else if (mode === 'tween') {
        const t = Math.min(1, (now - tw.t0) / tw.d), e = 1 - Math.pow(1 - t, 3), np = tw.a + (tw.b - tw.a) * e;
        v = (np - p) / Math.max(f, .01); p = np;
        if (t >= 1) { mode = 'idle'; v = 0; settle(); }
      }
      // gondolas lag behind the rim and sway back, like the real thing
      let moving = mode !== 'idle';
      gs.forEach(g => {
        const tgt = Math.max(-16, Math.min(16, v * 240 * Math.cos(g.rel * STEP)));
        g.sv = (g.sv + (tgt - g.sw) * .09 * f) * Math.pow(.84, f); g.sw += g.sv * f;
        if (Math.abs(g.sw) > .04 || Math.abs(g.sv) > .04) moving = true; else { g.sw = 0; g.sv = 0; }
      });
      draw();
      if (moving) raf = requestAnimationFrame(loop);
    }

    function onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const caught = mode === 'coast' || (mode === 'tween' && Math.abs(v) > .02); // a touch stops a spinning wheel
      if (caught) { mode = 'idle'; v = 0; }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, p0: p, t: e.timeStamp, on: false, dead: false, caught, el: e.currentTarget };
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id || drag.dead) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag.dead = true; return; } // that's a page scroll, not a spin
        drag.on = true; drag.x = e.clientX; drag.p0 = p; drag.t = e.timeStamp; mode = 'drag'; v = 0;
        try { drag.el.setPointerCapture(e.pointerId); } catch (err) {}
        return;
      }
      const np = drag.p0 - (e.clientX - drag.x) / (R * STEP); // one frame per gondola spacing along the rim
      const inst = (np - p) / (Math.max(1, e.timeStamp - drag.t) / 16.67);
      v = Math.max(-1.2, Math.min(1.2, v * .5 + inst * .5)); p = np; drag.t = e.timeStamp;
      kick();
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null;
      if (d.on) {
        quietUntil = performance.now() + 350;
        if (e.timeStamp - d.t > 90) v = 0; // held still before letting go: no fling
        if (Math.abs(v) > .05) { mode = 'coast'; kick(); } else tweenTo(Math.round(p), 240);
      } else if (d.caught) { quietUntil = performance.now() + 350; tweenTo(Math.round(p), 240); }
      else if (e.type === 'pointercancel') { /* page scrolled */ }
    }

    const init = () => { if (phoneMQ.matches && !built) build(); };
    phoneMQ.addEventListener('change', init); init();
  })();

  /* ---------- archive ---------- */
  const sheet = $('#sheet');
  P.forEach((p, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cell' + (p.h > p.w ? ' tall' : ''); b.dataset.id = p.id; b.dataset.chapter = p.chapter;
    b.setAttribute('aria-label', `${p.caption}, frame ${p.id}`);
    b.innerHTML = `<img src="${THUMB(p)}" alt="${p.caption}" loading="lazy" decoding="async"><span class="cell-num">${pad(p.id)}</span><span class="cell-cap">${p.caption}</span>`;
    b.addEventListener('click', () => openPB(p.id));
    sheet.appendChild(b);
  });
  $('#archiveCount').textContent = P.length;
  const filt = $('#archiveFilter');
  const chaps = ['all', ...ROLLS.flatMap(r => r.chapters).filter(c => P.some(p => p.chapter === c))];
  chaps.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = c === 'all' ? `all ${P.length}` : `${CHAPTER_LABEL[c] || c} ${P.filter(p => p.chapter === c).length}`; b.dataset.c = c; if (c === 'all') b.classList.add('is-on');
    b.addEventListener('click', () => {
      $$('button', filt).forEach(x => x.classList.toggle('is-on', x === b));
      sheetFilter = c; sheetCut = SHEET_CUT; applySheet();
    });
    filt.appendChild(b);
  });
  // phones show the first rows of the contact sheet; FF reveals the rest
  const phone = matchMedia('(max-width: 720px)');
  const SHEET_CUT = 40, ffBtn = $('#sheetFF');
  let sheetFilter = 'all', sheetCut = SHEET_CUT;
  function applySheet() {
    let k = 0; const cut = phone.matches ? sheetCut : Infinity;
    $$('.cell').forEach(cell => {
      const hit = sheetFilter === 'all' || cell.dataset.chapter === sheetFilter;
      cell.classList.toggle('is-hidden', !hit);
      cell.classList.toggle('is-cut', hit && k++ >= cut);
    });
    const more = Math.max(0, k - cut); ffBtn.hidden = !more; $('#sheetFFn').textContent = `${more} more frames`;
  }
  ffBtn.addEventListener('click', () => { flash(); sheetCut = Infinity; applySheet(); });
  phone.addEventListener('change', applySheet);
  applySheet();

  /* ---------- playback ---------- */
  const pb = $('#playback'), pbImg = $('#pbImg'), pbCount = $('#pbCount'), pbCap = $('#pbCap'), pbChap = $('#pbChap');
  let pbi = 0, lastFocus = null, order = P;
  function render(i, glitch = true) {
    pbi = (i + order.length) % order.length; const p = order[pbi];
    pbImg.classList.remove('glitch'); pbImg.src = FULL(p); pbImg.alt = p.caption;
    if (glitch && !reduce) { void pbImg.offsetWidth; pbImg.classList.add('glitch'); }
    pbCount.textContent = `FRAME ${pad(p.id)} / ${P.length}`; pbCap.textContent = p.caption; pbChap.textContent = CHAPTER_LABEL[p.chapter] || p.chapter;
    [1, -1].forEach(d => { const n = order[(pbi + d + order.length) % order.length]; new Image().src = FULL(n); });
    history.replaceState(null, '', '#f/' + p.slug);
    clearTimeout(upTimer); upTimer = setTimeout(() => upgradeImg(pbImg, p, () => !pb.hidden && order[pbi] === p), 1200);
  }
  let upTimer = 0;
  const shareBtn = $('#pbShare'); let shareTimer = 0;
  const photoLink = p => `${location.origin}${location.pathname}#f/${p.slug}`;
  async function sharePB() {
    const p = order[pbi], url = photoLink(p);
    const done = txt => { shareBtn.textContent = txt; shareBtn.classList.add('is-done'); clearTimeout(shareTimer); shareTimer = setTimeout(() => { shareBtn.innerHTML = 'SHARE &#8599;'; shareBtn.classList.remove('is-done'); }, 1800); };
    if (navigator.share && !fine) {
      try { await navigator.share({ title: 'lifeonnfilmm', text: p.caption, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); flash(); done('LINK COPIED'); }
    catch (e) { window.prompt('copy this link', url); }
  }
  shareBtn.addEventListener('click', sharePB);

  /* save: the full-size file. Phones get the share sheet with the image attached ("Save Image" puts it in
     the camera roll); holding the photo works too. Desktop gets a download. */
  const saveBtn = $('#pbSave'); let saveTimer = 0, saveBlob = null;
  const getBlob = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); });
  const blobFor = p => { if (!saveBlob || saveBlob.slug !== p.slug) saveBlob = { slug: p.slug, b: getBlob(SAVE(p)).catch(() => getBlob(FULL(p))) }; return saveBlob.b; };
  const saveSay = (txt, hold) => { saveBtn.textContent = txt; saveBtn.classList.add('is-done'); clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveBtn.innerHTML = 'SAVE &#8595;'; saveBtn.classList.remove('is-done'); }, hold || 1800); };
  saveBtn.addEventListener('click', async () => {
    const p = order[pbi], name = `lifeonnfilmm-${p.slug}.jpg`;
    try {
      const blob = await blobFor(p), file = new File([blob], name, { type: blob.type || 'image/jpeg' });
      if (!fine && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; saveSay('HOLD THE PHOTO TO SAVE', 3200); return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      flash(); saveSay('SAVED');
    } catch (e) { saveSay(fine ? 'SAVE FAILED' : 'HOLD THE PHOTO TO SAVE', 3200); }
  });
  function openPB(id, list) {
    const visible = $$('.cell:not(.is-hidden)').map(c => +c.dataset.id);
    order = list && list.length ? list : visible.includes(id) && visible.length < P.length ? P.filter(p => visible.includes(p.id)) : P;
    flash(); lastFocus = document.activeElement; pb.hidden = false; document.body.classList.add('pb-open');
    render(order.findIndex(p => p.id === id), false); $('#pbClose').focus();
  }
  function closePB() { pb.hidden = true; document.body.classList.remove('pb-open'); history.replaceState(null, '', location.pathname + location.search); if (lastFocus) lastFocus.focus(); }
  $('#pbClose').addEventListener('click', closePB);
  $('#pbNext').addEventListener('click', () => render(pbi + 1));
  $('#pbPrev').addEventListener('click', () => render(pbi - 1));
  pb.addEventListener('click', e => { if (e.target === pb || e.target.classList.contains('pb-img-wrap')) closePB(); });
  addEventListener('keydown', e => {
    if (pb.hidden) return;
    if (e.key === 'Escape') closePB(); else if (e.key === 'ArrowRight') render(pbi + 1); else if (e.key === 'ArrowLeft') render(pbi - 1);
  });
  let tx0 = null, ty0 = null;
  pb.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
  pb.addEventListener('touchend', e => {
    if (tx0 == null) return; const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0; tx0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) render(pbi + (dx < 0 ? 1 : -1));
    else if (dy > 90 && dy > Math.abs(dx) * 1.5) closePB(); // swipe down puts the frame away
  });
  // holding a thumbnail would save the small copy: only full-size photos (playback, the wheel's gate) offer a save
  document.addEventListener('contextmenu', e => { if (!fine && e.target.closest('.cell,.g-card,.frame,.poster,.hero-frame')) e.preventDefault(); });

  // deep link: lifeonnfilmm.xyz/#f/<slug> opens that frame
  function openFromHash() {
    const m = location.hash.match(/^#f\/([\w-]+)$/); if (!m) return;
    const p = P.find(x => x.slug === m[1]); if (p) { $$('.cell').forEach(c => c.classList.remove('is-hidden', 'is-cut')); openPB(p.id); }
  }
  addEventListener('hashchange', openFromHash);

  /* ---------- background reel ----------
     img/bg/*.mp4 play back to back, forever, muted, behind everything. Reduced motion / data saver get the still. */
  (() => {
    const v = $('#bgReel'); if (!v) return;
    const reel = ['img/bg/bully.mp4?v=2', 'img/bg/strike.mp4', 'img/bg/symposium.mp4?v=2'];
    const saver = navigator.connection && navigator.connection.saveData;
    if (reduce || saver) { v.pause(); v.removeAttribute('src'); v.load(); return; } // keep the still
    let k = 0; // the first clip is already loading from the html, autoplaying
    const play = () => { const p = v.play(); if (p) p.catch(() => {}); };
    const load = () => { v.src = reel[k]; v.load(); play(); };
    v.addEventListener('ended', () => { k = (k + 1) % reel.length; load(); });
    v.addEventListener('error', () => { k = (k + 1) % reel.length; setTimeout(load, 1000); });
    v.muted = true; if (v.paused) play();
  })();

  /* ---------- wall: posters ---------- */
  const posters = $('#posters');
  // l/t = position (% of wall), w = width (vw), r = tilt (deg), zoom = crop in {s: scale, x/y: focus %}
  // m = phone position {l, t, w}; posters without m stay off the wall on phones (the x sticker fills the middle)
  const posterPicks = [
    { slug: 'r4451-102',      l: 22, t: 5,  w: 20, r: -4 },
    { slug: 'shirtless-jump', l: 50, t: 4,  w: 17, r: 3 },
    { slug: 'smile',          l: 2,  t: 42, w: 19, r: 5 },
    { slug: 'concrete-034',   l: 25, t: 44, w: 19, r: -2, zoom: { s: 1.75, x: 52, y: 40 }, m: { l: 50, t: 3, w: 46 } },
    { slug: 'r5617-021',      l: 64, t: 46, w: 19, r: 4,  m: { l: 54, t: 66, w: 42 } },
    { slug: 'r239-057',       l: 47, t: 46, w: 15, r: -6, m: { l: 1, t: 58, w: 40 } },
    { slug: 'r9637-067',      l: 68, t: 72, w: 14, r: -3 },
    { slug: 'r5618-005',      l: 87, t: 46, w: 10, r: 6,  m: { l: 0, t: 27, w: 24 } }
  ];
  posterPicks.forEach(L => {
    const p = P.find(x => x.slug === L.slug); if (!p) return; const z = L.zoom, m = L.m;
    const d = document.createElement('button'); d.type = 'button'; d.className = m ? 'poster' : 'poster poster-desk'; d.dataset.id = p.id;
    d.style.cssText = `--l:${L.l}%;--t:${L.t}%;--w:${L.w}vw;--r:${L.r}deg` + (m ? `;--ml:${m.l}%;--mt:${m.t}%;--mw:${m.w}vw` : '');
    d.setAttribute('aria-label', `${p.caption}, frame ${p.id}`);
    const img = z
      ? `<span class="poster-crop"><img src="${FULL(p)}" alt="${p.caption}" loading="lazy" style="transform:scale(${z.s});transform-origin:${z.x}% ${z.y}%"></span>`
      : `<img src="${THUMB(p)}" alt="${p.caption}" loading="lazy">`;
    d.innerHTML = `${img}<span class="poster-tag">${pad(p.id)} ${p.caption}</span>`;
    d.addEventListener('click', () => openPB(p.id));
    posters.appendChild(d);
  });

  /* ---------- wall: spray paint ---------- */
  const wallStage = $('#wallStage'), cv = $('#sprayCanvas'), ctx = cv.getContext('2d', { willReadFrequently: false });
  const dcv = $('#demoCanvas'), dctx = dcv.getContext('2d');
  let color = '#ff3fa4', size = 26, spraying = false, last = null, dripTimer = null, dpr = Math.min(devicePixelRatio || 1, 2);
  function fit() {
    const r = wallStage.getBoundingClientRect(); const keep = cv.width ? ctx.getImageData(0, 0, cv.width, cv.height) : null;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (keep) ctx.putImageData(keep, 0, 0);
    dcv.width = cv.width; dcv.height = cv.height; dctx.setTransform(dpr, 0, 0, dpr, 0, 0); // replay restarts its loop clean
  }
  fit(); addEventListener('resize', fit);
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function puff(x, y, pressure = .5, c = ctx, col = color, sz = size) {
    const n = Math.round(sz * 1.6); const rad = sz / 2;
    c.fillStyle = col; c.globalAlpha = .07 + pressure * .08;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * rad * (1 + Math.random() * .1);
      const s = Math.random() < .9 ? 1 : 2.4;
      c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = .35; c.beginPath(); c.arc(x, y, rad * .35, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }
  function drip(x, y, c = ctx, col = color, sz = size, on = () => spraying) {
    let len = 0, target = sz * (1.5 + Math.random() * 3), yy = y;
    const step = () => { if (len > target || !on() && len > target * .5) return; c.fillStyle = col; c.globalAlpha = .6; c.beginPath(); c.arc(x + (Math.random() - .5), yy, sz * .09, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; yy += 1.4; len += 1.4; requestAnimationFrame(step); };
    step();
  }
  const canUp = () => fine || wallStage.classList.contains('can-up');
  let armed = null, armTimer = null;
  const beginSpray = (e) => {
    spraying = true; armed = null; clearTimeout(armTimer);
    last = pos(e); puff(last.x, last.y, e.pressure || .5); rec('d', last, e.pressure);
    clearInterval(dripTimer); dripTimer = setInterval(() => { if (spraying && last && Math.random() < .5) drip(last.x + (Math.random() - .5) * size * .6, last.y); }, 260);
  };
  cv.addEventListener('pointerdown', e => {
    if (!canUp()) return; takeOver(); if (e.pointerType === 'mouse' && e.button !== 0) return;
    cv.setPointerCapture(e.pointerId);
    armed = { x: e.clientX, y: e.clientY, t: performance.now(), e };
    armTimer = setTimeout(() => { if (armed) beginSpray(armed.e); }, 200);
  });
  cv.addEventListener('pointermove', e => {
    if (armed && !spraying) { if (Math.hypot(e.clientX - armed.x, e.clientY - armed.y) > 4) beginSpray(armed.e); else return; }
    if (!spraying) { rec('h', pos(e)); return; } const p = pos(e); rec('m', p, e.pressure); const dx = p.x - last.x, dy = p.y - last.y, dist = Math.hypot(dx, dy), steps = Math.max(1, Math.round(dist / (size * .18)));
    for (let i = 1; i <= steps; i++) puff(last.x + dx * i / steps, last.y + dy * i / steps, e.pressure || .5);
    last = p;
  });
  cv.addEventListener('pointerup', e => {
    if (armed && !spraying) { // a tap: open the poster underneath, if any
      clearTimeout(armTimer); armed = null;
      const under = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('poster'));
      if (under) { flash(); openPB(+under.dataset.id); }
    }
  });
  const stop = () => { if (spraying) rec('u'); spraying = false; armed = null; clearTimeout(armTimer); clearInterval(dripTimer); };
  cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop); cv.addEventListener('pointerleave', e => { stop(); rec('l'); });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  $$('.cap').forEach(b => b.addEventListener('click', () => { takeOver(); color = b.dataset.color; rec('c', null, null, color); $$('.cap').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); }); }));
  $('#capSize').addEventListener('input', e => { takeOver(); size = +e.target.value; rec('s', null, null, size); cur.style.setProperty('--cap', size + 'px'); });
  $('#pickCan').addEventListener('click', e => { takeOver(); const on = !wallStage.classList.contains('can-up'); wallStage.classList.toggle('can-up', on); e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.textContent = on ? 'put can down' : 'pick up can'; });
  $('#buffWall').addEventListener('click', () => { takeOver(); rec('b'); flash(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); });
  // spray cursor while over the wall
  if (fine) {
    wallStage.addEventListener('pointerenter', () => { cur.classList.add('is-spray'); cur.style.setProperty('--cap', size + 'px'); });
    wallStage.addEventListener('pointerleave', () => cur.classList.remove('is-spray'));
    wallStage.addEventListener('pointermove', e => { const over = e.target.closest('.sticker,.spray-ui'); cur.classList.toggle('is-spray', !over); });
  }
  // pre-tag the wall once so it doesn't look empty
  (() => {
    const w = cv.width / dpr, h = cv.height / dpr; const save = { color, size };
    color = '#f5f1e6'; size = 18;
    const txt = [[.03, .88, 'lifeonnfilmm'], [.50, .34, 'flash on']];
    ctx.font = `${Math.max(30, w * .05)}px "Rubik Spray Paint", Impact, sans-serif`; ctx.globalAlpha = .85;
    txt.forEach(([x, y, t], i) => { ctx.save(); ctx.translate(w * x, h * y); ctx.rotate(i ? .12 : -.06); ctx.fillStyle = i ? '#ff3fa4' : '#f5f1e6'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10; ctx.fillText(t, 0, 0); ctx.restore(); });
    ctx.globalAlpha = 1; color = save.color; size = save.size;
  })();

  /* ---------- wall: tag replay ----------
     js/tag.json is a recorded session of the owner spraying the wall (record one at /?record).
     It replays on a separate canvas on a loop so visitors see the wall being painted; the moment
     a visitor sprays, picks a cap, picks up the can or buffs, the replay stops and its paint is wiped. */
  const hint = $('#sprayHint'), ghost = $('#ghostCan'), buffBtn = $('#buffWall');
  hint.textContent = fine ? 'click and drag on the wall to spray' : 'tap "pick up can", then drag on the wall to spray';
  const RECORDING = new URLSearchParams(location.search).has('record');
  const DEMO_SPEED = 1.21; // replay runs a touch faster than it was recorded
  const demo = { stopped: RECORDING || reduce, visible: false, raf: 0 };
  function takeOver() {
    if (demo.stopped) return; demo.stopped = true; cancelAnimationFrame(demo.raf);
    dctx.save(); dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dcv.width, dcv.height); dctx.restore();
    ghost.classList.remove('on'); hint.classList.add('done'); buffBtn.classList.remove('is-hint');
  }
  function clearDemo() { dctx.save(); dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dcv.width, dcv.height); dctx.restore(); }
  function runDemo(tag) {
    if (!tag.events || !tag.events.length) return;
    // start on the first stroke: drop the lead-in (hovering into place), keep any cap/color picks from it
    const first = Math.max(0, tag.events.findIndex(e => e[1] === 'd')), lead = tag.events[first][0];
    tag.events.slice(0, first).forEach(e => { if (e[1] === 'c') tag.color = e[2]; if (e[1] === 's') tag.size = e[2]; });
    const ev = tag.events.slice(first).map(e => [e[0] - lead].concat(e.slice(1)));
    const end = ev[ev.length - 1][0];
    // hold the finished piece, buff it, go again (a recording that already ends on a buff just restarts)
    const tl = ev.concat(ev[ev.length - 1][1] === 'b' ? [[end + 1200, 'R']] : [[end + 3500, 'B'], [end + 4600, 'R']]);
    let i, clock, prev, col, sz, down, lastP, lastDrip;
    const reset = () => { i = 0; clock = 0; col = tag.color; sz = tag.size; down = false; lastP = null; lastDrip = 0; };
    const W = () => dcv.width / dpr, H = () => dcv.height / dpr;
    const scale = () => Math.max(.5, Math.min(W() / tag.w, H() / tag.h));
    const pt = e => ({ x: e[2] * W(), y: e[3] * H() });
    const place = p => { ghost.style.transform = `translate(${p.x}px,${p.y}px)`; ghost.style.setProperty('--cap', sz * scale() + 'px'); ghost.classList.add('on'); };
    reset(); prev = performance.now();
    const tick = now => {
      if (demo.stopped) return;
      const dt = Math.min(now - prev, 100); prev = now;
      if (demo.visible) {
        clock += dt * DEMO_SPEED;
        while (i < tl.length && tl[i][0] <= clock) {
          const e = tl[i++], k = e[1], s = sz * scale();
          if (k === 'd') { down = true; lastP = pt(e); puff(lastP.x, lastP.y, e[4] || .5, dctx, col, s); place(lastP); ghost.classList.add('down'); }
          else if (k === 'm' && down && lastP) {
            const p = pt(e), dx = p.x - lastP.x, dy = p.y - lastP.y, n = Math.max(1, Math.round(Math.hypot(dx, dy) / (s * .18)));
            for (let j = 1; j <= n; j++) puff(lastP.x + dx * j / n, lastP.y + dy * j / n, e[4] || .5, dctx, col, s);
            lastP = p; place(p);
          }
          else if (k === 'h') place(pt(e));
          else if (k === 'u') { down = false; ghost.classList.remove('down'); }
          else if (k === 'l') ghost.classList.remove('on');
          else if (k === 'c') col = e[2];
          else if (k === 's') sz = e[2];
          else if (k === 'b' || k === 'B') {
            buffBtn.classList.remove('is-hint'); void buffBtn.offsetWidth; buffBtn.classList.add('is-hint');
            dcv.classList.add('buffing'); setTimeout(() => { if (!demo.stopped) { clearDemo(); dcv.classList.remove('buffing'); } }, 550);
            if (k === 'B') ghost.classList.remove('on');
          }
          else if (k === 'R') { reset(); break; }
        }
        if (down && lastP && clock - lastDrip > 260) { lastDrip = clock; if (Math.random() < .5) { const s = sz * scale(); drip(lastP.x + (Math.random() - .5) * s * .6, lastP.y, dctx, col, s, () => down && !demo.stopped); } }
      }
      demo.raf = requestAnimationFrame(tick);
    };
    demo.raf = requestAnimationFrame(tick);
  }
  if (!demo.stopped && 'IntersectionObserver' in window) {
    // fetch the tag well before the wall scrolls in, and start painting the moment it shows
    const tagReady = fetch('js/tag.json').then(r => r.ok ? r.json() : null).catch(() => null);
    let started = false;
    new IntersectionObserver(([en]) => {
      demo.visible = en.isIntersecting;
      if (en.isIntersecting && !started) { started = true; tagReady.then(t => { if (t && !demo.stopped) runDemo(t); }); }
    }, { threshold: .05 }).observe(wallStage);
  }

  /* ---------- wall: record a tag (/?record) ----------
     Logs every stroke as fractions of the wall size, so it replays at any screen size.
     "save tag" writes js/tag.json through tools/record_server.py, or downloads it when that isn't running. */
  const R = { on: RECORDING, t0: 0, events: [], color, size };
  function rec(k, p, pr, v) {
    if (!R.on) return; const now = performance.now(); if (!R.t0) R.t0 = now;
    const w = cv.width / dpr, h = cv.height / dpr, t = Math.round(now - R.t0);
    if (p) R.events.push([t, k, +(p.x / w).toFixed(4), +(p.y / h).toFixed(4)].concat(pr ? [+pr.toFixed(2)] : []));
    else R.events.push(v === undefined ? [t, k] : [t, k, v]);
    if (R.count) R.count.textContent = R.events.length;
  }
  if (RECORDING) {
    const bar = document.createElement('div'); bar.className = 'rec-bar';
    bar.innerHTML = '<span class="rec-dot"></span> recording tag · <b>0</b> events <button type="button" data-a="save">save tag</button><button type="button" data-a="reset">start over</button><span class="rec-msg"></span>';
    document.body.appendChild(bar); R.count = $('b', bar); const msg = $('.rec-msg', bar);
    const pack = () => { // squeeze long pauses so the replay keeps moving
      let shift = 0, prevT = 0; const out = R.events.map(e => { const gap = e[0] - prevT; prevT = e[0]; if (gap > 1500) shift += gap - 1500; return [e[0] - shift].concat(e.slice(1)); });
      return { w: Math.round(cv.width / dpr), h: Math.round(cv.height / dpr), color: R.color, size: R.size, events: out };
    };
    bar.addEventListener('click', async e => {
      const a = e.target.dataset && e.target.dataset.a; if (!a) return;
      if (a === 'reset') { R.events = []; R.t0 = 0; R.color = color; R.size = size; R.count.textContent = 0; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); msg.textContent = ''; return; }
      const body = JSON.stringify(pack());
      // /?record saves js/tag.json; /?record=name saves js/tag-name.json (a piece to splice in)
      const name = (new URLSearchParams(location.search).get('record') || '').replace(/[^a-z0-9]/gi, '').toLowerCase(), file = name ? `tag-${name}.json` : 'tag.json';
      try { const r = await fetch('/__tag?file=' + file, { method: 'POST', body }); if (!r.ok) throw 0; msg.textContent = 'saved to js/' + file; }
      catch { const a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a2.download = 'tag.json'; a2.click(); msg.textContent = 'downloaded tag.json'; }
    });
    window.__tag = R;
  }

  /* ---------- marquee ---------- */
  const words = ['shot on 35mm', 'flash on', 'night mode', 'no digital', 'push two stops', 'rec ●', 'urbans', 'after dark', 'sun', 'lifeonnfilmm'];
  const track = $('#marquee'); const seq = words.map(w => `<span>${w}</span>`).join('');
  track.innerHTML = seq + seq;

  /* ---------- nav active state ---------- */
  const navLinks = $$('.hud-nav a, .osd-menu-list a');
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  ['rolls', 'wall', 'archive', 'contact'].forEach(id => io.observe($('#' + id)));

  /* ---------- flash on photo clicks anywhere ---------- */
  document.addEventListener('click', e => { if (e.target.closest('.cell,.frame,.poster')) flash(); });

  openFromHash();
})();
