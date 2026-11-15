# SMYM Christmas Cake Fest 2026

A React + Vite pre-order website starter for SMYM Chemmalamattom. Orders are saved to Google Sheets through a Google Apps Script web app.

## What's included

- Responsive Christmas-themed landing page and cake catalogue
- Eight options: carrot, pineapple, marble and plum cakes in ½ kg and 1 kg sizes
- Customer form: full name, email, phone, house name and ward (1–30)
- Quantity selectors (0–9), order summary and price calculation
- Configurable prices, order deadline, campaign open/closed status and pickup settings
- Google Apps Script backend with server-side validation and Google Sheets storage
- Pickup currently set to **21 December 2026**, at **12 Apostles Church, Chemmalamattom**

> Cake prices and the order deadline are intentionally blank/unconfirmed. The live site should not accept an order containing a cake with no configured price.

## 1. Run the frontend locally

Install Node.js (LTS), then in this folder:

```bash
npm install
npm run dev
```

Vite prints a local development URL, usually `http://localhost:5173`.

## 2. Set up Google Sheets

1. Create a new Google spreadsheet owned by the SMYM team account.
2. Copy the spreadsheet ID from its URL (the long value between `/d/` and `/edit`).
3. Open **Extensions → Apps Script** from that spreadsheet.
4. Replace the starter code in `Code.gs` with `google-apps-script/Code.gs` from this project.
5. In Apps Script, open **Project Settings → Script properties → Add script property**.
   - Property: `SPREADSHEET_ID`
   - Value: your spreadsheet ID
6. Save the script. Choose `setupSheets` in the function dropdown and click **Run**. Approve the requested spreadsheet permissions. This creates `Orders`, `Products`, and `Settings` tabs.
7. In the `Products` tab, enter the confirmed selling prices in column D. Keep a price blank until the bakery confirms it. Set `Available` to `FALSE` to temporarily hide a product.
8. In the `Settings` tab:
   - `pickupDate`: `2026-12-21`
   - `orderDeadline`: leave blank until confirmed; use `YYYY-MM-DD` when decided
   - `campaignOpen`: `true` while accepting orders, `false` to close
   - `pickupLocation`: `12 Apostles Church, Chemmalamattom`
9. Select **Deploy → New deployment → Web app**.
10. Set **Execute as: Me**. Set access to **Anyone** only if the SMYM team approves public order submissions and your Google Workspace/account policy allows it. Deploy and copy the Web app URL ending in `/exec`.

Keep the spreadsheet private. Never put the spreadsheet ID, service credentials, or private API keys in frontend code. Anyone with the public web app URL may attempt to submit data, so monitor orders and restrict or disable the deployment if abuse occurs.

## 3. Connect the frontend to Apps Script

Create a `.env` file in the project root:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Use the real `/exec` URL from your deployment. Restart the Vite dev server after changing `.env`.

The frontend uses a simple text/plain POST to reduce browser preflight issues. Test both configuration loading and order submission from the deployed Vercel site. If the browser blocks the response due to Apps Script redirects/CORS in your environment, put a small server-side proxy/API in front of Apps Script rather than exposing Google credentials in the browser.

## 4. Deploy to Vercel

1. Push the project to a private/public GitHub repository as appropriate.
2. Import the repository in Vercel.
3. Add the environment variable `VITE_APPS_SCRIPT_URL` with the deployed Apps Script `/exec` URL in Vercel Project Settings → Environment Variables.
4. Deploy or redeploy after setting the variable.
5. Test on a phone: load the catalogue, check prices, submit a test order, confirm the new row in `Orders`, and verify that the returned reference matches the sheet.
6. Remove the test order after checking the workflow.

## 5. Before launching publicly

- Confirm all eight product prices with the supplier.
- Confirm the order deadline and collection time. The pickup date is set to 21 December 2026, but the pickup time is not set yet.
- Replace sample cake photos with the supplier's real product images before accepting orders. The current photos are visual placeholders and may not exactly match the cakes supplied.
- Add the approved SMYM logo if available; the current header uses a simple seasonal mark, not an official logo.
- Confirm payment method, cancellation/refund policy, and who will handle customer queries.
- Make a test order and check the actual sheet before sharing the URL.
- Share access to the Google Sheet only with authorized SMYM coordinators.

## Price / order behaviour

- Product prices are configured in the `Products` sheet, not hard-coded in the UI.
- The backend recomputes the order total from sheet prices and validates quantity (1–9 per selected product).
- The website refuses to submit a selection if a selected product has no confirmed price.
- The `Settings` sheet controls whether the campaign is open, the order deadline and pickup details.
- The order status begins as `New`; the SMYM team can update it in the sheet.
