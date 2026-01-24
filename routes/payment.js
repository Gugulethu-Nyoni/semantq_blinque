// routes/payment.js
import express from 'express';
import blinque from '../index.js';

const router = express.Router();

/**
 * Endpoint to start a checkout session (e.g., Yoco Checkout)
 * Expects orderId, total, and shippingQuoteId in body
 */
router.post('/create-session', async (req, res) => {
  try {
    if (!blinque.payment) {
      return res.status(500).json({ error: "Payment service not initialized." });
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
 * Webhook/Verify endpoint to confirm payment was successful
 */
router.get('/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = await blinque.payment.paymentProvider.verifyPayment(transactionId);
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;