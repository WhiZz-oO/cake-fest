/**
 * SMYM Christmas Cake Fest 2026
 * Google Apps Script web app backend for Google Sheets.
 *
 * Setup:
 * 1. Open your Google Spreadsheet (Extensions > Apps Script).
 * 2. Replace Code.gs with this entire file.
 * 3. In the toolbar, select "setupSheets" and click "Run".
 *    This will create/update column headers in "Form Responses 1" (or "Orders")
 *    and also create/update the live "Cake Summary" dashboard!
 * 4. Click Deploy > Manage Deployments > Edit (Pencil) > Version: New version > Deploy.
 */

const PRODUCT_DEFAULTS = [
  { id: 'carrot-05', name: 'Carrot Cake', weight: '½ kg', price: '', colLetter: 'G' },
  { id: 'carrot-1', name: 'Carrot Cake', weight: '1 kg', price: '', colLetter: 'H' },
  { id: 'pineapple-05', name: 'Pineapple Cake', weight: '½ kg', price: '', colLetter: 'I' },
  { id: 'pineapple-1', name: 'Pineapple Cake', weight: '1 kg', price: '', colLetter: 'J' },
  { id: 'marble-05', name: 'Marble Cake', weight: '½ kg', price: '', colLetter: 'K' },
  { id: 'marble-1', name: 'Marble Cake', weight: '1 kg', price: '', colLetter: 'L' },
  { id: 'plum-05', name: 'Plum Cake', weight: '½ kg', price: '', colLetter: 'M' },
  { id: 'plum-1', name: 'Plum Cake', weight: '1 kg', price: '', colLetter: 'N' }
];

const DEFAULT_SETTINGS = {
  pickupDate: '2026-12-21',
  orderDeadline: '',
  campaignOpen: true,
  pickupLocation: '12 Apostles Church, Chemmalamattom'
};

const ORDER_HEADERS = [
  'Order ID',           // Col 1 (A)
  'Submitted At',       // Col 2 (B)
  'Name',               // Col 3 (C)
  'House Name',         // Col 4 (D)
  'Phone Number',       // Col 5 (E)
  'Ward Number',        // Col 6 (F)
  'Carrot (½ kg)',      // Col 7 (G)
  'Carrot (1 kg)',      // Col 8 (H)
  'Pineapple (½ kg)',   // Col 9 (I)
  'Pineapple (1 kg)',   // Col 10 (J)
  'Marble (½ kg)',      // Col 11 (K)
  'Marble (1 kg)',      // Col 12 (L)
  'Plum (½ kg)',        // Col 13 (M)
  'Plum (1 kg)',        // Col 14 (N)
  'Total Cakes',        // Col 15 (O)
  'Total Amount (INR)', // Col 16 (P)
  'Pickup Date',        // Col 17 (Q)
  'Order Status',       // Col 18 (R)
  'Payment Method',     // Col 19 (S)
  'Delivered At'        // Col 20 (T)
];

const CAKE_SPECS = [
  { id: 'carrot-05', name: 'Carrot Cake', weight: '½ kg', colIndex: 7 },
  { id: 'carrot-1', name: 'Carrot Cake', weight: '1 kg', colIndex: 8 },
  { id: 'pineapple-05', name: 'Pineapple Cake', weight: '½ kg', colIndex: 9 },
  { id: 'pineapple-1', name: 'Pineapple Cake', weight: '1 kg', colIndex: 10 },
  { id: 'marble-05', name: 'Marble Cake', weight: '½ kg', colIndex: 11 },
  { id: 'marble-1', name: 'Marble Cake', weight: '1 kg', colIndex: 12 },
  { id: 'plum-05', name: 'Plum Cake', weight: '½ kg', colIndex: 13 },
  { id: 'plum-1', name: 'Plum Cake', weight: '1 kg', colIndex: 14 }
];

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action === 'config') return jsonResponse(getPublicConfig());
  if (action === 'getOrders') return jsonResponse(getOrdersList());
  return jsonResponse({ success: true, service: 'SMYM Christmas Cake Fest order service' });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (payload.action === 'submitOrder') return jsonResponse(saveOrder(payload.order));
    if (payload.action === 'getOrders') return jsonResponse(getOrdersList());
    if (payload.action === 'markDelivered') return jsonResponse(markOrderDelivered(payload.orderId, payload.paymentMethod));
    if (payload.action === 'markPending') return jsonResponse(markOrderPending(payload.orderId));
    return jsonResponse({ success: false, message: 'Unknown action: ' + payload.action });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message || 'Could not process the request.' });
  }
}

