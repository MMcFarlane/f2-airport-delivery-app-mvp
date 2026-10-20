import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addCalendarDays,
  departureDateOn,
  diffCalendarDays,
  findDeparture,
  flightStatusToGate,
  parseSkyLinkDate,
  scheduleRowsToFlights,
  shortDepartureList,
  shouldRefresh,
  upcomingDepartures,
} from '@/src/data/skylink/board';

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

  it('rolls a stored departure date forward to the airport day', () => {
    assert.equal(departureDateOn('2026-10-19', '2026-10-19', '2026-10-19'), '2026-10-19');
    assert.equal(departureDateOn('2026-10-19', '2026-10-19', '2026-10-21'), '2026-10-21');
    assert.equal(departureDateOn('2026-10-20', '2026-10-19', '2026-10-21'), '2026-10-22');
    assert.equal(diffCalendarDays('2026-10-19', '2026-10-21'), 2);
    assert.equal(addCalendarDays('2026-10-19', 2), '2026-10-21');
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

  it('refreshes the board once the last fetch is 15 minutes old', () => {
    assert.equal(shouldRefresh(null, now, 15), true);
    assert.equal(shouldRefresh(new Date(now.getTime() - 5 * 60_000).toISOString(), now, 15), false);
    assert.equal(shouldRefresh(new Date(now.getTime() - 20 * 60_000).toISOString(), now, 15), true);
  });

  it('hides flights that have already left', () => {
    // now is 13:22 in America/New_York.
    const flights = [
      { ...sample('DL100'), scheduledTime: '13:21' },
      { ...sample('DL200'), scheduledTime: '13:23' },
    ];

    assert.deepEqual(
      upcomingDepartures(flights, now).map((flight) => flight.flightNumber),
      ['DL200'],
    );
  });

  it('reads the ATL departure gate from flight_status and treats an empty gate as unknown', () => {
    const body = (gate: string, from = 'KATL') => ({
      flight_number: 'DL 711',
      airline: 'Delta Air Lines',
      status: 'Scheduled',
      departure: { airport: from, scheduled_time: '17:00', scheduled_date: '19 Oct', terminal: 'S', gate },
      arrival: { airport: 'KLAS', gate: 'D4', terminal: '1' },
    });

    assert.deepEqual(flightStatusToGate(body('b14')), { gate: 'B14', terminal: 'S', status: 'Scheduled' });
    assert.equal(flightStatusToGate(body(''))?.gate, null);
    assert.equal(flightStatusToGate(body('A1', 'KLAS')), null);
    assert.equal(flightStatusToGate({ detail: 'Flight not found for number: DL1' }), null);
  });

  it('reads the live flight_status shape, where an unpublished gate is "--"', () => {
    const live = {
      flight_number: 'DL1713',
      status: 'Scheduled',
      airline: 'Delta Air Lines',
      departure: { airport: 'ATL • Atlanta', scheduled_time: '20:01', scheduled_date: '20 Oct', terminal: '--', gate: '--' },
      arrival: { airport: 'ELP • El Paso', terminal: '--', gate: '--' },
    };

    assert.deepEqual(flightStatusToGate(live), { gate: null, terminal: null, status: 'Scheduled' });
    assert.equal(
      flightStatusToGate({ ...live, departure: { ...live.departure, gate: 'E12', terminal: 'I' } })?.gate,
      'E12',
    );
    assert.equal(flightStatusToGate({ ...live, departure: { ...live.departure, airport: 'ELP • El Paso' } }), null);
    assert.equal(flightStatusToGate(null), null);
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
