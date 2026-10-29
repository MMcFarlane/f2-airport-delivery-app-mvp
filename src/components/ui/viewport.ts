import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Dimensions, type View } from 'react-native';

/** Load a little before a card scrolls in, so the photo is ready when it arrives. */
const MARGIN = 120;

const listeners = new Set<() => void>();
let scheduled = false;

/** Call from a ScrollView's onScroll so cards waiting to be seen check again. One check per frame. */
export function notifyViewportChanged(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    for (const listener of listeners) listener();
  });
}

/**
 * True once the view has been on screen. Home and Browse render every restaurant, and each first photo
 * is a billed request, so cards ask for a photo only after this turns true. It never turns back off.
 */
export function useSeenOnScreen(enabled: boolean) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!enabled || seen) return;
    let active = true;
    const check = () => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (!active || width === 0 || height === 0) return;
        const screen = Dimensions.get('window');
        const onScreen =
          x + width >= -MARGIN && x <= screen.width + MARGIN && y + height >= -MARGIN && y <= screen.height + MARGIN;
        if (onScreen) setSeen(true);
      });
    };
    listeners.add(check);
    check();
    return () => {
      active = false;
      listeners.delete(check);
    };
  }, [enabled, seen]);

  const onLayout = useCallback(() => notifyViewportChanged(), []);
  return { ref, onLayout, seen };
}
