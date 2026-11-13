/**
 * labs-filter.js — search and chip filters for the /labs/ listing (ISSUE-KVD-DEV-983CE9).
 *
 * Progressive enhancement: the controls ship with `hidden` and the full list is
 * rendered server-side, so without JS every lab shows. This script reveals the
 * controls and filters the cards client-side:
 *   - a text box over title, result line, versions and tool tags (data-search);
 *   - status chips (All · Works · Partial · Didn't work), one active at a time;
 *   - tool chips (toggle; when any is on, a lab must carry one of them).
 * Chips are <button aria-pressed>. The result count is written to an
 * aria-live="polite" region; "No labs match." shows when nothing is left.
 *
 * No dependencies. Self-hosted, deferred, same-origin — CSP-safe.
 */
(function () {
  var controls = document.querySelector('[data-labs-controls]');
  var list = document.querySelector('[data-labs-list]');
  if (!controls || !list) return;

  var search = controls.querySelector('[data-labs-search]');
  var count = controls.querySelector('[data-labs-count]');
  var empty = document.querySelector('[data-labs-empty]');
  var statusChips = Array.prototype.slice.call(controls.querySelectorAll('[data-labs-status]'));
  var toolChips = Array.prototype.slice.call(controls.querySelectorAll('[data-labs-tool]'));
  var items = Array.prototype.slice.call(list.querySelectorAll('[data-status]'));

  var status = 'all';
  var tools = [];

  function pressed(chip, on) {
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function apply() {
    var q = (search.value || '').trim().toLowerCase();
    var terms = q ? q.split(/\s+/) : [];
    var shown = 0;
    items.forEach(function (item) {
      var text = item.getAttribute('data-search') || '';
      var itemTools = (item.getAttribute('data-tools') || '').split('|');
      var ok =
        (status === 'all' || item.getAttribute('data-status') === status) &&
        (tools.length === 0 ||
          tools.some(function (t) {
            return itemTools.indexOf(t) !== -1;
          })) &&
        terms.every(function (t) {
          return text.indexOf(t) !== -1;
        });
      item.hidden = !ok;
      if (ok) shown += 1;
    });
    count.textContent = shown + (shown === 1 ? ' lab' : ' labs');
    if (empty) empty.hidden = shown !== 0;
  }

  search.addEventListener('input', apply);

  statusChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      status = chip.getAttribute('data-labs-status');
      statusChips.forEach(function (c) {
        pressed(c, c === chip);
      });
      apply();
    });
  });

  toolChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var tool = chip.getAttribute('data-labs-tool');
      var i = tools.indexOf(tool);
      if (i === -1) tools.push(tool);
      else tools.splice(i, 1);
      pressed(chip, i === -1);
      apply();
    });
  });

  controls.hidden = false;
  apply();
})();
