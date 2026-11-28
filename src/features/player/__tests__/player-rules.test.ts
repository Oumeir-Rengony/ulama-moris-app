/// <reference types="node" />
// Node types for fs and path: this test reads source files. (@types/node comes with Jest.)
// Guards for the player's architecture rules: one audio player, status flowing one way into the
// store, and selector-only store reads. They read the app's source files, so breaking a rule
// fails a test.
import fs from 'fs';
import path from 'path';

const srcFolder = path.join(__dirname, '..', '..', '..');

// Every app source file: tests and test helpers are left out, since they mock these on purpose.
function listAppSourceFiles(folder: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      const isTestFolder = entry.name === '__tests__' || entry.name === 'test-utils';
      if (!isTestFolder) {
        files.push(...listAppSourceFiles(entryPath));
      }
      continue;
    }
    const isCode = entry.name.endsWith('.ts') || entry.name.endsWith('.tsx');
    if (isCode) {
      files.push(entryPath);
    }
  }
  return files;
}

const appSourceFiles = listAppSourceFiles(srcFolder);

function relativeName(filePath: string): string {
  return path.relative(srcFolder, filePath);
}

function filesContaining(text: string | RegExp): string[] {
  const matches: string[] = [];
  for (const filePath of appSourceFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    const found = typeof text === 'string' ? source.includes(text) : text.test(source);
    if (found) {
      matches.push(relativeName(filePath));
    }
  }
  return matches.sort();
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(srcFolder, relativePath), 'utf8');
}

