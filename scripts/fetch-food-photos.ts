import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CUISINE_GROUPS, dishImageKey, MENU_SLOTS } from '../src/data/places/menus';
import { FIXTURE_PHOTO_QUERIES, fixtureImageKey } from '../src/data/sqlite/fixture-photos';

import { photoDownload, searchLinks } from './food-photo-links';

/**
 * Bundled food photos, picked by hand on pexels.com or unsplash.com (no API key; both licenses allow free
 * commercial use in an app). Each run:
 *   1. creates or updates assets/images/food/picks.json with one entry per dish and search links,
 *   2. downloads every pick whose `url` is new or changed,
 *   3. writes credits.json, CREDITS.md, and the generated registry src/components/ui/food-images.ts.
 * Clear a pick's `url` to drop its photo; the dish goes back to its colored box.
 */

const FOOD_DIR = resolve('assets/images/food');
const PICKS_PATH = resolve(FOOD_DIR, 'picks.json');
const CREDITS_JSON = resolve(FOOD_DIR, 'credits.json');
const CREDITS_MD = resolve(FOOD_DIR, 'CREDITS.md');
const REGISTRY_PATH = resolve('src/components/ui/food-images.ts');
const LARGE_FILE_BYTES = 400_000;

type PhotoPick = {
  key: string;
  dish: string;
  usedBy: string;
  /** Fixture dishes only show in the development catalog, so they can wait. */
  optional: boolean;
  searchPexels: string;
  searchUnsplash: string;
  /** A pexels.com photo page link, or for Unsplash the image address (right-click → Copy Image Address). */
  url: string;
  /** Optional. Pexels and Unsplash don't require credit, but CREDITS.md lists it when given. */
  photographer: string;
};

type Credit = {
  key: string;
  dish: string;
  source: 'Pexels' | 'Unsplash';
  url: string;
  photographer: string;
};

type Wanted = Pick<PhotoPick, 'key' | 'dish' | 'usedBy' | 'optional'> & { query: string };

void main().catch((caught: unknown) => {
  console.error(caught instanceof Error ? caught.message : 'Fetching food photos failed.');
  process.exit(1);
});

