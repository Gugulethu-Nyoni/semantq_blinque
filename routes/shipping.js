// routes/shipping.js
import express from 'express';
import { getRates, createShippingOrder } from '../controllers/ShippingController.js';

const router = express.Router();

// Step 1: Get prices for the customer to choose from
router.post('/shipping/quote', getRates);

// Step 3: Call this after Step 2 (Payment) is successful
router.post('/shipping/order', createShippingOrder);

export default router;