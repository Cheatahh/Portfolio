// noinspection HtmlUnknownAnchorTarget

import './Footer.css';

import {data} from '../data.ts';

export function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <span>© {new Date().getFullYear()} {data.profile.name}</span>
                <span className="footer-built">
                    Built with <b>&lt;3</b>
                </span>
                <a href="#top">Back to top ↑</a>
            </div>
        </footer>
    );
}
