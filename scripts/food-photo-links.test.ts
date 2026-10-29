import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { photoDownload, searchLinks } from './food-photo-links';

describe('food photo links', () => {
  it('turns Pexels page links into a 1200 px image download', () => {
    const expected = 'https://images.pexels.com/photos/2271196/pexels-photo-2271196.jpeg?auto=compress&cs=tinysrgb&w=1200';
    assert.deepEqual(photoDownload('https://www.pexels.com/photo/pepperoni-pizza-2271196/'), { source: 'Pexels', imageUrl: expected });
    assert.equal(photoDownload('https://pexels.com/photo/2271196').imageUrl, expected);
    assert.equal(photoDownload('https://www.pexels.com/fr-fr/photo/pizza-2271196/').imageUrl, expected);
    assert.equal(
      photoDownload('https://images.pexels.com/photos/2271196/pexels-photo-2271196.jpeg?w=4000').imageUrl,
      expected,
    );
  });

  it('sizes Unsplash image addresses and refuses Unsplash+ and page links', () => {
    const { source, imageUrl } = photoDownload('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&w=4000');
    assert.equal(source, 'Unsplash');
    assert.ok(imageUrl.includes('w=1200') && imageUrl.includes('fm=jpg') && !imageUrl.includes('w=4000'));
    assert.throws(() => photoDownload('https://plus.unsplash.com/premium_photo-1683619761492-639240d29bb5'), /Unsplash\+/);
    assert.throws(() => photoDownload('https://unsplash.com/photos/burger-abc123'), /Copy Image Address/);
  });

  it('rejects other sites', () => {
    assert.throws(() => photoDownload('https://example.com/burger.jpg'), /pexels/);
    assert.throws(() => photoDownload('burger'), /not a link/);
  });

  it('builds landscape search links that hide Unsplash+', () => {
    assert.deepEqual(searchLinks('pepperoni pizza slice'), {
      searchPexels: 'https://www.pexels.com/search/pepperoni%20pizza%20slice/?orientation=landscape',
      searchUnsplash: 'https://unsplash.com/s/photos/pepperoni-pizza-slice?orientation=landscape&license=free',
    });
  });
});
