/* Copied from kvendra-web (REL-KVD-WEB-0.6.x).
 *
 * Kvendra theme-init — runs BEFORE first paint to apply the user's theme.
 *
 * Served as a static asset from /scripts/theme-init.js so it complies with
 * CSP `script-src 'self'`. Referenced from <head> via plain <script src>
 * (no defer / no async / no type=module) so it executes synchronously and
 * blocks rendering until `data-theme` is set. ~250 bytes, gzipped ~150B.
 *
 * Source of truth for theme: localStorage.kvendra-theme ('dark' | 'light').
 * Default (no key + no OS pref) = dark.
 */
(function () {
  try {
    var saved = localStorage.getItem('kvendra-theme');
    var prefers = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
    var theme = saved || prefers;
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {
    /* localStorage blocked — default to dark */
  }
})();
