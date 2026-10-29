import type { PlacePhoto } from '../../domain/types';
import type { PhotoRepository } from '../repositories';

const PLACES_URL = 'https://places.googleapis.com/v1';

type Fetch = (url: string, init: { headers: Record<string, string> }) => Promise<{
  ok: boolean;
  json(): Promise<unknown>;
}>;

export type PlacesPhotoOptions = {
  apiKey: string;
  bundleId: string;
  maxWidthPx: number;
  cacheMinutes: number;
  fetch?: Fetch;
  now?: () => number;
};

type PhotoRef = Omit<PlacePhoto, 'uri'> & { name: string };

/**
 * Restaurant cover photos from Places API (New): one Place Details call (free `photos` field), then one
 * media call for the first photo. Answers live in memory for this session only. Google does not allow
 * storing photo names or URIs, so nothing here touches SQLite or disk.
 */
export class PlacesPhotoRepository implements PhotoRepository {
  private readonly covers = new Map<string, { at: number; photo: Promise<PlacePhoto | null> }>();
  private readonly fetch: Fetch;
  private readonly now: () => number;

  constructor(private readonly options: PlacesPhotoOptions) {
    this.fetch = options.fetch ?? ((url, init) => fetch(url, init));
    this.now = options.now ?? Date.now;
  }

  coverFor(placeId: string): Promise<PlacePhoto | null> {
    const cached = this.covers.get(placeId);
    if (cached && this.now() - cached.at < this.options.cacheMinutes * 60_000) return cached.photo;
    const photo = this.loadCover(placeId).catch(() => null);
    this.covers.set(placeId, { at: this.now(), photo });
    return photo;
  }

  private async loadCover(placeId: string): Promise<PlacePhoto | null> {
    const details = await this.get(`${PLACES_URL}/places/${encodeURIComponent(placeId)}`, { 'X-Goog-FieldMask': 'photos' });
    const first = parsePhotoRefs(placeId, details)[0];
    if (!first) return null;
    const media = await this.get(
      `${PLACES_URL}/${first.name}/media?maxWidthPx=${this.options.maxWidthPx}&skipHttpRedirect=true`,
      {},
    );
    const uri = parsePhotoUri(media);
    if (!uri) return null;
    const { name: _name, ...photo } = first;
    return { ...photo, uri };
  }

  private async get(url: string, headers: Record<string, string>): Promise<unknown> {
    const response = await this.fetch(url, {
      headers: {
        'X-Goog-Api-Key': this.options.apiKey,
        'X-Ios-Bundle-Identifier': this.options.bundleId,
        ...headers,
      },
    });
    if (!response.ok) throw new Error('Places photo request failed.');
    return response.json();
  }
}

/** For fixtures, or a build without the client key. */
export const noPhotos: PhotoRepository = {
  coverFor: async () => null,
};

export function parsePhotoRefs(placeId: string, payload: unknown): PhotoRef[] {
  if (!payload || typeof payload !== 'object' || !('photos' in payload) || !Array.isArray(payload.photos)) return [];
  return payload.photos.flatMap((value: unknown) => {
    if (!value || typeof value !== 'object') return [];
    const photo = value as Record<string, unknown>;
    if (typeof photo.name !== 'string' || !photo.name) return [];
    return [
      {
        placeId,
        name: photo.name,
        width: typeof photo.widthPx === 'number' ? photo.widthPx : 0,
        height: typeof photo.heightPx === 'number' ? photo.heightPx : 0,
        authors: parseAuthors(photo.authorAttributions),
      },
    ];
  });
}

export function parsePhotoUri(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('photoUri' in payload)) return null;
  const uri = payload.photoUri;
  return typeof uri === 'string' && uri.startsWith('https://') ? uri : null;
}

function parseAuthors(value: unknown): PlacePhoto['authors'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const author = entry as Record<string, unknown>;
    const name = typeof author.displayName === 'string' ? author.displayName.trim() : '';
    if (!name) return [];
    const uri = typeof author.uri === 'string' && author.uri ? normalizeUri(author.uri) : null;
    return [{ name, uri }];
  });
}

/** Places sends author links as "//maps.google.com/…". */
function normalizeUri(uri: string): string {
  return uri.startsWith('//') ? `https:${uri}` : uri;
}
