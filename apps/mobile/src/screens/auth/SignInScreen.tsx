import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiPost, type OTPSendResponse } from '../../lib/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { brand } from '../../lib/brand';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
};

export function SignInScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /^\d{10}$/.test(phone);

  async function handleSendOTP() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost<OTPSendResponse>('/api/auth/send-otp', { phone });
      navigation.navigate('OTP', { phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>{brand.name}</Text>
        <Text style={styles.tagline}>{brand.tagline}</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Enter your mobile number to sign in</Text>

          <View style={styles.inputRow}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#555555"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    color: brand.primaryColor,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tagline: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  heading: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subheading: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  prefixBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  prefixText: {
    color: brand.primaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: brand.primaryColor,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#0A0A12',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
