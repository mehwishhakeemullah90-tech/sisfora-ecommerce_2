// public/js/checkout.js
// -----------------------------------------------------------------------
// Checkout page: renders order summary from the local cart, collects
// shipping address, and completes payment via Stripe Elements (card) or
// places a Cash on Delivery order directly.
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  const page = document.getElementById('checkoutPage');
  if (!page) return;

  const cart = sfGetCart();
  if (cart.length === 0) {
    window.location.href = '/cart';
    return;
  }

  const savedCoupon = sessionStorage.getItem('sisfora_coupon');
  const coupon = savedCoupon ? JSON.parse(savedCoupon) : null;

  // ---- Render order summary ----
  const summaryEl = document.getElementById('checkoutSummaryItems');
  summaryEl.innerHTML = cart
    .map(
      (i) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div class="d-flex align-items-center gap-2">
        <img src="${i.image}" style="width:44px;height:44px;object-fit:cover;border-radius:4px;" alt="" />
        <div>
          <div class="small fw-medium">${sfEscape(i.name)}</div>
          <div class="small text-muted">Qty ${i.quantity}</div>
        </div>
      </div>
      <div class="small fw-semibold">${sfCurrency(i.price * i.quantity)}</div>
    </div>`
    )
    .join('');

  const subtotal = sfCartSubtotal();
  const discount = coupon ? coupon.discountAmount : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount >= 50 ? 0 : 5.99;
  const total = afterDiscount + shipping;

  document.getElementById('checkoutSubtotal').textContent = sfCurrency(subtotal);
  document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'Free' : sfCurrency(shipping);
  document.getElementById('checkoutTotal').textContent = sfCurrency(total);
  if (coupon) {
    document.getElementById('checkoutDiscountRow').classList.remove('d-none');
    document.getElementById('checkoutDiscount').textContent = `-${sfCurrency(discount)}`;
  }

  // ---- Pre-fill saved addresses ----
  try {
    const { user } = await sfFetch('/api/auth/me');
    const addressSelect = document.getElementById('savedAddressSelect');
    if (user.addresses && user.addresses.length && addressSelect) {
      addressSelect.innerHTML =
        '<option value="">-- Enter a new address --</option>' +
        user.addresses
          .map((a) => `<option value="${a._id}">${sfEscape(a.fullName)}, ${sfEscape(a.addressLine1)}, ${sfEscape(a.city)}</option>`)
          .join('');
      addressSelect.addEventListener('change', () => {
        const addr = user.addresses.find((a) => a._id === addressSelect.value);
        if (!addr) return;
        const form = document.getElementById('shippingForm');
        form.fullName.value = addr.fullName || '';
        form.phone.value = addr.phone || '';
        form.addressLine1.value = addr.addressLine1 || '';
        form.addressLine2.value = addr.addressLine2 || '';
        form.city.value = addr.city || '';
        form.state.value = addr.state || '';
        form.postalCode.value = addr.postalCode || '';
        form.country.value = addr.country || '';
      });
    }
  } catch (err) { /* not logged in path shouldn't happen — page is protected */ }

  // ---- Payment method toggle ----
  const codRadio = document.getElementById('payCOD');
  const cardRadio = document.getElementById('payCARD');
  const cardSection = document.getElementById('cardPaymentSection');
  function togglePaymentUI() {
    cardSection.classList.toggle('d-none', !cardRadio.checked);
  }
  codRadio.addEventListener('change', togglePaymentUI);
  cardRadio.addEventListener('change', togglePaymentUI);

  // ---- Stripe Elements setup (only initialised when CARD is selected) ----
  let stripe;
  let elements;
  let clientSecret;
  const stripeKey = page.dataset.stripeKey;

  async function initStripeElements() {
    if (!stripeKey || elements) return;
    stripe = Stripe(stripeKey);
    const items = cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const data = await sfFetch('/api/orders/create-payment-intent', {
      method: 'POST',
      body: { items, couponCode: coupon?.code },
    });
    clientSecret = data.clientSecret;
    elements = stripe.elements({ clientSecret });
    const paymentElement = elements.create('payment');
    paymentElement.mount('#stripePaymentElement');
  }

  cardRadio.addEventListener('change', () => {
    togglePaymentUI();
    initStripeElements().catch((err) => sfToast(err.message, 'error'));
  });

  // ---- Place order ----
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  placeOrderBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const form = document.getElementById('shippingForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const shippingAddress = {
      fullName: form.fullName.value,
      phone: form.phone.value,
      addressLine1: form.addressLine1.value,
      addressLine2: form.addressLine2.value,
      city: form.city.value,
      state: form.state.value,
      postalCode: form.postalCode.value,
      country: form.country.value,
    };

    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Placing order...';

    try {
      const items = cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      let paymentIntentId;

      if (cardRadio.checked) {
        if (!elements) await initStripeElements();
        // return_url is required by Stripe for payment methods that need a
        // browser redirect (e.g. bank transfers). For standard card payments
        // with redirect:'if_required', Stripe only redirects when necessary.
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          redirect: 'if_required',
          confirmParams: { return_url: `${window.location.origin}/order-confirmation/pending` },
        });
        if (error) throw new Error(error.message);
        paymentIntentId = paymentIntent.id;
      }

      const order = await sfFetch('/api/orders', {
        method: 'POST',
        body: {
          items,
          shippingAddress,
          paymentMethod: cardRadio.checked ? 'CARD' : 'COD',
          couponCode: coupon?.code,
          paymentIntentId,
        },
      });

      sfClearCart();
      sessionStorage.removeItem('sisfora_coupon');
      window.location.href = `/order-confirmation/${order.order._id}`;
    } catch (err) {
      sfToast(err.message, 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = 'Place Order';
    }
  });
});
