// Codex CLI guide checks (ISSUE-KVD-DEV-468ED4; copy DOC-KGTM-3585F8 §B; AGENTS.md from
// DOC-KVD-3F723B §2). /docs/codex/ renders the h1, the TOML block, the full AGENTS.md template
// with <YOUR-PROJECT-ID> and the fail-safe, the Lab 01 link; the sidebar entry; CSP; 375 px.
import { createHash } from 'node:crypto';

import { expect, test } from '@playwright/test';

const GUIDE = '/docs/codex/';

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

test('/docs/codex/ renders the guide: h1, sections, TOML, AGENTS.md and the Lab 01 link', async ({
  page,
}) => {
  await page.goto(GUIDE);
  await expect(page.locator('article .kvd-kicker')).toHaveText('Guide');
  await expect(page.locator('article h1')).toHaveText('Use Kvendra from Codex CLI');
  const h2 = (await page.locator('article h2').allTextContents()).map((t) => t.trim());
  expect(h2).toEqual([
    'You need',
    '1. Add Kvendra to Codex',
    '2. Sign in to Kvendra',
    '3. Add a boot file',
    '4. Start a session',
    'Approvals',
    'What is different from Claude Code',
    'Safety',
    'Tested with',
  ]);

  const toml = await page.locator('article pre').nth(0).innerText();
  expect(toml).toContain('[mcp_servers.kvendra-cloud]');
  expect(toml).toContain('url = "https://api.kvendra.cloud/mcp"');

  const agents = await page.locator('article pre').nth(1).innerText();
  // Verbatim from DOC-KVD-3F723B §2: ends with the Reporting rule.
  expect(agents.trimEnd().endsWith('Cite the KB ids, versions and times you used.')).toBe(true);
  expect(agents.startsWith('# Your project — boot file for MCP agents')).toBe(true);
  expect(agents).toContain('Project id: **<YOUR-PROJECT-ID>**.');
  expect(agents).not.toContain('KVD');
  expect(agents).toContain('{"topic": "bootstrap"}');
  expect(agents).toContain('{{cfg:<key>}}');
  expect(agents).toContain('## Fail-safe');
  expect(agents).toContain(
    '"The Kvendra environment is not available. Reconnect before going on."',
  );
  expect(agents).toContain('## Reporting');

  await expect(page.locator('article a[href="/labs/codex-cli/"]')).toHaveText('Lab 01');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(new URL(canonical).pathname).toBe(GUIDE);
});

test('the docs sidebar links to the guide and marks it current', async ({ page }) => {
  await page.goto('/docs/');
  await expect(page.locator(`nav.kvd-docs__sidebar a[href="${GUIDE}"]`)).toHaveCount(1);
  await page.goto(GUIDE);
  await expect(page.locator(`nav.kvd-docs__sidebar a[href="${GUIDE}"]`)).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('/docs/codex/ is in the sitemap', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain(`<loc>https://kvendra.dev${GUIDE}</loc>`);
});

test('/docs/codex/ raises 0 CSP violations under a strict script policy', async ({
  page,
  request,
}) => {
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
  await page.goto(GUIDE, { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
});

test('/docs/codex/ has no horizontal overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(GUIDE, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
