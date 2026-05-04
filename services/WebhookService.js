// bliqnue/services/WebhookService.js

export class WebhookService {
  constructor(gatewayLoader) {
    this.gatewayLoader = gatewayLoader;
  }

  async processWebhook(gatewayName, rawBody, signature) {
    const provider = this.gatewayLoader.getGateway(gatewayName);
    
    if (!provider) {
      throw new Error(`Gateway ${gatewayName} not supported.`);
    }

    // 1. Verify Security
    const isValid = provider.verifyWebhook(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // 2. Normalize Data
    const payload = JSON.parse(rawBody);
    const normalized = provider.normalizeEvent(payload);

    // 3. Communicate with Pylon (The Receiver)
    // We send the normalized event to Pylon's internal endpoint
    return await this.forwardToPylon(normalized);
  }

  async forwardToPylon(event) {
    // This URL would point to your Pylon API
    const pylonWebhookUrl = process.env.PYLON_INTERNAL_URL + '/api/v1/payments/callback';
    
    const response = await fetch(pylonWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Blinque-Token': process.env.BLINQUE_INTERNAL_TOKEN // Security for Pylon
      },
      body: JSON.stringify(event)
    });

    return response.ok;
  }
}