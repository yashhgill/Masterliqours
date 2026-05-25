module.exports = {
  // Staff names + WhatsApp numbers (international format, no + sign)
  STAFF: [
    { name: process.env.STAFF_1_NAME || 'Staff 1', number: process.env.STAFF_1_NUMBER, email: process.env.STAFF_1_EMAIL },
    { name: process.env.STAFF_2_NAME || 'Staff 2', number: process.env.STAFF_2_NUMBER, email: process.env.STAFF_2_EMAIL },
    { name: process.env.STAFF_3_NAME || 'Staff 3', number: process.env.STAFF_3_NUMBER, email: process.env.STAFF_3_EMAIL },
    { name: process.env.STAFF_4_NAME || 'Staff 4', number: process.env.STAFF_4_NUMBER, email: process.env.STAFF_4_EMAIL },
  ].filter(s => s.number),

  // Shortcut: just numbers for backward compat
  get STAFF_NUMBERS() { return this.STAFF.map(s => s.number); },

  // WhatsApp Business API
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'masterliquors_webhook_secret',

  // Gemini AI
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  // TEST MODE — set TEST_MODE=true in .env to skip real WhatsApp sends
  TEST_MODE: process.env.TEST_MODE === 'true',

  // Paths
  ORDERS_FILE: './data/orders.json',
  EXCEL_FILE: './data/inventory_sales.xlsx',
};