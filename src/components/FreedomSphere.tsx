import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurMask, Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { Easing, SharedValue, useDerivedValue, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { clamp } from '../engine/math';
import { useAura } from '../state/AppContext';

interface Props {
  ratio: number; // 0..1+ progress toward the goal
  size?: number;
  accent: string;
  accent2: string;
  label: string;
}

const Orb = ({ i, c, phase, radius, color }: { i: number; c: number; phase: SharedValue<number>; radius: SharedValue<number>; color: string }) => {
  const cx = useDerivedValue(() => c + Math.cos(phase.value * (1 + i * 0.12) + i * 1.05) * (radius.value * 1.5 + i * 4));
  const cy = useDerivedValue(() => c + Math.sin(phase.value * (1 + i * 0.12) + i * 1.05) * (radius.value * 1.5 + i * 4) * 0.45);
  return <Circle cx={cx} cy={cy} r={2 + (i % 3)} color={color} opacity={0.85} />;
};

export const FreedomSphere = ({ ratio, size = 260, accent, accent2, label }: Props) => {
  const { colors } = useAura();
  const c = size / 2;
  const grow = useSharedValue(0);
  const phase = useSharedValue(0);

  useEffect(() => {
    grow.value = withSpring(clamp(ratio, 0, 1.4), { damping: 11, stiffness: 90, mass: 0.8 });
  }, [ratio, grow]);
  useEffect(() => {
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 9000, easing: Easing.linear }), -1, false);
  }, [phase]);

  const radius = useDerivedValue(() => size * 0.12 + grow.value * size * 0.25);
  const glowR = useDerivedValue(() => radius.value * 1.3 + Math.sin(phase.value * 3) * 4);
  const ringR = useDerivedValue(() => radius.value * 1.22);
  const shineX = useDerivedValue(() => c - radius.value * 0.3);
  const shineY = useDerivedValue(() => c - radius.value * 0.35);
  const shineR = useDerivedValue(() => radius.value * 0.28);
  const gradC = useDerivedValue(() => vec(c - radius.value * 0.25, c - radius.value * 0.25));

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        <Circle cx={c} cy={c} r={glowR} color={accent} opacity={0.38}>
          <BlurMask blur={30} style="normal" />
        </Circle>
        <Circle cx={c} cy={c} r={radius}>
          <RadialGradient c={gradC} r={radius} colors={[accent2, accent, '#1B1048']} />
        </Circle>
        <Circle cx={shineX} cy={shineY} r={shineR} color="white" opacity={0.28}>
          <BlurMask blur={10} style="normal" />
        </Circle>
        <Circle cx={c} cy={c} r={ringR} style="stroke" strokeWidth={1.5} color={colors.border} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Orb key={i} i={i} c={c} phase={phase} radius={radius} color={i % 2 ? accent2 : colors.accent} />
        ))}
      </Canvas>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.pct}>{Math.round(ratio * 100)}%</Text>
        <Text style={styles.label}>{ratio >= 1 ? 'Target reached' : label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pct: { color: '#fff', fontSize: 34, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 },
});
