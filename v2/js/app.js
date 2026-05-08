/* AutoAcre v2 — bundled vanilla JS for interactive components.
 * No dependencies, no build step. Loaded with `defer` so DOM is ready.
 *
 * Wires:
 *   - .js-enhanced flag on <body>            (CSS branches off this)
 *   - Property dial (#acreage-slider)        (square + acres + m² + fee)
 *   - ROI mini-calc (#roi-* sliders)         (reads dial state for fee)
 *   - FAQ accordion (.faq-question buttons)  (single-open, aria-expanded)
 *   - Reveal-on-scroll ([data-reveal])       (IntersectionObserver)
 *   - prefers-reduced-motion respected on reveal animations.
 */
(function () {
  'use strict';

  // ─── Constants (production-consistent — match the JSON-LD schema) ───
  var SYSTEM_PRICE = 33490;
  var MGMT_FEES = {
    3: 195, 4: 260, 5: 330, 6: 390,
    7: 455, 8: 520, 9: 585, 10: 650
  };
  var SQM_PER_ACRE = 4047;

  // ─── Single source of truth ─────────────────────────────────────────
  var state = {
    acreage: 5,
    contractorPerVisit: 800,
    visitsPerYear: 26
  };

  var fmtAUD = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  });

  function feeForAcres(acres) {
    var rounded = Math.max(3, Math.min(10, Math.round(acres)));
    return MGMT_FEES[rounded];
  }

  function $(id) { return document.getElementById(id); }
  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  // ─── Property dial ──────────────────────────────────────────────────
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
    setText('dial-fee-value', feeForAcres(acres));
  }

  function setupDial() {
    var slider = $('acreage-slider');
    if (!slider) return;
    slider.addEventListener('input', function (e) {
      state.acreage = parseFloat(e.target.value);
      updateDial();
      updateROI();
    });
  }

  // ─── ROI calculator ─────────────────────────────────────────────────
  function updateROI() {
    var fee = feeForAcres(state.acreage);
    var ctrPerVisit = state.contractorPerVisit;
    var visits = state.visitsPerYear;

    var aaYr1 = SYSTEM_PRICE + fee * 12;
    var ctrYr1 = ctrPerVisit * visits;
    var aa8 = SYSTEM_PRICE + fee * 12 * 8;
    var ctr8 = ctrPerVisit * visits * 8;
    var saved8 = ctr8 - aa8;

    var monthlyCtrCost = ctrPerVisit * visits / 12;
    var monthlyDelta = monthlyCtrCost - fee;
    var beMonthLabel;
    if (monthlyDelta <= 0) {
      beMonthLabel = '—';
    } else {
      beMonthLabel = Math.ceil(SYSTEM_PRICE / monthlyDelta) + ' mo';
    }

    setText('roi-aa-yr1', fmtAUD.format(aaYr1));
    setText('roi-ctr-yr1', fmtAUD.format(ctrYr1));
    setText('roi-diff-8yr', fmtAUD.format(saved8));
    setText('roi-be-month', beMonthLabel);
    setText('roi-savings-value', fmtAUD.format(Math.abs(saved8)));
    setText('roi-contractor-display', ctrPerVisit);
    setText('roi-visits-display', visits);

    var savings = $('roi-savings');
    var savLabel = $('roi-savings-label');
    if (savings && savLabel) {
      if (saved8 >= 0) {
        savings.classList.remove('roi-savings--neg');
        savLabel.textContent = 'YOU SAVE';
      } else {
        savings.classList.add('roi-savings--neg');
        savLabel.textContent = 'PREMIUM';
      }
    }
  }

  function setupROI() {
    var ctrSlider = $('roi-contractor-visit');
    var visitsSlider = $('roi-visits-year');

    if (ctrSlider) {
      ctrSlider.addEventListener('input', function (e) {
        state.contractorPerVisit = parseInt(e.target.value, 10);
        updateROI();
      });
    }
    if (visitsSlider) {
      visitsSlider.addEventListener('input', function (e) {
        state.visitsPerYear = parseInt(e.target.value, 10);
        updateROI();
      });
    }
  }

  // ─── FAQ accordion (single-open) ────────────────────────────────────
  function setupFAQ() {
    var buttons = document.querySelectorAll('.faq-question');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wasOpen = btn.getAttribute('aria-expanded') === 'true';
        // Close all
        buttons.forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
        });
        // Open this one if it was closed
        if (!wasOpen) btn.setAttribute('aria-expanded', 'true');
      });
    });
  }

  // ─── Reveal-on-scroll ───────────────────────────────────────────────
  function setupReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    if (!('IntersectionObserver' in window)) return;

    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      // Light stagger across siblings — looks nice on multi-card sections.
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  // ─── Init ───────────────────────────────────────────────────────────
  function init() {
    document.body.classList.add('js-enhanced');
    updateDial();
    updateROI();
    setupDial();
    setupROI();
    setupFAQ();
    setupReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
