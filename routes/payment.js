import express from 'express';
import blinque from '../index.js';
import { WebhookService } from '../services/WebhookService.js';

const router = express.Router();

/**
 * 1. Webhook Endpoint (The Listener)
 * Uses express.raw() to preserve signature for Paystack/Yoco verification.
 */
router.post('/webhook/:gateway', express.raw({ type: 'application/json' }), async (req, res) => {
  const { gateway } = req.params;

  if (!blinque.payment) {
    return res.status(503).send('Blinque Engine Initializing...');
  }

  // Lazy-load to prevent "Cannot read properties of null (reading 'gatewayLoader')"
  const webhookService = new WebhookService(blinque.payment.gatewayLoader);
  const signature = req.headers['x-paystack-signature'] || req.headers['yoco-signature'];

  try {
    await webhookService.processWebhook(gateway, req.body, signature);
    return res.status(200).send('Event Received');
  } catch (error) {
    console.error(`[Webhook Error] ${gateway}:`, error.message);
    return res.status(400).send('Webhook Processing Failed');
  }
});

/**
 * 2. Start a checkout session
 */
router.post('/create-session', async (req, res) => {
  try {
    if (!blinque.payment) {
      return res.status(503).json({ error: "Payment service not initialized." });
    }

    const session = await blinque.payment.initiateCheckout(req.body);

    return res.status(200).json({
      success: true,
      ...session
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 3. Manual verification
 */
router.get('/verify/:transactionId', async (req, res) => {
  try {
    if (!blinque.payment) {
      return res.status(503).json({ error: "Payment service not initialized." });
    }

    const { transactionId } = req.params;
    // Using the gateway loader to find the active provider
    const result = await blinque.payment.paymentProvider.verifyPayment(transactionId);
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;