// Every number for the launch screen (launch-screen.tsx). Tune here only.

// The logo's size. LOGO_WIDTH must match `imageWidth` of the expo-splash-screen plugin in
// app.json, so the logo is the same size on the native splash and on the launch screen.
// The height follows the asset's aspect ratio (assets/images/splash-logo.png is 466 × 505).
export const LOGO_WIDTH = 200;
export const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 505) / 466);

// The logo rising from the screen's centre into place, and the text fading in.
export const ENTRANCE_MS = 500;

// The progress bar filling up, starting a little after the entrance begins.
export const BAR_FILL_DELAY_MS = 200;
export const BAR_FILL_MS = 900;

// A short pause on the full bar, then the whole screen fades away.
export const EXIT_DELAY_MS = 150;
export const EXIT_MS = 300;
