// Content collections for kvendra.dev.
// `labs` — technical experiments written up openly (ISSUE-KVD-DEV-983CE9, spec ISSUE-KVD-DEV-6EC74D).
// One Markdown file per lab under src/content/labs/; the file name is the URL slug (/labs/<slug>/).
import { defineCollection, z } from 'astro:content';

const labs = defineCollection({
  type: 'content',
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    result: z.string(),
    status: z.enum(['works', 'partial', 'didnt-work']),
    tools: z.array(z.string()).min(1),
    versions: z.string(),
    datePublished: z.coerce.date(),
    dateModified: z.coerce.date(),
    description: z.string(),
  }),
});

export const collections = { labs };
