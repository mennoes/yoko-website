/* ============================================================
   STUDIO YOKO — Case pagina JavaScript
   Laadt case-data op basis van ?slug= in de URL
   ============================================================ */

async function initCasePage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = 'work.html';
        return;
    }

    let cases;
    try {
        const res = await fetch('data/cases.json');
        const data = await res.json();
        cases = data.cases;
    } catch (e) {
        console.error('cases.json niet gevonden');
        return;
    }

    const caseIndex = cases.findIndex(c => c.slug === slug);
    const c = cases[caseIndex];

    if (!c) {
        document.title = 'Niet gevonden — Studio Yoko';
        return;
    }

    // ===== META =====
    document.title = `${c.title} — Studio Yoko`;
    document.getElementById('page-desc')?.setAttribute('content', c.summary || '');

    // Accent kleur op hero achtergrond
    const heroSection = document.getElementById('case-hero');
    if (heroSection && c.accent_color) {
        heroSection.style.background = c.accent_color;
    }

    // ===== HERO MEDIA =====
    const heroMedia = document.getElementById('case-hero-media');
    if (heroMedia) {
        const heroVideo = c.assets?.find(a => a.type === 'video') || null;

        if (heroVideo) {
            heroMedia.innerHTML = `
                <video autoplay muted loop playsinline>
                    <source src="${heroVideo.src}" type="video/mp4">
                </video>`;
        } else if (c.thumbnail) {
            heroMedia.innerHTML = `<img src="${c.thumbnail}" alt="${c.title}">`;
        } else {
            heroMedia.style.background = c.accent_color || '#1a1a1a';
        }
    }

    setText('case-category', c.category);
    setText('case-title', c.title);

    // ===== INFO =====
    setText('case-client', c.client || c.title);
    setText('case-category-detail', c.category);

    const tagsEl = document.getElementById('case-tags');
    if (tagsEl && c.tags?.length) {
        tagsEl.innerHTML = c.tags.map(t => `<span class="case-tag">${t}</span>`).join('');
    } else {
        document.getElementById('case-tags-block')?.remove();
    }

    const descEl = document.getElementById('case-description');
    if (descEl && c.description) {
        descEl.innerHTML = c.description
            .split('\n\n')
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    // ===== GALLERY =====
    const galleryEl = document.getElementById('case-gallery');
    if (galleryEl && c.assets?.length) {
        const galleryAssets = c.assets.filter(a => a.type === 'image' || a.type === 'video');

        if (galleryAssets.length) {
            galleryEl.innerHTML = galleryAssets.map((asset, i) => {
                // Layout patroon: eerste item groot, daarna paren van halven
                let cls = 'gallery-item';
                if (i === 0) {
                    cls = 'gallery-item'; // full width
                } else if (galleryAssets.length >= 3 && i % 3 !== 0) {
                    cls = 'gallery-item gallery-item--half';
                }

                if (asset.type === 'video') {
                    return `<div class="${cls}">
                        <video autoplay muted loop playsinline>
                            <source src="${asset.src}" type="video/mp4">
                        </video>
                    </div>`;
                }
                return `<div class="${cls}">
                    <img src="${asset.src}" alt="${asset.alt || c.title}" loading="lazy">
                </div>`;
            }).join('');
        } else {
            galleryEl.style.display = 'none';
        }
    } else if (galleryEl) {
        galleryEl.style.display = 'none';
    }

    // ===== VOLGENDE CASE =====
    const nextCase = cases[(caseIndex + 1) % cases.length];
    const nextLinkEl = document.getElementById('case-next-link');
    const nextBgEl = document.getElementById('case-next-bg');

    if (nextLinkEl && nextCase) {
        nextLinkEl.href = `case.html?slug=${nextCase.slug}`;
        setText('case-next-title', nextCase.title);

        // Thumbnail als achtergrond van next sectie
        if (nextBgEl && nextCase.thumbnail) {
            nextBgEl.src = nextCase.thumbnail;
            nextBgEl.alt = nextCase.title;
        } else if (nextBgEl) {
            nextBgEl.style.display = 'none';
        }

        // Accent kleur border
        if (nextCase.accent_color) {
            const nextSection = document.getElementById('case-next');
            if (nextSection) {
                nextSection.style.borderTopColor = nextCase.accent_color + '30';
            }
        }
    }

    // ===== SCROLL ANIMATIES =====
    document.querySelectorAll('.case-meta__item, .case-description p, .gallery-item')
        .forEach((el, i) => {
            el.classList.add('js-fade');
            el.style.transitionDelay = `${Math.min(i * 0.06, 0.35)}s`;
        });

    // Scroll fade initialiseren (main.js heeft dit ook, maar double-check)
    if (typeof initScrollFade === 'function') initScrollFade();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
}

document.addEventListener('DOMContentLoaded', initCasePage);
