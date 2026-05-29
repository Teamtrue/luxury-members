import { Platform } from 'react-native'
import { apiPost } from './api'
import { getStoredSession } from './auth'

// Lazy-load Expo modules — won't exist in CI/type-check-only environments
let Notifications: typeof import('expo-notifications') | null = null
let Device: typeof import('expo-device') | null = null

async function getNotifications() {
  if (!Notifications) Notifications = await import('expo-notifications')
  return Notifications
}
async function getDevice() {
  if (!Device) Device = await import('expo-device')
  return Device
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const [N, D] = await Promise.all([getNotifications(), getDevice()])

    if (!D.isDevice) return null

    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  true,
      }),
    })

    const { status: existing } = await N.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await N.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return null

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name:              'default',
        importance:        N.AndroidImportance.MAX,
        vibrationPattern:  [0, 250, 250, 250],
      })
    }

    const token = (await N.getExpoPushTokenAsync()).data

    const session = await getStoredSession()
    if (session) {
      await apiPost('/api/push/subscribe', {
        endpoint:    token,
        p256dh:      'expo-push',
        auth:        token,
        platform:    Platform.OS === 'android' ? 'android' : 'ios',
        device_name: D.deviceName ?? undefined,
      }, session).catch(() => null)
    }

    return token
  } catch {
    return null
  }
}
