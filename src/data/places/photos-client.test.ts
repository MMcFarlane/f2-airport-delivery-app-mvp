import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parsePhotoRefs, parsePhotoUri, PlacesPhotoRepository } from './photos-client';

type Call = { url: string; headers: Record<string, string> };

function fakeFetch(answers: Record<string, unknown>, calls: Call[], ok = true) {
  return async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });
    // Media URLs contain the place path too, so match them first.
    const key = url.includes('/media') ? '/media' : Object.keys(answers).find((prefix) => url.includes(prefix));
    return { ok, json: async () => (key ? answers[key] : {}) };
  };
}

const details = {
  photos: [
    {
      name: 'places/p1/photos/a',
      widthPx: 1200,
      heightPx: 800,
      authorAttributions: [{ displayName: 'Sam Lee', uri: '//maps.google.com/maps/contrib/1' }],
    },
    { name: 'places/p1/photos/b', widthPx: 640, heightPx: 480, authorAttributions: [] },
  ],
};

function repository(calls: Call[], answers: Record<string, unknown>, now = () => 0, ok = true) {
  return new PlacesPhotoRepository({
    apiKey: 'test-key',
    bundleId: 'com.f2delivers.wingsnack',
    maxWidthPx: 800,
    cacheMinutes: 30,
    fetch: fakeFetch(answers, calls, ok),
    now,
  });
}

describe('Places photos', () => {
  it('reads photo names, sizes, and author credits', () => {
    const refs = parsePhotoRefs('p1', details);
    assert.equal(refs.length, 2);
    assert.deepEqual(refs[0]?.authors, [{ name: 'Sam Lee', uri: 'https://maps.google.com/maps/contrib/1' }]);
    assert.deepEqual(parsePhotoRefs('p1', { photos: 'nope' }), []);
    assert.equal(parsePhotoUri({ photoUri: 'https://lh3.googleusercontent.com/x' }), 'https://lh3.googleusercontent.com/x');
    assert.equal(parsePhotoUri({ photoUri: 'javascript:alert(1)' }), null);
  });

  it('asks for the first photo with the key and bundle ID in headers, never the URL', async () => {
    const calls: Call[] = [];
    const photos = repository(calls, {
      '/places/p1': details,
      '/media': { photoUri: 'https://lh3.googleusercontent.com/cover' },
    });

    const cover = await photos.coverFor('p1');

    assert.equal(cover?.uri, 'https://lh3.googleusercontent.com/cover');
    assert.equal(cover?.authors[0]?.name, 'Sam Lee');
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.headers['X-Goog-FieldMask'], 'photos');
    assert.ok(calls[1]?.url.includes('places/p1/photos/a/media?maxWidthPx=800&skipHttpRedirect=true'));
    for (const call of calls) {
      assert.equal(call.headers['X-Goog-Api-Key'], 'test-key');
      assert.equal(call.headers['X-Ios-Bundle-Identifier'], 'com.f2delivers.wingsnack');
      assert.ok(!call.url.includes('test-key'));
    }
  });

  it('shares one request per place for the session, and asks again after the cache window', async () => {
    const calls: Call[] = [];
    let now = 0;
    const photos = repository(
      calls,
      { '/places/p1': details, '/media': { photoUri: 'https://lh3.googleusercontent.com/cover' } },
      () => now,
    );

    await Promise.all([photos.coverFor('p1'), photos.coverFor('p1')]);
    assert.equal(calls.length, 2);

    now = 31 * 60_000;
    await photos.coverFor('p1');
    assert.equal(calls.length, 4);
  });

  it('answers null instead of throwing when Google refuses or has no photos', async () => {
    assert.equal(await repository([], {}, () => 0, false).coverFor('p1'), null);
    assert.equal(await repository([], { '/places/p1': { photos: [] } }).coverFor('p1'), null);
  });
});
