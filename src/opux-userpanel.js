// opux-userpanel.js

function initUserPanel($, $loadingOverlay) {
  // Read images-per-page selection saved from settings
  const imagesPerPageIdx = parseInt(localStorage.getItem('opu_images_per_page') || '2', 10);
  const itemsPerPage = [10, 20, 50, 100, 200, 500, 1000][imagesPerPageIdx] || 50;
  const useHack = itemsPerPage > 50;

  // Purely visual sync (no state changes)
  bindSelectionVisuals($);

  // Single-click selects, double-click opens viewer (zero interference with forms)
  enableBoxClickSelection($);

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

  // No button/form handlers. No global deselect.
  setTimeout(() => addExtendedBranding($), 500);
}

/** Visual selection sync (observe native changes only) */
function bindSelectionVisuals($) {
  // Initial paint
  $('.box, .boxtop').each(function () {
    const $cb = $(this).find('input[type="checkbox"][name^="item"]');
    $(this).toggleClass('selected', $cb.prop('checked'));
  });

  // Observe any native state changes
  $(document)
    .off('change.opux.select', 'input[type="checkbox"][name^="item"]')
    .on('change.opux.select', 'input[type="checkbox"][name^="item"]', function () {
      $(this).closest('.box, .boxtop').toggleClass('selected', this.checked);
    });
}

/** Click UX: single = select (checkbox click), double = open viewer */
function enableBoxClickSelection($) {
  let lastIndex = -1;
  let allowViewerOnce = false;

  // Prevent single-click on the viewer link, but allow our double-click path
  $(document)
    .off('click.opux.prevent', 'a.swipebox')
    .on('click.opux.prevent', 'a.swipebox', function (e) {
      if (allowViewerOnce) return; // let synthetic dblclick open pass through
      e.preventDefault();
      e.stopImmediatePropagation();
    });

  // Single-click anywhere in a box toggles the REAL checkbox
  $(document)
    .off('click.opux.box', '.box, .boxtop')
    .on('click.opux.box', '.box, .boxtop', function (e) {
      const $t = $(e.target);

      // Ignore UI controls; let native handlers work
      if ($t.is('input,button,select,textarea,label')) return;

      // Block single-click viewer open if the click is on/inside the thumbnail/link
      if ($t.closest('a.swipebox, .inbox-wrap, img.inbox, .anim-placeholder').length) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      const $this = $(this);
      const $cb = $this.find('input[type="checkbox"][name^="item"]').first();
      if (!$cb.length) return;

      if (e.shiftKey && lastIndex !== -1) {
        // Range select using REAL clicks to keep OPU state in sync
        const $all = $('.box, .boxtop');
        const curr = $this.index('.box, .boxtop');
        const start = Math.min(lastIndex, curr);
        const end   = Math.max(lastIndex, curr);
        for (let i = start; i <= end; i++) {
          const $box = $all.eq(i);
          const $c = $box.find('input[type="checkbox"][name^="item"]').first();
          if ($c.length && !$c.prop('checked')) $c.get(0).click();
        }
      } else {
        // Toggle selection via native click so OPU logic runs
        $cb.get(0).click();
        lastIndex = $this.index('.box, .boxtop');
      }
    });

  // Double-click opens the viewer (trigger the site’s own swipebox handler)
  $(document)
    .off('dblclick.opux.box', '.box, .boxtop')
    .on('dblclick.opux.box', '.box, .boxtop', function (e) {
      const $a = $(this).find('a.swipebox').first();
      if (!$a.length) return;

      // Temporarily allow viewer click to pass
      allowViewerOnce = true;
      // Use native click on the link; let OPU’s viewer JS handle it
      const a = $a.get(0);
      if (a && typeof a.click === 'function') a.click();
      // Reset flag after the event loop tick
      setTimeout(() => { allowViewerOnce = false; }, 0);
    });
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
