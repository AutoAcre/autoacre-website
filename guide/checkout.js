/* STUB. Stripe is not wired yet.
   Intended flow: POST {items} to a server endpoint that creates a Stripe Checkout Session
   (never put the secret key in the browser), then redirect to session.url.
   items: guide (A$197 AUD) always; Commercial Quote Kit (A$29 AUD) when the bump is ticked.
   Success URL should be /guide/thanks-upsell. */
(function () {
  'use strict';
  var form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bump = form.querySelector('input[name="order_bump"]');
    var items = [{ sku: 'autoacre-guide-v1', price: 197 }];
    if (bump && bump.checked) items.push({ sku: 'commercial-quote-kit', price: 29 });
    console.info('[stub] Stripe Checkout not wired. Would create a session with:', items);
  });
})();
