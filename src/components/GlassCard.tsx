import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAura } from '../state/AppContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  glow?: string;
}

export const GlassCard = ({ children, style, delay = 0, glow }: Props) => {
  const { theme, colors } = useAura();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(16)}
      style={[
        styles.wrap,
        {
          borderRadius: theme.radius,
          borderColor: glow ?? colors.border,
          shadowColor: glow ?? '#000000',
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderWidth: 1, marginBottom: 16, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  inner: { padding: 16 },
});
