require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initExcel } = require('./services/excel');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/google',   require('./routes/google'));
app.use('/orders',       require('./routes/orders'));
app.use('/webhook',      require('./routes/whatsapp'));

// Admin stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { getAllOrders } = require('./services/orders');
    const fs = require('fs').promises;
    const path = require('path');

    const orders = await getAllOrders();
    let products = [];
    try {
      const data = await fs.readFile(path.resolve(__dirname, 'data/products.json'), 'utf8');
      products = JSON.parse(data);
    } catch {}

    res.json({
      total_products: products.length,
      low_stock:      products.filter(p => p.stock < 5).length,
      total_orders:   orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      revenue:        orders.filter(o => o.status === 'fulfilled').reduce((s, o) => s + (o.total || 0), 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order status update
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { getOrder, updateOrder } = require('./services/orders');
    const order = await getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const updated = await updateOrder(req.params.id, { status: req.body.status, updatedAt: new Date().toISOString() });
    if (req.body.status === 'fulfilled' || req.body.status === 'delivered') {
      const { updateExcel } = require('./services/excel');
      await updateExcel({ ...order, status: req.body.status });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storefront config
app.get('/api/config/storefront', (req, res) => {
  res.json({
    whatsapp_number:     process.env.STAFF_1_NUMBER      || '60182085097',
    bank_name:           process.env.BANK_NAME            || 'Maybank',
    bank_account_name:   process.env.BANK_ACCOUNT_NAME   || 'Master Liquors Sdn Bhd',
    bank_account_number: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initExcel().catch(console.error);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🥃 Master Liquors backend running on port ${PORT}`));
