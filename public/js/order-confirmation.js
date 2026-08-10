// public/js/order-confirmation.js
document.addEventListener('DOMContentLoaded', async () => {
  const page = document.getElementById('orderConfirmationPage');
  if (!page) return;

  const orderId = page.dataset.orderId;
  const container = document.getElementById('orderSummaryContainer');
  try {
    const { order } = await sfFetch(`/api/orders/${orderId}`);
    container.innerHTML = `
      <div class="d-flex justify-content-between mb-3">
        <div>
          <div class="small text-muted">Order Number</div>
          <div class="fw-semibold">#${order.orderNumber}</div>
        </div>
        <div class="text-end">
          <div class="small text-muted">Placed On</div>
          <div class="fw-semibold">${new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
      <hr />
      ${order.items
        .map(
          (i) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center gap-2">
            <img src="${i.image}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" alt="" />
            <div>
              <div class="small fw-medium">${sfEscape(i.name)}</div>
              <div class="small text-muted">Qty ${i.quantity}</div>
            </div>
          </div>
          <div class="small fw-semibold">${sfCurrency(i.price * i.quantity)}</div>
        </div>`
        )
        .join('')}
      <hr />
      <div class="d-flex justify-content-between"><span>Subtotal</span><span>${sfCurrency(order.itemsPrice)}</span></div>
      <div class="d-flex justify-content-between"><span>Shipping</span><span>${order.shippingPrice === 0 ? 'Free' : sfCurrency(order.shippingPrice)}</span></div>
      ${order.coupon?.code ? `<div class="d-flex justify-content-between text-success"><span>Coupon (${order.coupon.code})</span><span>-${sfCurrency(order.coupon.discountAmount)}</span></div>` : ''}
      <div class="d-flex justify-content-between fw-bold fs-5 mt-2"><span>Total</span><span>${sfCurrency(order.totalPrice)}</span></div>
      <hr />
      <div class="small text-muted">Payment Method</div>
      <div class="fw-medium mb-2">${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit / Debit Card'} ${order.isPaid ? '<span class="badge bg-success ms-1">Paid</span>' : ''}</div>
      <div class="small text-muted">Shipping To</div>
      <div class="fw-medium">${sfEscape(order.shippingAddress.fullName)}, ${sfEscape(order.shippingAddress.addressLine1)}, ${sfEscape(order.shippingAddress.city)}, ${sfEscape(order.shippingAddress.country)}</div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-danger">${err.message}</p>`;
  }
});
