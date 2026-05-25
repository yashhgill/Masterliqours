const fs = require('fs').promises;
const path = require('path');
const { getAllOrders } = require('./orders');
const { getGoogleAccessToken } = require('./googleAuth');

const PRODUCTS_FILE = path.resolve(__dirname, '../data/products.json');
const SHEET_STATE_FILE = path.resolve(__dirname, '../data/google_sheet_state.json');

async function googleFetch(accessToken, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function readProducts() {
  try {
    return JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function readSheetState() {
  try {
    return JSON.parse(await fs.readFile(SHEET_STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function writeSheetState(state) {
  await fs.mkdir(path.dirname(SHEET_STATE_FILE), { recursive: true });
  await fs.writeFile(SHEET_STATE_FILE, JSON.stringify(state, null, 2));
}

async function createSpreadsheet(accessToken) {
  return googleFetch(accessToken, 'https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: 'Master Liquors Operations' },
      sheets: [
        { properties: { title: 'Inventory' } },
        { properties: { title: 'Orders' } },
      ],
    }),
  });
}

async function ensureSpreadsheet(accessToken) {
  const envSheetId = process.env.GOOGLE_MASTER_SPREADSHEET_ID;
  if (envSheetId) return { spreadsheetId: envSheetId, spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${envSheetId}` };

  const state = await readSheetState();
  if (state.spreadsheetId) {
    return {
      spreadsheetId: state.spreadsheetId,
      spreadsheetUrl: state.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${state.spreadsheetId}`,
    };
  }

  const spreadsheet = await createSpreadsheet(accessToken);
  await writeSheetState({
    spreadsheetId: spreadsheet.spreadsheetId,
    spreadsheetUrl: spreadsheet.spreadsheetUrl,
    createdAt: new Date().toISOString(),
  });
  return spreadsheet;
}

async function ensureTabs(accessToken, spreadsheetId, tabNames) {
  const spreadsheet = await googleFetch(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`
  );
  const existing = new Set((spreadsheet.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean));
  const missing = tabNames.filter((name) => !existing.has(name));

  if (missing.length) {
    await googleFetch(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      }),
    });
  }
}

async function writeValues(accessToken, spreadsheetId, tab, values) {
  const range = encodeURIComponent(`'${tab}'!A:Z`);
  await googleFetch(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    body: '{}',
  });

  const start = encodeURIComponent(`'${tab}'!A1`);
  await googleFetch(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${start}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }
  );
}

function orderDate(order, key) {
  const value = order[key] || order.createdAt || order.created_at;
  return value ? new Date(value).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }) : '';
}

async function syncOperationsToGoogleSheets(user) {
  const accessToken = await getGoogleAccessToken(user.email);
  const spreadsheet = await ensureSpreadsheet(accessToken);
  await ensureTabs(accessToken, spreadsheet.spreadsheetId, ['Inventory', 'Orders']);

  const products = await readProducts();
  const orders = await getAllOrders();

  const inventoryRows = [
    ['Product ID', 'Name', 'Brand', 'Category', 'Price RM', 'Stock', 'Featured'],
    ...products.map((p) => [
      p.id,
      p.name,
      p.brand || '',
      p.category || '',
      p.price_myr || p.price || 0,
      p.stock || 0,
      p.featured ? 'Yes' : 'No',
    ]),
  ];

  const orderRows = [
    ['Order ID', 'Customer', 'Phone', 'Address', 'Items', 'Total RM', 'Status', 'Accepted By', 'Payment', 'Created At', 'Updated At', 'Notes'],
    ...orders.map((order) => [
      order.id || order.order_number,
      order.customer?.name || order.customer_name || '',
      order.customer?.phone || order.phone || '',
      order.customer?.address || order.address || '',
      (order.items || []).map((item) => `${item.quantity}x ${item.name}`).join(', '),
      order.total || 0,
      order.status || '',
      order.acceptedBy || '',
      order.payment_method || '',
      orderDate(order, 'createdAt'),
      orderDate(order, 'updatedAt'),
      order.notes || '',
    ]),
  ];

  await Promise.all([
    writeValues(accessToken, spreadsheet.spreadsheetId, 'Inventory', inventoryRows),
    writeValues(accessToken, spreadsheet.spreadsheetId, 'Orders', orderRows),
  ]);

  return {
    spreadsheetId: spreadsheet.spreadsheetId,
    spreadsheetUrl: spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}`,
    inventoryRows: Math.max(inventoryRows.length - 1, 0),
    orderRows: Math.max(orderRows.length - 1, 0),
  };
}

module.exports = { syncOperationsToGoogleSheets };
