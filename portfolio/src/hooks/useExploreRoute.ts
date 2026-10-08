import {useEffect, useState} from 'react';

export const EXPLORE_HASH = '#/explore';

const isExploring = () => window.location.hash === EXPLORE_HASH;

export function useExploreRoute(): boolean {
    const [exploring, setExploring] = useState(isExploring);
    useEffect(() => {
        const update = () => setExploring(isExploring());
        window.addEventListener('hashchange', update);
        return () => window.removeEventListener('hashchange', update);
    }, []);
    return exploring;
}

export function leaveExplore(section?: string) {
    const {pathname, search} = window.location;
    history.replaceState(null, '', section ? `#${section}` : pathname + search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (section) {
        setTimeout(() => document.getElementById(section)?.scrollIntoView(), 30);
    }
}
