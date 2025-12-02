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

  // ===== Robust submitter tracking + scoped selection guard =====
  // Track the exact control that initiated submit (works with <button> and <input type=submit>)
  let OPULastSubmitter = null;
  $(document)
    .off('click.opux.submitter')
    .on(
      'click.opux.submitter',
      'button[name="tl_download"],button[name="tl_smazat"],input[name="tl_download"],input[name="tl_smazat"]',
      function () {
        OPULastSubmitter = this;
      }
    );

  // Guard at the FORM level, but only for our two actions
  $(document)
    .off('submit.opux-guard')
    .on('submit.opux-guard', 'form', function (e) {
      // Determine submitter reliably
      const submitter =
        (e.originalEvent && e.originalEvent.submitter) ||
        OPULastSubmitter ||
        null;

      // If we can't identify or it's not one of our buttons, let it pass
      if (!submitter) return true;

      const nameAttr = submitter.getAttribute && submitter.getAttribute('name');
      if (nameAttr !== 'tl_download' && nameAttr !== 'tl_smazat') return true;

      // Count selected items WITHIN THIS FORM (not globally)
      const $form = $(this);
      let anySelected = $form.find('input[type="checkbox"][name="item[]"]:checked').length > 0;

      // Fallback (some OPU templates render checkboxes slightly outside form)
      if (!anySelected) {
        anySelected = $('input[type="checkbox"][name="item[]"]:checked').length > 0;
      }

      if (!anySelected) {
        e.preventDefault();
        // Messages matching original behavior
        if (nameAttr === 'tl_download') {
          alert('Vyberte alespoň jednu položku k stažení!');
        } else {
          alert('Vyberte alespoň jednu položku ke smazání!');
        }
        return false;
      }

      // Clear submitter to avoid accidental reuse on the next submit
      OPULastSubmitter = null;
      // Allow native postback/download/delete to proceed untouched
      return true;
    });

  // No button handlers here on purpose — native behavior stays intact
  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
