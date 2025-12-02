// opux-userpanel.js

function initUserPanel($, $loadingOverlay) {
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

  setTimeout(() => addExtendedBranding($), 500);
}

/** Visual selection sync (observe native changes only) */
function bindSelectionVisuals($) {
  $('.box, .boxtop').each(function () {
    const $cb = $(this).find('input[type="checkbox"][name^="item"]');
    $(this).toggleClass('selected', $cb.prop('checked'));
  });

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

  // Prevent single-click on the viewer link; allow only our dblclick path
  $(document)
    .off('click.opux.prevent', 'a.swipebox')
    .on('click.opux.prevent', 'a.swipebox', function (e) {
      if (allowViewerOnce) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    });

  // Single-click anywhere in a box toggles the REAL checkbox
  $(document)
    .off('click.opux.box', '.box, .boxtop')
    .on('click.opux.box', '.box, .boxtop', function (e) {
      const $t = $(e.target);
      if ($t.is('input,button,select,textarea,label')) return;

      if ($t.closest('a.swipebox, .inbox-wrap, img.inbox, .anim-placeholder').length) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      const $this = $(this);
      const $cb = $this.find('input[type="checkbox"][name^="item"]').first();
      if (!$cb.length) return;

      if (e.shiftKey && lastIndex !== -1) {
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
        $cb.get(0).click(); // native click → OPU keeps state correctly
        lastIndex = $this.index('.box, .boxtop');
      }
    });

  // Double-click opens the viewer
  $(document)
    .off('dblclick.opux.box', '.box, .boxtop')
    .on('dblclick.opux.box', '.box, .boxtop', function () {
      const $a = $(this).find('a.swipebox').first();
      if (!$a.length) return;
      allowViewerOnce = true;
      const a = $a.get(0);
      if (a && typeof a.click === 'function') a.click();
      setTimeout(() => { allowViewerOnce = false; }, 0);
    });
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
