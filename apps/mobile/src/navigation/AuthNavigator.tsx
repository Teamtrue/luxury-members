import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';
import { brand } from '../lib/brand';

export type AuthStackParamList = {
  SignIn: undefined;
  OTP: { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A12' },
        headerTintColor: brand.primaryColor,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0A0A12' },
      }}
    >
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{ title: 'Verify OTP' }}
      />
    </Stack.Navigator>
  );
}