function getOrdersSheet(ss) {
  // Use "Form Responses 1" if available, else "Orders"
  return ss.getSheetByName('Form Responses 1') || ss.getSheetByName('Orders') || ss.insertSheet('Form Responses 1');
}

function setupSheets() {
  const ss = getSpreadsheet();

  // 1. Setup Form Responses 1 (or Orders) sheet
  const orderSheet = getOrdersSheet(ss);
  if (orderSheet.getLastRow() === 0) {
    orderSheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
    orderSheet.setFrozenRows(1);
    orderSheet.getRange(1, 1, 1, ORDER_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#4b1724')
      .setFontColor('#ffffff');
  } else {
    // Ensure all columns (including Payment Method and Delivered At) exist in header
    ensureDeliveryHeaders_(orderSheet);
  }

  // Also format 'Orders' if present and empty
  const altSheet = ss.getSheetByName('Orders');
  if (altSheet && altSheet.getName() !== orderSheet.getName()) {
    if (altSheet.getLastRow() === 0) {
      altSheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
      altSheet.setFrozenRows(1);
      altSheet.getRange(1, 1, 1, ORDER_HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#4b1724')
        .setFontColor('#ffffff');
    } else {
      ensureDeliveryHeaders_(altSheet);
    }
  }

  // 2. Setup Products sheet
  let products = ss.getSheetByName('Products');
  if (!products) products = ss.insertSheet('Products');
  if (products.getLastRow() === 0) {
    const prodHeaders = ['Product ID', 'Cake Name', 'Weight', 'Price (INR)', 'Available'];
    products.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);
    products.setFrozenRows(1);
    products.getRange(1, 1, 1, prodHeaders.length).setFontWeight('bold').setBackground('#4b1724').setFontColor('#ffffff');
    products.getRange(2, 1, PRODUCT_DEFAULTS.length, 5).setValues(PRODUCT_DEFAULTS.map(p => [p.id, p.name, p.weight, p.price, true]));
  }

  // 3. Setup Settings sheet
  let settings = ss.getSheetByName('Settings');
  if (!settings) settings = ss.insertSheet('Settings');
  if (settings.getLastRow() === 0) {
    const setHeaders = ['Setting', 'Value'];
    settings.getRange(1, 1, 1, setHeaders.length).setValues([setHeaders]);
    settings.setFrozenRows(1);
    settings.getRange(1, 1, 1, setHeaders.length).setFontWeight('bold').setBackground('#4b1724').setFontColor('#ffffff');
    settings.getRange(2, 1, 4, 2).setValues([
      ['pickupDate', DEFAULT_SETTINGS.pickupDate],
      ['orderDeadline', DEFAULT_SETTINGS.orderDeadline],
      ['campaignOpen', 'true'],
      ['pickupLocation', DEFAULT_SETTINGS.pickupLocation]
    ]);
  }

  // 4. Setup Live Cake Summary tab (Auto-calculates totals for Bakery and Wards)
  setupSummarySheet_(ss, orderSheet.getName());

  return 'Setup completed! Customer orders will be saved with Name, House Name, Phone Number, Ward Number and individual cake columns, plus payment & delivery tracking.';
}

function ensureDeliveryHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 19 || !sheet.getRange(1, 19).getValue()) {
    sheet.getRange(1, 19).setValue('Payment Method')
      .setFontWeight('bold')
      .setBackground('#4b1724')
      .setFontColor('#ffffff');
  }
  if (lastCol < 20 || !sheet.getRange(1, 20).getValue()) {
    sheet.getRange(1, 20).setValue('Delivered At')
      .setFontWeight('bold')
      .setBackground('#4b1724')
      .setFontColor('#ffffff');
  }
}

