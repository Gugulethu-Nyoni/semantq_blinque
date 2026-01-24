// core/BaseProvider.js
import crypto from 'crypto';

export class BaseProvider {
  /**
   * Standardized fetch wrapper with timeout and error handling
   */
  async request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `API Error: ${response.status}`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('API Request Timed Out');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generates a tamper-proof HMAC signature for a quote
   * @param {Object} payload - The data to sign (id, price)
   * @param {string} secret - The API Key used as the private salt
   */
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Verifies if the signature matches the provided payload
   */
  verifySignature(payload, signature, secret) {
    const expected = this.generateSignature(payload, secret);
    return expected === signature;
  }
}