import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getStoredSession } from '../lib/auth';
import AuthNavigator from './AuthNavigator';
import MemberNavigator from './MemberNavigator';

export type RootStackParamList = {
  Auth:   undefined;
  Member: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [loading,  setLoading]  = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    getStoredSession()
      .then(token => setIsAuthed(!!token))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#C5A028" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthed ? (
        <Stack.Screen name="Member" component={MemberNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
