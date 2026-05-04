// core/BaseProvider.js
import crypto from 'crypto';
import fetch from 'node-fetch'; 

export class BaseProvider {
  async request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Ensure URL is absolute
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    console.log('[BaseProvider] Full URL being requested:', fullUrl);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });

      console.log('[BaseProvider] Response status:', response.status);
      console.log('[BaseProvider] Content-Type:', response.headers.get('content-type'));

      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.message || data.error?.message || errorMessage;
          console.error('[BaseProvider] Error response:', data);
        } else {
          const text = await response.text();
          errorMessage = text.substring(0, 500);
          console.error('[BaseProvider] Error text:', errorMessage);
        }
        throw new Error(errorMessage);
      }

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return { raw: await response.text() };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('API Request Timed Out (30s)');
      }
      console.error('[BaseProvider] Request failed:', error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  verifySignature(payload, signature, secret) {
    const expected = this.generateSignature(payload, secret);
    return expected === signature;
  }
}