/*!
 * AutoAcre - GA4 custom events (drop-in)  v2  (4 Oct 2026)
 * Property: G-QV4RX5RY79 (gtag.js is already on every page)
 *
 * INSTALL (already live as v1; v2 is a drop-in replacement of the same file)
 *   <script src="/analytics-events.js" defer></script>  right after the gtag snippet.
 *
 * EVENTS SENT
 *   book_assessment_click    link to /book-site-assessment, /quote, or text "book ... assessment"
 *   lead_form_submit         a valid submit of the /book-site-assessment form, the /quote form,
 *                            or the calculator's calc-leads form. Param: form_name.   [NEW in v2]
 *   roi_calculator_start     first interaction with the calculator (once per page load)
 *   roi_calculator_complete  3 or more DIFFERENT calculator controls touched (once per page load).
 *                            Param: inputs_changed, acres.          [CHANGED in v2: no longer GET A QUOTE / PRINT]
 *   roi_calculator_print_pdf click on the calculator's PRINT / PDF button
 *   pdf_download             click on any link ending .pdf
 *   phone_click              click on any tel: link
 *   email_click              click on any mailto: link                                [NEW in v2]
 *   outbound_click           click on a link to another domain (Facebook etc.). Params: link_domain, link_url [NEW in v2]
 *
 * No personal data is ever read or sent: form field values are never touched, email addresses are not sent.
 * To rename an event, change it in EVENTS below.
 */
(function () {
  'use strict';

  var EVENTS = {
    book: 'book_assessment_click',
    leadForm: 'lead_form_submit',
    calcStart: 'roi_calculator_start',
    calcComplete: 'roi_calculator_complete',
    pdf: 'pdf_download',
    calcPrint: 'roi_calculator_print_pdf',
    phone: 'phone_click',
    email: 'email_click',
    outbound: 'outbound_click'
  };

  var COMPLETE_AFTER = 3; // distinct calculator controls touched before roi_calculator_complete fires

  var onCalc = /robot-mower-roi-calculator/.test(location.pathname);
  var sent = { calcStart: false, calcComplete: false };
  var touched = [];       // distinct calculator controls touched so far
  var lastSubmit = {};    // form_name -> timestamp, to avoid double counting

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

  // ---------- ROI calculator ----------
  function calcAcres() {
    try {
      var main = document.querySelector('main');
      var range = main && main.querySelector('input[type="range"]');
      return range ? range.value : undefined;
    } catch (e) { return undefined; }
  }

  function calcStart(how) {
    if (!onCalc || sent.calcStart) return;
    sent.calcStart = true;
    send(EVENTS.calcStart, { interaction: how });
  }

  // Buttons are grouped by what they set, so FLAT / ROLLING / STEEP count as ONE control.
  function buttonGroup(text) {
    var t = text.toLowerCase();
    if (/contractor|diy/.test(t)) return 'mode';
    if (/^(flat|rolling|steep)/.test(t)) return 'terrain';
    if (/^(weekly|fortnightly|monthly|seasonal)/.test(t)) return 'frequency';
    return 'btn:' + t;
  }

  function calcTouch(key, how) {
    if (!onCalc) return;
    calcStart(how);
    if (touched.indexOf(key) === -1) touched.push(key);
    if (!sent.calcComplete && touched.length >= COMPLETE_AFTER) {
      sent.calcComplete = true;
      send(EVENTS.calcComplete, {
        completion_action: 'engaged_' + COMPLETE_AFTER + '_inputs',
        inputs_changed: touched.length,
        acres: calcAcres()
      });
    }
  }

  // ---------- clicks ----------
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var el = t.closest('a, button');
    if (!el) return;

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

    // Email (address itself is not sent)
    if (/^mailto:/i.test(href)) {
      send(EVENTS.email, { link_text: text, link_location: locationOf(el) });
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

    // Outbound (another domain, http/https only)
    if (/^https?:\/\//i.test(href)) {
      try {
        var u = new URL(href, location.href);
        if (u.hostname !== location.hostname) {
          send(EVENTS.outbound, {
            link_domain: u.hostname,
            link_url: u.origin + u.pathname,
            link_text: text,
            link_location: locationOf(el)
          });
        }
      } catch (err) {}
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

    // Calculator buttons
    if (onCalc && el.closest('main')) {
      if (/print\s*\/?\s*pdf/i.test(text)) {
        send(EVENTS.calcPrint, { acres: calcAcres() });
      } else if (!/methodology|close|get a quote/i.test(text) && el.tagName === 'BUTTON') {
        calcTouch(buttonGroup(text), 'click');
      }
    }
  }, true);

  // ---------- calculator sliders and text fields ----------
  ['input', 'change'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!onCalc) return;
      var t = e.target;
      if (!t || !t.closest || !t.closest('main')) return;
      if (t.closest('form[name="calc-leads"]')) return; // typing a name is not using the calculator
      if (t.tagName !== 'INPUT') return;
      var all = document.querySelectorAll('main input');
      calcTouch('input:' + Array.prototype.indexOf.call(all, t), 'input');
    }, true);
  });

  // ---------- lead forms ----------
  //
  // Bubble phase + defaultPrevented check: lets app.js's custom email/phone
  // regex validation (which runs on bubble on the form) block the event when
  // it calls preventDefault() for its own reasons beyond checkValidity().
  // Also still fire for fetch/AJAX submits because the submit event still
  // dispatches before any preventDefault that would stop a real submission.
  function formName(f) {
    var n = f.getAttribute && f.getAttribute('name');
    if (n === 'calc-leads') return 'calc_leads';
    if (/^\/book-site-assessment/i.test(location.pathname)) return 'book_site_assessment';
    if (/^\/quote/i.test(location.pathname)) return 'quote';
    return null;
  }

  document.addEventListener('submit', function (e) {
    if (e.defaultPrevented) return;
    var f = e.target;
    if (!f || !f.getAttribute) return;
    var name = formName(f);
    if (!name) return;
    // ignore submits the browser would reject (empty required fields, invalid email)
    if (typeof f.checkValidity === 'function' && !f.checkValidity()) return;
    var now = Date.now();
    if (lastSubmit[name] && now - lastSubmit[name] < 3000) return;
    lastSubmit[name] = now;
    send(EVENTS.leadForm, { form_name: name });
  }, false);
})();
