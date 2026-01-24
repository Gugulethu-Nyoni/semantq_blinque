// index.js
import { loadAppConfig } from './config/loader.js';
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

  async init() {
    if (this._initialized) return this;

    this.config = await loadAppConfig();
    if (!this.config) {
      throw new Error("Blinque failed to initialize: No server.config.js found.");
    }

    // 1. Setup Shipping
    if (this.config.shipping.provider === 'courier_guy') {
      const provider = new CourierGuy(this.config.shipping.config);
      this.shipping = new QuoteService(provider, this.config.shipping.warehouse);
    }

    // 2. Setup Payment (Provisional)
    if (this.config.gateways.provider === 'yoco') {
      const provider = new Yoco(this.config.gateways.config);
      this.payment = new CheckoutService(provider);
    }

    this._initialized = true;
    console.log(`Blinque Engine Initialized: [${this.config.shipping.provider}] & [${this.config.gateways.provider}]`);
    return this;
  }
}

// Export a singleton instance
const blinqueInstance = new Blinque();
export default blinqueInstance;