const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './src/global.css',
  // Tailwind's spacing scale is in rem (mt-6 = 1.5rem). On native, NativeWind turns 1rem into
  // 14px by default, so every spacing class came out 12% smaller than the design (mt-6 = 21, not
  // 24). The web build uses 16, so iOS, Android and web now all use 16.
  inlineRem: 16,
});
