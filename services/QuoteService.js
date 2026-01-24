// services/QuoteService.js
import { normalizeProductsForShipping } from '../models/schema.js';

export class QuoteService {
  constructor(provider, warehouse) {
    this.provider = provider;
    this.warehouse = warehouse;
  }

  /**
   * Generates shipping quotes and signs them for security
   */
  async getShippingQuotes(customerAddress, products) {
    if (!customerAddress || !customerAddress.city || !customerAddress.postalCode) {
      throw new Error("Invalid destination address.");
    }

    const parcels = normalizeProductsForShipping(products);

    const payload = {
      from: {
        city: this.warehouse.city,
        postalCode: this.warehouse.postalCode,
        area: this.warehouse.local_area
      },
      to: {
        city: customerAddress.city,
        postalCode: customerAddress.postalCode,
        area: customerAddress.local_area
      },
      parcels
    };

    try {
      const rates = await this.provider.getRates(payload);
      
      // Security Layer: Sign each rate so the price is locked
      return rates.map(rate => {
        const signature = this.provider.generateSignature(
          { id: rate.unique_reference, price: rate.total_price },
          this.provider.apiKey 
        );
        
        return { 
          ...rate, 
          signature // Frontend must send this back when ordering
        };
      });
    } catch (error) {
      console.error(`QuoteService [${this.provider.name}] Error:`, error.message);
      throw new Error(`Shipping calculation failed: ${error.message}`);
    }
  }
}