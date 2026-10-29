import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { Easing, interpolateColor, useDerivedValue, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { clamp } from '../engine/math';
import { useAura } from '../state/AppContext';

interface Props {
  fill: number; // 0..1 liquid level
  turbulence: number; // 0..1 (calm blue -> turbulent amber/crimson)
  size?: number;
  tone?: 'spend' | 'save';
  centerText?: string;
  subText?: string;
  spendColor?: string;
}

const wave = (size: number, level: number, amp: number, freq: number, phase: number) => {
  'worklet';
  const p = Skia.Path.Make();
  const baseY = size * (1 - level);
  p.moveTo(0, size);
  for (let x = 0; x <= size; x += 3) {
    p.lineTo(x, baseY + Math.sin((x / size) * Math.PI * 2 * freq + phase) * amp);
  }
  p.lineTo(size, size);
  p.close();
  return p;
};

export const LiquidGauge = ({ fill, turbulence, size = 128, tone = 'spend', centerText, subText, spendColor }: Props) => {
  const { colors, colorScheme } = useAura();
  const phase = useSharedValue(0);
  const level = useSharedValue(0);
  const turb = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 2600, easing: Easing.linear }), -1, false);
  }, [phase]);

  useEffect(() => {
    level.value = withSpring(clamp(fill, 0, 1), { damping: 14, stiffness: 70 });
    turb.value = withTiming(clamp(turbulence, 0, 1), { duration: 900 });
  }, [fill, turbulence, level, turb]);

  const r = size / 2 - 3;
  const clip = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(size / 2, size / 2, r);
    return p;
  }, [size, r]);

  const back = useDerivedValue(() => wave(size, level.value, 3 + turb.value * 10, 1.2 + turb.value * 0.8, phase.value + 1.6));
  const front = useDerivedValue(() => wave(size, level.value, 2 + turb.value * 14, 1.5 + turb.value * 1.4, phase.value * 1.0));
  const color = useDerivedValue(() =>
    tone === 'save' ? colors.teal : interpolateColor(turb.value, [0, 0.55, 1], [spendColor ?? colors.blue, colors.amber, colors.crimson]),
  );

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Circle cx={size / 2} cy={size / 2} r={r} color={colors.track} />
        <Group clip={clip}>
          <Path path={back} color={color} opacity={0.45} />
          <Path path={front} color={color} opacity={0.9} />
        </Group>
        <Circle cx={size / 2} cy={size / 2} r={r} style="stroke" strokeWidth={2} color={colors.border} />
      </Canvas>
      <View style={styles.center} pointerEvents="none">
        {centerText ? <Text style={[styles.big, colorScheme === 'light' && styles.bigLight]}>{centerText}</Text> : null}
        {subText ? <Text style={[styles.sub, colorScheme === 'light' && styles.subLight]}>{subText}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  big: { color: '#fff', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 6 },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 4 },
  bigLight: { textShadowColor: 'transparent', textShadowRadius: 0 },
  subLight: { textShadowColor: 'transparent', textShadowRadius: 0 },
});
