import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryRow } from '../engine/selectors';
import { clamp } from '../engine/math';
import { fmtMoney } from '../utils/format';
import { useAura } from '../state/AppContext';
import { categoryColor } from '../theme/theme';
import { LiquidGauge } from './LiquidGauge';

export const GaugeTile = ({ row, size = 124, categoryIndex }: { row: CategoryRow; size?: number; categoryIndex?: number }) => {
  const { colors, colorScheme } = useAura();
  const tint = categoryColor(row.category.id, colorScheme, categoryIndex);
  const saving = row.category.bucket === 'saving';
  const remaining = clamp(1 - row.used, 0, 1);
  const fill = saving ? clamp(row.used, 0, 1) : Math.max(0.04, remaining);
  const turbulence = saving ? 0 : clamp((row.used - 0.5) / 0.6, 0, 1);
  return (
    <View style={styles.tile}>
      <Ionicons name={row.category.icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={saving ? colors.teal : tint} style={styles.icon} />
      <LiquidGauge
        fill={fill}
        turbulence={turbulence}
        size={size}
        tone={saving ? 'save' : 'spend'}
        spendColor={tint}
        centerText={saving ? `${Math.round(row.used * 100)}%` : `${Math.round(remaining * 100)}%`}
        subText={saving ? 'of goal' : row.used > 1 ? 'over!' : 'left'}
      />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {row.category.name}
      </Text>
      <Text style={[styles.amount, { color: colors.textDim }]}>
        {fmtMoney(row.actual, { compact: true })} / {fmtMoney(row.budget, { compact: true })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: { alignItems: 'center', marginRight: 18, width: 132 },
  icon: { marginBottom: 6 },
  name: { fontWeight: '700', marginTop: 8, fontSize: 13 },
  amount: { fontSize: 11, marginTop: 2 },
});
