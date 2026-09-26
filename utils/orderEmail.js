// utils/orderEmail.js
// -----------------------------------------------------------------------
// Order confirmation email sent to the customer right after an order is
// placed. Uses utils/sendEmail.js (SMTP settings in .env).
// -----------------------------------------------------------------------
const sendEmail = require('./sendEmail');
const storefront = require('../config/storefront');
const { formatPrice: money } = require('./currency'); // USD stored -> "Rs. 5,600"

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function orderConfirmationHTML(order, customerName, orderUrl) {
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee5d9;">${escapeHtml(item.name)} × ${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee5d9;text-align:right;">${money(item.price * item.quantity)}</td>
    </tr>`).join('');

  const a = order.shippingAddress || {};
  const address = [a.fullName, a.addressLine1, a.addressLine2, [a.city, a.state, a.postalCode].filter(Boolean).join(', '), a.country, a.phone]
    .filter(Boolean).map(escapeHtml).join('<br>');

  const line = (label, value) => `<tr><td style="padding:4px 0;color:#817670;">${label}</td><td style="padding:4px 0;text-align:right;">${value}</td></tr>`;

  return `
  <div style="background:#f8f4ed;padding:24px;font-family:Arial,sans-serif;color:#292321;">
    <div style="max-width:560px;margin:0 auto;background:#fffdf9;padding:32px;border-top:3px solid #b58a3c;">
      <h1 style="font-family:Georgia,serif;font-weight:normal;margin:0 0 8px;">Thank you for your order</h1>
      <p style="margin:0 0 20px;color:#817670;">Hi ${escapeHtml(customerName)}, we've received your order and are getting it ready.</p>
      <p style="margin:0 0 20px;"><strong>Order #${String(order._id).slice(-8).toUpperCase()}</strong><br>
        <span style="color:#817670;">Payment: ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}</span></p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
        ${line('Subtotal', money(order.itemsPrice))}
        ${order.coupon && order.coupon.discountAmount ? line(`Discount (${escapeHtml(order.coupon.code)})`, `-${money(order.coupon.discountAmount)}`) : ''}
        ${line('Shipping', order.shippingPrice ? money(order.shippingPrice) : 'Free')}
        ${order.taxPrice ? line('Tax', money(order.taxPrice)) : ''}
        <tr><td style="padding:10px 0;font-weight:bold;border-top:1px solid #eee5d9;">Total</td>
            <td style="padding:10px 0;font-weight:bold;text-align:right;border-top:1px solid #eee5d9;">${money(order.totalPrice)}</td></tr>
      </table>

      <h3 style="font-family:Georgia,serif;font-weight:normal;margin:24px 0 8px;">Delivering to</h3>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;">${address}</p>

      <p style="margin:0 0 24px;"><a href="${orderUrl}" style="background:#1b1715;color:#fff;padding:12px 22px;text-decoration:none;display:inline-block;">View your order</a></p>
      <p style="margin:0;font-size:13px;color:#817670;">Questions? Reply to this email or contact us at ${escapeHtml(storefront.email)}.</p>
    </div>
  </div>`;
}

/**
 * Sends the confirmation email. Never throws — a mail problem must not
 * make a successful order look like it failed.
 */
async function sendOrderConfirmation(order, user, req) {
  try {
    const orderUrl = `${req.protocol}://${req.get('host')}/order-confirmation/${order._id}`;
    await sendEmail({
      to: user.email,
      subject: `Sisfora — Order #${String(order._id).slice(-8).toUpperCase()} confirmed`,
      html: orderConfirmationHTML(order, user.name, orderUrl),
    });
  } catch (err) {
    console.error('Order confirmation email failed:', err.message);
  }
}

module.exports = { sendOrderConfirmation, orderConfirmationHTML };
