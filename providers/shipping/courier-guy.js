// providers/shipping/courier-guy.js
import { ShippingService } from '../../core/ShippingService.js';

export class CourierGuy extends ShippingService {
  /**
   * @param {Object} credentials - From config loader
   */
  constructor(credentials) {
    super();
    this.name = 'The Courier Guy';
    this.apiKey = credentials.apiKey;
    this.baseUrl = credentials.baseUrl || 'https://api.thecourierguy.co.za/v1';
    this.accountNumber = credentials.accountNumber;
  }

  /**
   * Fetches real-time rates
   */
  async getRates(payload) {
    // Map internal payload to TCG's expected 'Estimate' structure
    const tcgRequest = {
      account_number: this.accountNumber,
      collection_address: {
        city: payload.from.city,
        postal_code: payload.from.postalCode,
        suburb: payload.from.area
      },
      delivery_address: {
        city: payload.to.city,
        postal_code: payload.to.postalCode,
        suburb: payload.to.area
      },
      parcels: payload.parcels.map(p => ({
        weight: p.weight,
        height: p.height,
        width: p.width,
        length: p.length
      }))
    };

    const response = await this.request(`${this.baseUrl}/rates`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(tcgRequest)
    });

    // Normalize response: Extract only what the frontend/app needs
    return (response.rates || []).map(rate => ({
      provider: 'courier_guy',
      service_name: rate.service_type_name,
      service_code: rate.service_type_code,
      total_price: parseFloat(rate.total_price),
      currency: 'ZAR',
      delivery_delay: rate.delivery_delay,
      unique_reference: rate.rate_id // Used to confirm this rate later
    }));
  }

  /**
   * Creates the actual waybill after payment is confirmed
   */
  async createWaybill(payload) {
    // This will be implemented when we connect the payment success trigger
    console.log("TCG: Generating Waybill for order", payload.orderNumber);
    return { waybill_number: `TCG-${Math.random().toString(36).toUpperCase().substring(2, 10)}` };
  }
}