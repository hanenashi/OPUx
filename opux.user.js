
// ==UserScript==
// @name         OPUx
// @namespace    http://tampermonkey.net/
// @version      1.32-dev
// @description  Modular OPU enhancer
// @author       Grok (xAI) & Blasnik
// @match        https://opu.peklo.biz/?page=userpanel*
// @match        https://opu.peklo.biz/?page=settings*
// @grant        GM_addStyle
// ==/UserScript==

// opux-style.js
GM_addStyle(`
    .box.selected {
        border: 1px solid #fff !important;
        background-color: #333 !important;
    }
    .anim-placeholder {
        max-width: 200px;
        max-height: 160px;
        width: 200px;
        height: 160px;
        border: 1px solid #666;
        margin-top: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #000;
        color: #fff;
        font-family: Roboto, sans-serif;
        font-size: 16px;
        margin: auto;
    }
    .anim-placeholder:hover {
        border: 1px solid #fff;
    }
    .opux-e {
        color: #888;
        font-family: arial;
        font-weight: bold;
        font-size: 14pt;
    }
    .opux-x {
        color: #f0f0f0;
        font-family: arial;
        font-weight: bold;
        font-size: 14pt;
        cursor: pointer;
    }
    .opux-x:hover {
        text-decoration: underline;
    }
    .opux-rest {
        color: #888;
        font-family: arial;
    }
    .opux-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    .opux-loading-text {
        color: #fff;
        font-family: arial;
        font-size: 24px;
        font-weight: bold;
    }
    .opux-loading-overlay.active {
        display: flex;
    }
    .opux-delay-section {
        display: none;
    }
    .opux-delay-input {
        width: 60px;
        margin-left: 10px;
        font-size: 14pt;
        color: #888;
        font-family: arial;
    }
`);


// opux-utils.js

// Branding + delay UI (shared by settings & userpanel)
function addExtendedBranding($) {
  const $opuLinks = $('.opunadpis-wrap a.opu');
  if (!$opuLinks.length) return;
  const $opuLink = $opuLinks.first();

  if ($opuLink.length && !$opuLink.siblings('.opux-e').length) {
    $opuLink.after(' <span class="opux-e">e</span><span class="opux-x">x</span><span class="opux-rest">tended</span>');

    // Find the “Limit pro zobrazení animací” section robustly (covers mojibake too)
    const $candidates = $('div.newuspas').filter(function () {
      const t = $(this).text().toLowerCase();
      return t.includes('limit pro zobrazení animací') || t.includes('limit pro zobrazen') || t.includes('limit pro zobrazeni animaci');
    });

    if ($candidates.length) {
      const delayValue = localStorage.getItem('opux_load_delay') || 500;
      const delaySection = `
        <div class="opux-delay-section">
          <div align="left" class="newuspas">Load Delay:</div>
          <div class="usset ussetmarg1">
            <input type="text" class="opux-delay-input" id="opux-load-delay" value="${delayValue}" size="4" maxlength="4"> ms
          </div>
          <div class="usset">Set delay between page loads (100-9999 ms)</div>
          <br clear="all">
        </div>
      `;
      $candidates.first().before(delaySection);

      // Toggle section on 'x'
      $('.opux-x').off('click.opux').on('click.opux', function (e) {
        e.preventDefault();
        $('.opux-delay-section').toggle();
      });

      // Persist delay
      $('#opux-load-delay').off('change.opux').on('change.opux', function () {
        const v = parseInt($(this).val(), 10);
        if (v >= 100 && v <= 9999) {
          localStorage.setItem('opux_load_delay', v);
        } else {
          $(this).val(localStorage.getItem('opux_load_delay') || 500);
        }
      });
    }
  }
}

