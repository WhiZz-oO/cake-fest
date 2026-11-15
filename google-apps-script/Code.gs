/**
 * SMYM Christmas Cake Fest 2026
 * Google Apps Script web app backend for Google Sheets.
 *
 * Setup:
 * 1. Open your Google Spreadsheet (Extensions > Apps Script).
 * 2. Replace Code.gs with this entire file.
 * 3. In the toolbar, select "setupSheets" and click "Run".
 *    This will create column headers in "Form Responses 1" (or "Orders")
 *    and also create the live "Cake Summary" dashboard!
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
  'Order ID',
  'Submitted At',
  'Name',
  'House Name',
  'Phone Number',
  'Ward Number',
  'Carrot (½ kg)',
  'Carrot (1 kg)',
  'Pineapple (½ kg)',
  'Pineapple (1 kg)',
  'Marble (½ kg)',
  'Marble (1 kg)',
  'Plum (½ kg)',
  'Plum (1 kg)',
  'Total Cakes',
  'Total Amount (INR)',
  'Pickup Date',
  'Order Status'
];

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action === 'config') return jsonResponse(getPublicConfig());
  return jsonResponse({ success: true, service: 'SMYM Christmas Cake Fest order service' });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (payload.action !== 'submitOrder') return jsonResponse({ success: false, message: 'Unknown action.' });
    return jsonResponse(saveOrder(payload.order));
  } catch (err) {
    return jsonResponse({ success: false, message: err.message || 'Could not process the order.' });
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
  }

  // Also format 'Orders' if present and empty
  const altSheet = ss.getSheetByName('Orders');
  if (altSheet && altSheet.getName() !== orderSheet.getName() && altSheet.getLastRow() === 0) {
    altSheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
    altSheet.setFrozenRows(1);
    altSheet.getRange(1, 1, 1, ORDER_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#4b1724')
      .setFontColor('#ffffff');
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

  return 'Setup completed! Customer orders will be saved with Name, House Name, Phone Number, Ward Number and individual cake columns.';
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
    '=QUERY(' + sName + '!A1:R, "SELECT F, COUNT(A), SUM(O), SUM(P) WHERE A IS NOT NULL AND F IS NOT NULL GROUP BY F ORDER BY F LABEL F \'Ward Number\', COUNT(A) \'Total Families Ordered\', SUM(O) \'Total Cakes\', SUM(P) \'Total Amount (INR)\'", 1)'
  );
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
      'New'
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
