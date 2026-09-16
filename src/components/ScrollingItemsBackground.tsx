/**
 * src/components/ScrollingItemsBackground.tsx
 *
 * Infinite auto-scrolling rows of item cards, fading to solid #121212 right
 * behind the logo — matches the grid-fades-into-badge look in the reference
 * screenshot. Pure RN Animated + View-stack gradient (no reanimated, no
 * expo-linear-gradient) so it can't introduce a new "module not found" error.
 *
 * Images are neutral placeholder photos from picsum.photos (a public
 * dummy-image service, not scraped product photography). Swap the `id`s in
 * ROWS for your real product/category photos whenever you have them —
 * looping, fade, and sizing logic all stay the same.
 */
import React, { FC, useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ITEM_SIZE = 104;
const ITEM_GAP = 14;

// Total area the grid + fade occupies, from the very top of the safe area.
const BACKGROUND_HEIGHT = Math.round(SCREEN_HEIGHT * 0.48);
// How far down the fade-to-solid starts (grid renders clearly above this).
const FADE_ZONE_HEIGHT = Math.round(BACKGROUND_HEIGHT * 0.72);
const FADE_BANDS = 16;

// Where the header/logo block should start (exported so sign-in.tsx can
// align its padding to sit right in the faded-out tail of the grid).
const HEADER_TOP_OFFSET = Math.round(BACKGROUND_HEIGHT * 0.7);

// Placeholder photo ids from picsum.photos — replace with your real product images.
const ROWS: number[][] = [
  [1080, 1025, 292, 431, 1069, 1074, 1078, 1084],
  [326, 152, 429, 1040, 823, 106, 1043, 1050],
  [1062, 1082, 493, 1073, 250, 96, 1059, 1076],
];

const photoUri = (id: number) => `https://picsum.photos/id/${id}/200/200`;

interface ScrollingRowProps {
  ids: number[];
  durationMs: number;
  reverse?: boolean;
}

const ScrollingRow: FC<ScrollingRowProps> = ({ ids, durationMs, reverse = false }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const doubledIds = [...ids, ...ids];
  const singleSetWidth = ids.length * (ITEM_SIZE + ITEM_GAP);

  useEffect(() => {
    translateX.setValue(reverse ? -singleSetWidth : 0);

    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: reverse ? 0 : -singleSetWidth,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => loop.stop();
  }, [translateX, durationMs, reverse, singleSetWidth]);

  return (
    <View style={styles.rowClip}>
      <Animated.View style={[styles.rowTrack, { transform: [{ translateX }] }]}>
        {doubledIds.map((id, index) => (
          <View key={`${id}-${index}`} style={styles.itemCard}>
            <Image source={{ uri: photoUri(id) }} style={styles.itemImage} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

/**
 * Simulates a smooth fade-to-#121212 using stacked bands instead of
 * expo-linear-gradient, since we can't confirm that package is installed.
 * If you already have expo-linear-gradient in the project, this whole
 * block can be swapped for a single <LinearGradient> for a smoother result.
 */
const FadeToSolid: FC = () => {
  const bands = Array.from({ length: FADE_BANDS });
  return (
    <View style={styles.fadeContainer} pointerEvents="none">
      {bands.map((_, i) => (
        <View
          key={i}
          style={{ flex: 1, backgroundColor: '#121212', opacity: (i + 1) / FADE_BANDS }}
        />
      ))}
    </View>
  );
};

const ScrollingItemsBackground: FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.rowsWrapper}>
        <ScrollingRow ids={ROWS[0]} durationMs={20000} />
        <ScrollingRow ids={ROWS[1]} durationMs={24000} reverse />
        <ScrollingRow ids={ROWS[2]} durationMs={18000} />
      </View>
      <FadeToSolid />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BACKGROUND_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  rowsWrapper: {
    paddingTop: 12,
  },
  rowClip: {
    width: SCREEN_WIDTH,
    height: ITEM_SIZE,
    overflow: 'hidden',
    marginBottom: 14,
  },
  rowTrack: {
    flexDirection: 'row',
  },
  itemCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: ITEM_GAP,
    borderRadius: 20,
    backgroundColor: '#1F1F23',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  fadeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_ZONE_HEIGHT,
    flexDirection: 'column',
  },
});

export { BACKGROUND_HEIGHT, HEADER_TOP_OFFSET };
export default ScrollingItemsBackground;