function setupSummarySheet_(ss, orderSheetName) {
  let summary = ss.getSheetByName('Cake Summary');
  if (!summary) summary = ss.insertSheet('Cake Summary');

  // Title Banner
  summary.getRange('A1:E1').merge()
    .setValue('SMYM CHEMMALAMATTOM - CHRISTMAS CAKE FEST 2026 (LIVE BAKERY SUMMARY)')
    .setFontWeight('bold')
    .setBackground('#4b1724')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Table Headers
  const headers = ['Product ID', 'Cake Variety', 'Weight', 'Total Boxes Ordered (Live)', 'Order Sheet Column'];
  summary.getRange(3, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#d7b66f')
    .setFontColor('#321b16');

  // Formulas referencing each cake column in Form Responses 1
  const sName = "'" + orderSheetName + "'";
  const rows = [
    ['carrot-05', 'Carrot Cake', '½ kg', '=SUM(' + sName + '!G2:G)', 'Column G'],
    ['carrot-1', 'Carrot Cake', '1 kg', '=SUM(' + sName + '!H2:H)', 'Column H'],
    ['pineapple-05', 'Pineapple Cake', '½ kg', '=SUM(' + sName + '!I2:I)', 'Column I'],
    ['pineapple-1', 'Pineapple Cake', '1 kg', '=SUM(' + sName + '!J2:J)', 'Column J'],
    ['marble-05', 'Marble Cake', '½ kg', '=SUM(' + sName + '!K2:K)', 'Column K'],
    ['marble-1', 'Marble Cake', '1 kg', '=SUM(' + sName + '!L2:L)', 'Column L'],
    ['plum-05', 'Plum Cake', '½ kg', '=SUM(' + sName + '!M2:M)', 'Column M'],
    ['plum-1', 'Plum Cake', '1 kg', '=SUM(' + sName + '!N2:N)', 'Column N'],
    ['TOTAL', 'ALL CAKES', 'All Sizes', '=SUM(D4:D11)', 'Total Boxes'],
    ['REVENUE', 'GRAND TOTAL', 'INR', '=SUM(' + sName + '!P2:P)', 'Total Amount']
  ];

  summary.getRange(4, 1, rows.length, headers.length).setValues(rows);
  summary.getRange('A12:E13').setFontWeight('bold').setBackground('#f8f1e7');

  summary.setColumnWidth(1, 110);
  summary.setColumnWidth(2, 160);
  summary.setColumnWidth(3, 100);
  summary.setColumnWidth(4, 210);
  summary.setColumnWidth(5, 150);

  // Ward distribution formula
  summary.getRange('A16:D16').merge()
    .setValue('WARD-WISE DISTRIBUTION BREAKDOWN (AUTOMATIC)')
    .setFontWeight('bold')
    .setBackground('#4b1724')
    .setFontColor('#ffffff');

  summary.getRange('A17').setFormula(
    '=QUERY(' + sName + '!A1:T, "SELECT F, COUNT(A), SUM(O), SUM(P) WHERE A IS NOT NULL AND F IS NOT NULL GROUP BY F ORDER BY F LABEL F \'Ward Number\', COUNT(A) \'Total Families Ordered\', SUM(O) \'Total Cakes\', SUM(P) \'Total Amount (INR)\'", 1)'
  );
}

function getProductPrices_(ss) {
  const productSheet = ss.getSheetByName('Products');
  const priceMap = {};
  if (productSheet && productSheet.getLastRow() > 1) {
    const rows = productSheet.getRange(2, 1, productSheet.getLastRow() - 1, 4).getValues();
    rows.forEach(r => {
      if (r[0]) priceMap[String(r[0])] = Number(r[3]) || 0;
    });
  }
  return priceMap;
}

function getPublicConfig() {
  const ss = getSpreadsheet();
  const productSheet = ss.getSheetByName('Products');
  let products = PRODUCT_DEFAULTS;
  if (productSheet && productSheet.getLastRow() > 1) {
    const rows = productSheet.getRange(2, 1, productSheet.getLastRow() - 1, 5).getValues();
    products = rows.filter(r => r[0]).map(r => ({
      id: String(r[0]),
      name: String(r[1]),
      weight: String(r[2]),
      price: r[3] === '' ? null : Number(r[3]),
      available: String(r[4]).toLowerCase() !== 'false'
    }));
  }
  const settings = getSettings_();
  return { success: true, products: products.filter(p => p.available), settings };
}

function getOrdersList() {
  const ss = getSpreadsheet();
  const sheet = getOrdersSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, orders: [] };
  }

  ensureDeliveryHeaders_(sheet);

  const numCols = Math.max(sheet.getLastColumn(), 20);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const productPrices = getProductPrices_(ss);

  const orders = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const orderId = String(row[0] || '').trim();
    if (!orderId) continue;

    const items = [];
    CAKE_SPECS.forEach(spec => {
      const qty = Number(row[spec.colIndex - 1]) || 0;
      if (qty > 0) {
        const unitPrice = productPrices[spec.id] || 0;
        items.push({
          id: spec.id,
          name: spec.name,
          weight: spec.weight,
          quantity: qty,
          unitPrice: unitPrice,
          subtotal: unitPrice ? unitPrice * qty : 0
        });
      }
    });

    const submittedAtRaw = row[1];
    let submittedAt = '';
    if (submittedAtRaw instanceof Date) {
      submittedAt = Utilities.formatDate(submittedAtRaw, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    } else {
      submittedAt = String(submittedAtRaw || '');
    }

    const deliveredAtRaw = row[19];
    let deliveredAt = '';
    if (deliveredAtRaw instanceof Date) {
      deliveredAt = Utilities.formatDate(deliveredAtRaw, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    } else {
      deliveredAt = String(deliveredAtRaw || '');
    }

    orders.push({
      rowIndex: i + 2,
      orderId: orderId,
      submittedAt: submittedAt,
      name: String(row[2] || '').trim(),
      houseName: String(row[3] || '').trim(),
      phone: String(row[4] || '').trim(),
      ward: Number(row[5]) || '',
      items: items,
      totalCakes: Number(row[14]) || 0,
      totalAmount: Number(row[15]) || 0,
      pickupDate: row[16] instanceof Date ? Utilities.formatDate(row[16], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[16] || ''),
      status: String(row[17] || 'New').trim(),
      paymentMethod: String(row[18] || '').trim(),
      deliveredAt: deliveredAt
    });
  }

  // Reverse so latest orders are listed first
  orders.reverse();
  return { success: true, orders: orders };
}

