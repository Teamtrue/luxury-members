import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { clearSession, getStoredMember } from '../../lib/auth';
import { TierBadge } from '../../components/TierBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { MemberProfile } from '../../lib/api';
import { brand } from '../../lib/brand';

export function SettingsScreen() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredMember<MemberProfile>().then((m) => {
      setMember(m);
      setLoading(false);
    });
  }, []);

  function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            // RootNavigator will detect cleared session and show AuthStack
          },
        },
      ]
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile section */}
      {member && (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberPhone}>+91 {member.phone}</Text>
            <TierBadge tier={member.tier} />
          </View>
        </View>
      )}

      {/* Preferences section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.menuCard}>
          <SettingsRow label="Notification Settings" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Privacy Policy" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Terms of Service" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Contact Support" onPress={() => {}} />
        </View>
      </View>

      {/* Account section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menuCard}>
          <SettingsRow label="Membership Details" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Payment Methods" onPress={() => {}} />
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>{brand.name} v1.0.0</Text>
    </ScrollView>
  );
}

function SettingsRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#0A0A12',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberPhone: {
    color: '#999999',
    fontSize: 13,
    marginBottom: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
  menuArrow: {
    color: '#555555',
    fontSize: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#2a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5a1a1a',
    marginBottom: 20,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
  version: {
    color: '#444444',
    fontSize: 12,
    textAlign: 'center',
  },
});
