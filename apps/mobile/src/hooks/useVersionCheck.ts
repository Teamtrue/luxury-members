import { useEffect, useState } from 'react'
import { Alert, Linking, Platform } from 'react-native'
import { apiGet } from '../lib/api'

interface VersionData {
  min_version: string
  current_version: string
  force_update_message: string
  platform_urls: { android: string; ios: string }
}

const APP_VERSION = '1.0.0'

function versionGte(a: string, b: string): boolean {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false
  }
  return true
}

export function useVersionCheck(): boolean {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    apiGet<{ success: boolean; data: VersionData }>('/api/app/version')
      .then(res => {
        if (!res.success) return
        const { min_version, force_update_message, platform_urls } = res.data
        if (!versionGte(APP_VERSION, min_version)) {
          const url = Platform.OS === 'android' ? platform_urls.android : platform_urls.ios
          Alert.alert(
            'Update Required',
            force_update_message,
            [{ text: 'Update Now', onPress: () => Linking.openURL(url) }],
            { cancelable: false }
          )
        }
      })
      .catch(() => null)
      .finally(() => setChecked(true))
  }, [])

  return checked
}