function markOrderDelivered(orderId, paymentMethod) {
  if (!orderId) throw new Error('Order ID is required.');
  const method = paymentMethod === 'GPay' ? 'GPay' : 'Cash';

  const ss = getSpreadsheet();
  const sheet = getOrdersSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error('No orders found in sheet.');

  ensureDeliveryHeaders_(sheet);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let targetRow = -1;
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim().toUpperCase() === String(orderId).trim().toUpperCase()) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) throw new Error('Order not found with reference: ' + orderId);

    const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    // Update Col 18 (Order Status), Col 19 (Payment Method), Col 20 (Delivered At)
    sheet.getRange(targetRow, 18, 1, 3).setValues([['Delivered', method, nowStr]]);

    // Turn the customer's entire row into GREEN color (#d9ead3 is soft, elegant, highly readable green)
    const totalCols = Math.max(sheet.getLastColumn(), 20);
    sheet.getRange(targetRow, 1, 1, totalCols).setBackground('#d9ead3');

    return {
      success: true,
      orderId: orderId,
      status: 'Delivered',
      paymentMethod: method,
      deliveredAt: nowStr
    };
  } finally {
    lock.releaseLock();
  }
}

function markOrderPending(orderId) {
  if (!orderId) throw new Error('Order ID is required.');

  const ss = getSpreadsheet();
  const sheet = getOrdersSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error('No orders found in sheet.');

  ensureDeliveryHeaders_(sheet);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let targetRow = -1;
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim().toUpperCase() === String(orderId).trim().toUpperCase()) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) throw new Error('Order not found with reference: ' + orderId);

    // Reset Col 18 (Order Status) to 'New', Col 19 to '', Col 20 to ''
    sheet.getRange(targetRow, 18, 1, 3).setValues([['New', '', '']]);

    // Reset row background to clean white
    const totalCols = Math.max(sheet.getLastColumn(), 20);
    sheet.getRange(targetRow, 1, 1, totalCols).setBackground('#ffffff');

    return {
      success: true,
      orderId: orderId,
      status: 'New',
      paymentMethod: '',
      deliveredAt: ''
    };
  } finally {
    lock.releaseLock();
  }
}

