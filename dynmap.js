//add event listener which updates height of iframe with id dynmap_iframe to the height of the window
window.addEventListener('resize', function(event){
    document.getElementById('dynmap_iframe').style.height = window.innerHeight * 0.7 + 'px';
}
);
//update height of iframe with id dynmap_iframe to the height of the window
document.getElementById('dynmap_iframe').style.height = window.innerHeight * 0.7 + 'px';
