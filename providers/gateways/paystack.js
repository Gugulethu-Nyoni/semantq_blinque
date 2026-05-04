import { PaymentService } from '../../core/PaymentService.js';
import crypto from 'crypto';

/**
 * Paystack Provider
 * Handles direct API interaction and Webhook processing for Paystack.
 */
export class Paystack extends PaymentService {
  constructor(config) {
    super();
    this.name = 'Paystack';
    this.secretKey = config.secretKey;
    this.publicKey = config.publicKey;
    this.baseUrl = 'https://api.paystack.co';
    
    const environment = this.secretKey?.startsWith('sk_live_') ? 'live' : 'sandbox';
    console.log(`[Paystack] Initialized with ${environment} environment`);
  }

  /**
   * Initialize a Checkout Session
   */
  async createCheckout(payload) {
    // Paystack expects amount in kobo (cents)
    const amountInKobo = Math.round(payload.amount * 100);
    
    const requestBody = {
      amount: amountInKobo,
      currency: payload.currency || 'ZAR',
      email: payload.email,
      reference: String(payload.externalId) + '_' + Date.now(),
      callback_url: payload.successUrl,
      metadata: {
        cancel_url: payload.cancelUrl,
        ...payload.metadata
      }
    };

    console.log('[Paystack] Initializing transaction:', {
      amount: requestBody.amount,
      currency: requestBody.currency,
      email: requestBody.email,
      reference: requestBody.reference
    });

    const response = await this.request('/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    return {
      checkoutId: response.data.reference,
      redirectUrl: response.data.authorization_url,
      status: 'pending'
    };
  }

  /**
   * Manual Verification (Polling)
   */
  async verifyPayment(transactionId) {
    const response = await this.request(`/transaction/verify/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`
      }
    });

    return {
      status: response.data.status === 'success' ? 'paid' : 'pending',
      transactionId: transactionId,
      amount: response.data.amount / 100
    };
  }

  /**
   * Webhook Security: HMAC SHA512 Verification
   * Ensures the request is authentically from Paystack.
   */
  verifyWebhook(rawBody, signature) {
    if (!signature) return false;

    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Event Normalization
   * Converts Paystack payload to standardized Blinque format for Pylon.
   */
  normalizeEvent(payload) {
    const { event, data } = payload;

    const statusMap = {
      'charge.success': 'PAID',
      'charge.failed': 'FAILED',
      'refund.processed': 'REFUNDED'
    };

    // Strip the timestamp suffix to get the original Pylon ID
    const originalExternalId = data.reference.split('_')[0];

    return {
      externalId: originalExternalId,
      status: statusMap[event] || 'PROCESSING',
      amount: data.amount / 100, // Return to Rands for Pylon consumption
      currency: data.currency,
      gatewayReference: data.id.toString(),
      pylon_gateway: 'paystack',
      metadata: data.metadata || {},
      timestamp: new Date()
    };
  }

  /**
   * Internal Request Wrapper with Timeout
   */
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Paystack request failed');
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Paystack API Timeout (30s)');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}