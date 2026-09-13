/* /js/app.js — Homepage-only interactive layer.
 *
 * Loaded AFTER /app.js (production). Production's app.js handles dropdowns,
 * mobile menu, FAQ accordion (.faq-item.active toggle), reveal-on-scroll
 * (.reveal → .visible), scroll-banner, and form validation. We add:
 *
 *   - body.js-enhanced flag (CSS branches off this for FAQ/reveal hidden state)
 *   - body.is-scrolled flag (header transitions transparent → solid)
 *   - Property dial (slider → SVG square + acres/m²)
 *
 * No pricing lives in this file. It is served publicly, so the fee table and
 * system price were readable by anyone who opened it. Fees are quoted after a
 * site assessment.
 */
(function () {
  'use strict';

  /* ─── Constants ─── */
  var SQM_PER_ACRE = 4047;

  var state = {
    acreage: 5
  };

  function $(id) { return document.getElementById(id); }
  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  /* ─── Property dial ─── */
  function updateDial() {
    var acres = state.acreage;
    var sqM = acres * SQM_PER_ACRE;
    var sideM = Math.sqrt(sqM);
    var maxSide = Math.sqrt(10 * SQM_PER_ACRE);
    var ratio = sideM / maxSide;
    var boxSize = 20 + ratio * 200;

    var square = $('dial-square');
    if (square) {
      square.setAttribute('x', 120 - boxSize / 2);
      square.setAttribute('y', 120 - boxSize / 2);
      square.setAttribute('width', boxSize);
      square.setAttribute('height', boxSize);
    }

    setText('dial-acres-value', acres % 1 === 0 ? acres : acres.toFixed(1));
    var meta = $('dial-meta');
    if (meta) {
      meta.textContent = '≈ ' + Math.round(sqM).toLocaleString() +
                         ' m² · ' + Math.round(sideM) + 'm × ' + Math.round(sideM) + 'm';
    }
  }

  function setupDial() {
    var slider = $('acreage-slider');
    if (!slider) return;
    slider.addEventListener('input', function (e) {
      state.acreage = parseFloat(e.target.value);
      state.interacted = true;
      updateDial();
    });
  }



  /* ─── Sticky header (transparent → solid past hero) ─── */
  function setupStickyHeader() {
    var hero = document.querySelector('.hero');
    var body = document.body;
    if (!hero || !body.classList.contains('home')) return;

    if (!('IntersectionObserver' in window)) {
      body.classList.add('is-scrolled');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          body.classList.remove('is-scrolled');
        } else {
          body.classList.add('is-scrolled');
        }
      });
    }, {
      threshold: 0,
      rootMargin: '-80px 0px 0px 0px'
    });

    observer.observe(hero);
  }

  /* ─── Init ─── */
  function init() {
    document.body.classList.add('js-enhanced');
    updateDial();
    setupDial();
    setupROI();
    setupStickyHeader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
