// services/QuoteService.js
import { normalizeProductsForShipping } from '../models/schema.js';

export class QuoteService {
  constructor(provider, warehouse) {
    this.provider = provider;
    this.warehouse = warehouse;
  }

  /**
   * getShippingQuotes
   * Used during checkout to show delivery options to the user.
   */
  async getShippingQuotes(customerAddress, products) {
    if (!customerAddress || !customerAddress.city || !customerAddress.local_area) {
      throw new Error("Invalid destination address. Suburb and City are required.");
    }

    // Map Semantq products to Shiplogic parcel format
    const parcels = products.map(p => ({
      submitted_length_cm: p.length_cm || 10,
      submitted_width_cm: p.width_cm || 10,
      submitted_height_cm: p.height_cm || 10,
      submitted_weight_kg: p.weight_kg || 1
    }));

    const payload = {
      collection_address: { ...this.warehouse },
      delivery_address: {
        type: customerAddress.type || "residential",
        company: customerAddress.company || "",
        street_address: customerAddress.addressLine1,
        local_area: customerAddress.local_area,
        city: customerAddress.city,
        zone: customerAddress.state || "Gauteng",
        country: customerAddress.country || "ZA",
        code: customerAddress.postalCode
      },
      parcels,
      declared_value: 0, 
      collection_min_date: new Date().toISOString().split('T')[0],
      delivery_min_date: new Date().toISOString().split('T')[0]
    };

    try {
      const rates = await this.provider.getRates(payload);
      
      return rates.map(rate => {
        // Create HMAC signature for security (if your provider supports this)
        const signature = typeof this.provider.generateSignature === 'function' 
          ? this.provider.generateSignature({ id: rate.unique_reference, price: rate.total_price }, this.provider.apiKey)
          : null;
        
        return { 
          service_name: rate.service_name,
          total_price: rate.total_price,
          unique_reference: rate.unique_reference,
          rate_id: rate.rate_id,
          signature 
        };
      });
    } catch (error) {
      console.error(`QuoteService Error:`, error.message);
      throw new Error(`Shipping calculation failed: ${error.message}`);
    }
  }

  /**
   * createWaybill
   * The bridge method that fixes the "not a function" error in CheckoutController.
   * Passes the final shipment payload to the underlying CourierGuy provider.
   */
  async createWaybill(payload) {
    console.log("🌉 [QuoteService] Bridging Waybill creation to Provider...");
    
    try {
      // Ensure the provider actually has the capability
      if (!this.provider.createWaybill) {
        throw new Error(`The provider ${this.provider.name} does not support shipment creation.`);
      }

      // Pass the payload directly to the provider (CourierGuy)
      return await this.provider.createWaybill(payload);
    } catch (error) {
      console.error(`[QuoteService Waybill Bridge] Error:`, error.message);
      throw error;
    }
  }
}