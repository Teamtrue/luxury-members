import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiGet, type Deal, type MemberFeedResponse } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { DealCard } from '../../components/DealCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';
import { brand } from '../../lib/brand';

type Props = {
  navigation: NativeStackNavigationProp<MemberStackParamList, 'DealsTab'>;
};

async function fetchFeed(): Promise<MemberFeedResponse> {
  const token = await getStoredSession();
  return apiGet<MemberFeedResponse>('/api/member/feed', token ?? undefined);
}

const ALL_CATEGORY = 'All';

export function DealsScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['member-feed'],
    queryFn: fetchFeed,
  });

  const categories = useMemo(() => {
    if (!data?.deals) return [ALL_CATEGORY];
    const unique = Array.from(new Set(data.deals.map((d) => d.category)));
    return [ALL_CATEGORY, ...unique];
  }, [data?.deals]);

  const filteredDeals = useMemo(() => {
    if (!data?.deals) return [];
    if (selectedCategory === ALL_CATEGORY) return data.deals;
    return data.deals.filter((d) => d.category === selectedCategory);
  }, [data?.deals, selectedCategory]);

  function handleDealPress(deal: Deal) {
    navigation.navigate('DealDetail', { dealId: deal.id, deal });
  }

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <ErrorBanner
          message="Could not load deals. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              selectedCategory === cat && styles.chipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === cat && styles.chipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredDeals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DealCard deal={item} onPress={handleDealPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={brand.primaryColor}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No deals in this category.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  chipsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  chipActive: {
    backgroundColor: brand.primaryColor,
    borderColor: brand.primaryColor,
  },
  chipText: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0A0A12',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
