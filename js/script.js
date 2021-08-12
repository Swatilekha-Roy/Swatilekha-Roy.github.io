/* Scroll to top arrow */
$(window).scroll(function() {
    if ($(this).scrollTop() >= 50) {        
        $('#return-to-top').fadeIn(200);    
    } else {
        $('#return-to-top').fadeOut(200);   
    }
});
$('#return-to-top').click(function() {      
    $('body,html').animate({
        scrollTop : 0                       
    }, 500);
});



/* Form submission without refresh */
$.ajax({
    url: "https://formsubmit.co/3877f8bbba51205a28d60d24e448b2d0",
    method: "POST",
    data: {
        name: "FormSubmit",
        message: "I'm from Devro LABS"
    },
    dataType: "json"
});