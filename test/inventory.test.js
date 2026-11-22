'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(overrides) {
  return Object.assign({
    id: 7,
    sku: 'TEST-007',
    name: 'Test product',
    hsn: '1006',
    price: 100,
    stock: 1,
    reserved: 0
  }, overrides || {});
}

function routeOrderLine(p, qty) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    hsn: p.hsn,
    price: p.price,
    qty: qty
  };
}

test('check accepts qty 1 when sellable stock is 1', function () {
  const p = product({ stock: 1, reserved: 0 });

  assert.deepEqual(inventory.check([p], [{ id: p.id, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable stock is 1', function () {
  const p = product({ stock: 1, reserved: 0 });

  assert.deepEqual(inventory.check([p], [{ id: p.id, qty: 2 }]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable stock is 1', function () {
  const p = product({ stock: 1, reserved: 0 });

  assert.deepEqual(inventory.check([p], [{ id: p.id, qty: 0 }]), { ok: true });
});

test('check accepts qty 1 when stock 4 minus reserved 3 leaves 1 sellable', function () {
  const p = product({ stock: 4, reserved: 3 });

  assert.deepEqual(inventory.check([p], [{ id: p.id, qty: 1 }]), { ok: true });
});

test('cancelling a pending order restores stock after reserve', function () {
  const p = product({ stock: 4, reserved: 3 });
  const items = [routeOrderLine(p, 1)];
  const order = {
    id: 101,
    status: 'pending',
    paymentMode: 'cash',
    customerId: null,
    items: items,
    total: 100
  };
  const db = { products: [p], orders: [order] };
  const snapshot = function () {
    return { stock: p.stock, reserved: p.reserved };
  };

  const beforeOrder = snapshot();
  inventory.reserve(db.products, items);
  const afterReserve = snapshot();
  const result = orders.cancel(db, order.id, 'characterization test');
  const afterCancel = snapshot();

  assert.equal(result.ok, true);
  assert.deepEqual(
    { beforeOrder: beforeOrder, afterReserve: afterReserve, afterCancel: afterCancel },
    {
      beforeOrder: { stock: 4, reserved: 3 },
      afterReserve: { stock: 3, reserved: 3 },
      afterCancel: { stock: 4, reserved: 3 }
    }
  );
});

test('correct behaviour: sell all remaining stock and restore a cancelled order exactly once', async function (t) {
  await t.test('allows exactly the remaining sellable quantity but never more', function () {
    const p = product({ stock: 4, reserved: 3 });

    assert.deepEqual(inventory.check([p], [{ id: p.id, qty: 1 }]), { ok: true });
    assert.deepEqual(inventory.check([p], [{ id: p.id, qty: 2 }]), {
      ok: false,
      msg: 'Test product is out of stock (1 sellable available)'
    });
  });

  await t.test('cancel restores stock once for a route-shaped pending order', function () {
    const p = product({ stock: 4, reserved: 3 });
    const items = [routeOrderLine(p, 1)];
    const order = {
      id: 102,
      status: 'pending',
      paymentMode: 'cash',
      customerId: null,
      items: items,
      total: 100
    };
    const db = { products: [p], orders: [order] };

    inventory.reserve(db.products, items);
    assert.deepEqual({ stock: p.stock, reserved: p.reserved }, { stock: 3, reserved: 3 });

    const cancelled = orders.cancel(db, order.id, 'characterization test');
    assert.equal(cancelled.ok, true);
    assert.deepEqual({ stock: p.stock, reserved: p.reserved }, { stock: 4, reserved: 3 });

    const cancelledAgain = orders.cancel(db, order.id, 'characterization test');
    assert.equal(cancelledAgain.ok, false);
    assert.deepEqual({ stock: p.stock, reserved: p.reserved }, { stock: 4, reserved: 3 });
  });
});
