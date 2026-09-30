/* Order bump behaviour. Markup: /guide/order-bump.html. Unticked by default.
   Dispatches "orderbump:change" on the .bump element with detail {checked, sku, price}.
   Anything with [data-bump-total] shows base price (data-base-price on it) + bump when ticked. */
(function () {
  'use strict';
  document.querySelectorAll('[data-order-bump]').forEach(function (bump) {
    var box = bump.querySelector('input[type="checkbox"]');
    if (!box) return;
    box.checked = false;
    function update() {
      var price = Number(bump.getAttribute('data-price')) || 0;
      document.querySelectorAll('[data-bump-total]').forEach(function (el) {
        var base = Number(el.getAttribute('data-base-price')) || 0;
        el.textContent = 'A$' + (base + (box.checked ? price : 0)) + ' (AUD)';
      });
      bump.dispatchEvent(new CustomEvent('orderbump:change', {
        bubbles: true,
        detail: { checked: box.checked, sku: bump.getAttribute('data-sku'), price: price }
      }));
    }
    box.addEventListener('change', update);
    update();
  });
})();
