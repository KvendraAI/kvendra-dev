import type { APIRoute } from 'astro';

// Static sitemap, generated at build time from the .astro pages (no extra
// dependency). Every page lives at a trailing-slash directory URL because the
// build uses format:'directory'.
const pages = import.meta.glob('./**/*.astro', { eager: false });

function toPath(file: string): string {
  const route = file
    .replace(/^\.\//, '')
    .replace(/\.astro$/, '')
    .replace(/(^|\/)index$/, '');
  return route ? `/${route}/` : '/';
}

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://kvendra.dev');
  const paths = Object.keys(pages)
    .filter((f) => !/\[|\/_|^\.\/_|404\.astro$/.test(f))
    .map(toPath)
    .sort();
  const urls = paths
    .map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`)
    .join('\n');
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n';
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
