import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { Deal } from '../lib/api';
import { brand } from '../lib/brand';

import { DashboardScreen } from '../screens/member/DashboardScreen';
import { DealsScreen } from '../screens/member/DealsScreen';
import { DealDetailScreen } from '../screens/member/DealDetailScreen';
import { BookingScreen } from '../screens/member/BookingScreen';
import { BookingHistoryScreen } from '../screens/member/BookingHistoryScreen';
import { ConciergeScreen } from '../screens/member/ConciergeScreen';
import { MembershipScreen } from '../screens/member/MembershipScreen';
import { WalletScreen } from '../screens/member/WalletScreen';
import { ReferralScreen } from '../screens/member/ReferralScreen';
import { SettingsScreen } from '../screens/member/SettingsScreen';

export type MemberTabParamList = {
  Dashboard: undefined;
  Deals:     undefined;
  Wallet:    undefined;
  Referral:  undefined;
  Settings:  undefined;
};

export type MemberStackParamList = {
  Tabs:           undefined;
  DealDetail:     { dealId: string; deal: Deal };
  Booking:        { deal: Deal };
  BookingHistory: undefined;
  Concierge:      undefined;
  Membership:     { currentTier: string };
  DealsTab:       undefined;
};

const Tab   = createBottomTabNavigator<MemberTabParamList>();
const Stack = createNativeStackNavigator<MemberStackParamList>();

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function getTabIcon(routeName: keyof MemberTabParamList, focused: boolean): TabIconName {
  const icons: Record<keyof MemberTabParamList, [TabIconName, TabIconName]> = {
    Dashboard: ['home',     'home-outline'],
    Deals:     ['pricetag', 'pricetag-outline'],
    Wallet:    ['wallet',   'wallet-outline'],
    Referral:  ['people',   'people-outline'],
    Settings:  ['settings', 'settings-outline'],
  };
  const [active, inactive] = icons[routeName];
  return focused ? active : inactive;
}

function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name as keyof MemberTabParamList, focused)} size={size} color={color} />
        ),
        tabBarActiveTintColor:   brand.primaryColor,
        tabBarInactiveTintColor: '#555555',
        tabBarStyle:             { backgroundColor: '#0A0A12', borderTopColor: '#1e1e1e', borderTopWidth: 1 },
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
        headerStyle:             { backgroundColor: '#0A0A12' },
        headerTintColor:         '#ffffff',
        headerTitleStyle:        { fontWeight: '700', color: '#ffffff' },
        headerShadowVisible:     false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home', headerTitle: brand.name }} />
      <Tab.Screen name="Deals"     component={DealsScreen}     options={{ title: 'Deals', headerTitle: 'All Deals' }} />
      <Tab.Screen name="Wallet"    component={WalletScreen}    options={{ title: 'Wallet', headerTitle: `${brand.tokenName}s` }} />
      <Tab.Screen name="Referral"  component={ReferralScreen}  options={{ title: 'Refer', headerTitle: 'Referrals' }} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  options={{ title: 'Settings', headerTitle: 'Settings' }} />
    </Tab.Navigator>
  );
}

export function MemberNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:         { backgroundColor: '#0A0A12' },
        headerTintColor:     brand.primaryColor,
        headerTitleStyle:    { fontWeight: '700', color: '#ffffff' },
        contentStyle:        { backgroundColor: '#0A0A12' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs"           component={MemberTabs}          options={{ headerShown: false }} />
      <Stack.Screen name="DealDetail"     component={DealDetailScreen}    options={({ route }) => ({ title: route.params.deal.title })} />
      <Stack.Screen name="Booking"        component={BookingScreen}       options={{ title: 'Confirm Booking' }} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="Concierge"      component={ConciergeScreen}     options={{ title: 'Personal Concierge' }} />
      <Stack.Screen name="Membership"     component={MembershipScreen}    options={{ title: 'Membership Plans' }} />
    </Stack.Navigator>
  );
}
