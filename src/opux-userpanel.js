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

  // === STRICTLY button-level handling (no global submit guards) ===
  const BTN_SEL = 'button[name="tl_download"],button[name="tl_smazat"],input[name="tl_download"],input[name="tl_smazat"]';

  // Count “selected items” robustly (form-scoped first, then global fallback)
  function anySelected($scope) {
    // primary: item[] inside the same scope/form
    let n = $scope.find('input[type="checkbox"][name="item[]"]:checked').length;
    if (n > 0) return true;
    // some templates may vary or render outside → global fallback
    n = $('input[type="checkbox"][name="item[]"]:checked').length;
    if (n > 0) return true;
    // extra-tolerant fallback in case of slightly different names
    n = $scope.find('input[type="checkbox"][name^="item"]:checked').length;
    if (n > 0) return true;
    n = $('input[type="checkbox"][name^="item"]:checked').length;
    return n > 0;
  }

  $(document)
    .off('click.opux.actions', BTN_SEL)
    .on('click.opux.actions', BTN_SEL, function (e) {
      // Always take over; we’ll re-submit explicitly
      e.preventDefault();
      e.stopImmediatePropagation();

      const $btn = $(this);
      const $form = $btn.closest('form');
      if ($form.length === 0) {
        // If the markup is weird, try nearest ancestor of .box-wrap
        const $altForm = $('.box-wrap').closest('form');
        if ($altForm.length) {
          submitWithButton($altForm, $btn);
        } else {
          // Last resort: let the native click go through (unlikely)
          $btn.get(0).click();
        }
        return;
      }

      if (!anySelected($form)) {
        if ($btn.attr('name') === 'tl_download') {
          alert('Vyberte alespoň jednu položku k stažení!');
        } else {
          alert('Vyberte alespoň jednu položku ke smazání!');
        }
        return;
      }

      submitWithButton($form, $btn);
    });

  // Submit the form and ensure the server receives which button was pressed.
  function submitWithButton($form, $btn) {
    // Clean previous synthetic flags if any
    $form.find('input[type="hidden"].opux-submit-flag').remove();

    const btnName = $btn.attr('name') || '';
    // Use actual button value if present; fallback to "1"
    const btnVal  = ($btn.is('input') ? ($btn.val() || '1') : ($btn.attr('value') || '1'));

    if (btnName) {
      $('<input>')
        .attr({ type: 'hidden', name: btnName, value: btnVal })
        .addClass('opux-submit-flag')
        .appendTo($form);
    }

    // Use native submit to bypass our own jQuery handlers and keep site behavior
    const formEl = $form.get(0);
    if (formEl && typeof formEl.submit === 'function') {
      formEl.submit();
    } else {
      // fallback
      $form.trigger('submit');
    }
  }

  setTimeout(() => addExtendedBranding($), 500);
}

// Expose
window.initUserPanel = window.initUserPanel || initUserPanel;
