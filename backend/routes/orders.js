const express = require('express');
const router = express.Router();
const { formatOrderWithAI } = require('../services/ai');
const { sendToAllStaff } = require('../services/whatsapp');
const { saveOrder, getOrder, updateOrder, getAllOrders } = require('../services/orders');

// POST /orders or /api/orders — accepts both frontend and direct formats
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // ── Normalise: support both frontend format and direct format ──
    const customer = body.customer || {
      name:    body.customer_name,
      phone:   body.phone,
      address: body.address,
    };

    const items = (body.items || []).map(i => ({
      product_id: i.product_id,
      name:       i.name,
      sku:        i.sku || i.product_id || '',
      price:      i.price ?? i.price_myr ?? 0,
      quantity:   i.quantity,
    }));

    const total = body.total
      ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    if (!customer?.name || !customer?.phone || !items?.length) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, items' });
    }

    const orderId = `ML-${Date.now()}`;
    const order = {
      id: orderId,
      order_number: orderId,
      customer,
      customer_name: customer.name,
      phone:         customer.phone,
      address:       customer.address || '',
      items,
      subtotal:      total,
      delivery_fee:  0,
      total,
      notes:         body.notes || '',
      payment_method: body.payment_method || 'cash',
      status:        'pending',
      acceptedBy:    null,
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    };

    await saveOrder(order);

    const message = await formatOrderWithAI(order);
    await sendToAllStaff(message, orderId);

    // Return in frontend-compatible format
    res.json({
      success:      true,
      orderId,
      order_number: orderId,
      ...order,
      message: 'Order received! Our team has been notified and will contact you shortly.',
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// GET /orders — list all orders
router.get('/', async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /orders/:id/fulfill
router.patch('/:id/fulfill', async (req, res) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'fulfilled') return res.status(400).json({ error: 'Already fulfilled' });
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
