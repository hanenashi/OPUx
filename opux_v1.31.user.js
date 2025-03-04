// ==UserScript==
// @name         OPUx
// @namespace    http://tampermonkey.net/
// @version      1.31
// @description  OPU enhancer
// @author       Grok (xAI) & Blasnik
// @match        https://opu.peklo.biz/?page=userpanel*
// @match        https://opu.peklo.biz/?page=settings*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add custom CSS
    GM_addStyle(`
        .box.selected {
            border: 1px solid #fff !important;
            background-color: #333 !important;
        }
        .anim-placeholder {
            max-width: 200px;
            max-height: 160px;
            width: 200px;
            height: 160px;
            border: 1px solid #666;
            margin-top: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #000;
            color: #fff;
            font-family: Roboto, sans-serif;
            font-size: 16px;
            margin: auto;
        }
        .anim-placeholder:hover {
            border: 1px solid #fff;
        }
        .opux-e {
            color: #888;
            font-family: arial;
            font-weight: bold;
            font-size: 14pt;
        }
        .opux-x {
            color: #f0f0f0;
            font-family: arial;
            font-weight: bold;
            font-size: 14pt;
            cursor: pointer;
        }
        .opux-x:hover {
            text-decoration: underline;
        }
        .opux-rest {
            color: #888;
            font-family: arial;
        }
        .opux-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .opux-loading-text {
            color: #fff;
            font-family: arial;
            font-size: 24px;
            font-weight: bold;
        }
        .opux-loading-overlay.active {
            display: flex;
        }
        .opux-delay-section {
            display: none;
        }
        .opux-delay-input {
            width: 60px;
            margin-left: 10px;
            font-size: 14pt;
            color: #888;
            font-family: arial;
        }
    `);

    // Wait for jQuery
    function waitForJQuery() {
        if (typeof jQuery === 'undefined') {
            setTimeout(waitForJQuery, 100);
        } else {
            initScript(jQuery);
        }
    }

    // Main script logic
    function initScript($) {
        $(document).ready(function() {
            var lastClickedIndex = -1;

            // Add loading overlay to DOM
            $('body').append('<div class="opux-loading-overlay"><span class="opux-loading-text">Loading...</span></div>');
            var $loadingOverlay = $('.opux-loading-overlay');

            // Function to add branding and delay setting
            function addExtendedBranding() {
                var $opuLinks = $('.opunadpis-wrap a.opu');
                console.log(`Found .opunadpis-wrap a.opu elements: ${$opuLinks.length}`);
                $opuLinks.each(function(index) {
                    var href = $(this).attr('href');
                    console.log(`a.opu[${index}] href: ${href}`);
                });
                var $opuLink = $opuLinks.first();
                if ($opuLink.length && !$opuLink.siblings('.opux-e').length) {
                    $opuLink.after(' <span class="opux-e">e</span><span class="opux-x">x</span><span class="opux-rest">tended</span>');

                    // Add hidden delay section
                    var $animLimit = $('div.newuspas:contains("Limit pro zobrazení animací")');
                    if ($animLimit.length) {
                        var delaySection = `
                            <div class="opux-delay-section">
                                <div align="left" class="newuspas">Load Delay:</div>
                                <div class="usset ussetmarg1">
                                    <input type="text" class="opux-delay-input" id="opux-load-delay" value="${localStorage.getItem('opux_load_delay') || 500}" size="4" maxlength="4"> ms
                                </div>
                                <div class="usset">Set delay between page loads (100-9999 ms)</div>
                                <br clear="all">
                            </div>
                        `;
                        $animLimit.before(delaySection);

                        // Toggle section on 'x' click
                        $('.opux-x').on('click', function(e) {
                            e.preventDefault(); // Stop link propagation
                            $('.opux-delay-section').toggle();
                        });

                        // Save delay on change
                        $('#opux-load-delay').on('change', function() {
                            var value = parseInt($(this).val());
                            if (value >= 100 && value <= 9999) {
                                localStorage.setItem('opux_load_delay', value);
                            } else {
                                $(this).val(localStorage.getItem('opux_load_delay') || 500);
                            }
                        });
                    }
                }
            }

            // Settings Page: Enhance dropdown and branding
            if (window.location.search.includes('page=settings')) {
                var $select = $('select[name="pocet_prispevku"]');
                if ($select.length) {
                    var options = [
                        { value: "3", text: "100" },
                        { value: "4", text: "200" },
                        { value: "5", text: "500" },
                        { value: "6", text: "1000" }
                    ];
                    options.forEach(opt => {
                        if (!$select.find(`option[value="${opt.value}"]`).length) {
                            $select.append(`<option value="${opt.value}">${opt.text}</option>`);
                        }
                    });
                    $select.on('change', function() {
                        localStorage.setItem('opu_images_per_page', $(this).val());
                    });
                    var savedValue = localStorage.getItem('opu_images_per_page');
                    if (savedValue && $select.find(`option[value="${savedValue}"]`).length) {
                        $select.val(savedValue);
                    }
                }
                setTimeout(addExtendedBranding, 500);
                $loadingOverlay.remove();
            }

            // User Panel: Handle image loading, selection, and branding
            if (window.location.search.includes('page=userpanel')) {
                var imagesPerPage = parseInt(localStorage.getItem('opu_images_per_page')) || 2;
                var itemsPerPage = [10, 20, 50, 100, 200, 500, 1000][imagesPerPage];
                var useHack = itemsPerPage > 50;

                initializeAllBoxes();
                if (useHack) {
                    replaceAnimThumbnails();
                    loadExtraPages(itemsPerPage);
                    setTimeout(replaceAnimThumbnails, 1000);
                    $(document).on('load', 'img.inbox', replaceAnimThumbnails);
                } else {
                    $loadingOverlay.remove();
                }

                // Deselect on click outside gallery
                $(document).on('click', function(e) {
                    if (!$(e.target).closest('.box, .boxtop').length) {
                        $('.box, .boxtop').each(function() {
                            var checkbox = $(this).find('input[type="checkbox"]');
                            if (checkbox.prop('checked')) {
                                checkbox.prop('checked', false);
                                $(this).removeClass('selected');
                                checkbox.trigger('change');
                            }
                        });
                        lastClickedIndex = -1;
                    }
                });

                // Enhance bulk download and delete buttons
                $('button[name="tl_download"]').on('click.opux', function(e) {
                    e.preventDefault();
                    if ($('input[name="item[]"]:checked').length === 0) {
                        alert('Vyberte alespoň jednu položku k stažení!');
                    } else {
                        console.log('Triggering native download for selected items...');
                        $(this).trigger('click.native');
                    }
                });

                $('button[name="tl_smazat"]').on('click.opux', function(e) {
                    e.preventDefault();
                    if ($('input[name="item[]"]:checked').length === 0) {
                        alert('Vyberte alespoň jednu položku ke smazání!');
                    } else {
                        console.log('Triggering native delete for selected items...');
                        $(this).trigger('click.native');
                    }
                });

                $('button[name="tl_download"]').on('click.native', function() {
                    console.log('Native download handler triggered');
                });

                $('button[name="tl_smazat"]').on('click.native', function() {
                    console.log('Native delete handler triggered');
                });

                setTimeout(addExtendedBranding, 500);
            }

            // Initialize all boxes with proper indexing
            function initializeAllBoxes() {
                var $allBoxes = $('.box, .boxtop');
                $allBoxes.each(function(index) {
                    $(this).data('index', index);
                    var checkbox = $(this).find('input[type="checkbox"]');
                    if (checkbox.prop('checked')) {
                        $(this).addClass('selected');
                        setTimeout(() => checkbox.trigger('change'), 0);
                    }
                    let id = checkbox.val();
                    if (!$(`#overlay_${id}`).length) {
                        let overlay = $(`<span id="overlay_${id}" class="overlay"></span>`).hide();
                        $(this).css("position", "relative").append(overlay);
                    }
                });

                $allBoxes.off('click').on('click', function(e) {
                    if (!$(e.target).is('button, input') && e.detail === 1) {
                        var $this = $(this);
                        var checkbox = $this.find('input[type="checkbox"]');
                        var currentIndex = $this.data('index');

                        if (e.shiftKey && lastClickedIndex !== -1) {
                            var $allBoxesFresh = $('.box, .boxtop');
                            var start = Math.min(lastClickedIndex, currentIndex);
                            var end = Math.max(lastClickedIndex, currentIndex);
                            console.log(`Range selecting from ${start} to ${end}, total boxes: ${$allBoxesFresh.length}`);
                            $allBoxesFresh.slice(start, end + 1).each(function() {
                                var $box = $(this);
                                var cb = $box.find('input[type="checkbox"]');
                                if (!cb.prop('checked')) {
                                    cb.prop('checked', true);
                                    $box.addClass('selected');
                                    cb.trigger('change');
                                }
                            });
                        } else {
                            checkbox.prop('checked', !checkbox.prop('checked'));
                            $this.toggleClass('selected', checkbox.prop('checked'));
                            checkbox.trigger('change');
                            lastClickedIndex = currentIndex;
                        }

                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                });

                $('.swipebox').off('click.swipebox');
            }

            // Replace .gif and .webp thumbnails with placeholder for >50 items
            function replaceAnimThumbnails() {
                $('.box, .boxtop').each(function() {
                    var $link = $(this).find('.inbox-wrap');
                    var $img = $link.find('img.inbox[src]');
                    var src = $img.attr('src');
                    if (src) {
                        console.log(`Checking image src: ${src}`);
                        if (src.endsWith('.gif') || src.endsWith('.webp')) {
                            var ext = src.split('.').pop().toUpperCase();
                            console.log(`Replacing ${src} with .${ext} placeholder`);
                            $img.replaceWith(`<div class="anim-placeholder">.${ext}</div>`);
                        }
                    }
                });
            }

            // Load extra pages for >50 images with overlay and configurable delay
            function loadExtraPages(targetCount) {
                var currentStart = parseInt(new URLSearchParams(window.location.search).get('recordStart')) || 1;
                var itemsPerPage = 50;
                var pagesNeeded = Math.ceil(targetCount / itemsPerPage) - 1;
                var loadedCount = $('.box, .boxtop').length;
                var loadDelay = parseInt(localStorage.getItem('opux_load_delay')) || 500;

                function fetchNextPage(pageNum) {
                    if (loadedCount >= targetCount || pageNum > 11) {
                        initializeAllBoxes();
                        replaceAnimThumbnails();
                        $loadingOverlay.removeClass('active');
                        return;
                    }
                    var nextUrl = `https://opu.peklo.biz/?page=userpanel&recordStart=${pageNum}`;
                    $loadingOverlay.addClass('active');
                    setTimeout(function() {
                        $.get(nextUrl, function(data) {
                            var $nextPage = $(data);
                            var $nextBoxes = $nextPage.find('.box-wrap').children('.box, .boxtop');
                            if ($nextBoxes.length > 0) {
                                $('.box-wrap').append($nextBoxes);
                                loadedCount += $nextBoxes.length;
                                console.log(`Loaded ${$nextBoxes.length} from page ${pageNum}, total: ${loadedCount}`);
                                replaceAnimThumbnails();
                                fetchNextPage(pageNum + 1);
                            } else {
                                $loadingOverlay.removeClass('active');
                            }
                        }).fail(function() {
                            console.log(`Failed to load page ${pageNum}`);
                            initializeAllBoxes();
                            replaceAnimThumbnails();
                            $loadingOverlay.removeClass('active');
                        });
                    }, loadDelay);
                }

                fetchNextPage(currentStart + 1);
            }
        });
    }

    // Start the script
    waitForJQuery();
})();