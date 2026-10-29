import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { PlacePhoto } from '@/src/domain';

import { foodImages } from './food-images';

type PhotoProps = {
  /** The colored box shown while loading and whenever there is no photo. */
  color: string;
  style?: StyleProp<ViewStyle>;
  /** A bundled stock food photo. */
  imageKey?: string | null;
  /** A Google Places photo. Kept in memory only, never on disk. */
  remote?: PlacePhoto | null;
  /** Shown only when no photo is showing, such as initials or a "Photo" caption. */
  fallback?: ReactNode;
  children?: ReactNode;
};

/** True when a bundled food photo exists for this key. */
export function hasFoodImage(imageKey: string | null | undefined): boolean {
  return Boolean(imageKey && foodImages[imageKey]);
}

export function Photo({ color, style, imageKey, remote, fallback, children }: PhotoProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const remoteSource = remote && remote.uri !== failedUri ? { uri: remote.uri } : null;
  const localSource = imageKey ? foodImages[imageKey] : undefined;
  const source = remoteSource ?? localSource;

  return (
    <View style={[styles.box, { backgroundColor: color }, style]}>
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          cachePolicy={remoteSource ? 'memory' : 'disk'}
          accessibilityIgnoresInvertColors
          onError={() => {
            if (remoteSource) setFailedUri(remoteSource.uri);
          }}
        />
      ) : (
        fallback
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});
