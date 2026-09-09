export type LiveFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: 'gps' | 'network' | 'ip';
};

type LiveLocationCallbacks = {
  onFix: (fix: LiveFix) => void;
  onError: (message: string) => void;
};

async function ipFallback(): Promise<LiveFix | null> {
  try {
    const res = await fetch('/api/geo/live');
    if (!res.ok) return null;
    const data = await res.json();
    if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;
    return {
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy ?? null,
      source: 'ip',
    };
  } catch {
    return null;
  }
}

function readFix(position: GeolocationPosition): LiveFix {
  const accuracy = position.coords.accuracy;
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    source: accuracy > 0 && accuracy <= 50 ? 'gps' : 'network',
  };
}

export function watchLiveLocation({ onFix, onError }: LiveLocationCallbacks): () => void {
  let stopped = false;
  let hasFix = false;
  let watchId: number | null = null;

  const stopWatch = () => {
    if (watchId != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };

  void ipFallback().then((fix) => {
    if (stopped || hasFix || !fix) return;
    hasFix = true;
    onFix(fix);
  });

  if (!('geolocation' in navigator)) {
    void ipFallback().then((fix) => {
      if (stopped) return;
      if (fix) {
        hasFix = true;
        onFix(fix);
      } else if (!hasFix) {
        onError('Location access required for Drift to function.');
      }
    });
    return () => {
      stopped = true;
    };
  }

  const startWatch = (enableHighAccuracy: boolean) => {
    stopWatch();
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (stopped) return;
        hasFix = true;
        onFix(readFix(position));
      },
      () => {
        if (stopped) return;
        if (enableHighAccuracy) {
          startWatch(false);
          return;
        }
        if (!hasFix) {
          void ipFallback().then((fix) => {
            if (stopped) return;
            if (fix) {
              hasFix = true;
              onFix(fix);
            } else {
              onError('Location access required for Drift to function.');
            }
          });
        }
      },
      {
        enableHighAccuracy,
        timeout: enableHighAccuracy ? 5000 : 8000,
        maximumAge: 0,
      },
    );
  };

  startWatch(true);

  return () => {
    stopped = true;
    stopWatch();
  };
}

export function requestLiveLocation({ onFix, onError }: LiveLocationCallbacks): () => void {
  let cancelled = false;
  let hasFix = false;

  void ipFallback().then((fix) => {
    if (cancelled || hasFix || !fix) return;
    hasFix = true;
    onFix(fix);
  });

  if (!('geolocation' in navigator)) {
    void ipFallback().then((fix) => {
      if (cancelled) return;
      if (fix) {
        hasFix = true;
        onFix(fix);
      } else if (!hasFix) {
        onError('Location access required for Drift to function.');
      }
    });
    return () => {
      cancelled = true;
    };
  }

  const usePosition = (position: GeolocationPosition) => {
    if (cancelled) return;
    hasFix = true;
    onFix(readFix(position));
  };

  navigator.geolocation.getCurrentPosition(
    usePosition,
    () => {
      if (cancelled) return;
      navigator.geolocation.getCurrentPosition(
        usePosition,
        () => {
          if (cancelled || hasFix) return;
          void ipFallback().then((fix) => {
            if (cancelled) return;
            if (fix) {
              hasFix = true;
              onFix(fix);
            } else {
              onError('Location required to drop a note.');
            }
          });
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
      );
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
  );

  return () => {
    cancelled = true;
  };
}
