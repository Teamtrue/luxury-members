import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { brand } from '../../lib/brand';

interface Booking {
  id: string;
  booking_ref: string;
  status: string;
  deal_title: string;
  total_paise: number;
  tokens_earned: number;
  created_at: string;
}

interface BookingsResponse {
  success: boolean;
  data?: { bookings: Booking[]; total: number };
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:       '#4CAF50',
  pending_payment: '#FFA726',
  pending:         '#FFA726',
  cancelled:       '#EF5350',
  delivered:       '#26C6DA',
};

async function fetchBookings(): Promise<Booking[]> {
  const token = await getStoredSession();
  const res = await apiGet<BookingsResponse>('/api/bookings?limit=50', token ?? undefined);
  return res.data?.bookings ?? [];
}

export function BookingHistoryScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.container}>
        <ErrorBanner message="Could not load bookings." onRetry={() => refetch()} />
      </View>
    );
  }

  const bookings = data ?? [];

  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No bookings yet</Text>
        <Text style={styles.emptySub}>Your confirmed bookings will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={bookings}
      keyExtractor={(b) => b.id}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={brand.primaryColor} />
      }
      renderItem={({ item: b }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.ref}>{b.booking_ref}</Text>
            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[b.status] ?? '#888') + '22' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[b.status] ?? '#888' }]}>
                {b.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.dealTitle} numberOfLines={2}>{b.deal_title}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.amount}>
              ₹{(b.total_paise / 100).toLocaleString('en-IN')}
            </Text>
            {b.tokens_earned > 0 && (
              <Text style={styles.tokens}>+{b.tokens_earned} {brand.tokenSymbol}</Text>
            )}
            <Text style={styles.date}>
              {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A0A12' },
  content:        { padding: 16, gap: 10 },
  emptyContainer: { flex: 1, backgroundColor: '#0A0A12', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub:       { color: '#888888', fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ref:         { color: brand.primaryColor, fontSize: 13, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:  { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  dealTitle:   { color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 12, lineHeight: 20 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount:      { color: '#ffffff', fontSize: 15, fontWeight: '700', flex: 1 },
  tokens:      { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
  date:        { color: '#666666', fontSize: 12 },
});
