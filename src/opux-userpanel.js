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

  // ✅ Guard at the FORM level (don’t touch the buttons)
  // Find the gallery form that owns tl_download / tl_smazat
  // Use a broad selector but only act if the submitter is one of those buttons.
  $(document)
    .off('submit.opux-guard')
    .on('submit.opux-guard', 'form', function (e) {
      // Identify which submit button triggered the submit
      const submitter =
        (e.originalEvent && e.originalEvent.submitter) ||
        document.activeElement; // fallback

      if (!submitter) return; // nothing to do

      const name = submitter.getAttribute && submitter.getAttribute('name');
      if (name !== 'tl_download' && name !== 'tl_smazat') return; // not our concern

      const anySelected = $('input[name="item[]"]:checked').length > 0;
      if (!anySelected) {
        e.preventDefault();
        // Messages from the original working code (Czech)
        if (name === 'tl_download') {
          alert('Vyberte alespoň jednu položku k stažení!');
        } else {
          alert('Vyberte alespoň jednu položku ke smazání!');
        }
        return false;
      }
      // else: let the native submit proceed untouched
      return true;
    });

  // No button handlers here on purpose — native behavior stays intact
  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
