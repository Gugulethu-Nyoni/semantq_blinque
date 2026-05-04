// index.js
import getConfig from '../../../config_loader.js';
import { QuoteService } from './services/QuoteService.js';
import { CheckoutService } from './services/CheckoutService.js';
import { CourierGuy } from './providers/shipping/courier-guy.js';
import { Yoco } from './providers/gateways/yoco.js';
import { Paystack } from './providers/gateways/paystack.js';

class Blinque {
  constructor() {
    this.config = null;
    this.shipping = null;
    this.payment = null;
    this.paymentGateways = new Map(); // NEW: Store multiple gateways
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return this;

    console.log("[Blinque] Initializing Engine...");

    try {
      const fullConfig = await getConfig();

      if (!fullConfig || !fullConfig.logistics) {
        throw new Error("Logistics section missing in server.config.js.");
      }
      
      this.config = fullConfig.logistics;

      // 1. Setup Shipping
      if (this.config.shipping && this.config.shipping.provider === 'courier_guy') {
        const shippingProvider = new CourierGuy(this.config.shipping.config);
        this.shipping = new QuoteService(shippingProvider, this.config.shipping.warehouse);
        console.log("[Blinque] Shipping (QuoteService + CourierGuy) initialized.");
      }

      // 2. Setup Payment - Multiple gateways
      // Backward compatible: single provider config
      if (this.config.gateways && this.config.gateways.provider === 'yoco') {
        const paymentProvider = new Yoco(this.config.gateways.config);
        this.payment = new CheckoutService(paymentProvider);
        this.paymentGateways.set('yoco', this.payment);
        console.log("[Blinque] Payment (Yoco) initialized.");
      }
      
      // NEW: Multi-gateway config (priority over single provider)
      if (this.config.gateways?.providers?.yoco?.enabled) {
        const yocoProvider = new Yoco(this.config.gateways.providers.yoco.config);
        const yocoService = new CheckoutService(yocoProvider);
        this.paymentGateways.set('yoco', yocoService);
        if (!this.payment) this.payment = yocoService; // Backward compatibility
        console.log("[Blinque] Yoco gateway initialized (multi-gateway mode).");
      }
      
      if (this.config.gateways?.providers?.paystack?.enabled) {
        const paystackProvider = new Paystack(this.config.gateways.providers.paystack.config);
        const paystackService = new CheckoutService(paystackProvider);
        this.paymentGateways.set('paystack', paystackService);
        console.log("[Blinque] Paystack gateway initialized.");
      }

      this._initialized = true;
      console.log("[Blinque] Successfully ready for logistics.");
      if (this.paymentGateways.size > 0) {
        console.log(`[Blinque] Available gateways: ${Array.from(this.paymentGateways.keys()).join(', ')}`);
      }
      return this;
    } catch (error) {
      console.error("[Blinque] Init Error:", error.message);
      throw error;
    }
  }

  // NEW: Method to get specific gateway
  getPaymentGateway(gatewayName = null) {
    if (!gatewayName && this.payment) return this.payment;
    const gateway = this.paymentGateways.get(gatewayName);
    if (!gateway) {
      throw new Error(`Gateway '${gatewayName}' not found. Available: ${Array.from(this.paymentGateways.keys()).join(', ')}`);
    }
    return gateway;
  }
}

const blinqueInstance = new Blinque();
export default blinqueInstance;