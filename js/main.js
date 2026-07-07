/* ============================================================
   STUDIO YOKO — Main JavaScript
   ============================================================ */

// ===== CONFIG =====
const CONFIG = window.YOKO_CONFIG || { mode: 'homepage', maxItems: 6 };

// ===== HERO HEADLINE =====
const heroHeadlines = [
    'Je visuele redactie.',
    'Jij hebt een verhaal dat ertoe doet.<br>Wij weten hoe je dat laat zien.',
    'Je visuele redactie.',
    'Wij brengen beweging in organisaties<br>die niet kunnen wachten tot<br>ze begrepen worden.',
    'Je visuele redactie.',
    'Design en animatie voor organisaties<br>die begrepen willen worden.',
];

function initHeroHeadline() {
    // Rotatie uitgeschakeld — teksten bewaard in heroHeadlines array
}

// ===== HERO VIDEO =====
// Zet je eigen video's in assets/videos/ en pas de lijst aan
const heroVideos = [
    'assets/videos/showreel.mp4',
];

function initHeroVideo() {
    const video = document.getElementById('hero-video');
    if (!video) return;
    const src = heroVideos[Math.floor(Math.random() * heroVideos.length)];
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();
    video.addEventListener('playing', () => {
        video.classList.add('is-playing');
    }, { once: true });
}

// ===== CASES LADEN =====
async function loadCases() {
    // Gebruik inline data als beschikbaar (werkt ook zonder server via file://)
    if (window.YOKO_CASES) return window.YOKO_CASES.cases || [];

    // Zorg dat we altijd het juiste pad naar cases.json laden,
    // ook als we in een submap zitten (bijv. work/)
    const basePath = document.querySelector('base')?.href || '';
    const jsonPath = basePath ? basePath + 'data/cases.json' : 'data/cases.json';

    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error('cases.json niet gevonden');
        const data = await res.json();
        return data.cases || [];
    } catch (err) {
        console.warn('Cases laden mislukt:', err.message);
        return [];
    }
}

// ===== WORK GRID RENDEREN =====
function renderWorkGrid(cases, gridEl, preFiltered = false) {
    if (!gridEl || !cases.length) return;

    let filtered = cases;

    if (!preFiltered && CONFIG.mode === 'homepage') {
        filtered = cases.filter(c => c.featured !== false).slice(0, CONFIG.maxItems);
    }

    gridEl.innerHTML = filtered.map((c, i) => {
        const size = c.size || 'medium';
        const delay = Math.min(Math.floor(i / 2) * 0.12, 0.6);

        const autoplay = c.autoplay_preview ? ' video-autoplay' : '';
        return `
        <a
            class="work-item js-fade${autoplay}"
            href="${c.href || 'case.html?slug=' + c.slug}"
            data-size="${size}"
            data-category="${c.category}"
            data-slug="${c.slug}"
            style="transition-delay: ${delay}s"
        >
            <div class="work-item__media" style="background:${c.accent_color || '#2a2a2a'}">
                ${c.thumbnail
                    ? `<img class="work-item__img" src="${c.thumbnail}" alt="${c.title}" loading="lazy"
                          onerror="this.parentElement.style.background='${c.accent_color || '#2a2a2a'}';">`
                    : ''
                }
                ${c.thumbnail_logo
                    ? `<img class="work-item__logo" src="${c.thumbnail_logo}" alt="${c.title} logo">`
                    : ''
                }
                ${c.video_preview
                    ? `<video class="work-item__video" muted loop playsinline ${c.autoplay_preview ? `data-start-time="${c.video_start_time || 0}"` : 'preload="none"'}>
                           <source src="${c.video_preview}" type="video/mp4">
                       </video>`
                    : ''
                }
                <div
                    class="work-item__overlay"
                    style="background: ${c.accent_color || '#202020'}"
                ></div>
            </div>
            <div class="work-item__info">
                ${c.summary ? `<p class="work-item__summary">${c.summary}</p>` : `<h3 class="work-item__title">${c.title}</h3>`}
                ${c.client ? `<span class="work-item__client">${c.client}</span>` : ''}
            </div>
        </a>`;
    }).join('');

    // Video preview op hover / autoplay
    gridEl.querySelectorAll('.work-item').forEach(item => {
        const video = item.querySelector('.work-item__video');
        if (!video) return;

        item.classList.add('video-ready');

        if (item.classList.contains('video-autoplay')) {
            const startTime = parseFloat(video.dataset.startTime) || 0;
            let started = false;
            const vidObs = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    if (!started) {
                        video.currentTime = startTime;
                        started = true;
                    }
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            }, { threshold: 0.1 });
            vidObs.observe(item);
            return;
        }

        item.addEventListener('mouseenter', () => {
            video.play().catch(() => {});
        });
        item.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });

    // Scroll-animaties triggeren
    initScrollFade();
}

