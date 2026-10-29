import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { clamp } from '../engine/math';
import { useAura } from '../state/AppContext';

export const ProgressBar = ({ value, color, height = 10, marker }: { value: number; color: string; height?: number; marker?: number }) => {
  const { colors } = useAura();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withSpring(clamp(value, 0, 1), { damping: 16, stiffness: 90 });
  }, [value, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` as `${number}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.track }]}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color, shadowColor: color, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, style]} />
      {marker !== undefined && <View style={[styles.marker, { left: `${clamp(marker, 0, 1) * 100}%`, backgroundColor: colors.text }]} />}
    </View>
  );
};

export const Stat = ({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) => {
  const { colors } = useAura();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.textDim }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color ?? colors.text }]}>{value}</Text>
      {hint ? <Text style={[styles.statHint, { color: colors.textDim }]}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  track: { overflow: 'visible', justifyContent: 'center' },
  marker: { position: 'absolute', width: 2, height: 18, top: -4 },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  statHint: { fontSize: 10, marginTop: 2 },
});
