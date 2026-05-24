const ExcelJS = require('exceljs');
const path = require('path');

const STAFF_FILE  = path.resolve(__dirname, '../data/staff_yash.xlsx');
const MASTER_FILE = path.resolve(__dirname, '../data/master_dashboard.xlsx');

async function updateExcel(order) {
  const now = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
  const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  // ── Update Staff file ────────────────────────────────────────
  const staffWb = new ExcelJS.Workbook();
  await staffWb.xlsx.readFile(STAFF_FILE);
  const staffWs = staffWb.getWorksheet('My Orders');

  // Find first empty row after header (row 2)
  let staffRow = 3;
  while (staffWs.getCell(`A${staffRow}`).value) staffRow++;

  staffWs.getCell(`A${staffRow}`).value = order.id;
  staffWs.getCell(`B${staffRow}`).value = order.customer.name;
  staffWs.getCell(`C${staffRow}`).value = order.customer.phone;
  staffWs.getCell(`D${staffRow}`).value = order.customer.address || '';
  staffWs.getCell(`E${staffRow}`).value = itemsSummary;
  staffWs.getCell(`F${staffRow}`).value = order.total;
  staffWs.getCell(`F${staffRow}`).numFmt = '#,##0.00';
  staffWs.getCell(`G${staffRow}`).value = now;           // Order Placed
  staffWs.getCell(`H${staffRow}`).value = now;           // Date Accepted
  staffWs.getCell(`I${staffRow}`).value = '';            // Date Out for Delivery
  staffWs.getCell(`J${staffRow}`).value = '';            // Date Fulfilled
  staffWs.getCell(`K${staffRow}`).value = 'Accept';      // Status dropdown
  staffWs.getCell(`L${staffRow}`).value = order.notes || '';

  await staffWb.xlsx.writeFile(STAFF_FILE);

  // ── Update Master file ───────────────────────────────────────
  const masterWb = new ExcelJS.Workbook();
  await masterWb.xlsx.readFile(MASTER_FILE);
  const masterWs = masterWb.getWorksheet('Master Orders');

  let masterRow = 3;
  while (masterWs.getCell(`A${masterRow}`).value) masterRow++;

  masterWs.getCell(`A${masterRow}`).value = order.id;
  masterWs.getCell(`B${masterRow}`).value = order.customer.name;
  masterWs.getCell(`C${masterRow}`).value = order.customer.phone;
  masterWs.getCell(`D${masterRow}`).value = order.customer.address || '';
  masterWs.getCell(`E${masterRow}`).value = itemsSummary;
  masterWs.getCell(`F${masterRow}`).value = order.total;
  masterWs.getCell(`F${masterRow}`).numFmt = '#,##0.00';
  masterWs.getCell(`G${masterRow}`).value = 'Yash';
  masterWs.getCell(`H${masterRow}`).value = now;         // Order Placed
  masterWs.getCell(`I${masterRow}`).value = now;         // Date Accepted
  masterWs.getCell(`J${masterRow}`).value = '';          // Date Out for Delivery
  masterWs.getCell(`K${masterRow}`).value = '';          // Date Fulfilled
  masterWs.getCell(`L${masterRow}`).value = 'Accept';    // Status
  masterWs.getCell(`M${masterRow}`).value = order.notes || '';

  await masterWb.xlsx.writeFile(MASTER_FILE);

  console.log(`📊 Excel updated for order ${order.id} — row ${staffRow} (staff), row ${masterRow} (master)`);
}

async function initExcel() {
  // Just verify both files exist
  const fs = require('fs');
  if (!fs.existsSync(STAFF_FILE))  console.warn('⚠️  staff_yash.xlsx not found in data/');
  if (!fs.existsSync(MASTER_FILE)) console.warn('⚠️  master_dashboard.xlsx not found in data/');
  console.log('📊 Excel files ready');
}

module.exports = { updateExcel, initExcel };
