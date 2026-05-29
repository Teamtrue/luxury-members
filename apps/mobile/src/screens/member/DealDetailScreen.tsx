import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TierBadge } from '../../components/TierBadge';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';
import { brand } from '../../lib/brand';

type Props = {
  navigation: NativeStackNavigationProp<MemberStackParamList, 'DealDetail'>;
  route: RouteProp<MemberStackParamList, 'DealDetail'>;
};

export function DealDetailScreen({ navigation, route }: Props) {
  const { deal } = route.params;

  const savingsPct = Math.round(deal.savings_pct);
  const clubPrice = `₹${deal.club_price.toLocaleString('en-IN')}`;
  const originalPrice = `₹${deal.original_price.toLocaleString('en-IN')}`;
  const savingsAmount = deal.original_price - deal.club_price;

  function handleBook() {
    navigation.navigate('Booking', { deal });
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Category + savings row */}
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{deal.category}</Text>
          </View>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{savingsPct}% off</Text>
          </View>
        </View>

        <Text style={styles.title}>{deal.title}</Text>

        {deal.description && (
          <Text style={styles.description}>{deal.description}</Text>
        )}

        {/* Price breakdown */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Club Price</Text>
            <Text style={styles.clubPrice}>{clubPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Market Price</Text>
            <Text style={styles.originalPrice}>{originalPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.savingLabel}>You save</Text>
            <Text style={styles.savingValue}>
              ₹{savingsAmount.toLocaleString('en-IN')} ({savingsPct}%)
            </Text>
          </View>
        </View>

        {/* Tier requirement */}
        <View style={styles.tierRow}>
          <Text style={styles.tierLabel}>Minimum tier required:</Text>
          <TierBadge tier={deal.min_tier} />
        </View>

        {deal.expires_at && (
          <Text style={styles.expiry}>
            Offer expires: {new Date(deal.expires_at).toLocaleDateString('en-IN')}
          </Text>
        )}
      </ScrollView>

      {/* Sticky Book CTA */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Club Price</Text>
          <Text style={styles.footerPriceValue}>{clubPrice}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook} activeOpacity={0.85}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  categoryBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    backgroundColor: '#1a3a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    color: '#bbbbbb',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  priceLabel: {
    color: '#999999',
    fontSize: 14,
  },
  clubPrice: {
    color: brand.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  originalPrice: {
    color: '#666666',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  savingLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  savingValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tierLabel: {
    color: '#999999',
    fontSize: 13,
  },
  expiry: {
    color: '#888888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    color: '#999999',
    fontSize: 11,
    marginBottom: 2,
  },
  footerPriceValue: {
    color: brand.primaryColor,
    fontSize: 22,
    fontWeight: '700',
  },
  bookButton: {
    backgroundColor: brand.primaryColor,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#0A0A12',
    fontSize: 15,
    fontWeight: '700',
  },
});
