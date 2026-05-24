const express = require('express');
const router = express.Router();
const { WHATSAPP_VERIFY_TOKEN } = require('../config');
const { getOrder, updateOrder } = require('../services/orders');
const { sendMessage } = require('../services/whatsapp');

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return res.sendStatus(404);
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return res.sendStatus(200);

    for (const msg of messages) {
      if (msg.type !== 'text') continue;
      const fromNumber = msg.from;
      const text = msg.text.body.trim().toUpperCase();
      const acceptMatch = text.match(/^ACCEPT\s+(ML-\d+)/);
      const fulfilledMatch = text.match(/^FULFILLED\s+(ML-\d+)/);
      if (acceptMatch) await handleAccept(acceptMatch[1], fromNumber);
      else if (fulfilledMatch) await handleFulfilled(fulfilledMatch[1], fromNumber);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

async function handleAccept(orderId, staffNumber) {
  const order = await getOrder(orderId);
  if (!order) { await sendMessage(staffNumber, `❌ Order ${orderId} not found.`); return; }
  if (order.status !== 'pending') { await sendMessage(staffNumber, `⚠️ Order ${orderId} already claimed.`); return; }
  await updateOrder(orderId, { status: 'accepted', acceptedBy: staffNumber, updatedAt: new Date().toISOString() });
  await sendMessage(staffNumber, `✅ You claimed Order ${orderId}!\n\nCustomer: ${order.customer.name}\nPhone: ${order.customer.phone}\n\nContact the customer directly.\n\nOnce delivered reply: FULFILLED ${orderId}`);
  console.log(`📦 Order ${orderId} accepted by ${staffNumber}`);
}

async function handleFulfilled(orderId, staffNumber) {
  const order = await getOrder(orderId);
  if (!order) { await sendMessage(staffNumber, `❌ Order ${orderId} not found.`); return; }
  if (order.acceptedBy !== staffNumber) { await sendMessage(staffNumber, `⚠️ You didn't claim Order ${orderId}.`); return; }
  if (order.status === 'fulfilled') { await sendMessage(staffNumber, `ℹ️ Order ${orderId} already fulfilled.`); return; }
  const { updateExcel } = require('../services/excel');
  await updateOrder(orderId, { status: 'fulfilled', updatedAt: new Date().toISOString() });
  await updateExcel(order);
  await sendMessage(staffNumber, `🎉 Order ${orderId} fulfilled! Excel updated.`);
  console.log(`✅ Order ${orderId} fulfilled by ${staffNumber}`);
}

module.exports = router;
