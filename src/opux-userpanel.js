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
