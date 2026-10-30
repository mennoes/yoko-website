// Keep decorative loops still for visitors who prefer reduced motion.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function syncSasMotion() {
    document.querySelectorAll('.page--sas video[autoplay]').forEach(video => {
        if (reducedMotion.matches) video.pause();
        else if (video.readyState >= 2) video.play().catch(() => {});
    });
}
document.querySelectorAll('.page--sas video[autoplay]').forEach(video => {
    video.addEventListener('play', () => {
        if (reducedMotion.matches) video.pause();
    });
});
reducedMotion.addEventListener('change', syncSasMotion);
syncSasMotion();

// Pause background previews while the complete film is playing with sound.
const fullFilms = document.querySelectorAll('.sas-film video, .sas-intro__film');
fullFilms.forEach(fullFilm => fullFilm.addEventListener('play', () => {
    document.querySelectorAll('.page--sas video').forEach(video => {
        if (video !== fullFilm) video.pause();
    });
}));

const introPlayer = document.querySelector('.sas-intro__player');
const playButton = introPlayer?.querySelector('.sas-intro__play');
playButton?.addEventListener('click', () => {
    const preview = introPlayer.querySelector('.sas-intro__preview');
    const film = introPlayer.querySelector('.sas-intro__film');
    preview.pause();
    preview.hidden = true;
    film.hidden = false;
    playButton.hidden = true;
    film.muted = false;
    film.play().catch(() => {
        // Native controls stay visible if the browser needs another play gesture.
    });
});

// Enlarge all stills and looping clips, keeping the complete-film players separate.
const zoomMedia = Array.from(document.querySelectorAll('.sas-hero > video, .sas-gallery > img, .sas-gallery > video, .sas-process__grid figure > img, .sas-process__grid figure > video'));
const lightbox = document.createElement('dialog');
lightbox.className = 'sas-lightbox';
lightbox.setAttribute('aria-label', 'SAS-ICU beeldmateriaal vergroot');
lightbox.innerHTML = '<button type="button" class="sas-lightbox__close" aria-label="Sluiten">×</button><button type="button" class="sas-lightbox__prev" aria-label="Vorig beeld">‹</button><div class="sas-lightbox__content"></div><p class="sas-lightbox__caption" aria-live="polite"></p><button type="button" class="sas-lightbox__next" aria-label="Volgend beeld">›</button>';
document.body.append(lightbox);
const lightboxContent = lightbox.querySelector('.sas-lightbox__content');
let zoomIndex = 0;
let playingBeforeZoom = [];
let previousOverflow = '';

function showZoomMedia(index) {
    zoomIndex = (index + zoomMedia.length) % zoomMedia.length;
    lightboxContent.querySelector('video')?.pause();
    const original = zoomMedia[zoomIndex];
    const label = original.getAttribute('alt') || original.getAttribute('aria-label') || 'SAS-ICU';
    const enlarged = document.createElement(original.tagName.toLowerCase());
    if (original.tagName === 'VIDEO') {
        const source = original.querySelector('source');
        enlarged.src = original.currentSrc || source?.getAttribute('src') || source?.dataset.src;
        enlarged.controls = true;
        enlarged.muted = true;
        enlarged.loop = true;
        enlarged.playsInline = true;
        enlarged.setAttribute('aria-label', label);
        if (original.poster) enlarged.poster = original.poster;
    } else {
        enlarged.src = original.currentSrc || original.src;
        enlarged.alt = label;
    }
    lightboxContent.replaceChildren(enlarged);
    lightbox.querySelector('.sas-lightbox__caption').textContent = `${zoomIndex + 1} / ${zoomMedia.length} — ${label}`;
    if (original.tagName === 'VIDEO' && !reducedMotion.matches) enlarged.play().catch(() => {});
}

zoomMedia.forEach((media, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sas-zoom';
    button.setAttribute('aria-label', `Vergroot: ${media.getAttribute('alt') || media.getAttribute('aria-label') || 'SAS-ICU'}`);
    button.setAttribute('aria-haspopup', 'dialog');
    media.before(button);
    button.append(media);
    button.addEventListener('click', () => {
        playingBeforeZoom = Array.from(document.querySelectorAll('.page--sas video')).filter(video => !video.paused);
        playingBeforeZoom.forEach(video => video.pause());
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        lightbox.showModal();
        showZoomMedia(index);
    });
});
lightbox.querySelector('.sas-lightbox__close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.sas-lightbox__prev').addEventListener('click', () => showZoomMedia(zoomIndex - 1));
lightbox.querySelector('.sas-lightbox__next').addEventListener('click', () => showZoomMedia(zoomIndex + 1));
lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener('keydown', event => {
    // Leave native playback shortcuts available when the video controls have focus.
    if (event.target.tagName === 'VIDEO') return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        showZoomMedia(zoomIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
});
lightbox.addEventListener('close', () => {
    lightboxContent.querySelector('video')?.pause();
    lightboxContent.replaceChildren();
    document.body.style.overflow = previousOverflow;
    playingBeforeZoom.forEach(video => {
        if (video.isConnected && !reducedMotion.matches) video.play().catch(() => {});
    });
});
