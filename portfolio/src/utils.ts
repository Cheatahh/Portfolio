import type {CSSProperties} from 'react';

export const delay = (ms: number): CSSProperties => ({'--delay': `${ms}ms`} as CSSProperties);
