/**
 * Academy lessons loader (ISSUE-KVD-DEV-75677F) — used at build time by src/pages/academy.astro.
 *
 * At build, try the published lesson list of the product site with a short timeout. On any
 * failure (network, timeout, non-200, bad JSON, no valid lesson), use the fallback committed
 * in the repo (src/data/academy-fallback.json). Every item, fetched or fallback, goes through
 * the same validation: allowlisted fields only, an 11-char YouTube id, an https or relative
 * lab_href. Invalid items are dropped.
 *
 * Lives in scripts/ (build tooling, like kb-fetch.mjs): the remote URL below is a build input,
 * never rendered into the site.
 *
 * KVD_ACADEMY_OFFLINE=1 skips the fetch (fallback only).
 */
import fallbackData from '../src/data/academy-fallback.json' with { type: 'json' };

export const LESSONS_URL = 'https://kvendra.com/academy/lessons.json';
export const FETCH_TIMEOUT_MS = 3000;
export const CHANNEL_URL = 'https://www.youtube.com/@kvendraai';

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const MAX_TEXT = 300;

function text(v, max = MAX_TEXT) {
  if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}

function labHref(v) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string') return null;
  const h = v.trim();
  if (/^https:\/\/[^\s]+$/i.test(h)) return h;
  if (/^\/(?!\/)[^\s]*$/.test(h)) return h;
  return null;
}

/** One lesson with only the allowlisted fields, or null if invalid. */
export function validateLesson(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const lesson = {
    track: text(raw.track, 40),
    number: text(raw.number, 20),
    title: text(raw.title),
    summary: text(raw.summary),
    youtube_id: typeof raw.youtube_id === 'string' && YOUTUBE_ID_RE.test(raw.youtube_id) ? raw.youtube_id : null,
  };
  if (Object.values(lesson).some((v) => v === null)) return null;
  const lab = labHref(raw.lab_href);
  if (lab === null) return null;
  if (lab) lesson.lab_href = lab;
  return lesson;
}

/** Validate a payload ({lessons:[...]} or [...]); returns the valid lessons, sorted by number. */
export function validateLessons(payload) {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.lessons) ? payload.lessons : [];
  return list
    .map(validateLesson)
    .filter(Boolean)
    .sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }));
}

export function fallbackLessons() {
  return validateLessons(fallbackData);
}

/**
 * Lessons for the page. `fetchImpl` is injectable for tests (mocked fetch).
 * Returns { source: 'remote' | 'fallback', lessons }.
 */
export async function loadLessons({
  fetchImpl = globalThis.fetch,
  url = LESSONS_URL,
  timeoutMs = FETCH_TIMEOUT_MS,
  offline = process.env.KVD_ACADEMY_OFFLINE === '1',
} = {}) {
  if (!offline && typeof fetchImpl === 'function') {
    try {
      const res = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: 'application/json' },
      });
      if (res && res.ok) {
        const lessons = validateLessons(await res.json());
        if (lessons.length > 0) return { source: 'remote', lessons };
      }
    } catch {
      // fall through to the committed fallback
    }
  }
  return { source: 'fallback', lessons: fallbackLessons() };
}
