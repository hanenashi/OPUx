// opux-core.js
(function() {
    'use strict';
    function waitForJQuery() {
        if (typeof jQuery === 'undefined') {
            setTimeout(waitForJQuery, 100);
        } else {
            main(jQuery);
        }
    }
    waitForJQuery();
})();
"// initial build trigger" 
