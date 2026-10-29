/**
 * Turns a pexels.com photo page link, or an images.pexels.com / images.unsplash.com image address, into an
 * image download about 1200 px wide. No API key.
 */

const WIDTH = 1200;

export type PhotoDownload = { source: 'Pexels' | 'Unsplash'; imageUrl: string };

export function photoDownload(link: string): PhotoDownload {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    throw new Error('not a link');
  }
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'plus.unsplash.com') throw new Error('Unsplash+ photos need a paid license; pick a free one');

  if (host === 'pexels.com') {
    const id = /\/photo\/(?:[^/]*-)?(\d+)\/?$/.exec(url.pathname)?.[1];
    if (!id) throw new Error('could not find the Pexels photo id in the link');
    return { source: 'Pexels', imageUrl: pexelsImage(id) };
  }
  if (host === 'images.pexels.com') {
    const id = /^\/photos\/(\d+)\//.exec(url.pathname)?.[1];
    if (!id) throw new Error('could not find the Pexels photo id in the link');
    return { source: 'Pexels', imageUrl: pexelsImage(id) };
  }

  if (host === 'unsplash.com') {
    // Page links don't map reliably to a download without the Unsplash API.
    throw new Error('for Unsplash, right-click the photo and use "Copy Image Address" (images.unsplash.com/…)');
  }
  if (host === 'images.unsplash.com') {
    url.searchParams.set('w', String(WIDTH));
    url.searchParams.set('q', '80');
    url.searchParams.set('fm', 'jpg');
    return { source: 'Unsplash', imageUrl: url.toString() };
  }

  throw new Error('use a pexels.com photo link or an images.unsplash.com image address');
}

export function searchLinks(query: string): { searchPexels: string; searchUnsplash: string } {
  return {
    searchPexels: `https://www.pexels.com/search/${encodeURIComponent(query)}/?orientation=landscape`,
    // license=free hides Unsplash+ photos.
    searchUnsplash: `https://unsplash.com/s/photos/${query.trim().split(/\s+/).map(encodeURIComponent).join('-')}?orientation=landscape&license=free`,
  };
}

function pexelsImage(id: string): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${WIDTH}`;
}
