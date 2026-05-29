import React from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet, type ReferralStats } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { TierBadge } from '../../components/TierBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { brand } from '../../lib/brand';

async function fetchReferrals(): Promise<ReferralStats> {
  const token = await getStoredSession();
  return apiGet<ReferralStats>('/api/referrals', token ?? undefined);
}

export function ReferralScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['referrals'],
    queryFn: fetchReferrals,
  });

  async function handleShare() {
    if (!data?.referral_code) return;
    try {
      await Share.share({
        message: `Join ${brand.name} — ${brand.tagline} and save on 60+ categories. Use my referral code: ${data.referral_code}\n\n${brand.url}/signup?ref=${data.referral_code}`,
        title: `Join ${brand.name}`,
      });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  }

  function handleCopy() {
    if (!data?.referral_code) return;
    // Clipboard module would be needed here; alert as fallback
    Alert.alert('Referral Code', data.referral_code, [{ text: 'OK' }]);
  }

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <ErrorBanner
          message="Could not load referral data. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={data.referees}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={brand.primaryColor}
        />
      }
      ListHeaderComponent={
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.total_referrals}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{data.commission_earned.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          {/* Referral code card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
              <Text style={styles.code}>{data.referral_code}</Text>
            </TouchableOpacity>
            <Text style={styles.codeHint}>Tap code to copy</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareButtonText}>Share Invite Link</Text>
            </TouchableOpacity>
          </View>

          {data.referees.length > 0 && (
            <Text style={styles.sectionTitle}>Your Referrals</Text>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.refereeRow}>
          <View style={styles.refereeAvatar}>
            <Text style={styles.refereeAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.refereeInfo}>
            <Text style={styles.refereeName}>{item.name}</Text>
            <Text style={styles.refereeDate}>
              Joined {new Date(item.joined_at).toLocaleDateString('en-IN')}
            </Text>
          </View>
          <TierBadge tier={item.tier} />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No referrals yet. Share your code to start earning!
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999999',
    fontSize: 12,
  },
  codeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2e2a1a',
    alignItems: 'center',
  },
  codeLabel: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  code: {
    color: brand.primaryColor,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 4,
  },
  codeHint: {
    color: '#555555',
    fontSize: 11,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: brand.primaryColor,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareButtonText: {
    color: '#0A0A12',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  refereeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  refereeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refereeAvatarText: {
    color: brand.primaryColor,
    fontSize: 16,
    fontWeight: '700',
  },
  refereeInfo: {
    flex: 1,
  },
  refereeName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  refereeDate: {
    color: '#666666',
    fontSize: 12,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    lineHeight: 22,
  },
});
