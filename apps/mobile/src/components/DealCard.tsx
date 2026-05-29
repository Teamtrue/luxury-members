import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Deal } from '../lib/api';
import { brand } from '../lib/brand';

interface DealCardProps {
  deal: Deal;
  onPress: (deal: Deal) => void;
}

export function DealCard({ deal, onPress }: DealCardProps) {
  const savingsPct = Math.round(deal.savings_pct);
  const clubPrice = `₹${deal.club_price.toLocaleString('en-IN')}`;
  const originalPrice = `₹${deal.original_price.toLocaleString('en-IN')}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(deal)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{deal.category}</Text>
        </View>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>{savingsPct}% off</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {deal.title}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.clubPrice}>{clubPrice}</Text>
        <Text style={styles.originalPrice}>{originalPrice}</Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => onPress(deal)}
        activeOpacity={0.85}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    backgroundColor: '#1a3a1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 14,
  },
  clubPrice: {
    color: brand.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  originalPrice: {
    color: '#666666',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  bookButton: {
    backgroundColor: brand.primaryColor,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#0A0A12',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
