import {useEffect, useState} from 'react';

export function useActiveSection(ids: readonly string[]): string {
    const [active, setActive] = useState('');
    useEffect(() => {
        const update = () => {
            const marker = window.innerHeight * 0.35;
            let current = '';
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= marker) current = id;
            }
            setActive(current);
        };
        update();
        window.addEventListener('scroll', update, {passive: true});
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [ids]);
    return active;
}
