/**
 * src/lib/auth.ts
 * Auth session management using expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'plutusclub_session';
const MEMBER_KEY = 'plutusclub_member';

export async function getStoredSession(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function saveSession(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, token);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(MEMBER_KEY);
}

export async function saveStoredMember(member: object): Promise<void> {
  await SecureStore.setItemAsync(MEMBER_KEY, JSON.stringify(member));
}

export async function getStoredMember<T>(): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
