export type WrittenWeather = 'Clear' | 'Clouds' | 'Rain' | 'Snow' | 'Storm';
export type WrittenTime = 'Day' | 'Night';

export type WeatherGhost = {
  writtenWeather: WrittenWeather | null;
  writtenTime: WrittenTime | null;
};

export function weatherFromWmoCode(code: number): WrittenWeather {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 48) return 'Clouds';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snow';
  if (code >= 95 && code <= 99) return 'Storm';
  return 'Clouds';
}

export function timeFromIsDay(isDay: number | boolean): WrittenTime {
  return isDay === 1 || isDay === true ? 'Day' : 'Night';
}

export function ghostCaption(weather?: string | null, time?: string | null): string | null {
  const rain = weather === 'Rain' || weather === 'Storm';
  if (rain && time === 'Night') return 'left in the rain, after dark';
  if (weather === 'Storm') return 'a storm was passing';
  if (rain) return 'it was raining when they left this';
  if (weather === 'Snow' && time === 'Night') return 'left in the snow, after dark';
  if (weather === 'Snow') return 'snow was falling';
  if (time === 'Night') return 'left after dark';
  if (weather === 'Clouds') return 'the sky was heavy';
  if (weather === 'Clear') return 'the air was clear';
  return null;
}

export function parseOpenMeteoCurrent(data: {
  current?: { weather_code?: number; is_day?: number | boolean };
}): WeatherGhost {
  const weatherCode = data.current?.weather_code;
  const isDay = data.current?.is_day;
  if (!Number.isFinite(weatherCode) || isDay === undefined) {
    return { writtenWeather: null, writtenTime: null };
  }
  return {
    writtenWeather: weatherFromWmoCode(weatherCode as number),
    writtenTime: timeFromIsDay(isDay),
  };
}
