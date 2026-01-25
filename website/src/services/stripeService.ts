/**
 * Stripe Payment Service
 * Handles Stripe payment processing integration
 * 
 * Setup:
 * 1. Install Stripe: npm install @stripe/stripe-js
 * 2. Add Stripe publishable key to environment: VITE_STRIPE_PUBLISHABLE_KEY
 * 3. Create backend endpoint for payment intent creation
 */

// Stripe integration placeholder
// In production, this would use @stripe/stripe-js and backend API

export interface StripeConfig {
  publishableKey: string;
  apiEndpoint?: string; // Backend endpoint for payment intents
}

let stripeConfig: StripeConfig | null = null;

/**
 * Initialize Stripe
 */
export const initializeStripe = (config: StripeConfig): void => {
  stripeConfig = config;
  console.log('✅ Stripe initialized');
};

/**
 * Get Stripe config from environment
 */
export const getStripeConfig = (): StripeConfig | null => {
  if (stripeConfig) return stripeConfig;
  
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn('⚠️ Stripe publishable key not configured');
    return null;
  }
  
  return {
    publishableKey,
    apiEndpoint: import.meta.env.VITE_STRIPE_API_ENDPOINT || '/api/stripe',
  };
};

/**
 * Create payment intent (requires backend)
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> => {
  const config = getStripeConfig();
  if (!config) {
    throw new Error('Stripe not configured');
  }
  
  // In production, this would call your backend API
  // Backend would use Stripe server SDK to create payment intent
  try {
    const response = await fetch(config.apiEndpoint || '/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: metadata || {},
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error: any) {
    console.error('❌ Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

/**
 * Process payment with Stripe (client-side)
 * This is a placeholder - actual implementation requires Stripe Elements
 */
export const processStripePayment = async (
  clientSecret: string,
  paymentMethodId: string
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}> => {
  const config = getStripeConfig();
  if (!config) {
    throw new Error('Stripe not configured');
  }
  
  // In production, this would use Stripe.js to confirm payment
  // This is a placeholder for the actual Stripe integration
  try {
    const response = await fetch(config.apiEndpoint || '/api/stripe/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientSecret,
        paymentMethodId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment failed');
    }
    
    const data = await response.json();
    return {
      success: true,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error: any) {
    console.error('❌ Error processing payment:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if Stripe is available
 */
export const isStripeAvailable = (): boolean => {
  return getStripeConfig() !== null;
};

/**
 * Format amount for Stripe (convert to cents)
 */
export const formatAmountForStripe = (amount: number, currency: string = 'usd'): number => {
  // For most currencies, multiply by 100
  // For zero-decimal currencies (JPY, KRW), don't multiply
  const zeroDecimalCurrencies = ['jpy', 'krw', 'clp', 'ugx', 'vnd', 'xaf', 'xof', 'bif', 'djf', 'gnf', 'kmf', 'mga', 'rwf', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

/**
 * Format amount from Stripe (convert from cents)
 */
export const formatAmountFromStripe = (amount: number, currency: string = 'usd'): number => {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'clp', 'ugx', 'vnd', 'xaf', 'xof', 'bif', 'djf', 'gnf', 'kmf', 'mga', 'rwf', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }
  
  return amount / 100;
};
