jQuery(document).ready(function(){
    var $textareas = jQuery('textarea');

    // store init (default) state
    $textareas.data('x', $textareas.outerWidth());
    $textareas.data('y', $textareas.outerHeight());

    $textareas.mousemove(function(){
        var $this = jQuery(this);
        if (  $this.outerWidth()  != $this.data('x')
            || $this.outerHeight() != $this.data('y') )
        {
            // Resize Action Here
            $('textarea').height($this.outerHeight());
            $('textarea').width($this.outerWidth());
        }
        // store new height/width
        $this.data('x', $this.outerWidth());
        $this.data('y', $this.outerHeight());
    });
    $('textarea').height(window.innerHeight/3);
    addEventListener('resize', (event) => {$('textarea').width(window.innerWidth-10);});

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
