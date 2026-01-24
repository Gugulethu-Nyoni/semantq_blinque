// controllers/ShippingController.js
import blinque from '../index.js';

/**
 * Handles the POST /quote request
 */
export const getRates = async (req, res) => {
  try {
    const { customerAddress, products } = req.body;
    if (!blinque.shipping) throw new Error("Shipping service not initialized.");

    const rates = await blinque.shipping.getShippingQuotes(customerAddress, products);

    return res.status(200).json({
      success: true,
      provider: blinque.shipping.provider.name,
      rates
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handles the POST /order request
 * Security: Re-verifies the HMAC signature to prevent price tampering
 */
export const createShippingOrder = async (req, res) => {
  try {
    const { orderId, quoteReference, totalPrice, signature, customerDetails } = req.body;

    if (!blinque.shipping) throw new Error("Shipping service not initialized.");

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
    return res.status(400).json({ success: false, message: error.message });
  }
};