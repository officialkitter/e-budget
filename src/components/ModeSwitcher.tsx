import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ModeId } from '../engine/types';
import { modeThemes } from '../theme/theme';
import { useAura } from '../state/AppContext';

const ORDER: ModeId[] = ['seed', 'growth', 'vanguard'];

export const ModeSwitcher = () => {
  const { mode, setMode, theme, colors } = useAura();
  const [w, setW] = useState(0);
  const x = useSharedValue(ORDER.indexOf(mode));
  const segW = w / 3;

  React.useEffect(() => {
    x.value = withSpring(ORDER.indexOf(mode), { damping: 15, stiffness: 160 });
  }, [mode, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * segW }] }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 8);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]} onLayout={onLayout}>
      {w > 0 && <Animated.View style={[styles.indicator, { width: segW, backgroundColor: theme.accent }, indicator]} />}
      {ORDER.map((id) => {
        const t = modeThemes[id];
        const active = id === mode;
        return (
          <Pressable
            key={id}
            style={styles.item}
            onPress={() => {
              if (!active) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setMode(id);
              }
            }}
          >
            <Ionicons name={t.icon as React.ComponentProps<typeof Ionicons>['name']} size={16} color={active ? '#FFFFFF' : colors.textDim} />
            <Text style={[styles.label, { color: active ? '#FFFFFF' : colors.textDim }]}>{t.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 4, borderRadius: 14, borderWidth: 1, marginTop: 14, marginBottom: 18 },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 999 },
  item: { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
});
