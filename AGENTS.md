# ShopLedger contributor notes

## Stack
- CommonJS Node.js application using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript served from public/.
- Application data is stored in data/db.json via lib/store.js.

## Module map
### routes/
- routes/customers.js — list customers and settlements; record Khata settlements.
- routes/orders.js — list, fetch, place, and cancel orders.
- routes/products.js — list/search products and active coupons.
- routes/reports.js — dashboard, GST reconciliation, pricing preview, and admin export.
### lib/
- lib/coupons.js — normalize, validate, and calculate coupon discounts.
- lib/dates.js — format dates, normalize date keys, and calculate fiscal years.
- lib/inventory.js — find products, check/reserve/release stock, and summarize inventory.
- lib/invoice.js — calculate printable invoice figures and render invoice HTML.
- lib/ledger.js — customer balances, Khata charges/reversals, and settlements.
- lib/orders.js — add, find, cancel, and filter orders.
- lib/pricing.js — calculate subtotal, discount, tax, and checkout totals.
- lib/reports.js — dashboard metrics and invoice/order GST reconciliation.
- lib/store.js — read, normalize, write, and audit the JSON database.
- lib/tax.js — resolve item GST rates and split CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node's built-in test runner; no test files are currently present).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
Allowed files: lib/inventory.js, and lib/orders.js (cancel only).
