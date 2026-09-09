import { describe, expect, it } from 'vitest';
import { parseOpenMeteoCurrent, timeFromIsDay, weatherFromWmoCode, ghostCaption } from './weather-ghost.ts';

describe('weatherFromWmoCode', () => {
  it('maps clear skies to Clear', () => {
    expect(weatherFromWmoCode(0)).toBe('Clear');
  });

  it('maps cloudy codes to Clouds', () => {
    expect(weatherFromWmoCode(1)).toBe('Clouds');
    expect(weatherFromWmoCode(2)).toBe('Clouds');
    expect(weatherFromWmoCode(3)).toBe('Clouds');
    expect(weatherFromWmoCode(45)).toBe('Clouds');
  });

  it('maps rain and drizzle to Rain', () => {
    expect(weatherFromWmoCode(51)).toBe('Rain');
    expect(weatherFromWmoCode(61)).toBe('Rain');
    expect(weatherFromWmoCode(80)).toBe('Rain');
  });

  it('maps snow to Snow', () => {
    expect(weatherFromWmoCode(71)).toBe('Snow');
    expect(weatherFromWmoCode(85)).toBe('Snow');
  });

  it('maps thunderstorms to Storm', () => {
    expect(weatherFromWmoCode(95)).toBe('Storm');
    expect(weatherFromWmoCode(99)).toBe('Storm');
  });
});

describe('timeFromIsDay', () => {
  it('maps Open-Meteo is_day to Day or Night', () => {
    expect(timeFromIsDay(1)).toBe('Day');
    expect(timeFromIsDay(0)).toBe('Night');
    expect(timeFromIsDay(true)).toBe('Day');
    expect(timeFromIsDay(false)).toBe('Night');
  });
});

describe('parseOpenMeteoCurrent', () => {
  it('reads written_weather and written_time from a current snapshot', () => {
    expect(parseOpenMeteoCurrent({
      current: { weather_code: 61, is_day: 0 },
    })).toEqual({
      writtenWeather: 'Rain',
      writtenTime: 'Night',
    });
  });

  it('returns nulls when the snapshot is missing', () => {
    expect(parseOpenMeteoCurrent({})).toEqual({
      writtenWeather: null,
      writtenTime: null,
    });
  });
});

describe('ghostCaption', () => {
  it('names rain at night without using the finder\'s weather', () => {
    expect(ghostCaption('Rain', 'Night')).toBe('left in the rain, after dark');
    expect(ghostCaption('Clear', 'Day')).toBe('the air was clear');
    expect(ghostCaption(null, null)).toBeNull();
  });
});
