import {useEffect} from 'react';

const isAutomated = () =>
    navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent);

export function useReveal() {
    useEffect(() => {
        const elements = document.querySelectorAll<HTMLElement>('.reveal');
        if (!('IntersectionObserver' in window) || isAutomated()) {
            elements.forEach(el => el.classList.add('visible'));
            return;
        }
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            }
        }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
}
