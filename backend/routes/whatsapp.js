const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, STAFF, TEST_MODE } = require('../config');

const WA_API_URL = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendMessage(to, text) {
  // ── TEST MODE: just log, don't actually send ──
  if (TEST_MODE) {
    console.log('\n' + '='.repeat(60));
    console.log(`📲 [TEST MODE] WhatsApp to: ${to}`);
    console.log('-'.repeat(60));
    console.log(text);
    console.log('='.repeat(60) + '\n');
    return true;
  }

  try {
    const response = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`WhatsApp send failed to ${to}:`, data);
      return false;
    }

    console.log(`📲 WhatsApp sent to ${to}`);
    return true;
  } catch (err) {
    console.error(`WhatsApp error sending to ${to}:`, err.message);
    return false;
  }
}

async function sendToAllStaff(message, orderId) {
  if (!STAFF.length) {
    console.warn('⚠️  No staff numbers configured in .env');
    return;
  }

  if (TEST_MODE) {
    console.log(`\n🧪 TEST MODE — Simulating blast to ${STAFF.length} staff for order ${orderId}`);
  }

  const results = await Promise.allSettled(
    STAFF.map((s) => sendMessage(s.number, message))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  console.log(`📨 Order ${orderId} notification sent to ${sent}/${STAFF.length} staff`);
}

module.exports = { sendMessage, sendToAllStaff };