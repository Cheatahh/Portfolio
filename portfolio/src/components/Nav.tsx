// noinspection HtmlUnknownAnchorTarget,SpellCheckingInspection

import './Nav.css';

import {useEffect, useState} from 'react';
import {useActiveSection} from '../hooks/useActiveSection.ts';
import {EXPLORE_HASH} from '../hooks/useExploreRoute.ts';
import {Close, Menu, Rocket} from './Icons.tsx';

const SECTIONS = [
    {id: 'about', label: 'About'},
    {id: 'experience', label: 'Experience'},
    {id: 'research', label: 'Research'},
    {id: 'projects', label: 'Projects'},
    {id: 'skills', label: 'Skills'},
    {id: 'contact', label: 'Contact'},
] as const;

const IDS = SECTIONS.map(s => s.id);

export function Nav() {
    const active = useActiveSection(IDS);
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
    }, [open]);
    return (
        <header className={`nav ${scrolled ? 'scrolled' : ''} ${open ? 'open' : ''}`}>
            <div className="container nav-inner">
                <a href="#top" className="nav-logo" onClick={() => setOpen(false)}>
                    <span className="nav-logo-text">florian<span className="gradient-text">.stach</span></span>
                </a>
                <nav className="nav-links" aria-label="Main">
                    {SECTIONS.map(s => (
                        <a key={s.id}
                           href={`#${s.id}`}
                           className={active === s.id ? 'active' : ''}
                           onClick={() => setOpen(false)}>
                            {s.label}
                        </a>
                    ))}
                    <a href={EXPLORE_HASH} className="nav-explore" onClick={() => setOpen(false)}>
                        <Rocket/> Explore in 3D
                    </a>
                </nav>
                <button className="nav-toggle"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        onClick={() => setOpen(o => !o)}>
                    {open ? <Close/> : <Menu/>}
                </button>
            </div>
        </header>
    );
}
