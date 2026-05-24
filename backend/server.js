require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ordersRouter = require('./routes/orders');
const whatsappRouter = require('./routes/whatsapp');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/orders', ordersRouter);
app.use('/webhook', whatsappRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Master Liquors Backend' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🥃 Master Liquors backend running on port ${PORT}`));
