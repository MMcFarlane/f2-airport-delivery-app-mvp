import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { airport } from '../../config/airport';

import {
  concourseFromAddress,
  concourseLocation,
  concourseRank,
  isInsideAirport,
  keepPlace,
  nearestConcourse,
  placeOnConcourse,
} from './concourse';
import type { PlaceIdentity } from './types';

function place(overrides: Partial<PlaceIdentity> & Pick<PlaceIdentity, 'address' | 'latitude' | 'longitude'>): PlaceIdentity {
  return {
    placeId: 'place-x',
    name: 'Somewhere',
    rating: null,
    photoReference: null,
    primaryType: 'restaurant',
    primaryTypeLabel: null,
    ...overrides,
  };
}

// Addresses and points as Places returned them on October 28, 2026.
const tgiFridays = place({
  name: 'TGI Fridays',
  address: 'Concourse B, 6000 N Terminal Pkwy Gate B19, Atlanta, GA 30320, USA',
  latitude: 33.64046,
  longitude: -84.42541,
});
const ihop = place({
  name: 'IHOP',
  address: '7700 Spine Rd, Concourse T, Ste TS3-3-3G, Atlanta, GA 30320, USA',
  latitude: 33.63974,
  longitude: -84.42932,
});
const grindhouse = place({
  name: 'Grindhouse Killer Burgers',
  address: '6000 N Terminal Pkwy T10, Atlanta, GA 30320, USA',
  latitude: 33.64095,
  longitude: -84.42951,
});
const terrapin = place({
  name: 'Terrapin Taphouse',
  address: 'Atlanta, GA 30337, USA',
  latitude: 33.6408,
  longitude: -84.42894,
});

describe('concourse placement', () => {
  it('takes the gate from the address and moves a pin that sits on another concourse', () => {
    const placement = placeOnConcourse(tgiFridays, undefined);
    assert.equal(nearestConcourse({ latitude: 33.64046, longitude: -84.42541 }), 'E');
    assert.equal(placement?.concourse, 'B');
    assert.equal(placement?.nearGate, 'B19');
    assert.equal(placement?.source, 'address');
    assert.equal(placement?.confirmed, false);
    assert.equal(placement?.latitude, airport.concourses.B.latitude);
    assert.equal(placement?.longitude, airport.concourses.B.longitude);
    assert.equal(concourseLocation('B', 'B19'), 'Concourse B, near gate B19');
  });

  it('reads a named concourse and ignores suite numbers', () => {
    assert.deepEqual(concourseFromAddress(ihop.address), { concourse: 'T', nearGate: null });
    assert.equal(concourseFromAddress(grindhouse.address), null);
    assert.deepEqual(concourseFromAddress('6000 N Terminal Pkwy Terminal D Terminal D, Atlanta'), { concourse: 'D', nearGate: null });
    assert.deepEqual(concourseFromAddress('Hartsfield-Jackson, Concourse D, CENTERPOINT'), { concourse: 'D', nearGate: null });
  });

  it('reads gates written several ways', () => {
    assert.deepEqual(concourseFromAddress('6000 N Terminal Pkwy Concourse A Gate A 9, Atlanta'), { concourse: 'A', nearGate: 'A9' });
    assert.deepEqual(concourseFromAddress('ATL Concourse B Gate 30, 6000 N Terminal Rd'), { concourse: 'B', nearGate: 'B30' });
    assert.deepEqual(concourseFromAddress('6000 N Terminal Pkwy Concourse B30, Atlanta'), { concourse: 'B', nearGate: 'B30' });
    assert.deepEqual(concourseFromAddress('Terminal C, near Gate C12, Atlanta'), { concourse: 'C', nearGate: 'C12' });
  });

  it('falls back to the nearest concourse and keeps a point that agrees', () => {
    const placement = placeOnConcourse(grindhouse, undefined);
    assert.equal(placement?.concourse, 'D');
    assert.equal(placement?.source, 'coordinates');
    assert.equal(placement?.confirmed, false);
    assert.equal(placement?.latitude, 33.64095);
    assert.equal(placement?.longitude, -84.42951);
  });

  it('marks only a manual override as confirmed', () => {
    const placement = placeOnConcourse(grindhouse, { concourse: 'D', nearGate: 'D5' });
    assert.equal(placement?.source, 'override');
    assert.equal(placement?.confirmed, true);
    assert.equal(placement?.nearGate, 'D5');
    assert.equal(placement?.latitude, 33.64095);
  });

  it('orders concourses from T to F', () => {
    assert.deepEqual(
      (['F', 'A', 'T', 'D'] as const).map(concourseRank),
      [6, 1, 0, 4],
    );
  });
});

describe('which places stay', () => {
  it('keeps places inside the airport with an airport address', () => {
    assert.equal(keepPlace(tgiFridays, undefined), true);
    assert.equal(keepPlace(ihop, undefined), true);
  });

  it('drops a place with no airport address unless an override keeps it', () => {
    assert.equal(keepPlace(terrapin, undefined), false);
    assert.equal(keepPlace(terrapin, { concourse: 'D' }), true);
  });

  it('keeps a gate-only address', () => {
    const beercode = place({ address: 'Gate A3, College Park, GA 30337, USA', latitude: 33.6405, longitude: -84.4392 });
    assert.equal(keepPlace(beercode, undefined), true);
  });

  it('drops pre-security places, lounges, and excluded overrides', () => {
    const atrium = place({ address: 'Atrium NW F-11 Pre-Security, 6000 N Terminal Pkwy', latitude: 33.6408, longitude: -84.4424 });
    const lounge = place({ name: 'American Express Centurion Lounge', address: '12700 Spine Road', latitude: 33.6405, longitude: -84.4249 });
    assert.equal(keepPlace(atrium, undefined), false);
    assert.equal(keepPlace(lounge, undefined), false);
    assert.equal(keepPlace(ihop, { concourse: 'T', exclude: true }), false);
  });

  it('drops a landside override', () => {
    assert.equal(keepPlace(ihop, { concourse: null, landside: true }), false);
    assert.equal(keepPlace(ihop, { concourse: 'T', landside: true }), false);
  });

  it('drops a place outside the airport box', () => {
    const hotel = place({ address: '6000 N Terminal Pkwy, Atlanta, GA', latitude: 33.655, longitude: -84.44 });
    assert.equal(isInsideAirport(33.655, -84.44), false);
    assert.equal(keepPlace(hotel, undefined), false);
    assert.equal(isInsideAirport(null, null), false);
  });
});
