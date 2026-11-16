import { fitArtworkSize, nowPlayingSeekBar, nowPlayingTrackInfo } from '@/features/player/now-playing-content';
import { catForTopic } from '@/theme/tokens';
import { bareLecture, fullLecture } from '@/test-utils/fixtures';

describe('nowPlayingSeekBar', () => {
  it('shows the live position against the loaded length', () => {
    const seekBar = nowPlayingSeekBar({ positionSec: 965, durationSec: 2781, dataDuration: '46:21' });
    expect(seekBar.progress).toBeCloseTo(0.347, 3);
    expect(seekBar.elapsed).toBe('16:05');
    expect(seekBar.remaining).toBe('-30:16');
    expect(seekBar.accessibilityValue).toEqual({ min: 0, max: 2781, now: 965, text: '16:05 of 46:21' });
  });

  it("uses the data's duration before the audio has loaded", () => {
    const seekBar = nowPlayingSeekBar({ positionSec: 0, durationSec: 0, dataDuration: fullLecture.duration });
    expect(seekBar.progress).toBe(0);
    expect(seekBar.elapsed).toBe('0:00');
    expect(seekBar.remaining).toBe('-46:21');
    expect(seekBar.accessibilityValue).toEqual({ min: 0, max: 2781, now: 0, text: '0:00 of 46:21' });
  });

  it('shows no remaining time when no length is known yet', () => {
    const seekBar = nowPlayingSeekBar({ positionSec: 0, durationSec: 0, dataDuration: bareLecture.duration });
    expect(seekBar.progress).toBe(0);
    expect(seekBar.remaining).toBe('');
    expect(seekBar.accessibilityValue.text).toBe('0:00 of unknown length');
  });
});

describe('fitArtworkSize', () => {
  it('uses the full column width when everything fits', () => {
    const size = fitArtworkSize({ availableWidth: 342, availableHeight: 900, heightOfEverythingElse: 400 });
    expect(size).toBe(342);
  });

  it('shrinks just enough for the controls to fit', () => {
    const size = fitArtworkSize({ availableWidth: 342, availableHeight: 700, heightOfEverythingElse: 400 });
    expect(size).toBe(300);
  });

  it('stops shrinking at 200', () => {
    const size = fitArtworkSize({ availableWidth: 342, availableHeight: 500, heightOfEverythingElse: 400 });
    expect(size).toBe(200);
  });

  it('is never wider than the column', () => {
    const size = fitArtworkSize({ availableWidth: 150, availableHeight: 500, heightOfEverythingElse: 400 });
    expect(size).toBe(150);
  });
});

describe('nowPlayingTrackInfo', () => {
  it('fills every line and pill a complete lecture has', () => {
    expect(nowPlayingTrackInfo(fullLecture)).toEqual({
      venue: 'Masjid Muswalla, Highlands',
      dateLabel: 'Saturday, 31 October 2026',
      topicLabel: 'sahaba r.a',
      topicCategory: catForTopic('sahaba r.a'),
      eventTitle: 'The Sahaba Radiyyallahu Anhum',
    });
  });

  it('leaves out what the data does not have', () => {
    const trackInfo = nowPlayingTrackInfo(bareLecture);
    expect(trackInfo.venue).toBeUndefined();
    expect(trackInfo.topicLabel).toBeUndefined();
    expect(trackInfo.topicCategory).toBeUndefined();
    expect(trackInfo.eventTitle).toBeUndefined();
    expect(trackInfo.dateLabel).toBe('Friday, 2 October 2026');
  });

  it('shows the topic exactly as the API sends it, in its own colour', () => {
    const lecture = { ...fullLecture, category: ['Moon Sighting'] };
    const trackInfo = nowPlayingTrackInfo(lecture);
    expect(trackInfo.topicLabel).toBe('Moon Sighting');
    expect(trackInfo.topicCategory).toBe(catForTopic('Moon Sighting'));
  });

  it('leaves out the date line when the lecture has no date', () => {
    const lecture = { ...fullLecture, date: undefined };
    expect(nowPlayingTrackInfo(lecture).dateLabel).toBeUndefined();
  });
});
