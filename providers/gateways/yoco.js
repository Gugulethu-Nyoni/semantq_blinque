// providers/gateways/yoco.js
import { BaseProvider } from '../../core/BaseProvider.js';

export class Yoco extends BaseProvider {
  constructor(credentials) {
    super();
    this.name = 'Yoco';
    this.secretKey = credentials.secretKey;
    this.publicKey = credentials.publicKey;
    
    // CORRECT: Same URL for both sandbox and live
    this.baseUrl = 'https://payments.yoco.com/api';
    
    const environment = this.secretKey?.startsWith('sk_live_') ? 'live' : 'sandbox';
    console.log(`[Yoco] Initialized with ${environment} environment`);
    console.log(`[Yoco] Base URL: ${this.baseUrl}`);
  }

  async createCheckout(payload) {
    const yocoRequest = {
      amount: payload.amount,  // Already in cents (51000 = R510)
      currency: payload.currency || 'ZAR',
      cancelUrl: payload.cancelUrl,
      successUrl: payload.successUrl,
      metadata: {
        externalId: String(payload.externalId),
        ...payload.metadata
      }
    };

    const url = `${this.baseUrl}/checkouts`;
    console.log('[Yoco] Creating checkout at:', url);
    console.log('[Yoco] Request body:', yocoRequest);

    const response = await this.request(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(yocoRequest)
    });

    console.log('[Yoco] Response:', response);

    return {
      checkoutId: response.id,
      redirectUrl: response.redirectUrl,
      status: response.status
    };
  }
}