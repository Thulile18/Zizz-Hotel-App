import type { Hotel } from '../store/hotelsSlice';

// A mood is a promise, so each one is matched only against facts stored for the hotel:
// its tags, its country and its star rating. Nothing is guessed.
export interface Mood {
  key: string;
  name: string;
  line: string;
  matches: (h: Hotel) => boolean;
}

const hasTag = (h: Hotel, tag: string) => (h.tags ?? []).includes(tag);

export const MOODS: Mood[] = [
  {
    key: 'romantic',
    name: 'Romantic Hideaway',
    line: 'Candlelight, privacy and slow evenings for two.',
    matches: (h) => hasTag(h, 'romantic'),
  },
  {
    key: 'ocean',
    name: 'Ocean Therapy',
    line: 'Salt air, sea views and the sound of waves.',
    matches: (h) => hasTag(h, 'beach'),
  },
  {
    key: 'desert',
    name: 'Desert Dreams',
    line: 'Lantern-lit courtyards and warm desert light in Morocco and the Emirates.',
    matches: (h) => ['Morocco', 'United Arab Emirates'].includes(h.country ?? ''),
  },
  {
    key: 'forest',
    name: 'Forest Sanctuary',
    line: 'Jungle, bushveld and vineyards, far from the noise.',
    matches: (h) => hasTag(h, 'nature'),
  },
  {
    key: 'city',
    name: 'City After Dark',
    line: 'Skylines, late dinners and streets that come alive at night.',
    matches: (h) => hasTag(h, 'city'),
  },
  {
    key: 'royal',
    name: 'Royal Escape',
    line: 'Five-star indulgence, treated like royalty.',
    matches: (h) => hasTag(h, 'luxury') && h.stars >= 5,
  },
  {
    key: 'unexpected',
    name: 'Somewhere Unexpected',
    line: 'Hidden gems most travellers walk straight past.',
    matches: (h) => hasTag(h, 'hidden-gem'),
  },
];

export function moodByKey(key: string | null) {
  return MOODS.find((m) => m.key === key);
}
