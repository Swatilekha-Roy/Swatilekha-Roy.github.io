/* Website preloader */
(function ($) {
  "use strict";
  $(window).on("load", function () {
    if ($(".pre-loader").length > 0) {
      $(".pre-loader").fadeOut("slow");
    }
  });
})(jQuery);

/* Scroll to top arrow */
$(window).scroll(function () {
  if ($(this).scrollTop() >= 50) {
    $("#return-to-top").fadeIn(200);
  } else {
    $("#return-to-top").fadeOut(200);
  }
});
$("#return-to-top").click(function () {
  $("body,html").animate(
    {
      scrollTop: 0,
    },
    500
  );
});

/* Contact form submission without refresh */
$("form").on("submit", function (e) {
  // Form validation
  if ($("#_honeyinput").val().length != 0) {
    return false;
  }

  // Collect data
  var dataString = $(this).serialize();

  // Send mail
  $.ajax({
    type: "POST",
    url: "https://formsubmit.co/3877f8bbba51205a28d60d24e448b2d0",
    data: dataString,
    dataType: "json",
  });

  document.querySelector("#success-message").innerHTML =
    '<i class="fas fa-check-circle"></i> Thanks for contacting me!';
  document.querySelector("#success-message").style.marginLeft = "2%";
  e.preventDefault();
});

/* Certifications owl carousel */
$(".owl-carousel").owlCarousel({
  loop: false,
  margin: 10,
  dots: false,
  nav: true,
  navText: [
    "<div class='nav-btn prev-slide'><i class='fas fa-chevron-circle-left'></i></div>",
    "<div class='nav-btn next-slide'><i class='fas fa-chevron-circle-right'></i></div>",
  ],
  stagePadding: 50,
  responsive: {
    0: {
      items: 1,
    },
    600: {
      items: 3,
    },
    1000: {
      items: 5,
    },
  },
});
