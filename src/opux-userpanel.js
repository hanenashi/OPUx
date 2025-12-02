// opux-userpanel.js

function initUserPanel($, $loadingOverlay) {
  // Read images-per-page selection saved from settings
  const imagesPerPageIdx = parseInt(localStorage.getItem('opu_images_per_page') || '2', 10);
  const itemsPerPage = [10, 20, 50, 100, 200, 500, 1000][imagesPerPageIdx] || 50;
  const useHack = itemsPerPage > 50;

  // Initial bind (selection UX only)
  initializeAllBoxes($);

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

  // === SAFE deselect: only empty space inside .box-wrap, not buttons/forms/header ===
  $(document)
    .off('click.opux.deselect')
    .on('click.opux.deselect', function (e) {
      const $t = $(e.target);

      // If click is on/inside our action buttons or any form control → DO NOTHING
      if (
        $t.closest('button[name="tl_download"],button[name="tl_smazat"],input[name="tl_download"],input[name="tl_smazat"]').length ||
        $t.is('input,button,select,textarea,label,a') ||
        $t.closest('form').length
      ) {
        return;
      }

      // Only deselect when clicking inside the gallery container area
      const $wrap = $t.closest('.box-wrap');
      if (!$wrap.length) return;                // clicked outside gallery entirely
      if ($t.closest('.box, .boxtop').length) return; // clicked on a box → let box handler manage

      // Blank space inside gallery → deselect all
      $('.box, .boxtop').each(function () {
        const $cb = $(this).find('input[type="checkbox"]');
        if ($cb.prop('checked')) {
          $cb.prop('checked', false);
          $(this).removeClass('selected');
          $cb.trigger('change');
        }
      });
    });

  // IMPORTANT: No handlers on download/delete buttons. No form guards. Zero interference.
  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
