import { getCollection, type CollectionEntry } from 'astro:content';

export type ClassicEvent = CollectionEntry<'events'>;

const TZ = 'Europe/Rome';
const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('it-IT', { timeZone: TZ, ...o });

export async function getEvents(): Promise<ClassicEvent[]> {
  const all = await getCollection('events');
  return all.sort((a, b) => a.data.date.localeCompare(b.data.date));
}

export function dateParts(iso: string) {
  const d = toDate(iso);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    day: fmt({ day: '2-digit' }).format(d),
    month: fmt({ month: '2-digit' }).format(d),
    monthName: fmt({ month: 'long' }).format(d),
    monthShort: fmt({ month: 'short' }).format(d).replace('.', ''),
    weekday: cap(fmt({ weekday: 'long' }).format(d)),
    weekdayShort: cap(fmt({ weekday: 'short' }).format(d).replace('.', '')),
    year: fmt({ year: 'numeric' }).format(d),
    /** es. "Sabato 21 novembre" */
    long: cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d)),
  };
}

export const eventUrl = (e: ClassicEvent) => `/serate/${e.id}/`;

export const allNames = (e: ClassicEvent) => e.data.lineup.flatMap((g) => g.names);
