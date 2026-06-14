// ============================================================
// PRODE MUNDIAL FIFA 2026 — MAIN APP & ROUTER
// ============================================================

window.ProdeApp = (function () {
  let toastTimeout = null;

  function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');

    if (!toast || !toastIcon || !toastTitle || !toastMsg) return;

    // Set content
    toastIcon.textContent = isError ? '❌' : '✅';
    toastTitle.textContent = title;
    toastMsg.textContent = message;

    // Apply error styles if needed
    if (isError) {
      toast.style.borderColor = '#ef4444';
      toast.style.boxShadow = 'var(--shadow-lg), 0 0 30px rgba(239, 68, 68, 0.2)';
    } else {
      toast.style.borderColor = 'var(--border-green)';
      toast.style.boxShadow = 'var(--shadow-lg), 0 0 30px rgba(34, 161, 88, 0.2)';
    }

    // Show toast
    toast.classList.add('show');

    // Hide after 4s
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  function router() {
    const hash = window.location.hash || '#inicio';

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    // Show active page
    const activePage = document.querySelector(hash);
    if (activePage) {
      activePage.classList.add('active');
    } else {
      // Fallback
      const homePage = document.getElementById('inicio');
      if (homePage) homePage.classList.add('active');
    }

    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close hamburger menu on page change
    const hamburger = document.getElementById('hamburger-btn');
    const navLinksList = document.getElementById('nav-links');
    if (hamburger && navLinksList) {
      hamburger.classList.remove('open');
      navLinksList.classList.remove('open');
    }

    // Scroll to top of main content
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Initialize the navigated page
    if (hash === '#inicio') {
      if (window.ProdeHome) window.ProdeHome.init();
    } else if (hash === '#prediccion') {
      if (window.ProdePredictions) window.ProdePredictions.init();
    } else if (hash === '#ranking') {
      if (window.ProdeRanking) window.ProdeRanking.init();
    } else if (hash === '#reglamento') {
      if (window.ProdeRules) window.ProdeRules.init();
    }
  }

  // DOMContentLoaded
  window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Supabase
    const isSupabaseOk = initSupabase();
    
    // Show banner if Supabase url/key is not configured
    const configBanner = document.getElementById('config-banner');
    if (!isSupabaseOk && configBanner) {
      configBanner.classList.remove('hidden');
    }

    // 2. Hamburger button logic
    const hamburger = document.getElementById('hamburger-btn');
    const navLinksList = document.getElementById('nav-links');
    if (hamburger && navLinksList) {
      hamburger.onclick = function () {
        hamburger.classList.toggle('open');
        navLinksList.classList.toggle('open');
      };
    }

    // 3. Config banner close logic
    const btnCloseBanner = document.getElementById('btn-close-banner');
    if (btnCloseBanner && configBanner) {
      btnCloseBanner.onclick = function () {
        configBanner.classList.add('hidden');
      };
    }

    // 4. Listen to hash change & navigate
    window.addEventListener('hashchange', router);
    router();
  });

  return {
    showToast: showToast,
    router: router
  };
})();
