/// <reference types="expo/types" />

// Expo public env vars (set in .env / EAS secrets)
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_RAZORPAY_KEY_ID?: string;
  }
}
