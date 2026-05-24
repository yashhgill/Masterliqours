const ExcelJS = require('exceljs');
const path = require('path');
const { EXCEL_FILE, STAFF } = require('../config');

const EXCEL_PATH = path.resolve(__dirname, '..', EXCEL_FILE);

const SALES_COLS    = ['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Total (RM)', 'Staff', 'Status'];
const INV_COLS      = ['SKU', 'Product Name', 'Category', 'Unit Price (RM)', 'Stock Qty', 'Low Stock Alert', 'Last Updated'];
const STAFF_COLS    = ['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Total (RM)', 'Status'];

const SAMPLE_PRODUCTS = [
  ['JW-BLK',  'Johnnie Walker Black Label', 'Whisky',   189, 50, 10],
  ['JW-RED',  'Johnnie Walker Red Label',   'Whisky',   119, 80, 15],
  ['HEN-VS',  'Hennessy VS',               'Cognac',   199, 40,  8],
  ['HEN-VSOP','Hennessy VSOP',             'Cognac',   299, 25,  5],
  ['GRY-GOS', 'Grey Goose Vodka',          'Vodka',    179, 35,  8],
  ['HEN-GIN', "Hendrick's Gin",            'Gin',      159, 30,  6],
  ['JAM-IRI', 'Jameson Irish Whiskey',     'Whiskey',  129, 45, 10],
  ['CIR-VOD', 'Cîroc Vodka',              'Vodka',    169, 20,  5],
];

// Staff sheet names — use real names from config or fallback
function staffSheetName(index) {
  const s = STAFF[index];
  return s ? `Staff - ${s.name}` : `Staff ${index + 1}`;
}

async function ensureWorkbook() {
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.readFile(EXCEL_PATH); } catch { /* new file */ }

  // ── Sales sheet ──────────────────────────────────────────────
  let sales = wb.getWorksheet('Sales') || wb.addWorksheet('Sales');
  if (!sales.getRow(1).getCell(1).value) {
    const h = sales.addRow(SALES_COLS);
    styleHeader(h, '1A1A2E', 'FF107A');
    sales.columns = [
      { key: 'orderId',  width: 18 }, { key: 'date',     width: 22 },
      { key: 'customer', width: 20 }, { key: 'phone',    width: 18 },
      { key: 'items',    width: 45 }, { key: 'total',    width: 15 },
      { key: 'staff',    width: 20 }, { key: 'status',   width: 14 },
    ];
    sales.views = [{ state: 'frozen', ySplit: 1 }];
  }

  // ── Inventory sheet ──────────────────────────────────────────
  let inv = wb.getWorksheet('Inventory') || wb.addWorksheet('Inventory');
  if (!inv.getRow(1).getCell(1).value) {
    const h = inv.addRow(INV_COLS);
    styleHeader(h, '1A1A2E', 'FDE047');
    inv.columns = [
      { key: 'sku',      width: 14 }, { key: 'name',     width: 30 },
      { key: 'category', width: 16 }, { key: 'price',    width: 18 },
      { key: 'stock',    width: 14 }, { key: 'alert',    width: 20 },
      { key: 'updated',  width: 22 },
    ];
    const now = new Date().toLocaleDateString('en-MY');
    SAMPLE_PRODUCTS.forEach(([sku, name, cat, price, stock, alert]) => {
      const row = inv.addRow([sku, name, cat, price, stock, alert, now]);
      colorStockCell(row.getCell(5), stock, alert);
    });
    inv.views = [{ state: 'frozen', ySplit: 1 }];
  }

  // ── 4 individual staff sheets ────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const sheetName = staffSheetName(i);
    let sheet = wb.getWorksheet(sheetName) || wb.addWorksheet(sheetName);
    if (!sheet.getRow(1).getCell(1).value) {
      // Pick a different accent color per staff member
      const colors = ['FF107A', '39FF14', '00D4FF', 'FDE047'];
      const h = sheet.addRow(STAFF_COLS);
      styleHeader(h, '1A1A2E', colors[i]);
      sheet.columns = [
        { key: 'orderId',  width: 18 }, { key: 'date',     width: 22 },
        { key: 'customer', width: 20 }, { key: 'phone',    width: 18 },
        { key: 'items',    width: 45 }, { key: 'total',    width: 15 },
        { key: 'status',   width: 14 },
      ];
      sheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Add a label in the top-right so each staff knows whose sheet it is
      const staffInfo = STAFF[i];
      if (staffInfo) {
        sheet.getCell('I1').value = `📋 ${staffInfo.name}'s Orders`;
        sheet.getCell('I1').font = { bold: true, color: { argb: `FF${colors[i]}` }, size: 12 };
      }
    }
  }

  return wb;
}

