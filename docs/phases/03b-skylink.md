# Phase 3b — SkyLink

Status: Not started.

Depends on [03-trip-and-time-window.md](03-trip-and-time-window.md).

## Goal

The trip sheet can fill departure time and gate from a live ATL flight. The resolved trip is stored locally.

## Client

`src/data/skylink/` implements `FlightRepository`.

- `GET https://data.skylinkapi.com/v3.1/flight_status/{flight_number}`
- `GET https://data.skylinkapi.com/v3.1/schedules/departures?iata=ATL`

Header: `x-api-key`. Read `SKYLINK_API_KEY` from env. Do not commit it.

Map into a domain flight: flight number, airline, status, departure instant, gate. Prefer `actual_time`, then `scheduled_time`. Parse SkyLink's `11 Feb` style dates in `America/New_York`. Empty gate or terminal strings are unknown, not errors.

Schedule rows use title-case keys (`Time`, `Flight`, `Status`, `Airline`).

## Sheet behavior

Add a flight-number field and a short list of upcoming ATL departures next to the manual fields from Phase 3. Choosing a flight fills departure and fills gate when SkyLink has one. The gate field stays editable when the gate is empty.

Persist the snapshot on the trip. Later screens use that stored departure instant.

## Fallbacks

Missing key, HTTP 404, or a network failure leaves the manual name, gate, and departure fields working. Show a short inline message. Do not block the sheet.

## Done when

With a key, looking up an operating flight fills the sheet and a reload still shows that trip offline. Without a key, manual save still works.

## Out of scope

Polling, webhooks, and a backend proxy. Note in code that a public build should move the key off the device.
