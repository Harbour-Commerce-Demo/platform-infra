import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = process.env.GATEWAY_URL ?? 'http://127.0.0.1:8080';
async function request(path, options = {}, expected = 200) {
 const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(30000) });
 const text = await response.text(); assert.equal(response.status, expected, `${path}: ${response.status} ${text}`); return text ? JSON.parse(text) : null;
}
const post = (body, key) => ({ method:'POST', headers:{'content-type':'application/json', 'idempotency-key':key}, body:JSON.stringify(body) });
await request('/healthz');
const products = await request('/api/products'); assert.equal(products.length,4);
const before = await request('/api/inventory');
const basket = {userId:'usr_demo',items:[{productId:'prd_mug',quantity:2},{productId:'prd_notebook',quantity:1}],paymentToken:'tok_demo_visa'};
const key = randomUUID(); const order = await request('/api/orders',post(basket,key),201);
assert.equal(order.status,'paid'); assert.equal(order.amount,4550); assert.equal(order.notificationRecorded,true);
const replay = await request('/api/orders',post(basket,key)); assert.equal(replay.id,order.id);
const payment = await request('/api/payments/'+order.id);assert.equal(payment.amount,4550);
const notifications = await request('/api/notifications?orderId='+order.id);assert.equal(notifications.length,1);
const after = await request('/api/inventory');assert.equal(after.prd_mug,before.prd_mug-2);assert.equal(after.prd_notebook,before.prd_notebook-1);
await request('/api/orders',post({...basket,paymentToken:'tok_demo_declined'},randomUUID()),402);
assert.deepEqual(await request('/api/inventory'),after,'Declined checkout must release its reservation');
await request('/api/orders',post({...basket,items:[{productId:'missing',quantity:1}]},randomUUID()),400);
await request('/api/orders',post({...basket,items:[{productId:'prd_mug',quantity:-1}]},randomUUID()),400);
console.log(`PASS: order ${order.id}; pricing, stock, payment, confirmation, retry, decline compensation, and validation.`);
