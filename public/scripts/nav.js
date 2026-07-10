/**
 * nav.js — close-behaviour for the header nav dropdowns.
 *
 * The dropdowns are CSS-only <details name="kvd-nav"> elements (see
 * NavDropdown.astro). The browser opens/closes them and handles keyboard focus
 * natively. This script only adds the *closing* affordances that CSS cannot,
 * WITHOUT a full-screen backdrop (the old backdrop swallowed the first click on
 * any other nav item):
 *
 *   - click outside any open dropdown closes it;
 *   - Escape closes the open dropdown and returns focus to its summary;
 *   - choosing a link inside the menu closes the dropdown.
 *
 * No dependencies. Same-origin, deferred — CSP-safe.
 */
(function () {
  function openDropdowns() {
    return Array.prototype.slice.call(
      document.querySelectorAll('details.kvd-navdd[name="kvd-nav"][open]')
    );
  }

  function closeAll(except) {
    openDropdowns().forEach(function (dd) {
      if (dd !== except) dd.open = false;
    });
  }

  // Close on a click that lands outside any open dropdown. A click on a menu
  // link inside the dropdown also closes it (so navigation feels resolved).
  document.addEventListener('click', function (event) {
    var open = openDropdowns();
    if (open.length === 0) return;

    var insideOpen = open.find(function (dd) {
      return dd.contains(event.target);
    });

    if (!insideOpen) {
      // Click was outside every open dropdown — close them all. The click then
      // proceeds to its real target (no backdrop intercepts it).
      closeAll(null);
      return;
    }

    // Click was inside an open dropdown. If it was on a menu link, let the
    // navigation happen and close the dropdown.
    if (event.target.closest('.kvd-navdd__panel a')) {
      insideOpen.open = false;
    }
  });

  // Escape closes the open dropdown and restores focus to its trigger.
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var open = openDropdowns();
    if (open.length === 0) return;
    open.forEach(function (dd) {
      dd.open = false;
      var summary = dd.querySelector('summary');
      if (summary) summary.focus();
    });
  });
})();
