import { useColorScheme } from 'nativewind';
import {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { radius, size, useThemeColors, useThemeShadows } from '@/theme/tokens';

import type { ThumbnailSlot } from './mini-player-bar';
import type { ArtworkSlot } from './now-playing-view';
import {
  BAR_ROW_FADE_OUT_END_INDEX,
  CARD_COLOR_CHANGE_END_INDEX,
  CARD_LEAVES_BAR_INDEX,
  CARD_PINNED_TO_BOTTOM_INDEX,
  FULL_CONTENT_FADE_IN_END_INDEX,
  FULL_CONTENT_FADE_IN_START_INDEX,
} from './player-motion-config';

const BAR_INDEX = 0;
const FULL_INDEX = 1;

// A shadow that draws nothing, so the card's shadow can be switched off without removing the
// style (a style that disappears isn't reset on every platform).
const NO_SHADOW = '0px 0px 0px 0px transparent';

// The artwork's one layout size: Now Playing's design size. It is never laid out at any other
// size, before or after the slots are measured (an image whose size changes reloads and shows
// nothing for a frame). Both ends are reached with `scale`.
export const ARTWORK_LAYOUT_SIZE = size.artwork;

type PlayerMorphInput = {
  // The sheet's live index: 0 = the bar, 1 = the full player (−1 = gone, below the screen).
  sheetIndex: SharedValue<number>;
  // The sheet's top edge, in points from the top of the area it moves in.
  sheetTop: SharedValue<number>;
  // The area the sheet moves in (the whole screen).
  areaHeight: number;
  // The bar's measured height.
  barHeight: number;
  // The space on each side of the bar: its 12 px inset, more on a wide window, where the bar
  // stays in the centred content column.
  barSideInset: number;
  // Where the artwork sits in the bar and in Now Playing. Null until measured.
  thumbnailSlot: ThumbnailSlot | null;
  artworkSlot: ArtworkSlot | null;
};

// Every animated style of the player, as a function of the sheet's index (plus its top edge for
// the card's height). Nothing is copied or kept in step by hand, so a flick, a catch mid-way or a
// drag back never shows a wrong frame.
export function usePlayerMorph({
  sheetIndex,
  sheetTop,
  areaHeight,
  barHeight,
  barSideInset,
  thumbnailSlot,
  artworkSlot,
}: PlayerMorphInput) {
  const colors = useThemeColors();
  const shadows = useThemeShadows();
  const { colorScheme } = useColorScheme();

  // The bar's colours are the miniPlayer tokens (inverse in light, emphasis in dark). Now Playing
  // is bg in light; in dark one step lighter (surface1), so it stands apart from the screens.
  let barColor = colors.inverse;
  let fullColor = colors.bg;
  if (colorScheme === 'dark') {
    barColor = colors.emphasis;
    fullColor = colors.surface1;
  }
  let barShadow = NO_SHADOW;
  if (shadows.miniPlayer !== undefined) {
    barShadow = shadows.miniPlayer;
  }

  // The card is the one thing that changes size. Its children have fixed sizes and are clipped
  // by it, so nothing inside is laid out again on any frame.
  const cardStyle = useAnimatedStyle(() => {
    const index = sheetIndex.get();
    const isAtBar = index < CARD_LEAVES_BAR_INDEX;

    // The card's top follows the sheet's top. Its bottom reaches the screen's bottom early on and
    // stays there, so nothing behind the player shows below it at any point of the drag.
    const heightToAreaBottom = areaHeight - sheetTop.get();
    const cardHeight = interpolate(
      index,
      [BAR_INDEX, CARD_PINNED_TO_BOTTOM_INDEX],
      [barHeight, heightToAreaBottom],
      Extrapolation.CLAMP,
    );
    const sideInset = interpolate(index, [BAR_INDEX, FULL_INDEX], [barSideInset, 0], Extrapolation.CLAMP);
    // interpolateColor clamps outside its range, so below the bar (gone) it is the bar's colour.
    const backgroundColor = interpolateColor(index, [BAR_INDEX, CARD_COLOR_CHANGE_END_INDEX], [barColor, fullColor]);

    let borderRadius = 0;
    let boxShadow = NO_SHADOW;
    if (isAtBar) {
      borderRadius = radius.mini;
      boxShadow = barShadow;
    }

    return {
      height: cardHeight,
      marginLeft: sideInset,
      marginRight: sideInset,
      backgroundColor,
      borderRadius,
      boxShadow,
    };
  });

  // The bar's hairline outline (dark only, the class decides): shown while the card is the bar.
  const outlineStyle = useAnimatedStyle(() => {
    const isAtBar = sheetIndex.get() < CARD_LEAVES_BAR_INDEX;
    let opacity = 0;
    if (isAtBar) {
      opacity = 1;
    }
    return { opacity };
  });

  const barRowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(sheetIndex.get(), [BAR_INDEX, BAR_ROW_FADE_OUT_END_INDEX], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  const fullContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sheetIndex.get(),
      [FULL_CONTENT_FADE_IN_START_INDEX, FULL_CONTENT_FADE_IN_END_INDEX],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // One artwork, laid out at ARTWORK_LAYOUT_SIZE and moved with translate and scale from its
  // top-left corner, so translateX / translateY are where that corner ends up.
  const artworkStyle = useAnimatedStyle(() => {
    if (thumbnailSlot === null) {
      return { opacity: 0 };
    }
    const index = sheetIndex.get();
    const indexRange = [BAR_INDEX, FULL_INDEX];
    const scaleAtBar = thumbnailSlot.size / ARTWORK_LAYOUT_SIZE;

    // Until Now Playing's slot is known (its lecture details are still loading), the artwork stays
    // in the thumbnail and fades out with the bar's row.
    if (artworkSlot === null) {
      const opacity = interpolate(index, [BAR_INDEX, BAR_ROW_FADE_OUT_END_INDEX], [1, 0], Extrapolation.CLAMP);
      return {
        opacity,
        borderRadius: radius.thumbSm / scaleAtBar,
        transform: [{ translateX: thumbnailSlot.x }, { translateY: thumbnailSlot.y }, { scale: scaleAtBar }],
      };
    }

    const scaleAtFull = artworkSlot.size / ARTWORK_LAYOUT_SIZE;
    const scale = interpolate(index, indexRange, [scaleAtBar, scaleAtFull], Extrapolation.CLAMP);
    const translateX = interpolate(index, indexRange, [thumbnailSlot.x, artworkSlot.x], Extrapolation.CLAMP);
    const translateY = interpolate(index, indexRange, [thumbnailSlot.y, artworkSlot.y], Extrapolation.CLAMP);
    // Scaling shrinks the corners too. Dividing by the scale keeps them the size they should look
    // on screen: the thumbnail's corners in the bar, the artwork's in Now Playing.
    const cornersOnScreen = interpolate(index, indexRange, [radius.thumbSm, radius.card], Extrapolation.CLAMP);
    return {
      opacity: 1,
      borderRadius: cornersOnScreen / scale,
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  return { cardStyle, outlineStyle, barRowStyle, fullContentStyle, artworkStyle };
}
