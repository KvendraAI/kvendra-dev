// Site checks for kvendra.dev (ISSUE-KVD-DEV-79CA56, ISSUE-KVD-DEV-2C5055; STD-KVD-DEV-56B82C
// steps 3 and 10). Every page built into dist/, at 375 and 1440 px:
//   - no horizontal overflow (a wide table or code block scrolls inside its own box),
//   - no page error,
// plus the component pages link to their publication on /hub/<slug>/ and llms.txt links /hub/.
// Local or CI: against `astro preview` (playwright.config.mjs). Live: KVD_BASE_URL=https://kvendra.dev
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { expect, test } from '@playwright/test';

const DIST = new URL('../dist/', import.meta.url).pathname;

function routes(dir = DIST) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === '_astro') continue;
      out.push(...routes(p));
    } else if (name === 'index.html') {
      const r = '/' + relative(DIST, dir).split(sep).join('/');
      out.push(r === '/' ? '/' : `${r}/`);
    }
  }
  return out.sort();
}

const ROUTES = routes();
const HUB = 'https://app.kvendra.cloud/hub/';

test('dist has pages', () => {
  expect(ROUTES.length).toBeGreaterThan(5);
});

for (const width of [375, 1440]) {
  for (const route of ROUTES) {
    test(`${route} at ${width}px: no horizontal overflow, no page error`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} overflows by ${overflow}px at ${width}px`).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}

for (const [route, slug] of [
  ['/docs/platform/', 'kvendra-platform'],
  ['/docs/cli/', 'kvendra-cli'],
  ['/docs/skills/', 'kvendra-skills'],
]) {
  test(`${route} links to its publication ${slug}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator(`a[href="${HUB}${slug}/"]`)).toHaveCount(1);
  });
}

test('llms.txt links the publications catalog', async ({ request }) => {
  const r = await request.get('/llms.txt');
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain(HUB);
});

for (const route of ROUTES) {
  test(`${route} has Open Graph and Twitter card metadata`, async ({ page }) => {
    await page.goto(route);
    const meta = await page.evaluate(() => {
      const attr = (sel, name) => document.querySelector(sel)?.getAttribute(name);
      return {
        title: document.title,
        description: attr('meta[name="description"]', 'content'),
        canonical: attr('link[rel="canonical"]', 'href'),
        ogTitle: attr('meta[property="og:title"]', 'content'),
        ogDescription: attr('meta[property="og:description"]', 'content'),
        ogUrl: attr('meta[property="og:url"]', 'content'),
        twitterCard: attr('meta[name="twitter:card"]', 'content'),
      };
    });
    expect(meta.ogTitle).toBe(meta.title);
    expect(meta.ogDescription).toBe(meta.description);
    expect(meta.ogUrl).toBe(meta.canonical);
    expect(meta.twitterCard).toBe('summary');
    expect(typeof meta.title).toBe('string');
    expect(meta.title.trim()).not.toBe('');
    expect(typeof meta.description).toBe('string');
    expect(meta.description.trim()).not.toBe('');
    expect(meta.canonical, `${route} has no canonical`).toBeTruthy();
    // Compare the pathname only: the suite talks to the local preview server, not production.
    expect(new URL(meta.canonical).pathname).toBe(route);
  });
}

test('every page has a distinct title', async ({ page }) => {
  const byTitle = new Map();
  for (const route of ROUTES) {
    await page.goto(route);
    const title = await page.title();
    byTitle.set(title, [...(byTitle.get(title) ?? []), route]);
  }
  const collisions = [...byTitle].filter(([, routes]) => routes.length > 1);
  expect(
    collisions,
    collisions.map(([title, routes]) => `"${title}": ${routes.join(', ')}`).join('; '),
  ).toEqual([]);
});

test('every page declares a language on <html>', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang?.trim(), `${route} has no lang on <html>`).toBeTruthy();
  }
});

test('every <img> has an alt attribute', async ({ page }) => {
  const missing = [];
  for (const route of ROUTES) {
    await page.goto(route);
    const srcs = await page.$$eval('img:not([alt])', (imgs) =>
      imgs.map((i) => i.getAttribute('src') ?? '(no src)'),
    );
    for (const src of srcs) missing.push(`${route}: ${src}`);
  }
  expect(missing, missing.join('; ')).toEqual([]);
});

test('sitemap.xml lists exactly the built pages', async ({ request }) => {
  const r = await request.get('/sitemap.xml');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('xml');
  const locs = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1].trim()).pathname)
    .sort();
  expect(locs).toEqual(ROUTES);
});

test('every internal link resolves to a route or a served file', async ({ page, request }) => {
  const SKIP = ['http://', 'https://', 'mailto:', 'tel:', '#'];
  const known = new Set(ROUTES);
  const served = new Map();
  const broken = [];
  for (const route of ROUTES) {
    await page.goto(route);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const href of new Set(hrefs)) {
      if (SKIP.some((p) => href.startsWith(p)) || !href.startsWith('/')) continue;
      const target = new URL(href, 'http://local').pathname;
      if (known.has(target)) continue;
      if (!served.has(target)) served.set(target, (await request.get(target)).status());
      if (served.get(target) !== 200) broken.push(`${route} -> ${href} (${served.get(target)})`);
    }
  }
  expect(broken, broken.join('; ')).toEqual([]);
});

test('robots.txt is served and its Sitemap line points at a served sitemap', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(r.status()).toBe(200);
  const m = (await r.text()).match(/^Sitemap:\s*(\S+)\s*$/m);
  expect(m, 'robots.txt has no Sitemap: line').not.toBeNull();
  const sitemap = new URL(m[1]);
  expect(sitemap.origin).toBe('https://kvendra.dev');
  // Request the pathname: the suite talks to the local preview server, not production.
  const s = await request.get(sitemap.pathname);
  expect(s.status()).toBe(200);
  expect(await s.text()).toContain('<urlset');
});
