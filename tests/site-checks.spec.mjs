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

test('sitemap.xml lists exactly the routes in dist', async ({ request }) => {
  const r = await request.get('/sitemap.xml');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('application/xml');
  const paths = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1].trim()).pathname)
    .sort();
  expect(paths).toEqual([...ROUTES].sort());
});

test('llms.txt links the publications catalog', async ({ request }) => {
  const r = await request.get('/llms.txt');
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain(HUB);
});
