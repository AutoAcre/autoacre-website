/* app.js — AutoAcre site interactions */

(function () {
  'use strict';

  /* ---- Theme Toggle ---- */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = 'light'; // default to light for outdoor/property business
  root.setAttribute('data-theme', theme);

  function updateToggleIcon() {
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    themeToggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  updateToggleIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateToggleIcon();
    });
  }

  /* ---- Sticky Header: hide on scroll down, show on scroll up ---- */
  const header = document.querySelector('.site-header');
  let lastScroll = 0;
  let ticking = false;

  function onScroll() {
    const currentScroll = window.scrollY;
    if (currentScroll <= 0) {
      header.classList.remove('site-header--hidden');
    } else if (currentScroll > lastScroll && currentScroll > 80) {
      header.classList.add('site-header--hidden');
    } else if (currentScroll < lastScroll) {
      header.classList.remove('site-header--hidden');
    }
    lastScroll = currentScroll;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ---- Mobile Menu ---- */
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      menuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-item');
      const isActive = item.classList.contains('active');
      // Close all
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('active');
      });
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  /* ---- Scroll Reveal (Intersection Observer) ---- */
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---- Scroll-Triggered CTA Banner ---- */
  const scrollBanner = document.querySelector('.scroll-banner');
  if (scrollBanner) {
    let bannerDismissed = false;
    const closeBtn = scrollBanner.querySelector('.scroll-banner-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        scrollBanner.classList.remove('visible');
        bannerDismissed = true;
      });
    }

    window.addEventListener('scroll', function () {
      if (bannerDismissed) return;
      const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct > 0.3) {
        scrollBanner.classList.add('visible');
      }
    }, { passive: true });
  }

  /* ---- Form Validation ---- */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      let valid = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        const group = input.closest('.form-group');
        if (!input.value.trim()) {
          if (group) group.classList.add('error');
          valid = false;
        } else {
          if (group) group.classList.remove('error');
        }

        // Email validation
        if (input.type === 'email' && input.value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.value.trim())) {
            if (group) group.classList.add('error');
            valid = false;
          }
        }

        // Phone validation
        if (input.type === 'tel' && input.value.trim()) {
          const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
          if (!phoneRegex.test(input.value.trim())) {
            if (group) group.classList.add('error');
            valid = false;
          }
        }
      });

      if (!valid) {
        e.preventDefault();
        const firstError = form.querySelector('.form-group.error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Clear error on input
    form.querySelectorAll('input, textarea, select').forEach(function (input) {
      input.addEventListener('input', function () {
        const group = this.closest('.form-group');
        if (group) group.classList.remove('error');
      });
    });
  });

  /* ---- Active nav highlighting ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header-nav a, .mobile-nav a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html') || (currentPage === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---- Areas dropdown (click + mouseleave) ---- */
  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var trigger = dropdown.querySelector('.nav-dropdown-trigger');
    var menu = dropdown.querySelector('.nav-dropdown-menu');
    var closeTimer;

    function openDropdown() {
      clearTimeout(closeTimer);
      dropdown.classList.add('open');
    }

    function scheduleClose() {
      closeTimer = setTimeout(function () {
        dropdown.classList.remove('open');
      }, 120);
    }

    trigger.addEventListener('mouseenter', openDropdown);
    trigger.addEventListener('mouseleave', scheduleClose);
    menu.addEventListener('mouseenter', openDropdown);
    menu.addEventListener('mouseleave', scheduleClose);

    // Also toggle on click for keyboard/touch users
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });
  });

})();
