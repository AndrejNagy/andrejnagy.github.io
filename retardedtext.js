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
    retarded_output.textContent = retarded_value
}
