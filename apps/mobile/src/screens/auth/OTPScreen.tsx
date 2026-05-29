import React, { useRef, useState } from 'react';
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
import type { RouteProp } from '@react-navigation/native';
import { apiPost, type OTPVerifyResponse } from '../../lib/api';
import { saveSession, saveStoredMember } from '../../lib/auth';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { brand } from '../../lib/brand';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
  route: RouteProp<AuthStackParamList, 'OTP'>;
};

export function OTPScreen({ route }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const isValid = otp.length === 6;

  async function handleVerify() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<OTPVerifyResponse>('/api/auth/verify-otp', { phone, otp });
      if (res.token) {
        await saveSession(res.token);
        if (res.member) {
          await saveStoredMember(res.member);
        }
        // Navigation handled by RootNavigator listening to auth state change
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
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

        <View style={styles.card}>
          <Text style={styles.heading}>Enter OTP</Text>
          <Text style={styles.subheading}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneHighlight}>+91 {phone}</Text>
          </Text>

          <TouchableOpacity
            style={styles.otpContainer}
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  otp.length === i && styles.otpBoxActive,
                  otp.length > i && styles.otpBoxFilled,
                ]}
              >
                <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Hidden input to capture keyboard */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            autoFocus
            caretHidden
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.devHint}>Dev: use OTP 123456</Text>

          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 8,
  },
  subheading: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 22,
  },
  phoneHighlight: {
    color: brand.primaryColor,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 44,
    height: 52,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: brand.primaryColor,
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: brand.primaryColor,
    backgroundColor: '#1f1a0a',
  },
  otpDigit: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  devHint: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: brand.primaryColor,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#0A0A12',
    fontSize: 16,
    fontWeight: '700',
  },
});