async function updateExcel(order) {
  const wb = await ensureWorkbook();
  const salesSheet = wb.getWorksheet('Sales');
  const invSheet   = wb.getWorksheet('Inventory');

  const now = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
  const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  // ── Append to main Sales sheet ───────────────────────────────
  const salesRow = salesSheet.addRow([
    order.id, now, order.customer.name, order.customer.phone,
    itemsSummary, order.total, order.acceptedBy || 'Unknown', 'Fulfilled',
  ]);
  salesRow.getCell(6).numFmt = '#,##0.00';
  salesRow.getCell(8).font = { color: { argb: 'FF39FF14' }, bold: true };

  // ── Append to the staff member's own sheet ───────────────────
  const staffNumber = order.acceptedBy;
  if (staffNumber) {
    const staffIndex = STAFF.findIndex(s => s.number === staffNumber);
    if (staffIndex !== -1) {
      const staffSheet = wb.getWorksheet(staffSheetName(staffIndex));
      if (staffSheet) {
        const staffRow = staffSheet.addRow([
          order.id, now, order.customer.name, order.customer.phone,
          itemsSummary, order.total, 'Fulfilled',
        ]);
        staffRow.getCell(6).numFmt = '#,##0.00';
        staffRow.getCell(7).font = { color: { argb: 'FF39FF14' }, bold: true };

        // Running total formula for each staff sheet
        const last = staffSheet.rowCount;
        staffSheet.getCell(`E${last + 1}`).value = 'MY TOTAL:';
        staffSheet.getCell(`E${last + 1}`).font = { bold: true };
        staffSheet.getCell(`F${last + 1}`).value = { formula: `=SUM(F2:F${last})` };
        staffSheet.getCell(`F${last + 1}`).font = { bold: true, color: { argb: 'FFFDE047' } };
        staffSheet.getCell(`F${last + 1}`).numFmt = '#,##0.00';
      }
    }
  }

  // ── Decrement inventory stock ────────────────────────────────
  for (const item of order.items) {
    const lookup = (item.sku || item.name || '').toLowerCase();
    for (let r = 2; r <= invSheet.rowCount; r++) {
      const row = invSheet.getRow(r);
      const rowSku  = String(row.getCell(1).value || '').toLowerCase();
      const rowName = String(row.getCell(2).value || '').toLowerCase();
      if (rowSku === lookup || rowName.includes(lookup) || lookup.includes(rowName)) {
        const newStock = Math.max(0, (Number(row.getCell(5).value) || 0) - item.quantity);
        const alert    = Number(row.getCell(6).value) || 0;
        row.getCell(5).value = newStock;
        row.getCell(7).value = now;
        colorStockCell(row.getCell(5), newStock, alert);
        row.commit();
        break;
      }
    }
  }

  // ── Grand total row on Sales sheet ──────────────────────────
  const lastSales = salesSheet.rowCount;
  salesSheet.getCell(`E${lastSales + 1}`).value = 'TOTAL REVENUE:';
  salesSheet.getCell(`E${lastSales + 1}`).font = { bold: true };
  salesSheet.getCell(`F${lastSales + 1}`).value = { formula: `=SUM(F2:F${lastSales})` };
  salesSheet.getCell(`F${lastSales + 1}`).font = { bold: true, color: { argb: 'FFFDE047' } };
  salesSheet.getCell(`F${lastSales + 1}`).numFmt = '#,##0.00';

  const fs = require('fs').promises;
  await fs.mkdir(path.dirname(EXCEL_PATH), { recursive: true });
  await wb.xlsx.writeFile(EXCEL_PATH);
  console.log(`📊 Excel updated for order ${order.id}`);
}

async function initExcel() {
  const wb = await ensureWorkbook();
  const fs = require('fs').promises;
  await fs.mkdir(path.dirname(EXCEL_PATH), { recursive: true });
  await wb.xlsx.writeFile(EXCEL_PATH);
  console.log('📊 Excel workbook ready:', EXCEL_PATH);
}

function styleHeader(row, bgHex, textHex) {
  row.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: `FF${textHex}` }, name: 'Arial', size: 11 };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgHex}` } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = { bottom: { style: 'medium', color: { argb: `FF${textHex}` } } };
  });
  row.height = 22;
}

function colorStockCell(cell, stock, alert) {
  if (stock <= 0)     cell.font = { color: { argb: 'FFFF0000' }, bold: true };
  else if (stock <= alert) cell.font = { color: { argb: 'FFFF107A' }, bold: true };
  else                cell.font = { color: { argb: 'FF39FF14' } };
}

module.exports = { updateExcel, initExcel };