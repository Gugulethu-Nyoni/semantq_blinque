// providers/gateways/yoco.js
import { PaymentService } from '../../core/PaymentService.js';

export class Yoco extends PaymentService {
  constructor(credentials) {
    super();
    this.name = 'Yoco';
    this.secretKey = credentials.secretKey;
    this.baseUrl = 'https://online.yoco.com/v1';
  }

  /**
   * Initializes a checkout session
   */
  async createCheckout(payload) {
    const yocoRequest = {
      amount: Math.round(payload.total * 100), // Yoco uses cents
      currency: payload.currency || 'ZAR',
      cancelUrl: payload.cancelUrl,
      successUrl: payload.successUrl,
      metadata: {
        orderId: payload.orderId,
        shippingQuoteId: payload.shippingQuoteId
      }
    };

    const response = await this.request(`${this.baseUrl}/checkouts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.secretKey}` },
      body: JSON.stringify(yocoRequest)
    });

    return {
      checkoutId: response.id,
      redirectUrl: response.redirectUrl,
      status: 'pending'
    };
  }

  async verifyPayment(transactionId) {
    // Logic to poll or receive webhook from Yoco
    return { status: 'authorized', transactionId };
  }
}