// index.js
import { getConfig } from '../../../config_loader.js'; 
import { QuoteService } from './services/QuoteService.js';
import { CheckoutService } from './services/CheckoutService.js';
import { CourierGuy } from './providers/shipping/courier-guy.js';
import { Yoco } from './providers/gateways/yoco.js';

class Blinque {
  constructor() {
    this.config = null;
    this.shipping = null; 
    this.payment = null;
    this._initialized = false;
  }

  /**
   * Initializes the Blinque engine by loading configuration 
   * and instantiating the required providers and services.
   */
  async init() {
    if (this._initialized) return this;

    console.log("🔍 [Blinque] Initializing Engine...");

    try {
      const fullConfig = await getConfig();

      if (!fullConfig || !fullConfig.logistics) {
        throw new Error("Logistics section missing in server.config.js.");
      }
      
      this.config = fullConfig.logistics;

      // 1. Setup Shipping
      // We wrap the CourierGuy provider inside the QuoteService
      if (this.config.shipping && this.config.shipping.provider === 'courier_guy') {
        const shippingProvider = new CourierGuy(this.config.shipping.config);
        
        // Ensure QuoteService is initialized with the provider
        this.shipping = new QuoteService(shippingProvider, this.config.shipping.warehouse);
        console.log("📦 [Blinque] Shipping (QuoteService + CourierGuy) initialized.");
      }

      // 2. Setup Payment
      if (this.config.gateways && this.config.gateways.provider === 'yoco') {
        const paymentProvider = new Yoco(this.config.gateways.config);
        this.payment = new CheckoutService(paymentProvider);
        console.log("💳 [Blinque] Payment (CheckoutService + Yoco) initialized.");
      }

      this._initialized = true;
      console.log(`✅ [Blinque] Successfully ready for logistics.`);
      return this;
    } catch (error) {
      console.error("❌ [Blinque] Init Error:", error.message);
      throw error;
    }
  }
}

// Export a singleton instance
const blinqueInstance = new Blinque();
export default blinqueInstance;