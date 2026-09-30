/**
 * Kvendra iconset (K-009) — Copied from the Kvendra brand kit (v0.6.x).
 * 24x24 stroke-only SVG fragments, stroke-width 1.5, square caps, miter joins.
 * Phos accent only on "harness". Inner-XML stored as strings for <Fragment set:html>.
 */
export type IconName =
  | 'harness'
  | 'kb-node'
  | 'breach'
  | 'contract'
  | 'guard'
  | 'diff'
  | 'index'
  | 'inspect'
  | 'log'
  | 'rotate'
  | 'lock'
  | 'terminal';

export const ICONS: Record<IconName, string> = {
  harness:
    '<rect x="4" y="4" width="16" height="16"/>' +
    '<line x1="4" y1="12" x2="20" y2="12"/>' +
    '<line x1="12" y1="4" x2="12" y2="20"/>' +
    '<circle cx="12" cy="12" r="2.2" fill="var(--phos)" stroke="none"/>',
  'kb-node':
    '<rect x="3" y="3" width="7" height="7"/>' +
    '<rect x="14" y="3" width="7" height="7"/>' +
    '<rect x="3" y="14" width="7" height="7"/>' +
    '<rect x="14" y="14" width="7" height="7"/>' +
    '<line x1="10" y1="6.5" x2="14" y2="6.5"/>' +
    '<line x1="6.5" y1="10" x2="6.5" y2="14"/>',
  breach:
    '<path d="M3 19 L12 4 L21 19 Z"/>' +
    '<line x1="12" y1="10" x2="12" y2="14"/>' +
    '<line x1="12" y1="16.5" x2="12" y2="17"/>',
  contract:
    '<rect x="5" y="3" width="14" height="18"/>' +
    '<line x1="8" y1="8" x2="16" y2="8"/>' +
    '<line x1="8" y1="12" x2="16" y2="12"/>' +
    '<line x1="8" y1="16" x2="13" y2="16"/>',
  guard:
    '<path d="M12 3 L20 6 V12 C20 16 16 20 12 21 C8 20 4 16 4 12 V6 Z"/>' +
    '<path d="M9 12 L11 14 L15 10"/>',
  diff:
    '<line x1="4" y1="7" x2="11" y2="7"/>' +
    '<line x1="7.5" y1="3.5" x2="7.5" y2="10.5"/>' +
    '<line x1="13" y1="17" x2="20" y2="17"/>',
  index:
    '<line x1="4" y1="6" x2="20" y2="6"/>' +
    '<line x1="4" y1="12" x2="20" y2="12"/>' +
    '<line x1="4" y1="18" x2="14" y2="18"/>',
  inspect:
    '<circle cx="11" cy="11" r="6"/>' +
    '<line x1="15.5" y1="15.5" x2="20" y2="20"/>',
  log:
    '<line x1="4" y1="6" x2="20" y2="6"/>' +
    '<line x1="4" y1="10" x2="16" y2="10"/>' +
    '<line x1="4" y1="14" x2="20" y2="14"/>' +
    '<line x1="4" y1="18" x2="12" y2="18"/>',
  rotate:
    '<path d="M20 12 A8 8 0 1 1 16 5"/>' +
    '<polyline points="20 4 20 9 15 9"/>',
  lock:
    '<rect x="5" y="11" width="14" height="9"/>' +
    '<path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/>',
  terminal:
    '<rect x="3" y="4" width="18" height="16"/>' +
    '<polyline points="7 9 10 12 7 15"/>' +
    '<line x1="12" y1="15" x2="17" y2="15"/>',
};
