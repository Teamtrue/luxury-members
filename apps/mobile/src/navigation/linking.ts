import type { LinkingOptions } from '@react-navigation/native'
import { brand } from '../lib/brand'

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [`${brand.slug}://`, brand.url],
  config: {
    screens: {
      Auth: {
        screens: {
          SignIn: 'signin',
          OTP:    'otp',
        },
      },
      Member: {
        screens: {
          Dashboard:   'dashboard',
          Deals:       'deals',
          DealDetail:  'deals/:dealId',
          Wallet:      'wallet',
          Referral:    'referral',
          Settings:    'settings',
        },
      },
    },
  },
}
