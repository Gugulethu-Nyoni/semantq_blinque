export class PaymentController {
  async handleWebhook(req, res) {
    const { gateway } = req.params;
    const signature = req.headers['x-paystack-signature'] || req.headers['yoco-signature'];
    
    try {
      // Pass the raw buffer to the service
      await webhookService.processWebhook(gateway, req.body, signature);
      
      // Always return 200 to the gateway to stop retries
      res.status(200).send('Webhook Processed');
    } catch (err) {
      console.error(`[Webhook Error] ${gateway}:`, err.message);
      res.status(400).send('Webhook Verification Failed');
    }
  }
}