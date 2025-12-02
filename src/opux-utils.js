// opux-utils.js

// Branding + delay UI (shared by settings & userpanel)
function addExtendedBranding($) {
  const $opuLinks = $('.opunadpis-wrap a.opu');
  if (!$opuLinks.length) return;
  const $opuLink = $opuLinks.first();

  if ($opuLink.length && !$opuLink.siblings('.opux-e').length) {
    $opuLink.after(' <span class="opux-e">e</span><span class="opux-x">x</span><span class="opux-rest">tended</span>');

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

      $('.opux-x').off('click.opux').on('click.opux', function (e) {
        e.preventDefault();
        $('.opux-delay-section').toggle();
      });

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
  let loadedCount = $('.box, .boxtop').length;
  const loadDelay = parseInt(localStorage.getItem('opux_load_delay') || '500', 10);

  function fetchNextPage(pageNum) {
    if (loadedCount >= targetCount || pageNum > 11) {
      // After loading completes, just resync visuals; DO NOT bind clicks or touch swipebox
      bindSelectionVisuals($);
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
        bindSelectionVisuals($);
        replaceAnimThumbnails($);
        $loadingOverlay.removeClass('active');
      });
    }, loadDelay);
  }

  fetchNextPage(currentStart + 1);
}

// Expose to global (simple userscript environment)
window.addExtendedBranding   = window.addExtendedBranding   || addExtendedBranding;
window.replaceAnimThumbnails = window.replaceAnimThumbnails || replaceAnimThumbnails;
window.loadExtraPages        = window.loadExtraPages        || loadExtraPages;
