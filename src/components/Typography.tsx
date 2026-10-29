import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { font } from '../theme/theme';
import { useAura } from '../state/AppContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}
export const H1 = ({ children, style }: Props) => {
  const { colors } = useAura();
  return <Text style={[styles.h1, { color: colors.text }, style]}>{children}</Text>;
};
export const H2 = ({ children, style }: Props) => {
  const { colors } = useAura();
  return <Text style={[styles.h2, { color: colors.text }, style]}>{children}</Text>;
};
export const Body = ({ children, style, numberOfLines }: Props) => {
  const { colors } = useAura();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color: colors.text }, style]}>
      {children}
    </Text>
  );
};
export const Dim = ({ children, style, numberOfLines }: Props) => {
  const { colors } = useAura();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.dim, { color: colors.textDim }, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: { fontSize: font.h1, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: font.h3, fontWeight: '700' },
  body: { fontSize: font.body },
  dim: { fontSize: font.small },
});
