import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Eventi della demo. Oggi arrivano da un JSON; domani lo stesso schema
 * può essere alimentato da un CMS cambiando solo il loader.
 */
const events = defineCollection({
  loader: file('src/data/events.json'),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    label: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start: z.string(),
    end: z.string(),
    summary: z.string(),
    lineup: z.array(z.object({ role: z.string(), names: z.array(z.string()) })),
    poster: z.string(),
  }),
});

export const collections = { events };
