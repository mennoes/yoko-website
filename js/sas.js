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
