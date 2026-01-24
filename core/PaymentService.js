// core/PaymentService.js

import { BaseProvider } from './BaseProvider.js';

export class PaymentService extends BaseProvider {
  constructor() {
    super();
    if (this.constructor === PaymentService) {
      throw new Error("PaymentService is abstract and cannot be instantiated directly.");
    }
  }

  /**
   * @abstract
   * @returns {Promise<Object>} Checkout Session/Intent
   */
  async createCheckout(payload) {
    throw new Error("Method 'createCheckout()' must be implemented.");
  }

  /**
   * @abstract
   * @returns {Promise<Boolean>} Status
   */
  async verifyPayment(transactionId) {
    throw new Error("Method 'verifyPayment()' must be implemented.");
  }
}