//add event listener which updates height of iframe with id dynmap_iframe to the height of the window
window.addEventListener('resize', function(event){
    document.getElementById('dynmap_iframe').style.height = window.innerHeight * 0.7 + 'px';
}
);
//update height of iframe with id dynmap_iframe to the height of the window
document.getElementById('dynmap_iframe').style.height = window.innerHeight * 0.7 + 'px';

//lazy load the dynmap: only set the iframe src once the tab is first opened
document.getElementById('dynmap-tab').addEventListener('shown.bs.tab', function () {
    var iframe = document.getElementById('dynmap_iframe');
    if (!iframe.src) {
        iframe.src = iframe.dataset.src;
    }
}, { once: true });
