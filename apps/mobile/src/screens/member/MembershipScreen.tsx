import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiPost, type PaymentOrderResponse, type PaymentVerifyResponse } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { brand } from '../../lib/brand';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';

type Props = {
  navigation: NativeStackNavigationProp<MemberStackParamList, 'Membership'>;
  route: RouteProp<MemberStackParamList, 'Membership'>;
};

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

interface Plan {
  key: string;
  label: string;
  price: number;       // INR per year
  priceDisplay: string;
  features: string[];
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'silver', label: 'Silver', price: 4999, priceDisplay: '₹4,999/yr',
    highlight: false,
    features: ['Access to 30+ deal categories', 'Earn PC Tokens on every booking', '1 referral slot', 'Email support'],
  },
  {
    key: 'gold', label: 'Gold', price: 9999, priceDisplay: '₹9,999/yr',
    highlight: false,
    features: ['Everything in Silver', 'Priority deal access', '3 referral slots', 'Priority support'],
  },
  {
    key: 'platinum', label: 'Platinum', price: 24999, priceDisplay: '₹24,999/yr',
    highlight: true,
    features: ['Everything in Gold', 'Personal Concierge service', '10 referral slots', '1.5× token earning', 'Dedicated account manager'],
  },
  {
    key: 'obsidian', label: 'Obsidian', price: 99999, priceDisplay: '₹99,999/yr',
    highlight: false,
    features: ['Everything in Platinum', 'Unlimited referrals', '2× token earning', 'White-glove sourcing', 'Invite-only events'],
  },
];

export function MembershipScreen({ route }: Props) {
  const currentTier = route.params.currentTier?.toLowerCase() ?? 'silver';
  const [purchasing, setPurchasing] = useState<string | null>(null);

  async function handleUpgrade(plan: Plan) {
    if (plan.key === currentTier) return;

    Alert.alert(
      `Upgrade to ${plan.label}`,
      `${plan.priceDisplay} — charged now. Your membership activates immediately after payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Payment', style: 'default',
          onPress: () => processPurchase(plan),
        },
      ]
    );
  }

  async function processPurchase(plan: Plan) {
    setPurchasing(plan.key);
    try {
      const token = await getStoredSession();
      if (!token) throw new Error('Session expired. Please sign in again.');

      const orderRes = await apiPost<PaymentOrderResponse>(
        '/api/payments/create-order',
        { membership_tier: plan.key },
        token
      );
      if (!orderRes.success || !orderRes.data) throw new Error('Could not create payment order.');
      const { order_id, amount } = orderRes.data;

      const paymentData = await RazorpayCheckout.open({
        description:  `${brand.name} ${plan.label} Membership`,
        currency:     'INR',
        key:          RAZORPAY_KEY,
        amount:       String(amount),
        order_id,
        name:         brand.name,
        prefill:      { contact: '', email: '' },
        theme:        { color: brand.primaryColor },
      });

      const verifyRes = await apiPost<PaymentVerifyResponse>(
        '/api/payments/verify',
        {
          razorpay_order_id:   paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature:  paymentData.razorpay_signature,
        },
        token
      );

      if (!verifyRes.success) throw new Error('Payment verification failed.');

      Alert.alert(
        'Welcome to ' + plan.label + '!',
        `Your ${plan.label} membership is now active. Enjoy your upgraded benefits.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (err: unknown) {
      const razorErr = err as { code?: number };
      if (razorErr?.code === 0) return; // user cancelled
      Alert.alert('Payment Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setPurchasing(null);
    }
  }

  const currentPlanIndex = PLANS.findIndex(p => p.key === currentTier);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Membership Plans</Text>
      <Text style={styles.sub}>Upgrade to unlock more deals, higher token earnings, and concierge access.</Text>

      {PLANS.map((plan, i) => {
        const isCurrent = plan.key === currentTier;
        const isDowngrade = i < currentPlanIndex;
        const isLoading = purchasing === plan.key;

        return (
          <View key={plan.key} style={[styles.card, plan.highlight && styles.cardHighlight]}>
            {plan.highlight && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{plan.label}</Text>
              <Text style={styles.planPrice}>{plan.priceDisplay}</Text>
            </View>
            <View style={styles.features}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.btn,
                isCurrent && styles.btnCurrent,
                isDowngrade && styles.btnDisabled,
                plan.highlight && !isCurrent && !isDowngrade && styles.btnHighlight,
              ]}
              onPress={() => !isCurrent && !isDowngrade && handleUpgrade(plan)}
              disabled={isCurrent || isDowngrade || isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color={plan.highlight ? '#0A0A12' : brand.primaryColor} />
                : <Text style={[
                    styles.btnText,
                    isCurrent && styles.btnTextCurrent,
                    plan.highlight && !isCurrent && !isDowngrade && styles.btnTextHighlight,
                  ]}>
                    {isCurrent ? 'Current Plan' : isDowngrade ? 'Lower Tier' : `Upgrade to ${plan.label}`}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A0A12' },
  content:        { padding: 20, paddingBottom: 48 },
  heading:        { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sub:            { color: '#888888', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 16,
  },
  cardHighlight:  { borderColor: brand.primaryColor, borderWidth: 1.5 },
  popularBadge:   { alignSelf: 'flex-start', backgroundColor: brand.primaryColor, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 },
  popularText:    { color: '#0A0A12', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  planName:       { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  planPrice:      { color: brand.primaryColor, fontSize: 16, fontWeight: '700' },
  features:       { gap: 8, marginBottom: 20 },
  featureRow:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureCheck:   { color: '#4CAF50', fontSize: 13, fontWeight: '700', marginTop: 1 },
  featureText:    { color: '#cccccc', fontSize: 13, flex: 1, lineHeight: 20 },
  btn:            { borderWidth: 1, borderColor: '#2a2a2a', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnHighlight:   { backgroundColor: brand.primaryColor, borderColor: brand.primaryColor },
  btnCurrent:     { borderColor: '#3a3a3a', backgroundColor: '#111' },
  btnDisabled:    { opacity: 0.3 },
  btnText:        { color: brand.primaryColor, fontSize: 14, fontWeight: '700' },
  btnTextHighlight:{ color: '#0A0A12' },
  btnTextCurrent: { color: '#555555' },
});
