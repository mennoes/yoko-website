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
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.src = src;

    const playImmediately = () => {
        video.play().catch(() => {});
    };

    video.addEventListener('loadeddata', playImmediately, { once: true });
    window.addEventListener('pageshow', playImmediately);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) playImmediately();
    });
    video.load();
    playImmediately();
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
            data-group="${workGroupOf(c.category)}"
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
                <div class="work-item__info">
                    ${c.summary ? `<p class="work-item__summary">${c.summary}</p>` : `<h3 class="work-item__title">${c.title}</h3>`}
                </div>
            </div>
            <span class="work-item__label">${c.client || c.title}</span>
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

// ===== CATEGORIE-INDELING work.html (3 groepen) =====
const WORK_GROUPS = {
    'Motion branding':      'vorm',
    'Brand & Systeem':      'vorm',
    'Explainers':           'verhaal',
    'Brandmovies':          'verhaal',
    'Format & Concept':     'verhaal',
    'Animatie & Strategie': 'verhaal',
};
function workGroupOf(category) {
    return WORK_GROUPS[category] || 'verhaal';
}
const WORK_CAT_TEXT = {
    vorm:    'We geven je merk een gezicht dat overal werkt, grafisch en in animatie.',
    verhaal: 'Wil je iets vertellen? Ingewikkelde materie, scherpe journalistiek, groot onderzoek of een goed idee. Wij maken er beeld mee.',
    tools:   'Veel maken kost tijd. Wij bouwen tools die versnellen en maken het schaalbaar.',
};
const WORK_TOOLS = [
    { client: 'AI Presentaties',      color: '#2E2A3F' },
    { client: 'Planningstool',        color: '#1F3A34' },
    { client: 'Titelbalk generator',  color: '#3A2E1F' },
    { client: 'KNRM Hotspot kaart',   color: '#003F8A' },
    { client: 'Editing tool',         color: '#2B2B2B' },
];

// Voegt de tool-tegels (groep 'tools') toe aan het work-grid
function appendToolTiles(gridEl) {
    const html = WORK_TOOLS.map(t => `
        <a class="work-item js-fade" href="tools.html" data-group="tools">
            <div class="work-item__media" style="background:${t.color}">
                <div class="work-item__overlay" style="background:${t.color}"></div>
            </div>
            <span class="work-item__label">${t.client}</span>
        </a>`).join('');
    gridEl.insertAdjacentHTML('beforeend', html);
}

