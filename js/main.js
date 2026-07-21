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
        { threshold: 0, rootMargin: '0px 0px -22% 0px' }
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
        // Voorbij een drempel: logo faden + links inklappen naar menu-icoon
        nav.classList.toggle('is-collapsed', scrolled > 60);
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
// (dot-field verwijderd)

// ===== PARALLAX: media binnen work-items en case content =====
function initWorkParallax() {
    const targets = [
        { holder: '.work-item__media', inner: '.work-item__img, .work-item__video', strength: 0.03, prop: '--parallax-y' },
        { holder: '.gp-making__item', inner: 'img, video', strength: 0.06, prop: '--parallax-y' },
        { holder: '.gp-video-media', inner: '.gp-video-media__overlay', strength: 0.18, prop: '--overlay-parallax' },
    ];
    let ticking = false;
    function update() {
        const winH = window.innerHeight;
        for (const t of targets) {
            document.querySelectorAll(t.holder).forEach(media => {
                const rect = media.getBoundingClientRect();
                if (rect.bottom < -300 || rect.top > winH + 300) return;
                const center = (rect.top + rect.bottom) / 2;
                const offset = (center - winH / 2) * t.strength;
                const inner = media.querySelectorAll(t.inner);
                inner.forEach(el => el.style.setProperty(t.prop, `${-offset}px`));
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

// ===== HERO REVEAL: driehoek opent terwijl content over de video scrolt =====
function initHeroReveal() {
    const reveal = document.getElementById('pageReveal');
    const reel = document.querySelector('.reel--pinned');
    const intro = reveal ? reveal.querySelector('.reel-sub--center') : null;
    if (!reveal) return;
    let ticking = false;
    function update() {
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, window.scrollY / vh));
        const peak = (1 - p) * vh * 0.55;
        reveal.style.setProperty('--peak', peak.toFixed(1) + 'px');
        if (reel) reel.style.setProperty('--reel-dim', (p * 0.12).toFixed(3));
        // intro schaalt mee terwijl de driehoek opent + regelafstand krimpt
        if (intro) {
            intro.style.setProperty('--intro-scale', (0.82 + p * 0.24).toFixed(3));
            intro.style.setProperty('--intro-lh', (1.55 - p * 0.4).toFixed(3));
        }
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
}

// ===== MOBIEL MENU =====
function initNavMenu() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navToggle');
    if (!nav || !toggle) return;
    function close() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', close));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}


// ===== TILE MAGNET: case-beeld volgt licht de muis =====
function initTileMagnet() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const tiles = document.querySelectorAll('.pillars__thumb, .work-item__media, .ch__media');
    tiles.forEach(tile => {
        const img = tile.querySelector('img, video');
        if (!img) return;
        img.style.transition = 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)';
        img.style.willChange = 'transform';
        tile.addEventListener('mousemove', (e) => {
            const r = tile.getBoundingClientRect();
            const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1..1
            const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
            img.style.transition = 'transform 0.1s linear';
            img.style.transform = `scale(1.06) translate(${dx * 10}px, ${dy * 10}px)`;
        });
        tile.addEventListener('mouseleave', () => {
            img.style.transition = 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1)';
            img.style.transform = '';
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
    initWorkParallax();
    initTextRepulsion();
    initTileMagnet();
    initHeroReveal();
    initNavMenu();

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
