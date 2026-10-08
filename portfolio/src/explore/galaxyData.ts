import {galaxy, type Star} from 'portfolioContent';

export const map = galaxy();

export const starById = new Map(map.stars.map(s => [s.id, s]));
export const constellationById = new Map(map.constellations.map(c => [c.id, c]));

export const colorOf = (star: Star) => constellationById.get(star.constellation)?.color ?? '#ffffff';

export function nextStop(current: string | null, discovered: ReadonlySet<string>): Star {
    const stars = map.stars;
    const start = current ? stars.findIndex(s => s.id === current) : -1;
    for (let i = 1; i <= stars.length; i++) {
        const star = stars[(start + i) % stars.length];
        if (!discovered.has(star.id)) return star;
    }
    return stars[(start + 1) % stars.length];
}

const STORAGE_KEY = 'portfolio.galaxy.discovered';

export function loadDiscovered(): Set<string> {
    try {
        const ids: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        return new Set(Array.isArray(ids) ? ids.filter((id): id is string => starById.has(id)) : []);
    } catch {
        return new Set();
    }
}

export function saveDiscovered(ids: ReadonlySet<string>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
    }
}
