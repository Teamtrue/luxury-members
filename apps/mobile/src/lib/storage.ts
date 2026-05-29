/**
 * src/lib/storage.ts
 * Thin wrapper around expo-secure-store for typed key-value storage.
 */

import * as SecureStore from 'expo-secure-store';

export async function storageGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function storageGetJSON<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSetJSON(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}
