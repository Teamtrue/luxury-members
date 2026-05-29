import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet, type TokensResponse, type TokenTransaction } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { brand } from '../../lib/brand';

async function fetchTokens(): Promise<TokensResponse> {
  const token = await getStoredSession();
  return apiGet<TokensResponse>('/api/tokens', token ?? undefined);
}

function TransactionItem({ tx }: { tx: TokenTransaction }) {
  const isCredit = tx.type === 'credit';
  const sign = isCredit ? '+' : '-';
  const date = new Date(tx.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, isCredit ? styles.txIconCredit : styles.txIconDebit]}>
        <Text style={styles.txIconText}>{isCredit ? '↑' : '↓'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>
      <Text style={[styles.txAmount, isCredit ? styles.txCredit : styles.txDebit]}>
        {sign}{tx.amount} PCT
      </Text>
    </View>
  );
}

export function WalletScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <ErrorBanner
          message="Could not load wallet. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const inrValue = (data.balance * 0.5).toLocaleString('en-IN');

  return (
    <FlatList
      style={styles.container}
      data={data.transactions}
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
          {/* Balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{brand.tokenName} Balance</Text>
            <Text style={styles.balanceAmount}>
              {data.balance.toLocaleString('en-IN')} PCT
            </Text>
            <Text style={styles.balanceInr}>≈ ₹{inrValue} cash value</Text>
            <Text style={styles.rateNote}>1 PCT = ₹0.50 | Expires in 12 months</Text>
          </View>

          {/* Redemption info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to redeem</Text>
            <Text style={styles.infoText}>
              Use {brand.tokenName}s at checkout to reduce your booking cost. Up to 50% of any
              booking can be paid with tokens.
            </Text>
          </View>

          <Text style={styles.historyHeading}>Transaction History</Text>
        </>
      }
      renderItem={({ item }) => <TransactionItem tx={item} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No transactions yet.</Text>
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
  balanceCard: {
    backgroundColor: '#C5A028',
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#1a1a00',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.7,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#1a1a00',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  balanceInr: {
    color: '#1a1a00',
    fontSize: 16,
    opacity: 0.85,
    marginBottom: 8,
  },
  rateNote: {
    color: '#1a1a00',
    fontSize: 12,
    opacity: 0.6,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoTitle: {
    color: brand.primaryColor,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 20,
  },
  historyHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconCredit: {
    backgroundColor: '#1a3a1a',
  },
  txIconDebit: {
    backgroundColor: '#3a1a1a',
  },
  txIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  txDate: {
    color: '#666666',
    fontSize: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txCredit: {
    color: '#4CAF50',
  },
  txDebit: {
    color: '#FF6B6B',
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
