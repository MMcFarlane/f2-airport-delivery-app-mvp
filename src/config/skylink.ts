/**
 * SkyLink network calls are off.
 * Departures were seeded once from a 12-hour ATL window. The daily date roll
 * reads the local database and does not call SkyLink.
 * A public build should keep this key off the device.
 */
export const skylinkCallsDisabled = true;

export function skyLinkNetworkAllowed(callsDisabledInDatabase: boolean, seedOnce: boolean): boolean {
  if (callsDisabledInDatabase) return false;
  if (skylinkCallsDisabled && !seedOnce) return false;
  return true;
}
