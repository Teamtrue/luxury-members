declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: string;
    order_id: string;
    name?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    retry?: { enabled?: boolean; max_count?: number };
  }

  export interface RazorpaySuccessData {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayError {
    code: number;
    description: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpaySuccessData>;
  };

  export default RazorpayCheckout;
}
