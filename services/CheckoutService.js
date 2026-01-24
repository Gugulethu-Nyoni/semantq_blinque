// services/CheckoutService.js
export class CheckoutService {
  /**
   * @param {Object} paymentProvider - An instance of a PaymentService (e.g., Yoco)
   */
  constructor(paymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  /**
   * Prepares the payment gateway session
   * @param {Object} orderData - Includes totals and selected shipping info
   */
  async initiateCheckout(orderData) {
    const payload = {
      orderId: orderData.id,
      total: orderData.total, // Ensure this includes the shipping cost
      currency: orderData.currency || 'ZAR',
      shippingQuoteId: orderData.shippingQuoteId,
      successUrl: orderData.successUrl,
      cancelUrl: orderData.cancelUrl
    };

    return await this.paymentProvider.createCheckout(payload);
  }
}