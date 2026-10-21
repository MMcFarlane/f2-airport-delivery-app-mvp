import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

import { googleMapsConfigured } from '@/src/config/maps';
import { colors, radii } from '@/src/theme';

import { CourierMapFallback } from './CourierMapFallback';
import type { CourierMapProps } from './map-types';

const EDGE_PADDING = { top: 72, right: 56, bottom: 72, left: 56 };

export function CourierMap(props: CourierMapProps) {
  const { restaurant, passenger, showsUserLocation } = props;
  const map = useRef<MapView>(null);
  const google = googleMapsConfigured();
  const coordinates = [restaurant.coordinates, passenger.coordinates];
  // Rounded to about a meter, so GPS jitter does not keep refitting the map.
  const fromLat = round(restaurant.coordinates.latitude);
  const fromLng = round(restaurant.coordinates.longitude);
  const toLat = round(passenger.coordinates.latitude);
  const toLng = round(passenger.coordinates.longitude);

  useEffect(() => {
    map.current?.fitToCoordinates(
      [
        { latitude: fromLat, longitude: fromLng },
        { latitude: toLat, longitude: toLng },
      ],
      { edgePadding: EDGE_PADDING, animated: true },
    );
  }, [fromLat, fromLng, toLat, toLng]);

  // Android needs a Google Maps key to draw anything. iOS falls back to Apple Maps.
  if (Platform.OS === 'android' && !google) {
    return <CourierMapFallback {...props} reason="Add GOOGLE_MAPS_API_KEY and rebuild to show the map." />;
  }

  return (
    <View style={styles.frame}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        provider={google ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={{
          latitude: (restaurant.coordinates.latitude + passenger.coordinates.latitude) / 2,
          longitude: (restaurant.coordinates.longitude + passenger.coordinates.longitude) / 2,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        }}
        onMapReady={() =>
          map.current?.fitToCoordinates(coordinates, { edgePadding: EDGE_PADDING, animated: false })
        }
        showsUserLocation={showsUserLocation}
        showsIndoors
        toolbarEnabled={false}>
        <Marker
          identifier="restaurant"
          coordinate={restaurant.coordinates}
          title={restaurant.title}
          description={restaurant.detail}
          pinColor={colors.accent}
        />
        <Marker
          identifier="passenger"
          coordinate={passenger.coordinates}
          title={passenger.title}
          description={passenger.detail}
          pinColor={colors.ink}
        />
        <Polyline coordinates={coordinates} strokeColor={colors.ink} strokeWidth={4} lineDashPattern={[8, 6]} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 260,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
});

function round(degrees: number): number {
  return Math.round(degrees * 100_000) / 100_000;
}
