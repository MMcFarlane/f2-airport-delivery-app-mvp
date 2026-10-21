import type { Coordinates } from '@/src/domain';

export type CourierMapPin = {
  coordinates: Coordinates;
  title: string;
  detail: string;
};

export type CourierMapProps = {
  restaurant: CourierMapPin & { color: string };
  passenger: CourierMapPin;
  /** Draws the phone's own blue dot. Only when location permission is granted. */
  showsUserLocation: boolean;
};
