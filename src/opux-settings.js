// opux-settings.js

function initSettingsPage($, $loadingOverlay) {
  const $select = $('select[name="pocet_prispevku"]');
  if ($select.length) {
    const options = [
      { value: '3', text: '100' },
      { value: '4', text: '200' },
      { value: '5', text: '500' },
      { value: '6', text: '1000' }
    ];
    options.forEach(opt => {
      if (!$select.find('option[value="' + opt.value + '"]').length) {
        $select.append('<option value="' + opt.value + '">' + opt.text + '</option>');
      }
    });
    $select.off('change.opux').on('change.opux', function () {
      localStorage.setItem('opu_images_per_page', $(this).val());
    });
    const saved = localStorage.getItem('opu_images_per_page');
    if (saved && $select.find('option[value="' + saved + '"]').length) {
      $select.val(saved);
    }
  }

  setTimeout(() => addExtendedBranding($), 500);
  $loadingOverlay.remove();
}

// Expose
window.initSettingsPage = window.initSettingsPage || initSettingsPage;
