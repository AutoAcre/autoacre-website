/*!
 * AutoAcre - GA4 custom events (drop-in)
 * Property: G-QV4RX5RY79 (gtag.js is already on every page)
 *
 * HOW TO INSTALL
 *   1. Upload this file next to app.js  ->  https://autoacre.com.au/analytics-events.js
 *   2. Add ONE line to the shared template, right after the gtag.js snippet:
 *        <script src="/analytics-events.js" defer></script>
 *
 * No personal data (name, email, consent) is ever read or sent.
 * To rename an event, change it in EVENTS below.
 */
(function () {
  'use strict';

  var EVENTS = {
    book: 'book_assessment_click',
    calcStart: 'roi_calculator_start',
    calcComplete: 'roi_calculator_complete',
    pdf: 'pdf_download',
    calcPrint: 'roi_calculator_print_pdf',
    phone: 'phone_click'
  };

  var CALC_PATH = /robot-mower-roi-calculator/;
  var onCalc = CALC_PATH.test(location.pathname);
  var sent = { calcStart: false, calcComplete: false };

  function send(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    params.transport_type = 'beacon'; // survives the page navigating away
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(['event', name, params]);
    }
  }

  function clean(t) {
    return (t || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function locationOf(el) {
    if (el.closest('header, .header, nav, .mobile-nav, [class^="mn-"], [class*=" mn-"]')) return 'header_nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('main')) return 'main';
    return 'other';
  }

  function calcContext() {
    var ctx = {};
    try {
      var main = document.querySelector('main');
      var range = main && main.querySelector('input[type="range"]');
      if (range) ctx.acres = range.value;
    } catch (e) {}
    return ctx;
  }

  function calcStart(how) {
    if (!onCalc || sent.calcStart) return;
    sent.calcStart = true;
    send(EVENTS.calcStart, { interaction: how });
  }

  function calcComplete(how) {
    if (!onCalc || sent.calcComplete) return;
    sent.calcComplete = true;
    var p = calcContext();
    p.completion_action = how;
    send(EVENTS.calcComplete, p);
  }

  // ---- clicks (links + buttons) ----
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var el = t.closest('a, button');

    if (el) {
      var href = el.getAttribute('href') || '';
      var text = clean(el.innerText || el.textContent);

      // Phone
      if (/^tel:/i.test(href)) {
        send(EVENTS.phone, {
          phone_number: href.replace(/^tel:/i, ''),
          link_text: text,
          link_location: locationOf(el)
        });
      }

      // PDF file links
      if (/\.pdf(\?|#|$)/i.test(href)) {
        send(EVENTS.pdf, {
          file_name: href.split('/').pop().split(/[?#]/)[0],
          file_extension: 'pdf',
          link_url: href,
          link_text: text,
          link_location: locationOf(el)
        });
      }

      // Book assessment
      if (
        /^\/?(book-site-assessment|quote)(\/|\?|#|$)/i.test(href.replace(location.origin, '')) ||
        /book[^a-z]*(a\s+)?(site\s+)?assessment/i.test(text)
      ) {
        send(EVENTS.book, {
          link_text: text,
          link_url: href,
          link_location: locationOf(el)
        });
      }

      // Calculator-specific buttons
      if (onCalc && el.closest('main')) {
        if (/print\s*\/?\s*pdf/i.test(text)) {
          send(EVENTS.calcPrint, calcContext());
          calcComplete('print_pdf');
        } else if (/get a quote/i.test(text)) {
          calcComplete('get_quote');
        } else if (!/methodology|close/i.test(text)) {
          calcStart('click');
        }
      }
    }
  }, true);

  // ---- calculator inputs (sliders, postcode, etc.) ----
  ['input', 'change'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!onCalc) return;
      var t = e.target;
      if (!t || !t.closest || !t.closest('main')) return;
      // typing a name in the lead form is not "starting" the calculator
      if (t.closest('form[name="calc-leads"]')) return;
      calcStart('input');
    }, true);
  });

  // ---- lead form on the calculator ----
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (onCalc && f && f.getAttribute && f.getAttribute('name') === 'calc-leads') {
      calcComplete('lead_form');
    }
  }, true);
})();
