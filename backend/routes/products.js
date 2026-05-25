const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.resolve(__dirname, '../data/products.json');

async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch { return []; }
}

async function writeProducts(products) {
  await fs.mkdir(path.dirname(PRODUCTS_FILE), { recursive: true });
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// GET /products/categories — MUST be before /:id
router.get('/categories', async (req, res) => {
  const products = await readProducts();
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  res.json(cats);
});

// GET /products — with optional filters
router.get('/', async (req, res) => {
  let products = await readProducts();

  const { category, search, featured } = req.query;

  if (category && category !== 'all') {
    products = products.filter(p =>
      p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  if (featured === 'true') {
    products = products.filter(p => p.featured === true);
  }

  res.json(products);
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  const products = await readProducts();
  const p = products.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// POST /products
router.post('/', async (req, res) => {
  const products = await readProducts();
  const product = {
    id: `prod_${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
  };
  products.push(product);
  await writeProducts(products);
  res.json(product);
});

// PUT /products/:id
router.put('/:id', async (req, res) => {
  const products = await readProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  products[idx] = { ...products[idx], ...req.body };
  await writeProducts(products);
  res.json(products[idx]);
});

// DELETE /products/:id
router.delete('/:id', async (req, res) => {
  let products = await readProducts();
  products = products.filter(p => p.id !== req.params.id);
  await writeProducts(products);
  res.json({ ok: true });
});

module.exports = router;
