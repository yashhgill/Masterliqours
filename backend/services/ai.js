const { GEMINI_API_KEY } = require('../config');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function formatOrderWithAI(order) {
  try {
    const prompt = `You are an order notification formatter for Master Liquors, a premium liquor delivery service in Kuala Lumpur.

Format the following order into a clear, concise WhatsApp message to send to staff members.

Order details:
- Order ID: ${order.id}
- Customer Name: ${order.customer.name}
- Customer Phone: ${order.customer.phone}
- Customer Address: ${order.customer.address || 'Not provided'}
- Items: ${order.items.map(i => `${i.quantity}x ${i.name} (RM ${i.price} each)`).join(', ')}
- Order Total: RM ${order.total}
- Notes: ${order.notes || 'None'}
- Time: ${new Date(order.createdAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}

Rules:
- Use emojis sparingly but effectively
- Keep it under 20 lines
- End with exactly this line: Reply *ACCEPT ${order.id}* to claim this order.
- Do NOT add any extra commentary`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) return text;
    return buildFallbackMessage(order);
  } catch (err) {
    console.error('Gemini formatting failed, using fallback:', err.message);
    return buildFallbackMessage(order);
  }
}

function buildFallbackMessage(order) {
  const itemsList = order.items
    .map(i => `  • ${i.quantity}x ${i.name} — RM ${(i.price * i.quantity).toFixed(2)}`)
    .join('\n');

  return `🛒 *NEW ORDER — ${order.id}*

👤 Customer: ${order.customer.name}
📞 Phone: ${order.customer.phone}
📍 Address: ${order.customer.address || 'Not provided'}

📦 Items:
${itemsList}

💰 Total: RM ${order.total}
${order.notes ? `📝 Notes: ${order.notes}` : ''}

⏰ ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}

Reply *ACCEPT ${order.id}* to claim this order.`;
}

module.exports = { formatOrderWithAI };