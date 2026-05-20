/* ============================================================
   STUDIO YOKO — Main JavaScript
   ============================================================ */

// ===== CONFIG =====
const CONFIG = window.YOKO_CONFIG || { mode: 'homepage', maxItems: 6 };

// ===== HERO HEADLINE =====
const heroHeadlines = [
    'Jij hebt een verhaal dat ertoe doet.<br>Wij weten hoe je dat laat zien.',
];

function initHeroHeadline() {
    const el = document.querySelector('.site-intro__headline');
    if (!el) return;
    el.innerHTML = heroHeadlines[Math.floor(Math.random() * heroHeadlines.length)];
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
        const delay = Math.min(i * 0.06, 0.4);

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

// ===== NAV: transparant bij donkere achtergrond =====
function initNavScroll() {
    const nav = document.getElementById('nav');
    const hero = document.getElementById('home') || document.querySelector('.case-hero');
    if (!nav || !hero) return;

    const obs = new IntersectionObserver(([e]) => {
        nav.classList.toggle('is-past-hero', !e.isIntersecting);
    }, { threshold: 0.05 });

    obs.observe(hero);
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
