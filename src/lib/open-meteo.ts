import axios from 'axios';
import { parseOpenMeteoCurrent, WeatherGhost } from './weather-ghost.ts';

export async function fetchWeatherGhost(lat: number, lng: number): Promise<WeatherGhost> {
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat,
      longitude: lng,
      current: 'weather_code,is_day',
      timezone: 'auto',
    },
    timeout: 4000,
  });
  return parseOpenMeteoCurrent(data);
}
