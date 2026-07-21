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
            <div class="work-item__info">
                <span class="work-item__client">${t.client}</span>
            </div>
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
            item.classList.toggle('is-hidden', item.dataset.group !== group);
        });
    }

    filterBtns.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.filter)));

    // Standaard: eerste categorie (Vorm)
    activate('vorm');
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

// ===== CASE-CURSOR: roteert richting het midden van de case =====
function initCaseCursor() {
    const items = document.querySelectorAll('.ch__item');
    if (!items.length) return;
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'case-cursor';
    cursor.innerHTML = '<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><path d="M281.479 101.464C289.079 101.464 295.908 105.402 300.534 112.716C312.429 131.282 320.69 151.423 325.426 173.139C325.757 174.601 326.087 175.952 327.409 177.527C329.391 169.763 331.264 162.112 333.356 154.348C334.127 151.31 334.898 148.047 336.33 145.234C339.855 138.37 346.684 134.545 353.733 134.545C356.156 134.545 358.579 134.995 360.892 135.895C370.805 139.833 375.871 149.96 373.118 160.874C366.84 185.853 360.451 210.832 354.063 235.924L442.067 415.842C448.786 431.144 437.992 448.36 421.581 448.585L335.119 449.26C335.009 449.26 335.009 449.26 334.898 449.26C334.458 449.26 334.127 449.26 333.797 449.26C325.536 448.81 318.267 443.409 314.852 435.645L298.551 398.739L298.992 397.276C291.833 404.59 283.242 410.328 273.219 414.266C258.019 420.23 243.37 423.268 229.162 423.268C204.269 423.268 181.029 413.704 159.992 393.338C152.282 385.799 145.784 376.235 140.937 366.446C132.456 349.231 126.289 331.003 127.39 311.199C127.61 306.698 128.161 301.973 129.703 297.697C132.456 290.046 139.506 285.432 147.105 285.432C148.097 285.432 149.088 285.545 150.189 285.657C159.331 287.12 165.83 294.096 166.491 303.548L166.711 302.985C166.931 308.499 167.702 314.237 169.024 320.088C174.751 345.967 189.4 364.983 202.727 364.983C203.829 364.983 204.82 364.871 205.811 364.646C219.91 361.383 226.298 336.066 220.02 308.161C214.292 282.282 199.643 263.266 186.316 263.266C185.215 263.266 184.223 263.379 183.232 263.604C177.945 264.841 170.566 270.805 167.702 277.331C165.389 278.344 162.856 279.019 160.212 279.019C159.111 279.019 157.899 278.906 156.688 278.681C142.479 275.531 139.726 257.753 148.868 246.051C164.178 226.585 184.334 217.359 208.675 217.246C208.785 217.246 208.785 217.246 208.895 217.246C220.681 217.246 231.695 220.622 243.48 225.797C238.854 212.858 233.237 201.718 225.527 192.042C219.469 184.503 212.861 177.864 206.472 171.001C200.194 164.362 197.991 154.573 201.185 146.472C204.71 137.695 212.53 132.069 221.672 132.069C221.672 132.069 221.672 132.069 221.782 132.069C227.84 132.069 233.017 134.32 237.532 138.483C256.807 156.261 271.677 177.189 281.81 201.606C282.471 203.181 283.131 204.644 284.563 206.107C284.563 204.756 284.453 203.406 284.453 202.056C282.911 178.54 275.642 157.049 263.085 137.245C254.164 123.293 261.213 105.29 276.743 101.914C278.395 101.577 279.937 101.464 281.479 101.464Z" fill="#DCB83E"/></svg>';
    document.body.appendChild(cursor);

    let activeItem = null;

    function onMove(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top  = e.clientY + 'px';
        if (activeItem) {
            const r = activeItem.getBoundingClientRect();
            // Genormaliseerde positie t.o.v. het midden (-1 .. 1)
            const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
            const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
            // Recht in het midden, kantelt licht weg naar de zijkanten
            const MAX = 20; // graden
            const rot = Math.max(-1, Math.min(1, nx)) * MAX;
            // subtiele extra beweging in de verticale as
            const tilt = Math.max(-1, Math.min(1, ny)) * 4;
            cursor.style.setProperty('--rot', (rot + tilt) + 'deg');
        }
    }

    items.forEach(item => {
        item.addEventListener('mouseenter', () => { activeItem = item; cursor.classList.add('is-visible'); });
        item.addEventListener('mouseleave', () => { activeItem = null; cursor.classList.remove('is-visible'); });
    });
    window.addEventListener('mousemove', onMove, { passive: true });
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
    }
});
