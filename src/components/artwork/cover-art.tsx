import { Image } from 'expo-image';

// The lecture cover: a bitmap, the same in both themes. It is 896 × 1200 portrait, so a square
// frame crops the top and bottom and keeps the moon, dome and minaret in view.
// It fills its parent, so the parent sets the size and the corner radius.
const coverArtSource = require('@/assets/images/cover-art.jpg');

export function CoverArt() {
  return (
    <Image
      source={coverArtSource}
      contentFit="cover"
      contentPosition="center"
      style={{ width: '100%', height: '100%' }}
      accessible={false}
    />
  );
}
