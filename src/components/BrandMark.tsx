import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Polygon, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useAura } from '../state/AppContext';

export const BrandMark = ({ size = 112 }: { size?: number }) => {
  const { colors } = useAura();
  const waterMotion = useSharedValue(0);

  useEffect(() => {
    waterMotion.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [waterMotion]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waterMotion.value * size * 0.045 }, { translateY: -waterMotion.value * size * 0.035 }],
  }));
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel="eBudget wallet mark"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.waterHalo,
          { width: size * 0.92, height: size * 0.74, borderRadius: size * 0.4, backgroundColor: `${colors.personal}16` },
          waterStyle,
        ]}
      />
      <Svg width={size * 0.76} height={size * 0.76} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id="brand-letter">
            <SvgText x="31" y="69" fontFamily="Arial" fontSize="57" fontWeight="700">e</SvgText>
          </ClipPath>
        </Defs>
        <Path
          d="M17 33 Q17 22 29 22 H69 Q82 22 82 35 V42 H75 Q69 42 69 50 V59 Q69 66 76 66 H82 V72 Q82 82 70 82 H29 Q17 82 17 70 Z"
          fill={colors.surface}
          fillOpacity={0.46}
          stroke={colors.business}
          strokeOpacity={0.96}
          strokeWidth="3"
        />
        <Path d="M69 43 H84 Q88 43 88 48 V61 Q88 66 83 66 H76 Q69 66 69 59 Z" fill={colors.surface} fillOpacity={0.72} stroke={colors.business} strokeOpacity={0.96} strokeWidth="3" />
        <SvgText x="31" y="69" fontFamily="Arial" fontSize="57" fontWeight="700" fill={colors.textDim} fillOpacity={0.1}>e</SvgText>
        <Polygon points="8,14 34,14 62,90 36,90" fill={colors.essentials} clipPath="url(#brand-letter)" />
        <Polygon points="34,14 60,14 88,90 62,90" fill={colors.personal} clipPath="url(#brand-letter)" />
        <Polygon points="60,14 86,14 114,90 88,90" fill={colors.business} clipPath="url(#brand-letter)" />
        <Path d="M21 74 Q48 70 67 75" fill="none" stroke="#FFFFFF" strokeOpacity={0.38} strokeWidth="1.5" />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.waterGlint,
          { width: size * 0.54, borderColor: `${colors.essentials}35` },
          waterStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  waterHalo: { position: 'absolute' },
  waterGlint: { position: 'absolute', top: '61%', left: '23%', height: 1, borderTopWidth: 1, transform: [{ rotate: '-8deg' }] },
});
