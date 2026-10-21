export const airport = {
  iata: 'ATL',
  icao: 'KATL',
  timezone: 'America/New_York',
  center: {
    latitude: 33.6407,
    longitude: -84.4277,
  },
  /** Concourse building centers from OpenStreetMap (aeroway=terminal). Gates fall back to these. */
  concourses: {
    T: { latitude: 33.64082, longitude: -84.44251 },
    A: { latitude: 33.64052, longitude: -84.43918 },
    B: { latitude: 33.64064, longitude: -84.43591 },
    C: { latitude: 33.64061, longitude: -84.43259 },
    D: { latitude: 33.64054, longitude: -84.42933 },
    E: { latitude: 33.64052, longitude: -84.42487 },
    F: { latitude: 33.63934, longitude: -84.41949 },
  },
} as const;

export type Concourse = keyof typeof airport.concourses;