async function main(): Promise<void> {
  mkdirSync(FOOD_DIR, { recursive: true });
  const picks = mergePicks(wantedPhotos(), readJson<PhotoPick[]>(PICKS_PATH, []));
  writeFileSync(PICKS_PATH, `${JSON.stringify(picks, null, 2)}\n`);

  const credits = new Map(readJson<Credit[]>(CREDITS_JSON, []).map((credit) => [credit.key, credit]));
  const failures: string[] = [];
  for (const pick of picks) {
    const url = pick.url.trim();
    if (!url) {
      credits.delete(pick.key);
      rmSync(photoPath(pick.key), { force: true });
      continue;
    }
    const current = credits.get(pick.key);
    if (current?.url === url && existsSync(photoPath(pick.key))) {
      credits.set(pick.key, { ...current, dish: pick.dish, photographer: pick.photographer.trim() });
      continue;
    }
    try {
      const download = photoDownload(url);
      const bytes = await fetchImage(download.imageUrl);
      writeFileSync(photoPath(pick.key), bytes);
      credits.set(pick.key, {
        key: pick.key,
        dish: pick.dish,
        source: download.source,
        url,
        photographer: pick.photographer.trim(),
      });
      const size = bytes.byteLength > LARGE_FILE_BYTES ? ` (${Math.round(bytes.byteLength / 1000)} KB, larger than usual)` : '';
      console.log(`${pick.key}: downloaded from ${download.source}${size}`);
    } catch (caught) {
      failures.push(`${pick.key}: ${caught instanceof Error ? caught.message : 'download failed'}`);
    }
  }

  const ready = picks.filter((pick) => credits.has(pick.key) && existsSync(photoPath(pick.key)));
  writeCredits(ready.map((pick) => credits.get(pick.key)!));
  writeRegistry(ready.map((pick) => pick.key));

  const required = picks.filter((pick) => !pick.optional);
  const requiredReady = required.filter((pick) => credits.has(pick.key)).length;
  console.log(
    `\n${requiredReady} of ${required.length} dish photos and ${ready.length - requiredReady} of ${picks.length - required.length} optional fixture photos are bundled.`,
  );
  if (requiredReady < required.length) console.log('Fill in "url" for the rest in assets/images/food/picks.json and run this again.');
  if (failures.length > 0) {
    console.error(`\nNot downloaded:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
}

/** Every key the app can ask for: 13 cuisine groups × 4 dishes, then the fixture dishes. */
function wantedPhotos(): Wanted[] {
  const groups = CUISINE_GROUPS.flatMap((group) =>
    MENU_SLOTS.map((slot) => ({
      key: dishImageKey(group.id, slot.slug),
      dish: group.dishes[slot.slug].name,
      usedBy: group.primaryTypes.length > 0 ? group.primaryTypes.join(', ') : 'restaurant, american_restaurant, and anything else',
      optional: false,
      query: group.dishes[slot.slug].photoQuery,
    })),
  );
  const fixtures = Object.entries(FIXTURE_PHOTO_QUERIES).map(([itemId, query]) => ({
    key: fixtureImageKey(itemId),
    dish: itemId.replaceAll('-', ' '),
    usedBy: 'fixture catalog (development only)',
    optional: true,
    query,
  }));
  return [...groups, ...fixtures];
}

/** Keeps the url and photographer already filled in; refreshes everything else from the code. */
function mergePicks(wanted: Wanted[], existing: PhotoPick[]): PhotoPick[] {
  const byKey = new Map(existing.map((pick) => [pick.key, pick]));
  return wanted.map(({ query, ...photo }) => {
    const previous = byKey.get(photo.key);
    return {
      ...photo,
      ...searchLinks(query),
      url: previous?.url ?? '',
      photographer: previous?.photographer ?? '',
    };
  });
}

async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`the image request returned ${response.status}`);
  if (new URL(response.url).hostname === 'plus.unsplash.com') {
    throw new Error('Unsplash+ photos need a paid license; pick a free one');
  }
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`the link returned ${type || 'something'} instead of an image`);
  return Buffer.from(await response.arrayBuffer());
}

function photoPath(key: string): string {
  return resolve(FOOD_DIR, `${key}.jpg`);
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
}

function writeCredits(list: Credit[]): void {
  writeFileSync(CREDITS_JSON, `${JSON.stringify(list, null, 2)}\n`);
  const rows = list.map(
    (credit) => `| \`${credit.key}\` | ${credit.dish} | ${credit.photographer || '—'} | [${credit.source}](${credit.url}) |`,
  );
  writeFileSync(
    CREDITS_MD,
    [
      '# Food photo credits',
      '',
      'Stock photos bundled with the app, picked by hand. The [Pexels license](https://www.pexels.com/license/) and the [Unsplash license](https://unsplash.com/license) allow free commercial use without attribution; we list the sources here anyway.',
      '',
      'Generated by `npm run fetch:food-photos` from `picks.json`. Do not edit by hand.',
      '',
      '| Key | Dish | Photographer | Source |',
      '| --- | --- | --- | --- |',
      ...rows,
      '',
    ].join('\n'),
  );
}

function writeRegistry(keys: string[]): void {
  const entries = keys.map((key) => `  '${key}': require('../../../assets/images/food/${key}.jpg'),`);
  writeFileSync(
    REGISTRY_PATH,
    [
      '// Generated by scripts/fetch-food-photos.ts. Do not edit by hand; credits are in assets/images/food/CREDITS.md.',
      '',
      '/** Metro asset ids from require(). */',
      `export const foodImages: Record<string, number> = {${entries.length > 0 ? `\n${entries.join('\n')}\n` : ''}};`,
      '',
    ].join('\n'),
  );
}
