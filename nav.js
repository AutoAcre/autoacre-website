/* /nav.js — Site-wide cream-index nav drawer behaviour
 *
 * Loaded on every page alongside the shared header markup. Wires:
 *   - Hover-to-open on .nav-cream-trigger (with 120ms grace on close)
 *   - Click-to-toggle for keyboard / touch
 *   - Esc closes; restores focus to the trigger
 *   - Click outside the header closes
 *   - body.is-nav-open class added/removed in lockstep so /nav.css can
 *     flip the homepage header from transparent → cream
 *   - aria-expanded reflects state; drawer hidden attribute toggled
 *
 * Markup contract (in the shared header partial):
 *   <header class="site-header">
 *     <nav class="header-nav header-nav--cream-index">
 *       <ul class="nav-list">
 *         …
 *         <li class="nav-item nav-cream-item">
 *           <button class="nav-cream-trigger" aria-haspopup="true"
 *                   aria-expanded="false" aria-controls="nav-drawer-X">
 *             <span class="nav-cream-trigger-label">…</span>
 *             <svg class="nav-cream-chevron">…</svg>
 *           </button>
 *           <div class="nav-cream-drawer" id="nav-drawer-X"
 *                role="region" aria-label="…" hidden>…</div>
 *         </li>
 *         …
 *       </ul>
 *     </nav>
 *   </header>
 */
(function () {
  'use strict';

  function init() {
    var header = document.querySelector('.site-header');
    var items = document.querySelectorAll('.nav-cream-item');
    if (!header || !items.length) return;

    var closeTimer = null;
    var openItem = null;

    function closeAll() {
      items.forEach(function (item) {
        item.classList.remove('is-open');
        var trigger = item.querySelector('.nav-cream-trigger');
        var drawer = item.querySelector('.nav-cream-drawer');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (drawer) drawer.setAttribute('hidden', '');
      });
      document.body.classList.remove('is-nav-open');
      openItem = null;
    }

    function openOne(item) {
      if (openItem && openItem !== item) {
        openItem.classList.remove('is-open');
        var oldTrig = openItem.querySelector('.nav-cream-trigger');
        var oldDraw = openItem.querySelector('.nav-cream-drawer');
        if (oldTrig) oldTrig.setAttribute('aria-expanded', 'false');
        if (oldDraw) oldDraw.setAttribute('hidden', '');
      }
      item.classList.add('is-open');
      var trig = item.querySelector('.nav-cream-trigger');
      var draw = item.querySelector('.nav-cream-drawer');
      if (trig) trig.setAttribute('aria-expanded', 'true');
      if (draw) draw.removeAttribute('hidden');
      document.body.classList.add('is-nav-open');
      openItem = item;
    }

    function cancelClose() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function scheduleClose() {
      cancelClose();
      closeTimer = setTimeout(closeAll, 120);
    }

    items.forEach(function (item) {
      var trigger = item.querySelector('.nav-cream-trigger');
      if (!trigger) return;

      // Hover: open
      item.addEventListener('mouseenter', function () {
        cancelClose();
        openOne(item);
      });

      // Click (keyboard/touch): toggle this item
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        cancelClose();
        if (item.classList.contains('is-open')) {
          closeAll();
        } else {
          openOne(item);
        }
      });
    });

    // Mouseleave the whole header region — schedule close.
    // Drawers are positioned absolute below the header, but they're DOM
    // children of the .nav-cream-item which is inside the header, so
    // hover within the drawer counts as hover within the header.
    header.addEventListener('mouseleave', scheduleClose);
    header.addEventListener('mouseenter', cancelClose);

    // Esc closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openItem) {
        var trigger = openItem.querySelector('.nav-cream-trigger');
        closeAll();
        if (trigger) trigger.focus();
      }
    });

    // Click outside the header → close
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target) && openItem) closeAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
