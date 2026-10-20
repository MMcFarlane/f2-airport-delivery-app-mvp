import { airport } from '@/src/config/airport';

/**
 * SkyLink v3.1 over fetch. The phone sends the key for this demo.
 * A public build should move the key behind a proxy.
 */
const BASE_URL = 'https://data.skylinkapi.com/v3.1';

export const SKYLINK_TIMEOUT_MS = 10_000;

export type DepartureRows = {
  flights: unknown[];
  totalFlights: number;
  pagesFetched: number;
};

export async function fetchDepartureRows(
  apiKey: string,
  now: Date,
  timeoutMs = SKYLINK_TIMEOUT_MS,
): Promise<DepartureRows> {
  const url = `${BASE_URL}/schedules/departures?iata=${airport.iata}&ts=${now.getTime()}`;
  const body = (await getJson(url, apiKey, timeoutMs, 'departures')) as {
    flights?: unknown;
    total_flights?: unknown;
    pages_fetched?: unknown;
  };
  return {
    flights: Array.isArray(body.flights) ? body.flights : [],
    totalFlights: typeof body.total_flights === 'number' ? body.total_flights : 0,
    pagesFetched: typeof body.pages_fetched === 'number' ? body.pages_fetched : 0,
  };
}

/** Returns null on 404, which SkyLink sends when the flight is not operating today. */
export async function fetchFlightStatus(
  apiKey: string,
  flightNumber: string,
  timeoutMs = SKYLINK_TIMEOUT_MS,
): Promise<unknown> {
  const url = `${BASE_URL}/flight_status/${encodeURIComponent(flightNumber)}`;
  return getJson(url, apiKey, timeoutMs, 'flight status', true);
}

async function getJson(
  url: string,
  apiKey: string,
  timeoutMs: number,
  label: string,
  notFoundIsNull = false,
): Promise<unknown> {
  // AbortSignal.timeout is not available on every React Native runtime.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'network error';
    throw new Error(`SkyLink ${label} request failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }
  if (notFoundIsNull && response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`SkyLink ${label} request failed with HTTP ${response.status}.`);
  }
  return response.json();
}
