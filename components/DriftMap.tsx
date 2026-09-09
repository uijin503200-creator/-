import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { YouAreHerePulse } from '@/components/YouAreHerePulse';
import { DISCOVERY_RADIUS_METERS } from '@/lib/constants';
import { DRIFT_DARK_MAP_STYLE } from '@/lib/darkMapStyle';
import { palette } from '@/lib/theme';
import type { Coords, NearbyNote } from '@/lib/types';

type Props = {
  coords: Coords;
  notes?: NearbyNote[];
  onRegionChangeComplete?: (region: Region) => void;
  onNotePress?: (noteId: string) => void;
};

const DELTA = 0.008;

export function DriftMap({ coords, notes = [], onRegionChangeComplete, onNotePress }: Props) {
  const mapRef = useRef<MapView>(null);
  const lastCenter = useRef<Coords | null>(null);

  const discoverableIds = useMemo(
    () => new Set(notes.filter((n) => n.distanceMeters <= DISCOVERY_RADIUS_METERS).map((n) => n.id)),
    [notes]
  );

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
        <Circle
          center={coords}
          radius={DISCOVERY_RADIUS_METERS}
          strokeColor="rgba(34, 34, 34, 0.9)"
          fillColor="rgba(34, 34, 34, 0.08)"
          strokeWidth={1}
        />

        {notes.map((note) => {
          const hot = discoverableIds.has(note.id);
          return (
            <Marker
              key={note.id}
              coordinate={{ latitude: note.latitude, longitude: note.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={hot}
              flat
              onPress={() => {
                if (hot) onNotePress?.(note.id);
              }}>
              <View style={[styles.noteDot, hot && styles.noteDotHot]} />
            </Marker>
          );
        })}

        <Marker
          coordinate={coords}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges
          flat
          tappable={false}>
          <YouAreHerePulse size={12} active />
        </Marker>
      </MapView>
      <View style={[styles.vignette, styles.noPointer]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#050505',
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 5, 0.12)',
  },
  noPointer: {
    pointerEvents: 'none',
  },
  noteDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(168, 180, 200, 0.35)',
  },
  noteDotHot: {
    width: 10,
    height: 10,
    backgroundColor: palette.echo,
    shadowColor: palette.echo,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
