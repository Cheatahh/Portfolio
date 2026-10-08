import type {Plugin} from 'vite';

type Shared = typeof import('portfolioContent');

const ROBOTS = `# Everyone is welcome, including AI crawlers.
User-agent: *
Allow: /
`;

const TYPES: Record<string, string> = {
    'resume.md': 'text/markdown; charset=utf-8',
    'llm.txt': 'text/plain; charset=utf-8',
    'robots.txt': 'text/plain; charset=utf-8',
};

export function staticResume(): Plugin {
    let shared: Promise<Shared> | undefined;
    // @ts-ignore
    const load = () => (shared ??= import('portfolioContent'));
    // @ts-ignore
    const files = async (): Promise<Record<string, string>> => {
        const s = await load();
        return {'resume.md': s.resumeMarkdown(), 'llms.txt': s.llmTxt(), 'robots.txt': ROBOTS};
    };
    // @ts-ignore
    return {
        name: 'static-resume',
        transformIndexHtml: {
            order: 'pre',
            async handler(html) {
                const s = await load();
                return html
                    .replace('<!--static-resume-->', s.resumeHtml())
                    .replace('<!--json-ld-->', `<script type="application/ld+json">${s.resumeJsonLd()}</script>`);
            },
        },
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const name = (req["url"] ?? req.originalUrl)?.split('?')[0].slice(1) ?? '';
                if (!(name in TYPES)) return next();
                res.setHeader('Content-Type', TYPES[name]);
                res.end((await files())[name]);
            });
        },
        // @ts-ignore
        async generateBundle() {
            // @ts-ignore
            for (const [fileName, source] of Object.entries(await files())) {
                this.emitFile({type: 'asset', fileName, source});
            }
        },
    };
}
