import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Tier } from '../lib/api';
import { brand } from '../lib/brand';

interface TierBadgeProps {
  tier: Tier;
}

const TIER_COLORS: Record<Tier, { bg: string; text: string }> = {
  Silver:   { bg: '#C0C0C0', text: '#1a1a1a' },
  Gold:     { bg: brand.primaryColor, text: '#1a1a1a' },
  Platinum: { bg: '#E5E4E2', text: '#1a1a1a' },
  Obsidian: { bg: '#3D2B6B', text: '#ffffff' },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const colors = TIER_COLORS[tier];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
