// opux-userpanel.js

function initUserPanel($, $loadingOverlay) {
  // Read images-per-page selection saved from settings
  const imagesPerPageIdx = parseInt(localStorage.getItem('opu_images_per_page') || '2', 10);
  const itemsPerPage = [10, 20, 50, 100, 200, 500, 1000][imagesPerPageIdx] || 50;
  const useHack = itemsPerPage > 50;

  // Bind purely visual sync to native checkbox changes (no custom toggling)
  bindSelectionVisuals($);

  if (useHack) {
    replaceAnimThumbnails($);
    loadExtraPages($, itemsPerPage, $loadingOverlay);
    setTimeout(() => replaceAnimThumbnails($), 1000);
    $(document)
      .off('load.opux', 'img.inbox')
      .on('load.opux', 'img.inbox', function () {
        replaceAnimThumbnails($);
      });
  } else {
    $loadingOverlay.remove();
  }

  // IMPORTANT: No handlers on buttons/forms/click-outside.
  // Let OPU's own code manage selection + submit entirely.
  setTimeout(() => addExtendedBranding($), 500);
}

/**
 * Visual selection sync that DOES NOT change selection itself.
 * We only observe native checkbox changes and mirror a CSS class.
 */
function bindSelectionVisuals($) {
  // Initial paint
  $('.box, .boxtop').each(function () {
    const $cb = $(this).find('input[type="checkbox"][name^="item"]'); // tolerant
    if ($cb.prop('checked')) $(this).addClass('selected');
    else $(this).removeClass('selected');
  });

  // Observe changes (from user clicks OR site JS)
  $(document)
    .off('change.opux.select', 'input[type="checkbox"][name^="item"]')
    .on('change.opux.select', 'input[type="checkbox"][name^="item"]', function () {
      const $box = $(this).closest('.box, .boxtop');
      $box.toggleClass('selected', this.checked);
    });
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
