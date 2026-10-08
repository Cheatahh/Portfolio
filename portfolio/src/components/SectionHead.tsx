import type {ReactNode} from 'react';

interface SectionHeadProps {
    number: string;
    name: string;
    title: ReactNode;
    lead?: ReactNode;
}

export function SectionHead({number, name, title, lead}: SectionHeadProps) {
    return (
        <div className="section-head reveal">
            <h2 className="eyebrow"><span><span aria-hidden="true">{number} · </span>{name}</span></h2>
            <p className="section-title">{title}</p>
            {lead && <p className="section-lead">{lead}</p>}
        </div>
    );
}
