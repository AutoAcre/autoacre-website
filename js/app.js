/* /js/app.js — Homepage-only interactive layer.
 *
 * Loaded AFTER /app.js (production). Production's app.js handles dropdowns,
 * mobile menu, FAQ accordion (.faq-item.active toggle), reveal-on-scroll
 * (.reveal → .visible), scroll-banner, and form validation. We add:
 *
 *   - body.js-enhanced flag (CSS branches off this for FAQ/reveal hidden state)
 *   - body.is-scrolled flag (header transitions transparent → solid)
 *   - Property dial (slider → SVG square + acres/m² + tiered fee)
 *   - ROI calculator (sliders → readouts; uses same acreage state as dial)
 *
 * Pricing values match the production JSON-LD schema (and the Service entity's
 * copy block on the page) — 195/260/330/390/455/520/585/650.
 */
(function () {
  'use strict';

  /* ─── Constants ─── */
  var SYSTEM_PRICE = 33490;
  var MGMT_FEES = {
    2.5: 165,
    3: 195, 4: 260, 5: 330, 6: 390,
    7: 455, 8: 520, 9: 585, 10: 650
  };
  var SQM_PER_ACRE = 4047;

  var state = {
    acreage: 5,
    contractorPerVisit: 800,
    visitsPerYear: 26
  };

  var fmtAUD = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  });

  function feeForAcres(acres) {
    if (acres < 3) return 165;
    var rounded = Math.max(3, Math.min(10, Math.round(acres)));
    return MGMT_FEES[rounded];
  }

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

  /* ─── ROI calculator ─── */
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
    var beMonthLabel = monthlyDelta <= 0
      ? '—'
      : Math.ceil(SYSTEM_PRICE / monthlyDelta) + ' mo';

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
    updateROI();
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
