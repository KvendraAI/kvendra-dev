// Shared helpers for the Labs section (ISSUE-KVD-DEV-983CE9). Files starting with "_" are not routes.
import type { CollectionEntry } from 'astro:content';

export type Lab = CollectionEntry<'labs'>;

export const STATUS_LABEL: Record<Lab['data']['status'], string> = {
  works: 'works',
  partial: 'partial',
  'didnt-work': "didn't work",
};

/** "LAB 01" style number. */
export const labNumber = (n: number) => String(n).padStart(2, '0');

/** ISO calendar date (YYYY-MM-DD), the format used across the site. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Newest first: by publication date, then by lab number. */
export const byNewest = (a: Lab, b: Lab) =>
  b.data.datePublished.getTime() - a.data.datePublished.getTime() || b.data.number - a.data.number;

/** Self-hosted default image (the brand mark, as in the Organization JSON-LD). */
export const DEFAULT_OG_IMAGE = 'https://kvendra.dev/brand/kvendra-mark.svg';