// ===== CATEGORIE FILTERS (work.html) =====
function initFilters(cases) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Actieve staat
            filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');

            // Items tonen/verbergen
            document.querySelectorAll('.work-item').forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.classList.remove('is-hidden');
                } else {
                    item.classList.add('is-hidden');
                }
            });
        });
    });
}

// ===== SCROLL FADE ANIMATIES =====
function initScrollFade() {
    const targets = document.querySelectorAll('.js-fade');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                observer.unobserve(e.target);
            }
        }),
        { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );

    targets.forEach(el => observer.observe(el));
}

// ===== NAV: achtergrond + tekst faden bij scrollen =====
function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    function update() {
        const scrolled = window.scrollY;
        const fadeStart = 20;
        const fadeEnd = 120;
        const progress = Math.max(0, Math.min(1, (scrolled - fadeStart) / (fadeEnd - fadeStart)));

        nav.style.setProperty('--nav-fade', 1 - progress);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ===== BLOCK REVEAL (drie pijlers) =====
function initBlockReveal() {
    const container = document.querySelector('.reel-timeline');
    if (!container) return;

    const blocks = Array.from(container.querySelectorAll('.reel-timeline__item'));
    const total  = blocks.length;
    const trackFill = document.getElementById('timeline-fill');

    function update() {
        const rect  = container.getBoundingClientRect();
        const winH  = window.innerHeight;
        // Begint te onthullen zodra bovenkant sectie 85% van viewport bereikt
        // Compleet als bovenkant op 25% zit
        const start = winH * 0.85;
        const end   = winH * 0.25;
        const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
        const litCount = Math.ceil(progress * total);

        blocks.forEach((block, i) => {
            block.classList.toggle('is-lit', i < litCount);
        });

        // Animate the full connecting track line (0% → 100% as all 3 steps reveal)
        if (trackFill) {
            trackFill.style.width = (progress * 100) + '%';
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ===== WORD REVEAL (reel caption) =====
function initWordReveal() {
    const el = document.querySelector('.js-word-reveal');
    if (!el) return;

    // Split text into word spans, preserving <br> line breaks
    const raw = el.innerHTML;
    // Replace <br> tags with a placeholder, then split on spaces
    const withPlaceholder = raw.replace(/<br\s*\/?>/gi, '\n');
    // Strip any other HTML tags
    const stripped = withPlaceholder.replace(/<[^>]+>/g, '');
    const parts = stripped.split(/(\s+)/);
    el.innerHTML = parts.map(part => {
        if (part === '\n') return '<br>';
        if (/\S/.test(part)) return `<span class="word-chip">${part}</span>`;
        return part;
    }).join('');

    const chips = Array.from(el.querySelectorAll('.word-chip'));
    const total = chips.length;

    function update() {
        const rect = el.getBoundingClientRect();
        const winH  = window.innerHeight;
        // Reveal starts when top of element hits 85% of viewport, ends at 30%
        const start = winH * 0.85;
        const end   = winH * 0.15;
        const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
        const litCount  = Math.round(progress * total);
        chips.forEach((chip, i) => {
            chip.classList.toggle('is-lit', i < litCount);
        });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ===== SMOOTH SCROLL =====
// ===== INTERACTIVE DOT FIELD =====
function initDotField() {
    const canvas = document.getElementById('dot-field');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const SPACING = 14;
    const DOT_RADIUS = 1.4;
    const HIT_RADIUS = 22;
    const COOLDOWN = 4000;    // ms voordat dezelfde dot opnieuw mag spawnen
    const FLASH_LIFE = 700;   // ms levensduur van een lijn
    const STEP_DELAY = 70;    // ms tussen segmenten — hoe langzamer de lijn zich tekent
    const SHOTS_PER_HIT = 1;
    const SHOT_ALPHA = 0.45;
    const FIRE_CHANCE = 0.025; // kans dat een dot afgaat als de muis erover komt
    const PATH_MIN = 2;
    const PATH_MAX = 8;
    const css = getComputedStyle(document.documentElement);
    const DOT_COLOR = (css.getPropertyValue('--dot').trim()) || '#d6d2ca';

    let dots = [];
    let cols = 0, rows = 0;
    let offX = 0, offY = 0;
    let w = 0, h = 0;
    let flashes = []; // { ax, ay, bx, by, born }

    const mouse = { x: -9999, y: -9999, active: false };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width; h = rect.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(w / SPACING) + 1;
        rows = Math.ceil(h / SPACING) + 1;
        offX = (w - (cols - 1) * SPACING) / 2;
        offY = (h - (rows - 1) * SPACING) / 2;
        dots = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dots.push({
                    x: offX + c * SPACING,
                    y: offY + r * SPACING,
                    col: c, row: r,
                    triggered: -Infinity,
                });
            }
        }
        flashes = [];
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }
    function onLeave() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; }

    function trigger(d, now) {
        // bouw een pad van segmenten — elk hokje een nieuwe 90° richting
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        let dir = dirs[Math.floor(Math.random() * 4)];
        let cc = d.col, cr = d.row;
        const steps = PATH_MIN + Math.floor(Math.random() * (PATH_MAX - PATH_MIN + 1));
        for (let s = 0; s < steps; s++) {
            const nc = cc + dir[0];
            const nr = cr + dir[1];
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) break;
            const a = dots[cr * cols + cc];
            const b = dots[nr * cols + nc];
            flashes.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, born: now + s * STEP_DELAY });
            cc = nc; cr = nr;
            // kies een nieuwe 90°-richting, niet de reverse (geen backtrack)
            const perp = (dir[0] === 0)
                ? [[-1,0],[1,0]]
                : [[0,-1],[0,1]];
            // 50% kans om door te gaan, 50% kans om te draaien
            if (Math.random() < 0.5) dir = perp[Math.floor(Math.random() * 2)];
        }
        d.triggered = now;
    }

    function frame() {
        ctx.clearRect(0, 0, w, h);
        const now = performance.now();

        // muis nabij dots → trigger
        if (mouse.active) {
            // alleen dots binnen redelijk gebied checken
            const minC = Math.max(0, Math.floor((mouse.x - HIT_RADIUS - offX) / SPACING));
            const maxC = Math.min(cols - 1, Math.ceil((mouse.x + HIT_RADIUS - offX) / SPACING));
            const minR = Math.max(0, Math.floor((mouse.y - HIT_RADIUS - offY) / SPACING));
            const maxR = Math.min(rows - 1, Math.ceil((mouse.y + HIT_RADIUS - offY) / SPACING));
            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    const d = dots[r * cols + c];
                    if (!d) continue;
                    const dx = d.x - mouse.x;
                    const dy = d.y - mouse.y;
                    if (dx * dx + dy * dy > HIT_RADIUS * HIT_RADIUS) continue;
                    if (now - d.triggered < COOLDOWN) continue;
                    if (Math.random() > FIRE_CHANCE) continue;
                    trigger(d, now);
                }
            }
        }

        // dots renderen
        ctx.fillStyle = DOT_COLOR;
        for (const d of dots) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }

        // flashes renderen + opruimen
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.4;
        const next = [];
        for (const f of flashes) {
            const elapsed = now - f.born;
            if (elapsed < 0) { next.push(f); continue; } // nog niet aangekomen — bewaar
            const t = elapsed / FLASH_LIFE;
            if (t >= 1) continue;
            // segment tekent zich uit over de eerste 30% van zijn levensduur
            const drawT = Math.min(1, t / 0.3);
            const ex = f.ax + (f.bx - f.ax) * drawT;
            const ey = f.ay + (f.by - f.ay) * drawT;
            const alpha = SHOT_ALPHA * (1 - t);
            ctx.strokeStyle = `rgba(32,32,32,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(f.ax, f.ay);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            next.push(f);
        }
        flashes = next;

        requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) onLeave(); });
    window.addEventListener('touchmove', (e) => {
        const t = e.touches[0]; if (!t) return;
        onMove({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    window.addEventListener('touchend', onLeave);
    frame();
}

// ===== PARALLAX: media binnen work-items en case content =====
function initWorkParallax() {
    const STRENGTH = 0.03;
    const targets = [
        { holder: '.work-item__media', inner: '.work-item__img, .work-item__video', strength: 0.03 },
        { holder: '.js-parallax', inner: '.js-parallax > *', strength: 0.05 },
    ];
    let ticking = false;
    function update() {
        const winH = window.innerHeight;
        for (const t of targets) {
            document.querySelectorAll(t.holder).forEach(media => {
                const rect = media.getBoundingClientRect();
                if (rect.bottom < -100 || rect.top > winH + 100) return;
                const center = (rect.top + rect.bottom) / 2;
                const offset = (center - winH / 2) * t.strength;
                const inner = media.querySelectorAll(t.inner);
                inner.forEach(el => el.style.setProperty('--parallax-y', `${offset}px`));
            });
        }
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    setTimeout(update, 50);
    setTimeout(update, 500);
}

// ===== TEXT REPULSION: woorden reageren los op de muis =====
function initTextRepulsion() {
    const selector = '.reel-sub__text, .pillars__text, .footer__title';
    const containers = Array.from(document.querySelectorAll(selector));
    if (!containers.length) return;
    const INFLUENCE = 120;
    const PUSH = 1.5;
    const ROT = 2.5; // graden
    const EASE = 0.1;

    // split elke tekst-container in <span class="word-pop"> per woord
    const words = [];
    containers.forEach(el => {
        // niet dubbel splitsen (bv. reel-sub__text gebruikt al word-chip via initWordReveal)
        if (el.dataset.wordRepulse) return;
        el.dataset.wordRepulse = '1';
        const existingChips = el.querySelectorAll('.word-chip');
        if (existingChips.length) {
            existingChips.forEach(c => { c.classList.add('word-pop'); words.push({ el: c, x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0 }); });
            return;
        }
        const html = el.innerHTML.replace(/<br\s*\/?>/gi, '\n');
        const stripped = html.replace(/<[^>]+>/g, '');
        const parts = stripped.split(/(\s+)/);
        el.innerHTML = parts.map(p => {
            if (p === '\n') return '<br>';
            if (/\S/.test(p)) return `<span class="word-pop">${p}</span>`;
            return p;
        }).join('');
        el.querySelectorAll('.word-pop').forEach(s => words.push({ el: s, x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0 }));
    });

    if (!words.length) return;

    const mouse = { x: -9999, y: -9999, active: false };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    });

    function frame() {
        for (const w of words) {
            const r = w.el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = cx - mouse.x;
            const dy = cy - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (mouse.active && dist < INFLUENCE) {
                const force = (1 - dist / INFLUENCE);
                const ang = Math.atan2(dy, dx);
                w.tx = Math.cos(ang) * force * PUSH;
                w.ty = Math.sin(ang) * force * PUSH;
                // rotatie volgt horizontale offset van muis t.o.v. woord
                w.tr = -(dx / INFLUENCE) * force * ROT;
            } else {
                w.tx = 0; w.ty = 0; w.tr = 0;
            }
            w.x += (w.tx - w.x) * EASE;
            w.y += (w.ty - w.y) * EASE;
            w.r += (w.tr - w.r) * EASE;
            w.el.style.transform = `translate3d(${w.x.toFixed(2)}px, ${w.y.toFixed(2)}px, 0) rotate(${w.r.toFixed(2)}deg)`;
        }
        requestAnimationFrame(frame);
    }
    frame();
}

// ===== NAV CONTRAST: invert wanneer donkere content onder nav zit =====
function initNavContrast() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    let ticking = false;
    function update() {
        const navRect = nav.getBoundingClientRect();
        const probeY = navRect.bottom - navRect.height / 2;
        const targets = document.querySelectorAll('.work-item__media, .pillars__thumb, .reel__video, .footer');
        let overDark = false;
        for (const el of targets) {
            const r = el.getBoundingClientRect();
            if (r.top <= probeY && r.bottom >= probeY) { overDark = true; break; }
        }
        nav.classList.toggle('nav--dark', overDark);
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    setTimeout(update, 100);
    setTimeout(update, 800);
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    initHeroHeadline();
    initHeroVideo();
    initNavScroll();
    initSmoothScroll();
    initWordReveal();
    initBlockReveal();
    initDotField();
    initWorkParallax();
    initTextRepulsion();

    // Fade statische elementen
    document.querySelectorAll('.about__title, .about__text, .footer__title, .footer__team-title, .page-header__title')
        .forEach(el => el.classList.add('js-fade'));
    initScrollFade();

    // Work grid — homepage split: eerste 4 boven pijlers, rest eronder
    const gridTop    = document.getElementById('work-grid-top');
    const gridBottom = document.getElementById('work-grid-bottom');
    const gridSingle = document.getElementById('work-grid');

    if (gridTop && gridBottom) {
        const cases = await loadCases();
        let featured = cases.filter(c => c.featured !== false);
        const top    = featured.slice(0, 2);
        const bottom = featured.slice(2, CONFIG.maxItems);
        renderWorkGrid(top,    gridTop,    /* skipFilter */ true);
        renderWorkGrid(bottom, gridBottom, /* skipFilter */ true);
        initScrollFade();
    } else if (gridSingle) {
        const cases = await loadCases();
        renderWorkGrid(cases, gridSingle);
        initScrollFade();
        if (CONFIG.mode === 'work') {
            initFilters(cases);
        }
    }
});
