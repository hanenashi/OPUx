// opux-core.js
(function () {
  'use strict';

  function waitForJQuery() {
    if (typeof jQuery === 'undefined') {
      setTimeout(waitForJQuery, 100);
    } else {
      initScript(jQuery); // ✅ correct entry
    }
  }

  // Single entry point (kept global so concatenation order is enough)
  function initScript($) {
    $(document).ready(function () {
      // Loading overlay (same look as v1.31)
      $('body').append(
        '<div class="opux-loading-overlay"><span class="opux-loading-text">Loading...</span></div>'
      );
      const $loadingOverlay = $('.opux-loading-overlay');

      const qs = window.location.search;
      if (qs.includes('page=settings')) {
        initSettingsPage($, $loadingOverlay);
      } else if (qs.includes('page=userpanel')) {
        initUserPanel($, $loadingOverlay);
      } else {
        // Not our page → nothing to do
        $loadingOverlay.remove();
      }
    });
  }

  // expose for safety (optional, but handy for debugging)
  window.initScript = window.initScript || initScript;

  waitForJQuery();
})();
