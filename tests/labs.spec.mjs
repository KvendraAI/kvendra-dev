// Labs section checks (ISSUE-KVD-DEV-983CE9; spec ISSUE-KVD-DEV-6EC74D; copy DOC-KGTM-3585F8 §C).
// /labs/ listing (cards, search, chips, aria-live count, no-JS fallback), the Lab 01 page
// (8 headings in order, table, curly quotes, TechArticle JSON-LD), the "Labs" nav entry,
// CSP and 375 px overflow.
import { createHash } from 'node:crypto';

import { expect, test } from '@playwright/test';

const LAB = '/labs/codex-cli/';
const TITLE = 'Kvendra from Codex CLI';
const RESULT =
  'Codex CLI connected, bootstrapped from a 30-line AGENTS.md and wrote decisions to the knowledge base.';

// A strict script policy applied to the served HTML: scripts from 'self' only, no third-party
// origin, and no inline script except the ones the home page already ships site-wide (allowed by
// hash). Any new inline or third-party script on the Labs pages raises a securitypolicyviolation.
async function strictCsp(request) {
  const home = await (await request.get('/')).text();
  const hashes = [...home.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !/application\/ld\+json/.test(attrs))
    .map(([, , body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  return (
    `default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; ` +
    "img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'"
  );
}

test.describe('/labs/ listing', () => {
  test('renders one card: title link, status works, date and result line', async ({ page }) => {
    await page.goto('/labs/');
    await expect(page.locator('h1')).toHaveText('Labs');
    const cards = page.locator('a.kvd-lab');
    await expect(cards).toHaveCount(1);
    const card = cards.first();
    await expect(card).toHaveAttribute('href', LAB);
    await expect(card.locator('.kvd-lab__title')).toHaveText(TITLE);
    await expect(card.locator('.kvd-lab__status')).toHaveText('works');
    await expect(card.locator('.kvd-lab__date')).toHaveText('2026-11-12');
    await expect(card.locator('.kvd-lab__result')).toHaveText(RESULT);
    await expect(card.locator('.kvd-lab__versions')).toHaveText('Codex CLI 0.167.2');
    await expect(card).toContainText('LAB 01');
  });

  test('search filters the list and a non-matching query shows "No labs match."', async ({ page }) => {
    await page.goto('/labs/');
    const search = page.getByLabel('Search labs');
    await expect(search).toBeVisible();
    const card = page.locator('a.kvd-lab');
    const empty = page.getByText('No labs match.');

    for (const q of ['codex', '0.167.2', 'AGENTS.md', 'Kvendra from']) {
      await search.fill(q);
      await expect(card, `query "${q}"`).toBeVisible();
      await expect(empty).toBeHidden();
    }

    await search.fill('zzz-no-such-lab');
    await expect(card).toBeHidden();
    await expect(empty).toBeVisible();

    await search.fill('');
    await expect(card).toBeVisible();
    await expect(empty).toBeHidden();
  });

  test('status chips filter and the aria-live count updates', async ({ page }) => {
    await page.goto('/labs/');
    const count = page.locator('[aria-live="polite"]');
    await expect(count).toHaveText('1 lab');
    const card = page.locator('a.kvd-lab');
    const chip = (name) => page.getByRole('button', { name, exact: true });

    await expect(chip('All')).toHaveAttribute('aria-pressed', 'true');

    await chip('Partial').click();
    await expect(chip('Partial')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip('All')).toHaveAttribute('aria-pressed', 'false');
    await expect(card).toBeHidden();
    await expect(count).toHaveText('0 labs');
    await expect(page.getByText('No labs match.')).toBeVisible();

    await chip("Didn't work").click();
    await expect(count).toHaveText('0 labs');

    await chip('Works').click();
    await expect(card).toBeVisible();
    await expect(count).toHaveText('1 lab');

    // Keyboard: chips are buttons, reachable and operable from the keyboard.
    await chip('All').focus();
    await page.keyboard.press('Enter');
    await expect(chip('All')).toHaveAttribute('aria-pressed', 'true');
    await expect(count).toHaveText('1 lab');

    // Tool chip (from the lab's `tools`).
    await chip('Codex').click();
    await expect(chip('Codex')).toHaveAttribute('aria-pressed', 'true');
    await expect(card).toBeVisible();
  });
});

test.describe('/labs/ without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the card is still visible and the controls are hidden', async ({ page }) => {
    await page.goto('/labs/');
    await expect(page.locator('a.kvd-lab')).toHaveCount(1);
    await expect(page.locator('a.kvd-lab')).toBeVisible();
    await expect(page.getByLabel('Search labs')).toBeHidden();
    await expect(page.getByText('No labs match.')).toBeHidden();
  });
});

test('/labs/codex-cli/ has the 8 section headings in order, the table and curly quotes', async ({
  page,
}) => {
  await page.goto(LAB);
  await expect(page.locator('h1')).toHaveText(TITLE);
  await expect(page.locator('.kvd-kicker')).toHaveText('Lab 01 · works');
  await expect(page.locator('.kvd-labpage__meta')).toHaveText(
    'Codex CLI 0.167.2 · hosted Kvendra MCP · 2026-11-12',
  );
  // Smart apostrophes are typographic; compare with straight ones.
  const h2 = (await page.locator('article h2').allTextContents()).map((t) =>
    t.trim().replace(/’/g, "'"),
  );
  expect(h2).toEqual([
    'Question',
    'Setup',
    'What we did',
    'Result: it works.',
    "What's different from Claude Code",
    'Limits and safety',
    'Reproduce it',
    'Links',
  ]);
  await expect(page.locator('article table')).toHaveCount(1);
  await expect(page.locator('article table tbody tr')).toHaveCount(6);

  const text = await page.locator('article').innerText();
  expect(text).toContain('“replaced by”');
  expect(text).toContain('“any MCP client”');
  expect(text).not.toContain('””');
  expect(text).not.toMatch(/"replaced by"|"any MCP client"/);

  await expect(page.locator('article a[href="/docs/codex/"]').first()).toBeVisible();
  await expect(page.locator('article a[href="https://kvendra.com/whats-new/"]')).toHaveCount(1);
  await expect(
    page.locator('article a[href="https://app.kvendra.cloud/hub/kvendra-platform/"]'),
  ).toHaveCount(1);
});

test('/labs/codex-cli/ TechArticle JSON-LD parses', async ({ page }) => {
  await page.goto(LAB);
  const blocks = await page.$$eval('script[type="application/ld+json"]', (ss) =>
    ss.map((s) => JSON.parse(s.textContent)),
  );
  const article = blocks.find((b) => b['@type'] === 'TechArticle');
  expect(article, 'no TechArticle JSON-LD').toBeTruthy();
  expect(article.headline).toBe(TITLE);
  expect(article.datePublished).toBe('2026-11-12');
  expect(article.dateModified).toBe('2026-11-12');
  expect(article.author).toMatchObject({ '@type': 'Organization', name: 'Kvendra' });
});

test('/labs/ and the lab have SEO metadata and are in the sitemap', async ({ page, request }) => {
  for (const route of ['/labs/', LAB]) {
    await page.goto(route);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(new URL(og).pathname).toMatch(/^\/brand\//);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(new URL(canonical).pathname).toBe(route);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://kvendra.dev/labs/</loc>');
  expect(sitemap).toContain(`<loc>https://kvendra.dev${LAB}</loc>`);
});

for (const width of [375, 1440]) {
  test(`nav has "Labs" right after "Docs" at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const items = await page.$$eval('nav.kvd-nav > a, nav.kvd-nav > details > summary', (els) =>
      els.map((e) => e.textContent.replace('▾', '').trim()),
    );
    const docs = items.indexOf('Docs');
    expect(docs).toBeGreaterThanOrEqual(0);
    expect(items[docs + 1]).toBe('Labs');
    const labs = page.locator('nav.kvd-nav > a[href="/labs/"]');
    await expect(labs).toBeVisible();
  });
}

for (const route of ['/labs/', LAB]) {
  test(`${route} raises 0 CSP violations under a strict script policy`, async ({ page, request }) => {
    const CSP = await strictCsp(request);
    await page.route('**/*', async (route_) => {
      const req = route_.request();
      if (req.resourceType() !== 'document') return route_.continue();
      const res = await route_.fetch();
      await route_.fulfill({
        response: res,
        headers: { ...res.headers(), 'content-security-policy': CSP },
      });
    });
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) =>
        window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`),
      );
    });
    await page.goto(route, { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
    if (route === '/labs/') {
      // The self-hosted filter script ran under that policy: the controls are revealed.
      await expect(page.getByLabel('Search labs')).toBeVisible();
    }
  });

  test(`${route} has no horizontal overflow at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(route, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}
