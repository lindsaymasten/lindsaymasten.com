import { initWidowControl } from './typography.js';

document.documentElement.classList.add('has-js');

initWidowControl();

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const savesData = navigator.connection?.saveData === true;

if (!motionPreference.matches && !savesData) {
    const loadOctopus = () => {
        import('./octopus.js')
            .then(({ initInkOctopus }) => initInkOctopus())
            .catch(() => {
                document.querySelector('[data-ink-octopus]')?.setAttribute('hidden', '');
            });
    };

    if (document.readyState !== 'loading') {
        loadOctopus();
    } else {
        document.addEventListener('DOMContentLoaded', loadOctopus, { once: true });
    }
}

const index = document.querySelector('[data-cv-index]');

if (index) {
    const links = Array.from(index.querySelectorAll('a'));
    const sections = links
        .map((link) => document.querySelector(link.hash))
        .filter(Boolean);

    links.forEach((link) => {
        link.addEventListener('click', () => index.removeAttribute('open'));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') index.removeAttribute('open');
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                links.forEach((link) => {
                    if (link.hash === `#${entry.target.id}`) {
                        link.setAttribute('aria-current', 'true');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            });
        }, { rootMargin: '-10% 0px -75% 0px' });

        sections.forEach((section) => observer.observe(section));
    }
}
