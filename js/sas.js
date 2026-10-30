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
const fullFilm = document.querySelector('.sas-film video');
fullFilm?.addEventListener('play', () => {
    document.querySelectorAll('.page--sas video[autoplay]').forEach(video => video.pause());
});
