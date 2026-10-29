import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAura } from '../state/AppContext';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  color: string;
  editableValue?: {
    value: string;
    onChangeText: (value: string) => void;
    onBlur: () => void;
    keyboardType?: 'numeric' | 'decimal-pad';
  };
}

const THUMB = 28;

export const HapticSlider = ({ label, value, min, max, step, onChange, format, color, editableValue }: Props) => {
  const { colors } = useAura();
  const width = useSharedValue(1);
  const pos = useSharedValue((value - min) / Math.max(1e-9, max - min));
  const scale = useSharedValue(1);
  const dragging = useSharedValue(false);
  const lastStep = useSharedValue(Math.round((value - min) / step));
  const steps = Math.max(1, Math.round((max - min) / step));

  useEffect(() => {
    if (!dragging.value) pos.value = withSpring((value - min) / Math.max(1e-9, max - min), { damping: 18, stiffness: 180 });
    lastStep.value = Math.round((value - min) / step);
  }, [value, min, max, step, dragging, pos, lastStep]);

  const emit = useCallback(
    (s: number) => {
      onChange(Number((min + s * step).toFixed(6)));
      Haptics.selectionAsync();
    },
    [onChange, min, step],
  );
  const release = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handle = (x: number) => {
    'worklet';
    const track = Math.max(1, width.value - THUMB);
    const p = Math.min(1, Math.max(0, (x - THUMB / 2) / track));
    const s = Math.round(p * steps);
    pos.value = withTiming(s / steps, { duration: 60 });
    if (s !== lastStep.value) {
      lastStep.value = s;
      runOnJS(emit)(s);
    }
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      dragging.value = true;
      scale.value = withSpring(1.3);
      handle(e.x);
    })
    .onUpdate((e) => handle(e.x))
    .onFinalize(() => {
      dragging.value = false;
      scale.value = withSpring(1);
      runOnJS(release)();
    });

  const fillStyle = useAnimatedStyle(() => ({ width: pos.value * Math.max(1, width.value - THUMB) + THUMB / 2 }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * Math.max(1, width.value - THUMB) }, { scale: scale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textDim }]}>{label}</Text>
        {editableValue ? (
          <TextInput
            accessibilityLabel={`${label} value`}
            value={editableValue.value}
            onChangeText={editableValue.onChangeText}
            onBlur={editableValue.onBlur}
            keyboardType={editableValue.keyboardType ?? 'numeric'}
            selectTextOnFocus
            style={[styles.valueInput, { color, borderColor: `${color}55`, backgroundColor: colors.surface }]}
          />
        ) : (
          <Text style={[styles.value, { color }]}>{format ? format(value) : String(value)}</Text>
        )}
      </View>
      <GestureDetector gesture={pan}>
        <View style={styles.hit} onLayout={(e: LayoutChangeEvent) => (width.value = e.nativeEvent.layout.width)}>
          <View style={[styles.track, { backgroundColor: colors.track }]} />
          <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
          <Animated.View style={[styles.thumb, { backgroundColor: color, shadowColor: color, borderColor: colors.surface }, thumbStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '800' },
  valueInput: { minWidth: 82, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderRadius: 9, textAlign: 'right', fontSize: 14, fontWeight: '800' },
  hit: { height: 44, justifyContent: 'center' },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: 6, borderRadius: 3 },
  fill: { position: 'absolute', left: THUMB / 2, height: 6, borderRadius: 3, opacity: 0.85 },
  thumb: { position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: THUMB / 2, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3, borderWidth: 3 },
});
