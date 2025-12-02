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
