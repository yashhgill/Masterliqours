const { GROQ_API_KEY } = require('../config');

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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (text) return text;
    return buildFallbackMessage(order);
  } catch (err) {
    console.error('Groq formatting failed, using fallback:', err.message);
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
