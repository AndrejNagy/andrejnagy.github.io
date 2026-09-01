jQuery(document).ready(function(){
    var $textareas = jQuery('textarea');

    // jQuery 1.7 has no outerWidth/outerHeight setters, so convert the wanted
    // outer box into the content box .width()/.height() actually write.
    function setOuterSize($els, w, h) {
        $els.each(function(){
            var $el = jQuery(this);
            $el.width(w - ($el.outerWidth() - $el.width()));
            $el.height(h - ($el.outerHeight() - $el.height()));
        });
    }

    function storeSize($els) {
        $els.each(function(){
            var $el = jQuery(this);
            // A textarea in an inactive tab measures 0x0; keep its last known
            // good baseline instead of recording the collapsed size.
            if (!$el.outerWidth()) { return; }
            $el.data('x', $el.outerWidth());
            $el.data('y', $el.outerHeight());
        });
    }

    $textareas.mousemove(function(){
        var $this = jQuery(this);
        var w = $this.outerWidth();
        var h = $this.outerHeight();
        if (!$this.data('x')) {
            // first time we can actually measure it (tab just became visible),
            // so this is the baseline, not a resize
            storeSize($textareas);
            return;
        }
        if (w != $this.data('x') || h != $this.data('y')) {
            // this one was resized by hand -> mirror its outer box onto the rest
            setOuterSize($textareas.not(this), w, h);
        }
        // store new height/width for all of them, so the ones we just mirrored
        // onto don't look "resized" and bounce the change back
        storeSize($textareas);
    });
    $('textarea').height(window.innerHeight/3);
    // Don't force a pixel width here: the textareas are sized by CSS (100%/90%
    // of their container). Stamping window.innerWidth on them blows them out of
    // the container after anything that resizes the window - e.g. taking a
    // YouTube embed fullscreen and coming back. Just re-baseline.
    addEventListener('resize', (event) => {
        storeSize($textareas);
    });

    // store init (default) state, after the initial sizing above
    storeSize($textareas);

    // --- Git-like diff logic for retarded text ---
    var retarded_input = document.getElementById("retarded_input");
    var retarded_output = document.getElementById("retarded_output");
    var prev_value = retarded_input.value;
    var prev_retarded = "";

    function transformChar(c, last_change, number_of_same_changes, case_change, wrong_y_i) {
        var iiiis = {
            'i': 'y',
            'y': 'i',
            'I': 'Y',
            'Y': 'I',
        };
        var replacement_char = c;
        if (case_change) {
            if (number_of_same_changes >= 3) {
                if (last_change) { replacement_char = replacement_char.toLowerCase(); number_of_same_changes=1; }
                else { replacement_char = replacement_char.toUpperCase(); number_of_same_changes=1; }
            } else {
                if (Math.round(Math.random())) {
                    if (last_change) { number_of_same_changes++; } else { number_of_same_changes=1; }
                    replacement_char = replacement_char.toUpperCase();
                    last_change = true;
                } else {
                    if (!last_change) { number_of_same_changes++; } else { number_of_same_changes=1; }
                    replacement_char = replacement_char.toLowerCase();
                    last_change = false;
                }
            }
        }
        if (wrong_y_i) {
            if (["y", "i", "Y", "I"].includes(replacement_char)) {
                replacement_char = iiiis[replacement_char];
            }
        }
        return replacement_char;
    }

    function transformString(str, case_change, wrong_y_i) {
        var retarded_value = "";
        var last_change = true;
        var number_of_same_changes = 1;
        for (var i = 0; i < str.length; i++) {
            var c = str[i];
            // Use the same logic as generateRetardedText
            var replacement_char = c;
            if (case_change) {
                if (number_of_same_changes >= 3) {
                    if (last_change) { replacement_char = replacement_char.toLowerCase(); number_of_same_changes=1; }
                    else { replacement_char = replacement_char.toUpperCase(); number_of_same_changes=1; }
                } else {
                    if (Math.round(Math.random())) {
                        if (last_change) { number_of_same_changes++; } else { number_of_same_changes=1; }
                        replacement_char = replacement_char.toUpperCase();
                        last_change = true;
                    } else {
                        if (!last_change) { number_of_same_changes++; } else { number_of_same_changes=1; }
                        replacement_char = replacement_char.toLowerCase();
                        last_change = false;
                    }
                }
            }
            if (wrong_y_i) {
                var iiiis = {'i': 'y','y': 'i','I': 'Y','Y': 'I'};
                if (["y", "i", "Y", "I"].includes(replacement_char)) {
                    replacement_char = iiiis[replacement_char];
                }
            }
            retarded_value += replacement_char;
        }
        return retarded_value;
    }

    function findDiffIndices(a, b) {
        // Returns [start, endA, endB] where a[start:endA] replaced by b[start:endB]
        var start = 0;
        while (start < a.length && start < b.length && a[start] === b[start]) start++;
        var endA = a.length, endB = b.length;
        while (endA > start && endB > start && a[endA-1] === b[endB-1]) { endA--; endB--; }
        return [start, endA, endB];
    }

    retarded_input.addEventListener("input", function() {
        var case_change = document.getElementById("case_change").checked;
        var wrong_y_i = document.getElementById("wrong_y_i").checked;
        var new_value = retarded_input.value;

        // Find diff
        var [start, endA, endB] = findDiffIndices(prev_value, new_value);

        // Transform only the changed part
        var before = prev_retarded.slice(0, start);
        var after = prev_retarded.slice(prev_retarded.length - (prev_value.length - endA));
        var changed = new_value.slice(start, endB);
        var transformed = transformString(changed, case_change, wrong_y_i);
        var new_retarded = before + transformed + after;
        retarded_output.value = new_retarded;

        prev_value = new_value;
        prev_retarded = new_retarded;
    });
});

function copyToClipboard() {
    /* Get the text field */
    var copyText = document.getElementById("retarded_output");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */

     /* Copy the text inside the text field */
    navigator.clipboard.writeText(copyText.value);
  }

function generateRetardedText() {
    var iiiis = {
        'i': 'y',
        'y': 'i',
        'I': 'Y',
        'Y': 'I',
    }
    var case_change = document.getElementById("case_change").checked
    var wrong_y_i = document.getElementById("wrong_y_i").checked
    console.info(case_change);
    var retarded_input = document.getElementById("retarded_input")
    var retarded_button = document.getElementById("retarded_button")
    var retarded_output = document.getElementById("retarded_output")
    var regular_value = retarded_input.value;
    var retarded_value = "";
    var last_change = true;
    var number_of_same_changes = 1;
        for (var i = 0; i < regular_value.length; i++){
            var replacement_char = regular_value[i]
            if (case_change){
                if (number_of_same_changes >= 3){
                    if (last_change){replacement_char = replacement_char.toLowerCase(); number_of_same_changes=1;}
                    else {replacement_char = replacement_char.toUpperCase(); number_of_same_changes=1;}
                }
                else {
                    if (Math.round(Math.random())){
                        if (last_change){number_of_same_changes++;} else {number_of_same_changes=1;}
                        replacement_char = replacement_char.toUpperCase();
                        last_change = true
                    }
                    else {
                        if (!last_change){number_of_same_changes++;} else {number_of_same_changes=1;}
                        replacement_char = replacement_char.toLowerCase();
                        last_change = false
                    }
                }
            }
            if (wrong_y_i){
                if (['y', 'i', 'Y', 'I'].includes(replacement_char)){
                    replacement_char = iiiis[replacement_char];
                }
            }
            retarded_value = retarded_value + replacement_char
        }
    retarded_output.value = retarded_value
}