// 3-categorie filter + bijpassende tekst onder "Work"
function initWorkCategories() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const desc = document.getElementById('cat-desc');
    if (!filterBtns.length) return;

    function activate(group) {
        filterBtns.forEach(b => b.classList.toggle('filter-btn--active', b.dataset.filter === group));
        if (desc) desc.textContent = WORK_CAT_TEXT[group] || '';
        document.querySelectorAll('.work-item').forEach(item => {
            if (group === 'alles') {
                item.classList.toggle('is-hidden', item.dataset.group === 'tools');
            } else {
                item.classList.toggle('is-hidden', item.dataset.group !== group);
            }
        });
    }

    filterBtns.forEach(btn => btn.addEventListener('click', () => {
        const g = btn.dataset.filter;
        // Nogmaals klikken op een actieve categorie → terug naar Alles
        if (g !== 'alles' && btn.classList.contains('filter-btn--active')) {
            activate('alles');
        } else {
            activate(g);
        }
    }));

    // Startcategorie: ?filter= uit de URL (bv. vanaf de About-pagina), anders Alles
    const params = new URLSearchParams(window.location.search);
    const start = params.get('filter');
    const valid = ['vorm', 'verhaal', 'tools'];
    activate(valid.includes(start) ? start : 'alles');
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
        // Op home pas inklappen wanneer het eerste hoofdstukvlak de header raakt.
        // Op andere pagina's blijft de vaste scrolldrempel gelden.
        const firstChapter = document.querySelector('.page--home .pillars .ch');
        const shouldCollapse = firstChapter
            ? firstChapter.getBoundingClientRect().top <= nav.offsetHeight
            : scrolled > 60;
        nav.classList.toggle('is-collapsed', shouldCollapse);

        // Blauwe pagina-achtergrond rustig transparant laten worden, zodat
        // de oorspronkelijke crèmekleur er tijdens het scrollen doorheen komt.
        if (document.body.classList.contains('page--home')) {
            const tintEnd = Math.max(window.innerHeight * 0.6, 380);
            const tintProgress = Math.max(0, Math.min(1, scrolled / tintEnd));
            document.documentElement.style.setProperty('--page-tint-opacity', 1 - tintProgress);

            const chapters = Array.from(document.querySelectorAll('.pillars .ch'));
            if (chapters.length >= 3) {
                const vormStart = window.innerHeight * 0.85;
                const vormEnd = window.innerHeight * 0.5;
                const entryProgress = chapter => {
                    const text = chapter.querySelector('.ch__text');
                    const top = text.getBoundingClientRect().top;
                    return Math.max(0, Math.min(1, (vormStart - top) / (vormStart - vormEnd)));
                };

                const verhaalProgress = entryProgress(chapters[1]);
                const systeemProgress = entryProgress(chapters[2]);

                // Na het laatste hoofdstuk alle kleur weer wegfaden.
                const lastBottom = chapters[2].getBoundingClientRect().bottom;
                const exitStart = window.innerHeight * 0.6;
                const exitEnd = window.innerHeight * 0.25;
                const sectionVisibility = Math.max(0, Math.min(1, (lastBottom - exitEnd) / (exitStart - exitEnd)));

                const verhaalOpacity = verhaalProgress * (1 - systeemProgress) * sectionVisibility;
                document.documentElement.style.setProperty('--verhaal-tint-opacity', verhaalOpacity);
                document.documentElement.style.setProperty('--systeem-tint-opacity', systeemProgress * sectionVisibility);
                document.body.classList.toggle('cursor-on-yellow', verhaalOpacity > 0.45);
            }
        }
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
    const els = document.querySelectorAll('.js-word-reveal');
    if (!els.length) return;

    const instances = [];
    els.forEach(el => {
        // Split text into word spans, preserving <br> line breaks
        const raw = el.innerHTML;
        const withPlaceholder = raw.replace(/<br\s*\/?>/gi, '\n');
        const stripped = withPlaceholder.replace(/<[^>]+>/g, '');
        const parts = stripped.split(/(\s+)/);
        el.innerHTML = parts.map(part => {
            if (part === '\n') return '<br>';
            if (/\S/.test(part)) return `<span class="word-chip">${part}</span>`;
            return part;
        }).join('');
        instances.push({ el, chips: Array.from(el.querySelectorAll('.word-chip')) });
    });

    function update() {
        const winH = window.innerHeight;
        for (const inst of instances) {
            const rect = inst.el.getBoundingClientRect();
            // Reveal loopt terwijl de tekst van 85% naar 25% van het scherm schuift
            const start = winH * 0.85;
            const end   = winH * 0.25;
            const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
            const litCount = Math.round(progress * inst.chips.length);
            inst.chips.forEach((chip, i) => {
                chip.classList.toggle('is-lit', i < litCount);
            });
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
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
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const selector = [
        '.reel-sub__text',
        '.reel-sub__body--dark',
        '.pillars__text',
        '.ch__desc',
        '.studio__headline',
        '.studio__h2',
        '.page-header__title',
        '.footer__title',
        '.footer__team-title',
        '.nav__links a'
    ].join(', ');
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
        if (tile.dataset.magnet) return;   // niet dubbel initialiseren
        const img = tile.querySelector('img, video');
        if (!img) return;
        tile.dataset.magnet = '1';
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

// ===== CASE-CURSOR: roteert richting het midden van de case =====
const CASE_CURSOR_SEL = '.ch__item, .work-item';
function initCaseCursor() {
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'case-cursor';
    cursor.innerHTML =
        '<svg class="case-cursor__ico case-cursor__ico--ok" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><path d="M281.479 101.464C289.079 101.464 295.908 105.402 300.534 112.716C312.429 131.282 320.69 151.423 325.426 173.139C325.757 174.601 326.087 175.952 327.409 177.527C329.391 169.763 331.264 162.112 333.356 154.348C334.127 151.31 334.898 148.047 336.33 145.234C339.855 138.37 346.684 134.545 353.733 134.545C356.156 134.545 358.579 134.995 360.892 135.895C370.805 139.833 375.871 149.96 373.118 160.874C366.84 185.853 360.451 210.832 354.063 235.924L442.067 415.842C448.786 431.144 437.992 448.36 421.581 448.585L335.119 449.26C335.009 449.26 335.009 449.26 334.898 449.26C334.458 449.26 334.127 449.26 333.797 449.26C325.536 448.81 318.267 443.409 314.852 435.645L298.551 398.739L298.992 397.276C291.833 404.59 283.242 410.328 273.219 414.266C258.019 420.23 243.37 423.268 229.162 423.268C204.269 423.268 181.029 413.704 159.992 393.338C152.282 385.799 145.784 376.235 140.937 366.446C132.456 349.231 126.289 331.003 127.39 311.199C127.61 306.698 128.161 301.973 129.703 297.697C132.456 290.046 139.506 285.432 147.105 285.432C148.097 285.432 149.088 285.545 150.189 285.657C159.331 287.12 165.83 294.096 166.491 303.548L166.711 302.985C166.931 308.499 167.702 314.237 169.024 320.088C174.751 345.967 189.4 364.983 202.727 364.983C203.829 364.983 204.82 364.871 205.811 364.646C219.91 361.383 226.298 336.066 220.02 308.161C214.292 282.282 199.643 263.266 186.316 263.266C185.215 263.266 184.223 263.379 183.232 263.604C177.945 264.841 170.566 270.805 167.702 277.331C165.389 278.344 162.856 279.019 160.212 279.019C159.111 279.019 157.899 278.906 156.688 278.681C142.479 275.531 139.726 257.753 148.868 246.051C164.178 226.585 184.334 217.359 208.675 217.246C208.785 217.246 208.785 217.246 208.895 217.246C220.681 217.246 231.695 220.622 243.48 225.797C238.854 212.858 233.237 201.718 225.527 192.042C219.469 184.503 212.861 177.864 206.472 171.001C200.194 164.362 197.991 154.573 201.185 146.472C204.71 137.695 212.53 132.069 221.672 132.069C221.672 132.069 221.672 132.069 221.782 132.069C227.84 132.069 233.017 134.32 237.532 138.483C256.807 156.261 271.677 177.189 281.81 201.606C282.471 203.181 283.131 204.644 284.563 206.107C284.563 204.756 284.453 203.406 284.453 202.056C282.911 178.54 275.642 157.049 263.085 137.245C254.164 123.293 261.213 105.29 276.743 101.914C278.395 101.577 279.937 101.464 281.479 101.464Z" fill="#DCB83E"/></svg>' +
        '<svg class="case-cursor__ico case-cursor__ico--click" viewBox="0 0 775 1086" xmlns="http://www.w3.org/2000/svg"><path d="M405.763 168.783C431.457 166.378 442.644 189.136 452.215 208.26C478.027 259.836 493.155 316.699 501.99 373.505C505.221 353.522 508.63 335.053 510.881 314.782C514.281 284.159 510.54 232.506 551.596 227.493C560.12 226.398 568.723 228.78 575.477 234.101C592.525 247.615 587.505 271.092 585.724 290.067C583.407 314.442 580.264 338.73 576.299 362.891C574.295 375.316 572.09 387.708 569.688 400.063C565.734 420.324 559.097 445.65 561.959 465.875C562.998 473.214 569.683 486.134 573.097 493.393L587.388 523.684C610.962 573.862 634.837 623.899 659.009 673.792L689.564 737.754C693.688 746.424 697.918 755.576 702.154 764.198C715.756 791.894 700.33 825.763 668.334 828.515C660.838 829.162 652.834 828.558 645.185 828.6C627.326 828.754 609.472 828.791 591.613 828.701C572.964 828.648 554.31 828.685 535.661 828.817C492.807 828.939 482.532 831.352 463.086 788.729C460.539 783.15 438.674 740.06 436.863 738.602C429.718 737.621 424.311 744.711 418.47 748.672C406.856 756.403 394.313 762.639 381.139 767.231C288.318 799.833 171.835 740.935 139.396 648.673C130.107 620.521 125.812 580.395 138.568 552.847C142.173 544.914 148.873 538.8 157.104 535.942C165.367 533.047 176.204 533.026 183.848 537.082C202.496 546.977 201.266 563.32 202.337 581.323C203.176 588.444 204.744 595.412 207.109 602.179C229.871 667.286 314.44 673.691 344.598 609.82C354.372 588.837 355.484 564.847 347.693 543.053C340.419 522.799 325.911 505.561 305.436 495.784C281.75 484.475 248.272 486.88 226.742 502.67C217.692 509.308 212.727 524.237 199.684 527.823C191.007 530.208 182.927 531.265 174.406 527.202C152.434 516.167 154.256 488.776 164.021 469.868C166.454 465.157 169.796 460.726 172.914 456.55C189.034 434.512 211.467 417.893 237.241 408.894C279.27 394.622 318.467 403.56 356.943 422.63C345.821 387.262 321.77 351.782 296.056 325.313C277.576 306.291 249.764 286.908 263.468 256.121C267.702 246.656 275.559 239.288 285.274 235.673C300.232 229.943 317.024 234.831 328.212 245.855C331.601 249.194 335.222 252.466 338.653 255.8C369.837 286.509 395.624 322.256 414.929 361.54C419.344 370.348 424.024 379.771 427.471 388.949C426.49 381.245 425.986 373.723 424.835 365.939C420.662 337.139 412.976 308.959 401.95 282.029C397.316 271.066 392.318 260.26 386.965 249.63C381.536 238.681 373.249 226.771 371.702 214.679C368.661 190.909 382.172 172.258 405.763 168.783Z" fill="#DBB137"/><path d="M105.122 366.463C108.085 366.26 111.128 366.038 112.935 368.944C121.662 383.026 129.891 397.488 138.347 411.736C140.434 415.252 144.063 420.395 143.243 424.465C142.644 427.435 140.538 428.904 138.195 430.39C133.23 430.82 131.514 430.589 128.877 426.231C120.462 412.294 112.103 398.268 103.94 384.183C101.861 380.597 98.7653 376.146 99.9543 371.944C100.756 369.11 102.804 367.864 105.122 366.463Z" fill="#FEFEFE"/><path d="M52.0094 442.317C53.1997 442.142 54.913 442.029 56.1158 442.323C74.0161 446.821 92.4374 450.709 110.094 456.009C117.024 458.089 115.655 466.892 109.28 470.77C103.501 472.219 66.7283 460.154 58.6762 459.25C48.83 458.145 41.4607 450.28 52.0094 442.317Z" fill="#FEFEFE"/><path d="M114.956 503.91C117.909 504.024 119.146 504.244 121.511 506.099C125.448 509.187 125.113 515.182 121.029 517.954C108.921 526.171 96.3264 533.81 84.0477 541.791C80.6652 543.992 75.8058 547.433 72.1429 548.822C63.4138 548.801 59.622 539.171 66.2927 534.977C81.5966 525.357 99.0055 511.984 114.956 503.91Z" fill="#FEFEFE"/></svg>';
    document.body.appendChild(cursor);

    // Klik → toon de klik-hand i.p.v. de OK-hand
    window.addEventListener('mousedown', () => cursor.classList.add('is-click'));
    window.addEventListener('mouseup',   () => cursor.classList.remove('is-click'));

    // Delegatie via mousemove → werkt ook op dynamisch geladen work-items
    function onMove(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top  = e.clientY + 'px';
        const item = e.target.closest ? e.target.closest(CASE_CURSOR_SEL) : null;
        if (item) {
            cursor.classList.add('is-visible');
            const r = item.getBoundingClientRect();
            // Genormaliseerde positie t.o.v. het midden (-1 .. 1)
            const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
            const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
            // Recht in het midden, kantelt licht weg naar de zijkanten
            const MAX = 20; // graden
            const rot = Math.max(-1, Math.min(1, nx)) * MAX;
            const tilt = Math.max(-1, Math.min(1, ny)) * 4;
            cursor.style.setProperty('--rot', (rot + tilt) + 'deg');
        } else {
            cursor.classList.remove('is-visible');
        }
    }
    window.addEventListener('mousemove', onMove, { passive: true });
}

// ===== NAV-LOGO: Lottie-animatie linksboven =====
function initNavLogo() {
    const box = document.getElementById('navLogoAni');
    if (!box || typeof lottie === 'undefined') return;
    const anim = lottie.loadAnimation({
        container: box,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/yoko-logo.json',
    });
    const link = box.closest('.site-logo, .nav__logo') || box;
    // Bovenaan loopt de animatie; zodra je scrollt maakt 'ie de cyclus af
    // en stopt op de rustpositie (begin/eind-frame = normale logo).
    let collapsed = false;
    function syncScroll() {
        const isCol = window.scrollY > 60;
        if (isCol === collapsed) return;
        collapsed = isCol;
        if (collapsed) anim.loop = false;      // niet meer herhalen → stopt op eind (rustpose)
        else { anim.loop = true; anim.play(); }
    }
    window.addEventListener('scroll', syncScroll, { passive: true });

    // Op hover blijft het logo op het huidige frame staan; geen sprong naar
    // het begin van de animatie. Bovenaan loopt het na hover weer verder.
    link.addEventListener('mouseenter', () => anim.pause());
    link.addEventListener('mouseleave', () => {
        if (!collapsed) anim.play();
    });

}

// ===== INTRO-SLIDESHOW: crossfade tussen studio-foto's =====
function initIntroSlideshow() {
    const box = document.getElementById('introSlideshow');
    if (!box) return;
    const slides = Array.from(box.querySelectorAll('.intro-collage__bg'));
    if (slides.length < 2) return;
    let i = 0;
    setInterval(() => {
        slides[i].classList.remove('is-active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('is-active');
    }, 3500);
}

// ===== HOMEPAGE CASE RANDOMIZERS =====
function initChapterRandomizers() {
    document.querySelectorAll('.ch').forEach(chapter => {
        const button = chapter.querySelector('.ch__randomize');
        const row = chapter.querySelector('.ch__random-row');
        const poolRow = chapter.querySelector('.ch__pool-row');
        if (!button || !row || !poolRow) return;

        const cards = [...row.querySelectorAll(':scope > .ch__item'), ...poolRow.querySelectorAll(':scope > .ch__item')]
            .map(card => card.cloneNode(true));
        poolRow.remove();

        button.addEventListener('click', () => {
            const current = [...row.querySelectorAll(':scope > .ch__item')]
                .map(card => card.dataset.caseId)
                .sort()
                .join('|');

            let next = cards.slice(0, 2);
            for (let attempt = 0; attempt < 12; attempt += 1) {
                next = [...cards].sort(() => Math.random() - 0.5).slice(0, 2);
                const signature = next.map(card => card.dataset.caseId).sort().join('|');
                if (signature !== current) break;
            }

            row.replaceChildren(...next.map(card => {
                const clone = card.cloneNode(true);
                clone.classList.remove('js-fade');
                return clone;
            }));

            button.classList.remove('is-spinning');
            void button.offsetWidth;
            button.classList.add('is-spinning');
        });
    });
}

function initRandomizerPlacement() {
    const mobile = window.matchMedia('(max-width: 720px)');

    function placeButtons() {
        document.querySelectorAll('.ch').forEach(chapter => {
            const leadRow = chapter.querySelector('.ch__lead-row');
            const text = leadRow?.querySelector('.ch__text');
            const button = chapter.querySelector('.ch__randomize');
            if (!leadRow || !text || !button) return;

            if (mobile.matches) {
                text.after(button);
            } else {
                leadRow.after(button);
            }
        });
    }

    mobile.addEventListener('change', placeButtons);
    placeButtons();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    initNavLogo();
    initIntroSlideshow();
    initChapterRandomizers();
    initRandomizerPlacement();
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
    initCaseCursor();

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
        if (CONFIG.mode === 'work') {
            appendToolTiles(gridSingle);
            initWorkCategories();
        }
        initScrollFade();
        initTileMagnet();
    }
});
