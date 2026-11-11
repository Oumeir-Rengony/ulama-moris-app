// Web only: the HTML shell around every page. It runs in Node during rendering, never in the app.
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// NativeWind's web CSS declares `--css-interop-darkMode: media`, and NativeWind reads that flag
// when its JS first loads. In development the CSS is injected AFTER that first read, so NativeWind
// falls back to a code path that throws "Cannot manually set color scheme, as dark mode is type
// 'media'". Declaring the same flag here makes it present before any JS runs.
// Keep it in sync with `darkMode` in tailwind.config.js.
const nativeWindDarkModeFlag = ':root { --css-interop-darkMode: media; }';

export default function RootHtml({ children }: PropsWithChildren) {
  // headNodes / bodyNodes carry the styles, fonts and the app's JS bundle (SDK 58).
  // Leaving them out renders a page that never loads any JavaScript.
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: nativeWindDarkModeFlag }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
