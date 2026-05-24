const express = require('express');
const router = express.Router();
const { formatOrderWithAI } = require('../services/ai');
const { sendToAllStaff } = require('../services/whatsapp');
const { saveOrder, getOrder, updateOrder, getAllOrders } = require('../services/orders');

// POST /orders — customer places an order
router.post('/', async (req, res) => {
  try {
    const { customer, items, total, notes } = req.body;

    if (!customer?.name || !customer?.phone || !items?.length) {
      return res.status(400).json({ error: 'Missing required fields: customer.name, customer.phone, items' });
    }

    // Generate unique order ID
    const orderId = `ML-${Date.now()}`;

    const order = {
      id: orderId,
      customer,
      items,
      total,
      notes: notes || '',
      status: 'pending',       // pending → accepted → fulfilled
      acceptedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order
    await saveOrder(order);

    // Let AI format a clean WhatsApp message
    const message = await formatOrderWithAI(order);

    // Blast to all 4 staff
    await sendToAllStaff(message, orderId);

    res.json({
      success: true,
      orderId,
      message: 'Order received! Our team has been notified and will contact you shortly.',
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// GET /orders — admin dashboard: list all orders
router.get('/', async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/:id — get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /orders/:id/fulfill — staff marks order as fulfilled (updates Excel)
router.patch('/:id/fulfill', async (req, res) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'fulfilled') return res.status(400).json({ error: 'Order already fulfilled' });

    const { updateExcel } = require('../services/excel');
    await updateOrder(order.id, { status: 'fulfilled', updatedAt: new Date().toISOString() });
    await updateExcel(order);

    res.json({ success: true, message: 'Order fulfilled and Excel updated.' });
  } catch (err) {
    console.error('Fulfill error:', err);
    res.status(500).json({ error: 'Failed to fulfill order' });
  }
});

module.exports = router;
