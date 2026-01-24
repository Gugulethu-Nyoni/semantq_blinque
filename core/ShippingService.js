// core/ShippingService.js

import { BaseProvider } from './BaseProvider.js';

export class ShippingService extends BaseProvider {
  constructor() {
    super();
    if (this.constructor === ShippingService) {
      throw new Error("ShippingService is abstract and cannot be instantiated directly.");
    }
  }

  /**
   * @abstract
   * @returns {Promise<Array>} Normalized Quote Objects
   */
  async getRates(payload) {
    throw new Error("Method 'getRates()' must be implemented.");
  }

  /**
   * @abstract
   * @returns {Promise<Object>} Normalized Waybill/Label Object
   */
  async createWaybill(payload) {
    throw new Error("Method 'createWaybill()' must be implemented.");
  }
}