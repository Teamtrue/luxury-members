/**
 * BookingScreen — confirm deal details, enter delivery address, optionally
 * redeem PC Tokens, then pay via Razorpay.
 *
 * Flow:
 *  1. User fills delivery address (required) and optional token amount.
 *  2. POST /api/bookings  → creates pending booking, returns booking.id
 *  3. POST /api/payments/create-order { booking_id } → Razorpay order
 *  4. RazorpayCheckout.open(options) → payment result from Razorpay SDK
 *  5. POST /api/payments/verify → confirms & credits tokens
 *  6. Show success with booking_ref and tokens earned.
 *
 * Requires EAS build (react-native-razorpay uses native modules).
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiPost, type BookingCreateResponse, type PaymentOrderResponse, type PaymentVerifyResponse } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { brand } from '../../lib/brand';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';

type Props = {
  navigation: NativeStackNavigationProp<MemberStackParamList, 'Booking'>;
  route: RouteProp<MemberStackParamList, 'Booking'>;
};

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

type Step = 'form' | 'processing' | 'success' | 'error';

interface SuccessData {
  bookingRef: string;
  tokensEarned: number;
  amountPaid: number;
}

export function BookingScreen({ navigation, route }: Props) {
  const { deal } = route.params;

  const [address, setAddress]       = useState('');
  const [tokensInput, setTokensInput] = useState('');
  const [step, setStep]             = useState<Step>('form');
  const [errorMsg, setErrorMsg]     = useState('');
  const [success, setSuccess]       = useState<SuccessData | null>(null);

  const clubPrice = `₹${deal.club_price.toLocaleString('en-IN')}`;

  async function handlePay() {
    const addressTrimmed = address.trim();
    if (addressTrimmed.length < 10) {
      Alert.alert('Address required', 'Please enter a complete delivery address (at least 10 characters).');
      return;
    }

    const tokensUsed = Math.max(0, parseInt(tokensInput || '0', 10) || 0);

    setStep('processing');
    setErrorMsg('');

    try {
      const token = await getStoredSession();
      if (!token) throw new Error('Session expired. Please sign in again.');

      // Step 1: Create booking
      const bookingRes = await apiPost<BookingCreateResponse>(
        '/api/bookings',
        { deal_id: deal.id, delivery_address: addressTrimmed, tokens_used: tokensUsed },
        token
      );
      if (!bookingRes.success || !bookingRes.data?.booking) {
        throw new Error('Could not create booking. Please try again.');
      }
      const { id: bookingId, total_paise } = bookingRes.data.booking;

      // Step 2: Create Razorpay order
      const orderRes = await apiPost<PaymentOrderResponse>(
        '/api/payments/create-order',
        { booking_id: bookingId },
        token
      );
      if (!orderRes.success || !orderRes.data) {
        throw new Error('Could not initialise payment. Please try again.');
      }
      const { order_id, amount } = orderRes.data;

      // Step 3: Launch Razorpay checkout
      const paymentData = await RazorpayCheckout.open({
        description:  deal.title,
        currency:     'INR',
        key:          RAZORPAY_KEY,
        amount:       String(amount),
        order_id,
        name:         brand.name,
        prefill:      { contact: '', email: '' },
        theme:        { color: brand.primaryColor },
      });

      // Step 4: Verify with server
      const verifyRes = await apiPost<PaymentVerifyResponse>(
        '/api/payments/verify',
        {
          razorpay_order_id:   paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature:  paymentData.razorpay_signature,
        },
        token
      );

      if (!verifyRes.success) {
        throw new Error('Payment verification failed. Contact support if your account was debited.');
      }

      setSuccess({
        bookingRef:   verifyRes.data?.booking_ref ?? bookingRes.data.booking.booking_ref,
        tokensEarned: verifyRes.data?.tokens_earned ?? 0,
        amountPaid:   amount,
      });
      setStep('success');

    } catch (err: unknown) {
      // Razorpay checkout cancelled by user — go back to form silently
      const razorErr = err as { code?: number };
      if (razorErr?.code === 0) {
        setStep('form');
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStep('error');
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (step === 'success' && success) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successRef}>Ref: {success.bookingRef}</Text>
        <Text style={styles.successSub}>
          ₹{(success.amountPaid / 100).toLocaleString('en-IN')} paid
        </Text>
        {success.tokensEarned > 0 && (
          <View style={styles.tokensBadge}>
            <Text style={styles.tokensBadgeText}>
              +{success.tokensEarned} {brand.tokenSymbol} earned
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('Tabs')}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────────────

  if (step === 'error') {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorIcon}>✕</Text>
        <Text style={styles.errorTitle}>Payment Failed</Text>
        <Text style={styles.errorMsg}>{errorMsg}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setStep('form')}
          activeOpacity={0.85}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Processing screen ───────────────────────────────────────────────────────

  if (step === 'processing') {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={brand.primaryColor} />
        <Text style={styles.processingText}>Processing payment…</Text>
        <Text style={styles.processingSubText}>Do not close the app</Text>
      </View>
    );
  }

  // ── Booking form ────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You are booking</Text>
          <Text style={styles.summaryTitle}>{deal.title}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryMeta}>{deal.category}</Text>
            <Text style={styles.summaryPrice}>{clubPrice}</Text>
          </View>
        </View>

        {/* Delivery address */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Delivery Address *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter your full delivery address including city and PIN code"
            placeholderTextColor="#555555"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Token redemption */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Redeem {brand.tokenName}s (optional)</Text>
          <Text style={styles.sectionHint}>
            1 {brand.tokenSymbol} = ₹0.50 · Max 30% of order value for Platinum
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#555555"
            value={tokensInput}
            onChangeText={setTokensInput}
            keyboardType="number-pad"
          />
        </View>
      </ScrollView>

      {/* Sticky pay button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Club Price</Text>
          <Text style={styles.footerPrice}>{clubPrice}</Text>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePay}
          activeOpacity={0.85}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMeta: {
    color: '#888888',
    fontSize: 13,
  },
  summaryPrice: {
    color: brand.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#cccccc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionHint: {
    color: '#666666',
    fontSize: 11,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
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
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    color: '#777777',
    fontSize: 11,
    marginBottom: 2,
  },
  footerPrice: {
    color: brand.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  payButton: {
    backgroundColor: brand.primaryColor,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  payButtonText: {
    color: '#0A0A12',
    fontSize: 15,
    fontWeight: '700',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#0A0A12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: brand.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successCheck: {
    color: brand.primaryColor,
    fontSize: 32,
    fontWeight: '700',
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successRef: {
    color: brand.primaryColor,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  successSub: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 16,
  },
  tokensBadge: {
    backgroundColor: '#1a2e1a',
    borderWidth: 1,
    borderColor: '#2a5a2a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 32,
  },
  tokensBadgeText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: brand.primaryColor,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  doneButtonText: {
    color: '#0A0A12',
    fontSize: 15,
    fontWeight: '700',
  },
  errorIcon: {
    color: '#FF6B6B',
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  errorMsg: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: brand.primaryColor,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: brand.primaryColor,
    fontSize: 15,
    fontWeight: '700',
  },
  processingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  processingSubText: {
    color: '#666666',
    fontSize: 13,
  },
});
