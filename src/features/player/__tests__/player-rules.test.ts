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

  it('only the entry point navigates to Now Playing', () => {
    expect(filesContaining(/router\.(navigate|push|replace)\(['"]\/player/)).toEqual(['features/player/open-now-playing.ts']);
  });

  // Only the navigation stack knows whether Now Playing is open. A stored copy of that could
  // disagree with what is on screen.
  it('whether Now Playing is open is never stored', () => {
    expect(filesContaining('nowPlayingPresentation')).toEqual([]);
  });

  // An animation or a finger-driven value left half-way once made Now Playing transparent and
  // the bar invisible. Phase 1 has neither.
  it('Now Playing and the mini player have no animation and no gestures', () => {
    const playerFiles = [
      'app/player.tsx',
      'features/player/now-playing-view.tsx',
      'features/player/mini-player-bar.tsx',
      'features/player/open-now-playing.ts',
    ];
    for (const file of playerFiles) {
      const source = readSource(file);
      expect(source).not.toMatch(/react-native-reanimated/);
      expect(source).not.toMatch(/react-native-gesture-handler/);
      expect(source).not.toMatch(/PanResponder/);
    }
  });

  it('no component in src/components reads the player stores', () => {
    const componentFilesUsingStores = filesContaining(/usePlayerStore|useListeningHistoryStore/).filter((file) =>
      file.startsWith('components/'),
    );
    expect(componentFilesUsingStores).toEqual([]);
  });
});
