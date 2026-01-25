import { ShippingService } from '../../core/ShippingService.js';

export class CourierGuy extends ShippingService {
  /**
   * @param {Object} credentials - From config loader
   */
  constructor(credentials) {
    super();
    this.name = 'The Courier Guy';
    this.token = credentials.token;
    this.apiKey = credentials.apiKey;
    // Explicitly separate the two endpoints for rates and shipments
    this.ratesUrl = credentials.ratesBaseUrl || 'https://api.shiplogic.com/rates';
    this.ordersUrl = credentials.ordersBaseUrl || 'https://api.shiplogic.com/shipments';
  }

  /**
   * Fetches real-time rates from Shiplogic
   */
  async getRates(payload) {
    try {
      console.log("🚀 [CourierGuy] Fetching rates...");

      const response = await fetch(this.ratesUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Guard: Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await response.text();
        console.error("❌ [CourierGuy] Rates Non-JSON Error:", textError);
        throw new Error(`Shiplogic Rates returned non-JSON: ${textError.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Shiplogic Rate Error: ${response.statusText}`);
      }

      const ratesArray = data.rates || [];

      return ratesArray.map(item => ({
        provider: 'courier_guy',
        service_name: item.service_level?.name || 'Standard Shipping',
        service_code: item.service_level?.code || 'STD',
        total_price: parseFloat(item.rate || 0),
        currency: 'ZAR',
        unique_reference: item.service_level?.id?.toString() || `ref-${Math.random()}`,
        rate_id: item.service_level?.id?.toString(),
        delivery_estimate: item.service_level?.description || ""
      }));

    } catch (error) {
      console.error(`❌ [CourierGuy Provider] Rate API Failure:`, error.message);
      throw error;
    }
  }

  /**
   * Creates the actual waybill (Shipment) in Shiplogic
   */
  async createWaybill(payload) {
    console.log("📦 [CourierGuy] Generating Shipment at:", this.ordersUrl);
    
    try {
      const response = await fetch(this.ordersUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // --- CRITICAL LOGS FOR DEBUGGING ---
      console.log(`📡 [CourierGuy] API Status: ${response.status} ${response.statusText}`);

      // Check Content-Type to avoid "Unexpected token c" (JSON parse error)
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        console.error("🚨 [CourierGuy] RECEIVED NON-JSON RESPONSE FROM TCG:");
        console.error(rawText); 
        throw new Error(`TCG API returned plain text instead of JSON. Status: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ [CourierGuy] Shiplogic Shipment Error Details:", JSON.stringify(data, null, 2));
        throw new Error(data.message || `TCG Shipment Failed: ${response.statusText}`);
      }

      // Successful JSON Response Log
      console.log("✅ [CourierGuy] Shiplogic Successful Response Object:", JSON.stringify(data, null, 2));

      return {
        success: true,
        waybill_number: data.tracking_reference || data.short_tracking_reference, 
        tracking_id: data.id,
        status: data.status,
        label_url: `${this.ordersUrl}/${data.id}/label/pdf`, 
        estimated_collection: data.estimated_collection,
        raw_response: data
      };

    } catch (error) {
      console.error("❌ [CourierGuy Provider] Shipment API Failure:", error.message);
      throw error;
    }
  }
}