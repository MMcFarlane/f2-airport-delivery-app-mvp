import { CourierMapFallback } from './CourierMapFallback';
import type { CourierMapProps } from './map-types';

/** react-native-maps has no web build. The web demo shows the route as a card and links out to Google Maps. */
export function CourierMap(props: CourierMapProps) {
  return <CourierMapFallback {...props} reason="The live map runs in the iOS and Android app." />;
}
