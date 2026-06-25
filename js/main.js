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
    const SNAKE_MIN = 6;
    const SNAKE_MAX = 22;
    const STEPS_PER_FRAME = 2;
    const css = getComputedStyle(document.documentElement);
    const DOT_COLOR = (css.getPropertyValue('--dot').trim()) || '#d6d2ca';

    let dots = [];
    let offX = 0, offY = 0;
    let cols = 0, rows = 0;
    let w = 0, h = 0;
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, active: false, speed: 0 };
    let snake = []; // array of { col, row }
    let snakeLen = SNAKE_MIN;

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
                dots.push({ x: offX + c * SPACING, y: offY + r * SPACING });
            }
        }
        snake = [];
    }

    function gridFromPx(x, y) {
        const c = Math.round((x - offX) / SPACING);
        const r = Math.round((y - offY) / SPACING);
        return { col: Math.max(0, Math.min(cols - 1, c)), row: Math.max(0, Math.min(rows - 1, r)) };
    }

    function gridToPx(col, row) {
        return { x: offX + col * SPACING, y: offY + row * SPACING };
    }

    function stepSnake() {
        if (!mouse.active) return;
        const target = gridFromPx(mouse.x, mouse.y);
        if (!snake.length) { snake.push(target); return; }
        const head = snake[0];
        if (head.col === target.col && head.row === target.row) return;
        const dc = Math.sign(target.col - head.col);
        const dr = Math.sign(target.row - head.row);
        const next = { col: head.col + dc, row: head.row + dr };
        // alleen toevoegen als verschillend (Math.sign kan 0 geven)
        if (next.col === head.col && next.row === head.row) return;
        snake.unshift(next);
        if (snake.length > snakeLen) snake.length = snakeLen;
    }

    function onMove(e) {
        if (mouse.active) {
            const dx = e.clientX - mouse.x;
            const dy = e.clientY - mouse.y;
            const instant = Math.hypot(dx, dy);
            mouse.speed += (instant - mouse.speed) * 0.3;
        }
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }
    function onLeave() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; mouse.speed = 0; }

    function frame() {
        ctx.clearRect(0, 0, w, h);

        // mouse speed decay
        mouse.speed *= 0.92;
        const targetLen = Math.round(SNAKE_MIN + Math.min(1, mouse.speed / 60) * (SNAKE_MAX - SNAKE_MIN));
        snakeLen += (targetLen - snakeLen) * 0.18;
        const lenInt = Math.max(SNAKE_MIN, Math.round(snakeLen));
        if (snake.length > lenInt) snake.length = lenInt;

        // dots renderen
        ctx.fillStyle = DOT_COLOR;
        for (const d of dots) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }

        // snake stappen
        for (let s = 0; s < STEPS_PER_FRAME; s++) stepSnake();

        // snake renderen — subtiel, fade naar staart
        if (snake.length > 1) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 0; i < snake.length - 1; i++) {
                const a = gridToPx(snake[i].col, snake[i].row);
                const b = gridToPx(snake[i + 1].col, snake[i + 1].row);
                const t = 1 - i / (snake.length - 1); // 1 bij head → ~0 bij tail
                const alpha = 0.35 + t * 0.55;
                ctx.strokeStyle = `rgba(32,32,32,${alpha.toFixed(3)})`;
                ctx.lineWidth = 1.4 + t * 1.2;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
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

// ===== PARALLAX: media binnen work-items =====
function initWorkParallax() {
    const STRENGTH = 0.03;
    let ticking = false;
    function update() {
        const winH = window.innerHeight;
        document.querySelectorAll('.work-item__media').forEach(media => {
            const rect = media.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > winH + 100) return;
            const center = (rect.top + rect.bottom) / 2;
            const offset = (center - winH / 2) * STRENGTH;
            const inner = media.querySelectorAll('.work-item__img, .work-item__video');
            inner.forEach(el => el.style.setProperty('--parallax-y', `${offset}px`));
        });
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
    const INFLUENCE = 180;
    const PUSH = 4;
    const ROT = 8; // graden
    const EASE = 0.12;

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
