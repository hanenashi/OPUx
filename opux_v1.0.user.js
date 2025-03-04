// ==UserScript==
// @name         OPU User Panel - Click-to-Select with Double-Click Swipebox
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  Single-click selects image anywhere, double-click on image opens Swipebox
// @author       Blasnik
// @match        https://opu.peklo.biz/?page=userpanel*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add custom CSS for selected state
    GM_addStyle(`
        .box.selected {
            border: 1px solid #fff !important;
            background-color: #333 !important;
        }
    `);

    // Wait for jQuery to be available
    function waitForJQuery() {
        if (typeof jQuery === 'undefined') {
            setTimeout(waitForJQuery, 100);
        } else {
            initScript(jQuery);
        }
    }

    // Main script logic
    function initScript($) {
        $(document).ready(function() { // Wait for DOM and jscript.js to load
            // Set initial selected state based on checkbox
            $('.box').each(function() {
                var checkbox = $(this).find('input[type="checkbox"]');
                if (checkbox.prop('checked')) {
                    $(this).addClass('selected');
                    setTimeout(() => checkbox.trigger('change'), 0);
                }
            });

            // Add overlays if not already present (mimic jscript.js)
            $('input[name="item[]"]').each(function() {
                let id = $(this).val();
                let parentBox = $(this).closest('div[class^="box"]');
                if (parentBox.length && !$(`#overlay_${id}`).length) {
                    let overlay = $(`<span id="overlay_${id}" class="overlay"></span>`).hide();
                    parentBox.css("position", "relative").append(overlay);
                }
            });

            // Single-click to select (toggle checkbox) anywhere in .box
            $('.box').on('click', function(e) {
                console.log('Single-click on:', e.target, 'Detail:', e.detail);
                if (!$(e.target).is('button, input') && e.detail === 1) {
                    var checkbox = $(this).find('input[type="checkbox"]');
                    checkbox.prop('checked', !checkbox.prop('checked'));
                    $(this).toggleClass('selected', checkbox.prop('checked'));
                    checkbox.trigger('change'); // Sync with jscript.js
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            });

            // Double-click on .swipebox (image) handled by page's Swipebox
            // Remove new tab logic, let Swipebox take over
            $('.swipebox').off('click.swipebox'); // Remove our override, let page bind Swipebox
        });
    }

    // Start the script
    waitForJQuery();
})();