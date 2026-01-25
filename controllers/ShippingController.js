import blinque from '../index.js';

/**
 * Helper to ensure the engine is ready before any action
 */
const ensureReady = async () => {
  if (!blinque._initialized) {
    await blinque.init();
  }
  if (!blinque.shipping) {
    throw new Error("Shipping service is not configured or failed to initialize.");
  }
};

/**
 * Handles the POST /quote request
 */
export const getRates = async (req, res) => {
  try {
    // Ensure blinque is initialized before proceeding
    await ensureReady();

    const { customerAddress, products } = req.body;
    
    // Basic payload validation
    if (!customerAddress || !products) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: customerAddress and products are mandatory." 
      });
    }

    const rates = await blinque.shipping.getShippingQuotes(customerAddress, products);

    return res.status(200).json({
      success: true,
      provider: blinque.shipping.provider.name,
      rates
    });
  } catch (error) {
    console.error(`[ShippingController] Quote Error:`, error.message);
    return res.status(error.message.includes("configured") ? 500 : 400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Handles the POST /order request
 * Security: Re-verifies the HMAC signature to prevent price tampering
 */
export const createShippingOrder = async (req, res) => {
  try {
    await ensureReady();

    const { orderId, quoteReference, totalPrice, signature, customerDetails } = req.body;

    // 1. Signature Verification (The Guard)
    const isValid = blinque.shipping.provider.verifySignature(
      { id: quoteReference, price: totalPrice },
      signature,
      blinque.shipping.provider.apiKey
    );

    if (!isValid) {
      return res.status(403).json({ 
        success: false, 
        message: "Security violation: The shipping quote data has been tampered with." 
      });
    }

    // 2. Booking with the Provider
    const shipment = await blinque.shipping.provider.createWaybill({
      orderId,
      quoteReference,
      customer: customerDetails,
      price: totalPrice
    });

    return res.status(201).json({
      success: true,
      message: "Waybill generated successfully",
      shipment 
    });
  } catch (error) {
    console.error(`[ShippingController] Order Error:`, error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};