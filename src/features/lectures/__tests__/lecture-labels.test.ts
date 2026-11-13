import { lectureRowMetaLabel } from '@/features/lectures/lecture-labels';
import { bareLecture, fullLecture } from '@/test-utils/fixtures';

describe('lectureRowMetaLabel', () => {
  it('joins the date, rounded minutes and formatted venue', () => {
    expect(lectureRowMetaLabel(fullLecture)).toBe('31 Oct · 46 min · Masjid Muswalla, Highlands');
  });

  it('leaves out the minutes when the duration is unknown', () => {
    const lecture = { ...fullLecture, duration: undefined };
    expect(lectureRowMetaLabel(lecture)).toBe('31 Oct · Masjid Muswalla, Highlands');
  });

  it('leaves out the venue when there is none', () => {
    const lecture = { ...fullLecture, masjid: undefined };
    expect(lectureRowMetaLabel(lecture)).toBe('31 Oct · 46 min');
  });

  it('shows only the date when both are missing', () => {
    expect(lectureRowMetaLabel(bareLecture)).toBe('2 Oct');
  });
});
