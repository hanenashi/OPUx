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

  // Click outside deselects all (harmless to native logic)
  $(document)
    .off('click.opux.deselect')
    .on('click.opux.deselect', function (e) {
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

  // IMPORTANT: No handlers on download/delete buttons. No form guards. Zero interference.
  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
