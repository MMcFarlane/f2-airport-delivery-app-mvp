# Phase 3b — SkyLink

Status: Done. One 12-hour ATL board is seeded locally and SkyLink calls stay disabled. The trip sheet lists those departures, fills the departure time from the flight you pick, and stores that snapshot on the trip. The gate stays editable because the board has no gate. Opening the database rolls `departure_date` forward to the current airport day.

Depends on [03-trip-and-time-window.md](03-trip-and-time-window.md).

## Goal

The trip sheet can fill departure time and gate from a live ATL flight. The resolved trip is stored locally.

## Client

`src/data/skylink/` maps the seeded board. `SqliteFlightRepository` reads it. The app does not call SkyLink while `skylinkCallsDisabled` is set.

The one-time seed was `GET https://data.skylinkapi.com/v3.1/schedules/departures?iata=ATL` with header `x-api-key`. `SKYLINK_API_KEY` stays in `.env.local`. Do not commit it. `flight_status` is unused while calls are disabled, so the board has no gate.

Parse SkyLink's `11 Feb` style dates in `America/New_York`. Schedule rows use title-case keys (`Time`, `Flight`, `Status`, `Airline`).

## Sheet behavior

Add a flight-number field and a short list of the seeded ATL departures next to the manual fields from Phase 3. Choosing a flight fills the departure time. The gate field stays editable.

Persist flight number, airline, status, and the departure instant on the trip. Later screens use that stored departure instant. A number that is not on the board shows a short inline message and leaves manual save working.

## Fallbacks

Missing key, HTTP 404, or a network failure leaves the manual name, gate, and departure fields working. Show a short inline message. Do not block the sheet.

## Done when

Picking a seeded flight fills the sheet, and a reload still shows that trip offline. A missing flight or an empty board leaves manual save working.

## Out of scope

Polling, webhooks, and a backend proxy. Note in code that a public build should move the key off the device.
