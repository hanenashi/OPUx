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
    $(document)
      .off('load.opux', 'img.inbox')
      .on('load.opux', 'img.inbox', function () {
        replaceAnimThumbnails($);
      });
  } else {
    $loadingOverlay.remove();
  }

  // Click outside deselects all
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

  // ✅ Guard bulk actions WITHOUT breaking native behavior
  const ensureAnySelected = () => $('input[name="item[]"]:checked').length > 0;

  // Stáhnout (download)
  $('button[name="tl_download"]')
    .off('.opux')
    .on('click.opux', function (e) {
      if (!ensureAnySelected()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('Vyberte alespoň jednu položku k stažení!');
        return false;
      }
      // else: allow native submit/click to proceed
      return true;
    });

  // Smazat (delete)
  $('button[name="tl_smazat"]')
    .off('.opux')
    .on('click.opux', function (e) {
      if (!ensureAnySelected()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('Vyberte alespoň jednu položku ke smazání!');
        return false;
      }
      // else: allow native submit/click to proceed
      return true;
    });

  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