function saveOrder(order) {
  if (!order || !order.customer || !Array.isArray(order.items)) throw new Error('Order information is incomplete.');
  const settings = getSettings_();
  if (!settings.campaignOpen) throw new Error('Pre-orders are currently closed.');
  if (settings.orderDeadline && new Date() > new Date(settings.orderDeadline + 'T23:59:59')) throw new Error('The order deadline has passed.');

  const c = order.customer;
  const name = cleanText_(c.fullName, 100);
  const phone = cleanText_(c.phone, 18);
  const house = cleanText_(c.houseName, 100);
  const ward = Number(c.ward);
  if (!name || !/^[0-9+() -]{7,18}$/.test(phone) || !house || !Number.isInteger(ward) || ward < 1 || ward > 30) {
    throw new Error('Please check your customer details and try again.');
  }
  if (order.items.length < 1 || order.items.length > PRODUCT_DEFAULTS.length) throw new Error('Please select at least one valid cake.');

  const ss = getSpreadsheet();
  const productSheet = ss.getSheetByName('Products');
  const rows = productSheet.getRange(2, 1, Math.max(productSheet.getLastRow() - 1, 1), 5).getValues();
  const productMap = {};
  rows.forEach(r => {
    if (r[0]) productMap[String(r[0])] = { id: String(r[0]), name: String(r[1]), weight: String(r[2]), price: Number(r[3]), available: String(r[4]).toLowerCase() !== 'false' };
  });

  const qtyMap = {
    'carrot-05': 0,
    'carrot-1': 0,
    'pineapple-05': 0,
    'pineapple-1': 0,
    'marble-05': 0,
    'marble-1': 0,
    'plum-05': 0,
    'plum-1': 0
  };

  let total = 0;
  let totalQty = 0;
  const seen = {};

  order.items.forEach(item => {
    const p = productMap[String(item.id)];
    const qty = Number(item.quantity);
    if (!p || !p.available || seen[p.id] || !Number.isInteger(qty) || qty < 1 || qty > 9 || !(p.price > 0)) {
      throw new Error('One selected cake is unavailable or does not have a confirmed price. Please refresh or contact SMYM.');
    }
    seen[p.id] = true;
    if (qtyMap.hasOwnProperty(p.id)) {
      qtyMap[p.id] = qty;
    }
    total += p.price * qty;
    totalQty += qty;
  });

  if (Number(order.total) !== total) throw new Error('The order total has changed. Please refresh the page and review your order.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const orderId = 'SMYM-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
    const orderSheet = getOrdersSheet(ss);

    // If sheet has no header, add it
    if (orderSheet.getLastRow() === 0) {
      orderSheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
      orderSheet.setFrozenRows(1);
      orderSheet.getRange(1, 1, 1, ORDER_HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#4b1724')
        .setFontColor('#ffffff');
    } else {
      ensureDeliveryHeaders_(orderSheet);
    }

    orderSheet.appendRow([
      orderId,
      new Date(),
      name,
      house,
      phone,
      ward,
      qtyMap['carrot-05'],
      qtyMap['carrot-1'],
      qtyMap['pineapple-05'],
      qtyMap['pineapple-1'],
      qtyMap['marble-05'],
      qtyMap['marble-1'],
      qtyMap['plum-05'],
      qtyMap['plum-1'],
      totalQty,
      total,
      settings.pickupDate,
      'New',
      '', // Payment Method
      ''  // Delivered At
    ]);

    return { success: true, orderId: orderId };
  } finally {
    lock.releaseLock();
  }
}

function getSettings_() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  const result = Object.assign({}, DEFAULT_SETTINGS);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(r => {
      if (r[0] !== '') result[String(r[0])] = r[1];
    });
  }
  result.campaignOpen = String(result.campaignOpen).toLowerCase() === 'true';
  result.pickupDate = result.pickupDate instanceof Date ? Utilities.formatDate(result.pickupDate, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(result.pickupDate || '');
  result.orderDeadline = result.orderDeadline instanceof Date ? Utilities.formatDate(result.orderDeadline, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(result.orderDeadline || '');
  result.pickupLocation = String(result.pickupLocation || DEFAULT_SETTINGS.pickupLocation);
  return result;
}

function getSpreadsheet() {
  let id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    try {
      const active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) return active;
    } catch (e) {}
    throw new Error('Missing SPREADSHEET_ID in Apps Script Project Settings > Script properties.');
  }
  id = id.trim();
  const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) id = match[1];
  return SpreadsheetApp.openById(id);
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value).replace(/[<>\u0000-\u001F]/g, '').trim().slice(0, maxLength);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