// Initialize selection behavior & overlays on all boxes
function initializeAllBoxes($) {
  const $allBoxes = $('.box, .boxtop');

  $allBoxes.each(function (index) {
    $(this).data('index', index);

    const $checkbox = $(this).find('input[type="checkbox"]');
    if ($checkbox.prop('checked')) {
      $(this).addClass('selected');
      setTimeout(() => $checkbox.trigger('change'), 0);
    }

    const id = $checkbox.val();
    if (id && !$('#overlay_' + id).length) {
      const overlay = $('<span id="overlay_' + id + '" class="overlay"></span>').hide();
      $(this).css('position', 'relative').append(overlay);
    }
  });

  let lastClickedIndex = -1;

  $allBoxes.off('click.opux').on('click.opux', function (e) {
    if ($(e.target).is('button, input') || e.detail !== 1) return;

    const $this = $(this);
    const $cb = $this.find('input[type="checkbox"]');
    const currentIndex = $this.data('index');

    if (e.shiftKey && lastClickedIndex !== -1) {
      const $fresh = $('.box, .boxtop');
      const start = Math.min(lastClickedIndex, currentIndex);
      const end = Math.max(lastClickedIndex, currentIndex);
      $fresh.slice(start, end + 1).each(function () {
        const $box = $(this);
        const cb = $box.find('input[type="checkbox"]');
        if (!cb.prop('checked')) {
          cb.prop('checked', true);
          $box.addClass('selected');
          cb.trigger('change');
        }
      });
    } else {
      $cb.prop('checked', !$cb.prop('checked'));
      $this.toggleClass('selected', $cb.prop('checked'));
      $cb.trigger('change');
      lastClickedIndex = currentIndex;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
  });

  // Disable default lightbox clicker
  $('.swipebox').off('click.swipebox');
}

// Replace .gif/.webp thumbs with placeholders (performance)
function replaceAnimThumbnails($) {
  $('.box, .boxtop').each(function () {
    const $link = $(this).find('.inbox-wrap');
    const $img = $link.find('img.inbox[src]');
    const src = $img.attr('src');
    if (!src) return;

    if (src.endsWith('.gif') || src.endsWith('.webp')) {
      const ext = src.split('.').pop().toUpperCase();
      $img.replaceWith('<div class="anim-placeholder">.' + ext + '</div>');
    }
  });
}

// Lazy-load more pages into the gallery with overlay + delay
function loadExtraPages($, targetCount, $loadingOverlay) {
  const currentStart = parseInt(new URLSearchParams(window.location.search).get('recordStart') || '1', 10);
  const itemsPerPage = 50;
  let loadedCount = $('.box, .boxtop').length;
  const loadDelay = parseInt(localStorage.getItem('opux_load_delay') || '500', 10);

  function fetchNextPage(pageNum) {
    if (loadedCount >= targetCount || pageNum > 11) {
      initializeAllBoxes($);
      replaceAnimThumbnails($);
      $loadingOverlay.removeClass('active');
      return;
    }

    const nextUrl = 'https://opu.peklo.biz/?page=userpanel&recordStart=' + pageNum;
    $loadingOverlay.addClass('active');

    setTimeout(function () {
      $.get(nextUrl, function (data) {
        const $next = $(data);
        const $nextBoxes = $next.find('.box-wrap').children('.box, .boxtop');
        if ($nextBoxes.length > 0) {
          $('.box-wrap').append($nextBoxes);
          loadedCount += $nextBoxes.length;
          replaceAnimThumbnails($);
          fetchNextPage(pageNum + 1);
        } else {
          $loadingOverlay.removeClass('active');
        }
      }).fail(function () {
        initializeAllBoxes($);
        replaceAnimThumbnails($);
        $loadingOverlay.removeClass('active');
      });
    }, loadDelay);
  }

  fetchNextPage(currentStart + 1);
}

// Expose to global (simple userscript environment)
window.addExtendedBranding = window.addExtendedBranding || addExtendedBranding;
window.initializeAllBoxes   = window.initializeAllBoxes   || initializeAllBoxes;
window.replaceAnimThumbnails= window.replaceAnimThumbnails|| replaceAnimThumbnails;
window.loadExtraPages       = window.loadExtraPages       || loadExtraPages;


// opux-settings.js

function initSettingsPage($, $loadingOverlay) {
  const $select = $('select[name="pocet_prispevku"]');
  if ($select.length) {
    const options = [
      { value: '3', text: '100' },
      { value: '4', text: '200' },
      { value: '5', text: '500' },
      { value: '6', text: '1000' }
    ];
    options.forEach(opt => {
      if (!$select.find('option[value="' + opt.value + '"]').length) {
        $select.append('<option value="' + opt.value + '">' + opt.text + '</option>');
      }
    });
    $select.off('change.opux').on('change.opux', function () {
      localStorage.setItem('opu_images_per_page', $(this).val());
    });
    const saved = localStorage.getItem('opu_images_per_page');
    if (saved && $select.find('option[value="' + saved + '"]').length) {
      $select.val(saved);
    }
  }

  setTimeout(() => addExtendedBranding($), 500);
  $loadingOverlay.remove();
}

// Expose
window.initSettingsPage = window.initSettingsPage || initSettingsPage;


// opux-userpanel.js

function initUserPanel($, $loadingOverlay) {
  // Read images-per-page selection saved from settings
  const imagesPerPageIdx = parseInt(localStorage.getItem('opu_images_per_page') || '2', 10);
  const itemsPerPage = [10, 20, 50, 100, 200, 500, 1000][imagesPerPageIdx] || 50;
  const useHack = itemsPerPage > 50;

  // Initial bind
  initializeAllBoxes($);

  if (useHack) {
    replaceAnimThumbnails($);
    loadExtraPages($, itemsPerPage, $loadingOverlay);
    setTimeout(() => replaceAnimThumbnails($), 1000);
    $(document).off('load.opux', 'img.inbox').on('load.opux', 'img.inbox', function () {
      replaceAnimThumbnails($);
    });
  } else {
    $loadingOverlay.remove();
  }

  // Click outside deselects all
  $(document).off('click.opux.deselect').on('click.opux.deselect', function (e) {
    if (!$(e.target).closest('.box, .boxtop').length) {
      $('.box, .boxtop').each(function () {
        const $cb = $(this).find('input[type="checkbox"]');
        if ($cb.prop('checked')) {
          $cb.prop('checked', false);
          $(this).removeClass('selected');
          $cb.trigger('change');
        }
      });
    }
  });

  // Guard bulk actions (download/delete) unless something is selected
  $('button[name="tl_download"]').off('.opux').on('click.opux', function (e) {
    if ($('input[name="item[]"]:checked').length === 0) {
      e.preventDefault();
      alert('Vyberte alespoň jednu položku k stažení!');
    } else {
      // bounce to native
      $(this).trigger('click.native');
    }
  }).on('click.native', function () { /* native hook placeholder */ });

  $('button[name="tl_smazat"]').off('.opux').on('click.opux', function (e) {
    if ($('input[name="item[]"]:checked').length === 0) {
      e.preventDefault();
      alert('Vyberte alespoň jednu položku ke smazání!');
    } else {
      $(this).trigger('click.native');
    }
  }).on('click.native', function () { /* native hook placeholder */ });

  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;


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
