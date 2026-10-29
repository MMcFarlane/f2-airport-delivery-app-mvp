import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { airport } from '../config/airport';
import {
  concourseFromGate,
  concourseFromText,
  courierDistanceLine,
  courierSourceLine,
  courierTarget,
  distanceMeters,
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
  restaurantPoint,
  walkMinutes,
} from './locate';

const fix = (latitude: number, longitude: number, at = '2026-10-17T18:18:00.000Z') => ({
  latitude,
  longitude,
  accuracyMeters: 12,
  at,
});

describe('courier location', () => {
  it('measures the walk from Concourse B to Concourse A', () => {
    const meters = distanceMeters(airport.concourses.B, airport.concourses.A);

    assert.ok(Math.abs(meters - 303) <= 1, `expected about 303 m, got ${meters}`);
    assert.equal(distanceMeters(airport.concourses.B, airport.concourses.B), 0);
  });

  it('rounds walk time up to whole minutes at 80 m a minute', () => {
    assert.equal(walkMinutes(0), 1);
    assert.equal(walkMinutes(79), 1);
    assert.equal(walkMinutes(80), 1);
    assert.equal(walkMinutes(81), 2);
  });

  it('reads the concourse from a gate and from restaurant location text', () => {
    assert.equal(concourseFromGate('B14'), 'B');
    assert.equal(concourseFromGate('t3'), 'T');
    assert.equal(concourseFromGate('F10'), 'F');
    assert.equal(concourseFromGate(''), null);
    assert.equal(concourseFromGate('Z1'), null);
    assert.equal(concourseFromText('Concourse B, near gate B9'), 'B');
    assert.equal(concourseFromText('Near B12'), 'B');
    assert.equal(concourseFromText('Concourse A'), 'A');
    assert.equal(concourseFromText('Food court'), null);
  });

  it('places a restaurant without coordinates on its concourse', () => {
    assert.deepEqual(restaurantPoint(null, 'Concourse A'), airport.concourses.A);
    assert.deepEqual(restaurantPoint(null, 'Food court'), airport.center);
    assert.deepEqual(restaurantPoint({ latitude: 1, longitude: 2 }, 'Concourse A'), { latitude: 1, longitude: 2 });
  });

  it('prefers the live fix, then checkout, then the gate, then the airport', () => {
    const live = fix(33.641, -84.436);
    const stored = fix(33.6402, -84.4361);

    assert.equal(courierTarget({ live, stored, gate: 'B14' }).source, 'live');
    assert.deepEqual(courierTarget({ live, stored, gate: 'B14' }).coordinates, { latitude: 33.641, longitude: -84.436 });
    assert.equal(courierTarget({ live: null, stored, gate: 'B14' }).source, 'checkout');

    const gate = courierTarget({ live: null, stored: null, gate: 'B14' });
    assert.equal(gate.source, 'gate');
    assert.equal(gate.concourse, 'B');
    assert.deepEqual(gate.coordinates, airport.concourses.B);

    const unknown = courierTarget({ live: null, stored: null, gate: '??' });
    assert.equal(unknown.source, 'airport');
    assert.deepEqual(unknown.coordinates, airport.center);
  });

  it('writes the distance and how the passenger was located', () => {
    assert.equal(courierDistanceLine(417), '≈ 420 m · 6 min walk');
    assert.equal(courierDistanceLine(3), '≈ 10 m · 1 min walk');
    assert.equal(courierDistanceLine(1540), '≈ 1.5 km · 20 min walk');

    const live = fix(33.641, -84.436);
    assert.equal(courierSourceLine(courierTarget({ live, stored: null, gate: 'B14' })), 'Live location · ±12 m');
    assert.equal(
      courierSourceLine(courierTarget({ live: null, stored: live, gate: 'B14' })),
      'Location from checkout · 14:18 · ±12 m',
    );
    assert.equal(
      courierSourceLine(courierTarget({ live: null, stored: null, gate: 'B14' })),
      'Location off — showing Concourse B',
    );
  });

  it('links to Google Maps walking directions', () => {
    assert.equal(
      googleMapsDirectionsUrl(airport.concourses.B, { latitude: 33.641, longitude: -84.436 }),
      'https://www.google.com/maps/dir/?api=1&origin=33.640640,-84.435910&destination=33.641000,-84.436000&travelmode=walking',
    );
  });

  it("links to a restaurant's Google Maps page by place id", () => {
    assert.equal(
      googleMapsPlaceUrl('Phillips Seafood & Co', 'ChIJu6dLPzD99IgRCEj3iZ1Sl2w'),
      'https://www.google.com/maps/search/?api=1&query=Phillips%20Seafood%20%26%20Co&query_place_id=ChIJu6dLPzD99IgRCEj3iZ1Sl2w',
    );
  });
});
