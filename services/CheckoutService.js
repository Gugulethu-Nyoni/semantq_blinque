export class CheckoutService {
  constructor(paymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  /**
   * Universal Payment Orchestrator
   * Works for physical ecommerce and digital subscriptions.
   */
  async initiateCheckout(data) {
    // 1. Normalize the payload so the Provider (Yoco/Paystack/STRIPE/etc) gets what it needs
    const payload = {
      externalId: data.orderId || data.organizationId, // Unique Ref
      amount: data.total || data.amount,
      currency: data.currency || 'ZAR',
      email: data.email,  // ← ADD THIS LINE - Required for Paystack
      metadata: {
        type: data.shippingQuoteId ? 'ECOMMERCE' : 'SUBSCRIPTION',
        ...data.metadata // Pass through packageId, billingCycle, etc.
      },
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl
    };

    console.log('[CheckoutService] Payload:', { 
      email: payload.email, 
      externalId: payload.externalId,
      amount: payload.amount 
    });

    // 2. The Provider handles the logic
    // If Yoco SDK is preferred for Pylon, the provider returns a 'token' 
    // If Checkout Redirect is preferred, it returns a 'url'
    return await this.paymentProvider.createCheckout(payload);
  }
}