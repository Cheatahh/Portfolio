import {lazy, Suspense} from 'react';
import {useReveal} from './hooks/useReveal.ts';
import {leaveExplore, useExploreRoute} from './hooks/useExploreRoute.ts';
import {Nav} from './components/Nav.tsx';
import {Hero} from './components/Hero.tsx';
import {About} from './components/About.tsx';
import {Experience} from './components/Experience.tsx';
import {Research} from './components/Research.tsx';
import {Projects} from './components/Projects.tsx';
import {Skills} from './components/Skills.tsx';
import {Education} from './components/Education.tsx';
import {Contact} from './components/Contact.tsx';
import {Footer} from './components/Footer.tsx';

const Explore = lazy(() => import('./explore/Explore.tsx'));

export function App() {
    useReveal();
    const exploring = useExploreRoute();
    return (
        <>
            <div className="backdrop" aria-hidden="true">
                <div className="blob a"/>
                <div className="blob b"/>
                <div className="blob c"/>
            </div>
            <Nav/>
            <main>
                <Hero/>
                <About/>
                <Experience/>
                <Skills/>
                <Education/>
                <Research/>
                <Projects/>
                <Contact/>
            </main>
            <Footer/>
            {exploring && (
                <Suspense fallback={<div className="gx-loading">Fuelling the engines…</div>}>
                    <Explore onExit={leaveExplore}/>
                </Suspense>
            )}
        </>
    );
}
