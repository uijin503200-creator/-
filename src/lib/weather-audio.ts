type AmbienceHandle = {
  stop: () => void;
};

function createNoiseBuffer(ctx: AudioContext, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function startWeatherAmbience(weather: string | null, time: string | null): AmbienceHandle {
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return { stop() {} };

  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.6);

  const raining = weather === 'Rain' || weather === 'Storm';
  if (raining) {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = weather === 'Storm' ? 900 : 1400;
    filter.Q.value = 0.7;
    const rainGain = ctx.createGain();
    rainGain.gain.value = weather === 'Storm' ? 0.9 : 0.55;
    source.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(master);
    source.start();
  }

  if (time === 'Night') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 48;
    const nightGain = ctx.createGain();
    nightGain.gain.value = 0.22;
    osc.connect(nightGain);
    nightGain.connect(master);
    osc.start();
  }

  if (weather === 'Snow' || weather === 'Clouds') {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = weather === 'Snow' ? 92 : 72;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.08;
    osc.connect(airGain);
    airGain.connect(master);
    osc.start();
  }

  return {
    stop() {
      try {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        window.setTimeout(() => {
          void ctx.close();
        }, 500);
      } catch {
        void ctx.close();
      }
    },
  };
}
