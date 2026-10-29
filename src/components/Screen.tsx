import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAura } from '../state/AppContext';
import { BrandMark } from './BrandMark';
import { MoreMenu } from './MoreMenu';

export const Screen = ({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) => {
  const { colors, colorScheme, profile, sessionType } = useAura();
  const insets = useSafeAreaInsets();
  const drift = useSharedValue(0);
  React.useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift]);
  const firstOrb = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 24 }, { translateY: drift.value * 18 }, { scale: 1 + drift.value * 0.06 }],
  }));
  const secondOrb = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.value * 20 }, { translateY: -drift.value * 14 }, { scale: 1.05 - drift.value * 0.05 }],
  }));
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={colorScheme === 'light' ? [colors.surfaceMuted, colors.bg, colors.surface] : [colors.bg, '#111B2B', colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orbTop, { backgroundColor: colors.accent, opacity: colorScheme === 'light' ? 0.06 : 0.12 }, firstOrb]} />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orbBottom, { backgroundColor: colors.accent, opacity: colorScheme === 'light' ? 0.04 : 0.08 }, secondOrb]} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandBlock}>
          <BrandMark size={40} />
          <View style={styles.headerCopy}>
            <Text style={[styles.welcome, { color: colors.textDim }]}>
              Welcome back to <Text style={{ color: colors.accent, fontWeight: '800' }}>eBudget</Text>
            </Text>
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
              {profile.displayName
                ? `${profile.salutation ? `${profile.salutation} ` : ''}${profile.displayName}`
                : sessionType === 'guest' ? 'Guest' : 'Your profile'}
            </Text>
          </View>
        </View>
        <MoreMenu />
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 20, paddingBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, marginRight: 12 },
  headerCopy: { flex: 1 },
  welcome: { fontSize: 13, fontWeight: '600' },
  profileName: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  orb: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  orbTop: { top: -150, right: -120 },
  orbBottom: { bottom: 80, left: -190 },
});