describe('player rules', () => {
  it('the stores hold data only: no expo-audio, no expo-router', () => {
    for (const storeFile of ['features/player/player.store.ts', 'features/player/listening-history.store.ts']) {
      const source = readSource(storeFile);
      expect(source).not.toMatch(/from 'expo-audio'/);
      expect(source).not.toMatch(/from 'expo-router'/);
    }
  });

  it('only the listening history and recent searches are persisted, never the live player store', () => {
    expect(filesContaining('persist(')).toEqual([
      'features/player/listening-history.store.ts',
      'features/search/recent-searches.store.ts',
    ]);
  });

  it('there is one player, created in the engine', () => {
    expect(filesContaining('createAudioPlayer(')).toEqual(['features/player/audio-engine.ts']);
  });

  it('the audio mode is set in one place', () => {
    expect(filesContaining('setAudioModeAsync(')).toEqual(['features/player/setup-audio.ts']);
  });

  it('no screen creates its own player, and expo-av is never used', () => {
    expect(filesContaining('useAudioPlayer(')).toEqual([]);
    expect(filesContaining("'expo-av'")).toEqual([]);
  });

  it('the player store is always read through a selector', () => {
    expect(filesContaining('usePlayerStore()')).toEqual([]);
    expect(filesContaining('useListeningHistoryStore()')).toEqual([]);
  });

  // Now Playing is a panel in PlayerShell. /player is only the deep-link entry.
  it('nothing in the app navigates to /player', () => {
    expect(filesContaining(/router\.(navigate|push|replace)\(['"]\/player/)).toEqual([]);
  });

  // Whether Now Playing is open lives in one place (the store) and has one writer (the
  // coordinator). The panel follows it; nothing infers it from where the panel is.
  it('only the coordinator sets the Now Playing presentation', () => {
    const callers = filesContaining('setNowPlayingPresentation(').filter(
      (file) => file !== 'features/player/player.store.ts',
    );
    expect(callers).toEqual(['features/player/open-now-playing.ts']);
  });

  // The phase 1 Android bug (a value left half-way made Now Playing transparent) came from
  // JS responders and values written outside the worklet rules. Motion stays on the UI thread,
  // in Gesture Handler and Reanimated, and never uses PanResponder.
  it('player files never use PanResponder', () => {
    const playerFiles = filesContaining(/./).filter((file) => file.startsWith('features/player/'));
    const filesWithPanResponder = playerFiles.filter((file) => readSource(file).includes('PanResponder'));
    expect(filesWithPanResponder).toEqual([]);
  });

  it('player motion uses scheduleOnRN and .get()/.set(), never runOnJS or .value', () => {
    const motionFiles = filesContaining(/react-native-reanimated/).filter((file) => file.startsWith('features/player/'));
    expect(motionFiles.length).toBeGreaterThan(0);
    for (const file of motionFiles) {
      const source = readSource(file);
      expect(source).not.toMatch(/runOnJS/);
      expect(source).not.toMatch(/\.value\b/);
    }
  });

  // gorhom's onAnimate / onChange / onClose fire late, or not at all when a spring is interrupted,
  // which let the store and the sheet drift apart. The sheet's own resting check reports instead.
  it('only the player sheet uses @gorhom/bottom-sheet, and none of its callbacks', () => {
    expect(filesContaining('@gorhom/bottom-sheet')).toEqual(['features/player/now-playing-panel.tsx']);
    const panelSource = readSource('features/player/now-playing-panel.tsx');
    expect(panelSource).not.toMatch(/\bonAnimate=/);
    expect(panelSource).not.toMatch(/\bonChange=/);
    expect(panelSource).not.toMatch(/\bonClose=/);
  });

  // gorhom's default (accessible, "Bottom Sheet", adjustable) makes Now Playing one element on
  // iOS: VoiceOver couldn't reach the chevron or the controls.
  it('the player sheet does not group its content for screen readers', () => {
    expect(readSource('features/player/now-playing-panel.tsx')).toMatch(/accessible=\{false\}/);
  });

  // Changing it makes gorhom swap the view around its content, which remounts the whole player
  // (the artwork blinked at both sizes).
  it('the content panning gesture is never switched', () => {
    const source = readSource('features/player/now-playing-panel.tsx');
    const settings = source.match(/enableContentPanningGesture=\{[^}]*\}/g);
    expect(settings).toEqual(['enableContentPanningGesture={true}']);
  });

  // A drag from Now Playing passes through the bar's position. If that counted as resting at the
  // bar, Now Playing was recorded as closed mid-drag, and letting go below the bar stopped playback.
  // The finger is tracked through gorhom's public handler hook, never its internal context, whose
  // fields can change without notice.
  it('the resting check waits until no finger drags the sheet, tracked through public gorhom API', () => {
    const source = readSource('features/player/now-playing-panel.tsx');
    expect(source).toMatch(/gestureEventsHandlersHook=\{useDragTrackingHandlers\}/);
    expect(source).toMatch(/if \(isDraggingSheet\.get\(\)\) \{\s*return 'moving';/);
    expect(source).not.toMatch(/useBottomSheetInternal/);
  });

  // While Now Playing is open the bar is the lowest the sheet goes, so a drag or a flick from Now
  // Playing can never reach "gone" (which stops playback when started from the bar).
  it('pan down to close is on only while Now Playing is closed', () => {
    const source = readSource('features/player/now-playing-panel.tsx');
    const settings = source.match(/enablePanDownToClose=\{[^}]*\}/g);
    expect(settings).toEqual(['enablePanDownToClose={!isOpen}']);
  });

  // Every visual is a function of the sheet's index; the morph never talks to the sheet itself.
  it('the morph does not import gorhom', () => {
    expect(readSource('features/player/use-player-morph.ts')).not.toMatch(/@gorhom/);
  });

  // A flick on Now Playing must never stop playback: only the bar (its swipe down, or its
  // screen-reader action) can, and that decision lives in open-now-playing.ts.
  it('Now Playing has no path to stopping playback', () => {
    for (const file of ['features/player/now-playing-panel.tsx', 'features/player/now-playing-view.tsx']) {
      const source = readSource(file);
      expect(source).not.toMatch(/dismissMiniPlayer/);
      expect(source).not.toMatch(/stopAndClear/);
    }
  });

  // The mini player has to stay on every screen, Search included. Search is a root-stack screen
  // drawn over the tabs, so the player and the tab bar must be drawn around the whole root stack.
  it('the root layout draws the player around every screen, and nothing else draws it', () => {
    expect(filesContaining('<PlayerShell')).toEqual(['app/_layout.tsx']);
    expect(filesContaining('<NowPlayingPanel')).toEqual(['features/player/player-shell.tsx']);
    expect(filesContaining('<PlayerTabBar')).toEqual(['features/player/player-shell.tsx']);
  });

  // The root stack is inside PlayerShell, so Search (one of its screens) is under the player.
  it('the root stack is wrapped in PlayerShell', () => {
    const source = readSource('app/_layout.tsx');
    const shellStart = source.indexOf('<PlayerShell>');
    const stackStart = source.indexOf('<Stack ');
    const shellEnd = source.indexOf('</PlayerShell>');
    expect(shellStart).toBeGreaterThan(-1);
    expect(stackStart).toBeGreaterThan(shellStart);
    expect(shellEnd).toBeGreaterThan(stackStart);
  });

  // The keyboard is read in one place, with a web version that does nothing (Reanimated only
  // warns there).
  it('the keyboard height is read only through useKeyboardHeight', () => {
    expect(filesContaining('useAnimatedKeyboard')).toEqual(['features/player/use-keyboard-height.ts']);
    expect(fs.existsSync(path.join(srcFolder, 'features/player/use-keyboard-height.web.ts'))).toBe(true);
  });

  it('no component in src/components reads the player stores', () => {
    const componentFilesUsingStores = filesContaining(/usePlayerStore|useListeningHistoryStore/).filter((file) =>
      file.startsWith('components/'),
    );
    expect(componentFilesUsingStores).toEqual([]);
  });
});
