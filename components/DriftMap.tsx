import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { YouAreHerePulse } from '@/components/YouAreHerePulse';
import { DRIFT_DARK_MAP_STYLE } from '@/lib/darkMapStyle';
import { palette } from '@/lib/theme';
import type { Coords } from '@/lib/types';

type Props = {
  coords: Coords;
  onRegionChangeComplete?: (region: Region) => void;
};

const DELTA = 0.008;

export function DriftMap({ coords, onRegionChangeComplete }: Props) {
  const mapRef = useRef<MapView>(null);
  const lastCenter = useRef<Coords | null>(null);

  useEffect(() => {
    const prev = lastCenter.current;
    lastCenter.current = coords;
    if (!prev) {
      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        },
        0
      );
      return;
    }
    // Soft follow when GPS drifts more than ~8m (approx).
    const moved =
      Math.abs(prev.latitude - coords.latitude) > 0.00007 ||
      Math.abs(prev.longitude - coords.longitude) > 0.00007;
    if (moved) {
      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        },
        600
      );
    }
  }, [coords]);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DRIFT_DARK_MAP_STYLE}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        userInterfaceStyle="dark"
        onRegionChangeComplete={onRegionChangeComplete}>
        <Marker
          coordinate={coords}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges
          flat
          tappable={false}>
          <YouAreHerePulse size={12} />
        </Marker>
      </MapView>
      <View style={[styles.vignette, styles.noPointer]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.void,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 7, 13, 0.18)',
  },
  noPointer: {
    pointerEvents: 'none',
  },
});
