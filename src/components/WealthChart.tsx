import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAura } from '../state/AppContext';

export interface ChartSeries {
  key: string;
  label: string;
  color: string; // 6-digit hex
  values: number[];
  area?: boolean;
}

interface Props {
  series: ChartSeries[];
  xLabels: string[];
  height?: number;
  format: (n: number) => string;
  animateKey?: string;
}

const PAD = { l: 10, r: 10, t: 16, b: 14 };
const TOOLTIP_W = 150;

export const WealthChart = ({ series, xLabels, height = 220, format, animateKey }: Props) => {
  const { colors } = useAura();
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const progress = useSharedValue(0);
  const touchX = useSharedValue(0);
  const lineOpacity = useSharedValue(0);
  const lastIdx = useSharedValue(-1);

  const n = xLabels.length;
  const innerW = Math.max(1, w - PAD.l - PAD.r);
  const stepW = innerW / Math.max(1, n - 1);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
  }, [animateKey, progress]);

  const { maxV, minV } = useMemo(() => {
    const all = series.flatMap((s) => s.values);
    return { maxV: Math.max(1, ...all) * 1.08, minV: Math.min(0, ...all) };
  }, [series]);

  const xAt = (i: number) => PAD.l + i * stepW;
  const yAt = (v: number) => PAD.t + (1 - (v - minV) / (maxV - minV)) * (height - PAD.t - PAD.b);

  const paths = useMemo(() => {
    if (w === 0) return [];
    return series.map((s) => {
      const line = Skia.Path.Make();
      const pts = s.values.map((v, i) => ({ x: PAD.l + i * stepW, y: PAD.t + (1 - (v - minV) / (maxV - minV)) * (height - PAD.t - PAD.b) }));
      line.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const cx = (pts[i].x + pts[i + 1].x) / 2;
        line.cubicTo(cx, pts[i].y, cx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
      }
      let area = null as ReturnType<typeof Skia.Path.Make> | null;
      if (s.area) {
        area = line.copy();
        area.lineTo(pts[pts.length - 1].x, height - PAD.b);
        area.lineTo(pts[0].x, height - PAD.b);
        area.close();
      }
      return { key: s.key, color: s.color, line, area };
    });
  }, [series, w, stepW, minV, maxV, height]);

  const tick = () => Haptics.selectionAsync();

  const handle = (x: number) => {
    'worklet';
    const idx = Math.min(n - 1, Math.max(0, Math.round((x - PAD.l) / stepW)));
    touchX.value = withTiming(PAD.l + idx * stepW, { duration: 70 });
    lineOpacity.value = withTiming(1, { duration: 120 });
    if (idx !== lastIdx.value) {
      lastIdx.value = idx;
      runOnJS(setActive)(idx);
      runOnJS(tick)();
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin((e) => handle(e.x))
    .onUpdate((e) => handle(e.x))
    .onFinalize(() => {
      lineOpacity.value = withTiming(0, { duration: 250 });
      lastIdx.value = -1;
      runOnJS(setActive)(null);
    });

  const p1 = useDerivedValue(() => vec(touchX.value, PAD.t));
  const p2 = useDerivedValue(() => vec(touchX.value, height - PAD.b));

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => PAD.t + f * (height - PAD.t - PAD.b));
  const tipLeft = active === null ? 0 : Math.min(Math.max(xAt(active) - TOOLTIP_W / 2, 0), Math.max(0, w - TOOLTIP_W));

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
          {w > 0 && (
            <Canvas style={{ width: w, height }}>
              {gridYs.map((y, i) => (
                <Line key={i} p1={vec(PAD.l, y)} p2={vec(w - PAD.r, y)} color={colors.grid} strokeWidth={1} />
              ))}
              {paths.map((p) =>
                p.area ? (
                  <Path key={p.key + '-a'} path={p.area} style="fill" opacity={progress}>
                    <LinearGradient start={vec(0, PAD.t)} end={vec(0, height - PAD.b)} colors={[p.color + '55', p.color + '00']} />
                  </Path>
                ) : null,
              )}
              {paths.map((p) => (
                <Path key={p.key} path={p.line} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" color={p.color} start={0} end={progress} />
              ))}
              <Group opacity={lineOpacity}>
                <Line p1={p1} p2={p2} color={colors.textDim} strokeWidth={1} />
              </Group>
              {active !== null &&
                series.map((s) => (
                  <Group key={s.key + '-dot'}>
                    <Circle cx={xAt(active)} cy={yAt(s.values[active])} r={8} color={s.color + '44'} />
                    <Circle cx={xAt(active)} cy={yAt(s.values[active])} r={4} color={s.color} />
                  </Group>
                ))}
            </Canvas>
          )}
          {active !== null && (
            <View pointerEvents="none" style={[styles.tip, { left: tipLeft, width: TOOLTIP_W, backgroundColor: colors.overlay, borderColor: colors.border }]}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>{xLabels[active]}</Text>
              {series.map((s) => (
                <View key={s.key} style={styles.tipRow}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={[styles.tipLabel, { color: colors.textDim }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Text style={[styles.tipValue, { color: colors.text }]}>{format(s.values[active])}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </GestureDetector>
      <View style={styles.legend}>
        {series.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: colors.textDim }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.hint, { color: colors.textDim }]}>Drag across the chart to inspect values</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tip: { position: 'absolute', top: 0, borderRadius: 12, borderWidth: 1, padding: 8 },
  tipTitle: { fontWeight: '800', fontSize: 12, marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  tipLabel: { fontSize: 10, flex: 1, marginLeft: 6 },
  tipValue: { fontSize: 11, fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginTop: 4 },
  legendText: { fontSize: 11, marginLeft: 6 },
  hint: { fontSize: 10, marginTop: 6 },
});
