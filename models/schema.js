// models/schema.js

/**
 * Normalizes product data from Prisma for shipping calculators.
 * Ensures we don't pass nulls to the API.
 */
export const normalizeProductsForShipping = (products) => {
  return products.map(p => ({
    title: p.title || 'Item',
    weight: parseFloat(p.weight_kg) || 0.5,
    height: parseFloat(p.height_cm) || 10,
    width: parseFloat(p.width_cm) || 10,
    length: parseFloat(p.length_cm) || 10
  }));
};

/**
 * Maps the selected quote back to the shape of the Delivery model
 */
export const mapToDeliveryRecord = (selectedQuote, orderId, driverId = null) => {
  return {
    orderId: parseInt(orderId),
    status: 'pending',
    carrier: selectedQuote.provider,
    shippingService: selectedQuote.service_name,
    shippingQuoteId: selectedQuote.unique_reference,
    quotedShippingCost: selectedQuote.total_price,
    // Store original response for audit trails
    metadata: {
      source: 'blinque_shipping_module',
      ...selectedQuote
    }
  };
};