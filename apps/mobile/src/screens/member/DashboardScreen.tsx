import React from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { apiGet, type Deal, type MemberFeedResponse } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { DealCard } from '../../components/DealCard';
import { TierBadge } from '../../components/TierBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import type { MemberTabParamList } from '../../navigation/MemberNavigator';
import { brand } from '../../lib/brand';

type Props = {
  navigation: BottomTabNavigationProp<MemberTabParamList, 'Dashboard'>;
};

async function fetchFeed(): Promise<MemberFeedResponse> {
  const token = await getStoredSession();
  return apiGet<MemberFeedResponse>('/api/member/feed', token ?? undefined);
}

export function DashboardScreen({ navigation }: Props) {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['member-feed'],
    queryFn: fetchFeed,
  });

  function handleDealPress(deal: Deal) {
    navigation.navigate('Deals');
  }

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <ErrorBanner
          message="Could not load your dashboard. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const { member, deals } = data;
  const recentDeals = deals.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={brand.primaryColor}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.memberName}>{member.name}</Text>
        </View>
        <TierBadge tier={member.tier} />
      </View>

      {/* Token Balance Card */}
      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>{brand.tokenName} Balance</Text>
        <Text style={styles.tokenBalance}>
          {member.token_balance.toLocaleString('en-IN')} PCT
        </Text>
        <Text style={styles.tokenValue}>
          ≈ ₹{(member.token_balance * 0.5).toLocaleString('en-IN')} value
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{member.active_bookings_count}</Text>
          <Text style={styles.statLabel}>Active Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ₹{member.savings_this_month.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statLabel}>Saved This Month</Text>
        </View>
      </View>

      {/* Recent Deals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Deals</Text>
        {recentDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onPress={handleDealPress} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 2,
  },
  memberName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  tokenCard: {
    backgroundColor: '#C5A028',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  tokenLabel: {
    color: '#1a1a00',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    opacity: 0.7,
  },
  tokenBalance: {
    color: '#1a1a00',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  tokenValue: {
    color: '#1a1a00',
    fontSize: 14,
    opacity: 0.75,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statValue: {
    color: brand.primaryColor,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999999',
    fontSize: 12,
  },
  section: {
    gap: 0,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
});
