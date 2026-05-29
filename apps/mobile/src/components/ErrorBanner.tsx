import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { brand } from '../lib/brand';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a1a1a',
    borderColor: '#8B0000',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 24,
    color: '#FF6B6B',
  },
  message: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: brand.primaryColor,
    borderRadius: 6,
  },
  retryText: {
    color: '#0A0A12',
    fontWeight: '700',
    fontSize: 13,
  },
});
