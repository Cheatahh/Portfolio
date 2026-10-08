import type {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
    className: 'icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
} as const;

export const ArrowRight = (p: IconProps) => (
    <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
);

export const ArrowLeft = (p: IconProps) => (
    <svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
);

export const Rocket = (p: IconProps) => (
    <svg {...base} {...p}>
        <path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.1 2.1 0 0 0-2.9-.1Z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2Z"/>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
);

export const ArrowUpRight =(p: IconProps) => (
    <svg {...base} {...p}><path d="M7 17 17 7M8 7h9v9"/></svg>
);

export const Mail = (p: IconProps) => (
    <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
);

export const MapPin = (p: IconProps) => (
    <svg {...base} {...p}><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
);

export const Menu = (p: IconProps) => (
    <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16"/></svg>
);

export const Close = (p: IconProps) => (
    <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>
);

export const LinkedIn = (p: IconProps) => (
    <svg {...base} fill="currentColor" stroke="none" {...p}>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4v-11Z"/>
    </svg>
);

export const GitHub = (p: IconProps) => (
    <svg {...base} fill="currentColor" stroke="none" {...p}>
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>
    </svg>
);

export function LinkIcon({kind}: { kind: string }) {
    switch (kind) {
        case 'linkedin':
            return <LinkedIn/>;
        case 'github':
            return <GitHub/>;
        case 'email':
            return <Mail/>;
        default:
            return <ArrowUpRight/>;
    }
}

export const SoundOn = (p: IconProps) => (
    <svg {...base} {...p}>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>
    </svg>
);

export const SoundOff = (p: IconProps) => (
    <svg {...base} {...p}>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>
        <path d="M16 9.5l5 5M21 9.5l-5 5"/>
    </svg>
);
