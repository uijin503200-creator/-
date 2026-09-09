import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ghostCaption } from '../lib/weather-ghost.ts';
import { startWeatherAmbience } from '../lib/weather-audio.ts';

interface WeatherGhostOverlayProps {
  weather: string | null | undefined;
  time: string | null | undefined;
}

export default function WeatherGhostOverlay({ weather, time }: WeatherGhostOverlayProps) {
  const raining = weather === 'Rain' || weather === 'Storm';
  const snowing = weather === 'Snow';
  const storm = weather === 'Storm';
  const night = time === 'Night';
  const whisper = ghostCaption(weather, time);

  const drops = useMemo(
    () => Array.from({ length: raining ? 72 : snowing ? 42 : 0 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.4,
      duration: raining ? 0.55 + Math.random() * 0.7 : 3.2 + Math.random() * 2.4,
      height: raining ? 10 + Math.random() * 18 : 3 + Math.random() * 4,
      width: raining ? 1 : 3 + Math.random() * 3,
      drift: snowing ? (Math.random() * 40 - 20) : 0,
    })),
    [raining, snowing],
  );

  useEffect(() => {
    const ambience = startWeatherAmbience(weather ?? null, time ?? null);
    return () => ambience.stop();
  }, [weather, time]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[15]">
      {night && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,48,92,0.28)_0%,_rgba(4,6,16,0.92)_70%)]"
        />
      )}

      {weather === 'Clouds' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 2.8 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(140,150,170,0.18),_transparent_60%)]"
        />
      )}

      {raining && (
        <div className="weather-ghost-rain absolute inset-0">
          {drops.map((drop) => (
            <span
              key={drop.id}
              className="weather-ghost-drop"
              style={{
                left: `${drop.left}%`,
                height: drop.height,
                width: drop.width,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {snowing && (
        <div className="weather-ghost-rain absolute inset-0">
          {drops.map((drop) => (
            <span
              key={drop.id}
              className="weather-ghost-flake"
              style={{
                left: `${drop.left}%`,
                width: drop.width,
                height: drop.height,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
                ['--flake-drift' as string]: `${drop.drift}px`,
              }}
            />
          ))}
        </div>
      )}

      {storm && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.55, 0, 0.18, 0, 0] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeOut', times: [0, 0.62, 0.66, 0.7, 0.74, 0.8, 1] }}
        />
      )}

      {whisper && (
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.45em' }}
          animate={{ opacity: 0.55, letterSpacing: '0.28em' }}
          transition={{ delay: 2.2, duration: 2.8, ease: 'easeOut' }}
          className="absolute top-10 left-0 right-0 text-center text-[10px] uppercase text-zinc-400 font-light"
        >
          {whisper}
        </motion.p>
      )}
    </div>
  );
}
