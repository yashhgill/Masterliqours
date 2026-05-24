const fs = require('fs').promises;
const path = require('path');
const { ORDERS_FILE } = require('../config');

const ORDERS_PATH = path.resolve(__dirname, '..', ORDERS_FILE);

async function readOrders() {
  try {
    const data = await fs.readFile(ORDERS_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeOrders(orders) {
  await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

async function saveOrder(order) {
  const orders = await readOrders();
  orders[order.id] = order;
  await writeOrders(orders);
}

async function getOrder(id) {
  const orders = await readOrders();
  return orders[id] || null;
}

async function updateOrder(id, updates) {
  const orders = await readOrders();
  if (!orders[id]) throw new Error(`Order ${id} not found`);
  orders[id] = { ...orders[id], ...updates };
  await writeOrders(orders);
  return orders[id];
}

async function getAllOrders() {
  const orders = await readOrders();
  return Object.values(orders).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

module.exports = { saveOrder, getOrder, updateOrder, getAllOrders };
