import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { skyLinkNetworkAllowed } from '@/src/config/skylink';
import {
  addCalendarDays,
  departureDateOn,
  diffCalendarDays,
  findDeparture,
  parseSkyLinkDate,
  scheduleRowsToFlights,
  shortDepartureList,
} from '@/src/data/skylink/board';
import { departureSql, openDepartureDatabase } from '@/src/data/skylink/node-db';
import { ensureDepartureSchema, rollDepartureDates, writeDepartureCatalog } from '@/src/data/skylink/store';

const now = new Date('2026-10-19T17:22:00.000Z');

describe('SkyLink departure board', () => {
  it('keeps a SkyLink date in this year until that month-day has passed', () => {
    const today = { year: 2026, month: 10, day: 19 };

    assert.equal(parseSkyLinkDate('19 Oct', today), '2026-10-19');
    assert.equal(parseSkyLinkDate('20 Oct', today), '2026-10-20');
    assert.equal(parseSkyLinkDate('11 Feb', today), '2027-02-11');
  });

  it('keeps only departures inside the 12-hour window', () => {
    const flights = scheduleRowsToFlights(
      [
        { Time: '13:30', Date: '19 Oct', Flight: 'DL100', Airline: 'Delta', Status: 'Scheduled', Destination: 'Boston', IATA: 'BOS' },
        { Time: '01:21', Date: '20 Oct', Flight: 'DL200', Airline: 'Delta', Status: 'Scheduled', Destination: 'Seattle', IATA: 'SEA' },
        { Time: '06:00', Date: '20 Oct', Flight: 'DL300', Airline: 'Delta', Status: 'Scheduled', Destination: 'Miami', IATA: 'MIA' },
      ],
      now,
    );

    assert.deepEqual(
      flights.map((flight) => flight.flightNumber),
      ['DL100', 'DL200'],
    );
  });

  it('advances departure_date once per airport day', () => {
    const db = departureSql(openDepartureDatabase(':memory:'));
    ensureDepartureSchema(db);
    writeDepartureCatalog(db, {
      seededAt: '2026-10-19T17:22:00.000Z',
      lastRolledOn: '2026-10-19',
      callsDisabled: true,
      flights: [
        {
          flightNumber: 'DL100',
          airline: 'Delta',
          status: 'Scheduled',
          destination: 'Boston',
          destinationIata: 'BOS',
          scheduledTime: '13:30',
          departureDate: '2026-10-19',
        },
      ],
    });

    const first = rollDepartureDates(db, '2026-10-20');
    const second = rollDepartureDates(db, '2026-10-20');
    const stored = db.get<{ departure_date: string }>('SELECT departure_date FROM departures');

    assert.equal(first.advancedDays, 1);
    assert.equal(second.advancedDays, 0);
    assert.equal(stored?.departure_date, '2026-10-20');
    assert.equal(diffCalendarDays('2026-10-19', '2026-10-21'), 2);
    assert.equal(addCalendarDays('2026-10-19', 2), '2026-10-21');
  });

  it('rolls a stored departure date forward to the airport day', () => {
    assert.equal(departureDateOn('2026-10-19', '2026-10-19', '2026-10-19'), '2026-10-19');
    assert.equal(departureDateOn('2026-10-19', '2026-10-19', '2026-10-21'), '2026-10-21');
    assert.equal(departureDateOn('2026-10-20', '2026-10-19', '2026-10-21'), '2026-10-22');
  });

  it('matches a flight number and keeps the picker list short', () => {
    const flights = [
      sample('DL100'),
      sample('DL200'),
      sample('DL711'),
      sample('AA100'),
      sample('DL300'),
      sample('DL400'),
      sample('DL500'),
    ];

    assert.equal(findDeparture(flights, 'dl 711')?.flightNumber, 'DL711');
    assert.equal(findDeparture(flights, 'UA1'), null);
    assert.equal(shortDepartureList(flights, '').length, 6);
    assert.deepEqual(
      shortDepartureList(flights, 'DL').map((flight) => flight.flightNumber),
      ['DL100', 'DL200', 'DL711', 'DL300', 'DL400', 'DL500'],
    );
  });

  it('blocks another SkyLink call after the seed locks the database', () => {
    assert.equal(skyLinkNetworkAllowed(false, true), true);
    assert.equal(skyLinkNetworkAllowed(false, false), false);
    assert.equal(skyLinkNetworkAllowed(true, true), false);
  });
});

function sample(flightNumber: string) {
  return {
    flightNumber,
    airline: 'Delta',
    status: 'Scheduled',
    destination: 'Boston',
    destinationIata: 'BOS',
    scheduledTime: '17:00',
    departureDate: '2026-10-19',
  };
}
