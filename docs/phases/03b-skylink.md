# Phase 3b — SkyLink

Status: Done, then revised. The app fetches the live ATL departures board on launch (at most every 15 minutes) and stores it in SQLite. Picking a flight looks up its ATL gate with `flight_status` and fills the gate unless the passenger typed one. Past-day rows are pruned on every launch. The bundled snapshot is the offline fallback, and the daily date roll is gone.

Depends on [03-trip-and-time-window.md](03-trip-and-time-window.md).

## Goal

The trip sheet can fill departure time and gate from a live ATL flight. The resolved trip is stored locally.

## Client

`src/data/skylink/client.ts` calls SkyLink v3.1 with header `x-api-key`. `board.ts` maps the answers. The phone sends the key for this demo. It reaches the app from `SKYLINK_API_KEY` in `.env.local` through `app.config.ts`. Do not commit it.

- `GET /v3.1/schedules/departures?iata=ATL` runs on launch, at most every 15 minutes (`SKYLINK_REFRESH_MINUTES`). Rows use title-case keys (`Time`, `Flight`, `Status`, `Airline`). Only the next 12 hours are kept, and they replace the stored board in one transaction.
- `GET /v3.1/flight_status/{flight_number}` returns the gate. Only a departure from ATL counts. Live answers name the airport `ATL • Atlanta` and send `--` for an unpublished gate or terminal, which the app treats as unknown. Answers are cached in `flight_gates` for 5 minutes (`SKYLINK_GATE_CACHE_MINUTES`).

Parse SkyLink's `11 Feb` style dates in `America/New_York`.

## Storage

Startup never waits on SkyLink. `openDatabase()` only does local work (`prepareDepartures`): it deletes `departures` and `flight_gates` rows from past airport days, and fills an empty board from the bundled `departures.json` snapshot. `createDataSource()` then starts `refreshDepartures()` without awaiting it. `listDepartures()` waits for that refresh, which the 10-second timeout bounds, and hides flights that have already left. The tables hold one day of data at most, so they do not grow.

`npm run seed:departures` refreshes the bundled snapshot. It is only the offline fallback.

## Sheet behavior

The flight-number field shows a short list of upcoming ATL departures next to the manual fields from Phase 3. Choosing a flight, or typing an exact board number, fills the departure time and looks up the gate:

- While loading: "Checking gate…"
- Found: the gate field fills and the note reads "Gate E12 from SkyLink · Terminal I". If the passenger typed a gate after picking, their gate stays.
- Not published: "Gate not published yet. Enter it if you know it."

Persist flight number, airline, status, the departure instant, the gate, and `gate_source` (`skylink` or `manual`) on the trip. Later screens use the stored departure instant. A number that is not on the board shows a short inline message, makes no gate call, and leaves manual save working.

On launch, a saved trip that departs later and whose gate came from SkyLink is checked again. A changed gate updates the trip. A typed gate is never replaced.

## Fallbacks

A missing key, HTTP 404, a timeout, or a network failure never throws. The stored board stays, gate lookup returns nothing, and the manual name, gate, and departure fields keep working.

## Done when

On launch the sheet lists live ATL departures. Picking one fills the departure time and, when SkyLink has published it, the gate. A reload still shows that trip offline. A missing flight, an empty board, or no key leaves manual save working.

## Out of scope

Polling, webhooks, moving the departure time from `actual_time`, gate lookup for flights not on the board, and a backend proxy. A public build should move the key off the device.
