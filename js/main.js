(function($) {

	"use strict";


	$(window).stellar({
    responsive: true,
    parallaxBackgrounds: true,
    parallaxElements: true,
    horizontalScrolling: false,
    hideDistantElements: false,
    scrollProperty: 'scroll'
  });


	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	// loader
	var loader = function() {
		setTimeout(function() { 
			if($('#ftco-loader').length > 0) {
				$('#ftco-loader').removeClass('show');
			}
		}, 1);
	};
	loader();

  var carousel = function() {
		$('.carousel-testimony').owlCarousel({
			center: true,
			loop: true,
			items:1,
			margin: 30,
			stagePadding: 0,
			nav: false,
			navText: ['<span class="ion-ios-arrow-back">', '<span class="ion-ios-arrow-forward">'],
			responsive:{
				0:{
					items: 1
				},
				600:{
					items: 2
				},
				1000:{
					items: 3
				}
			}
		});

	};
	carousel();

	// Hover only for non-user dropdowns. User menu (Dashboard/Logout) uses click so it stays open when clicking items
	$('nav .dropdown:not(.dropdown-user)').hover(function(){
		var $this = $(this);
		$this.addClass('show');
		$this.find('> a').attr('aria-expanded', true);
		$this.find('.dropdown-menu').addClass('show');
	}, function(){
		var $this = $(this);
		$this.removeClass('show');
		$this.find('> a').attr('aria-expanded', false);
		$this.find('.dropdown-menu').removeClass('show');
	});


	$('#dropdown04').on('show.bs.dropdown', function () {
	  console.log('show');
	});

	// magnific popup
	$('.image-popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
     gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      verticalFit: true
    },
    zoom: {
      enabled: true,
      duration: 300 // don't foget to change the duration also in CSS
    }
  });

  $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,

    fixedContentPos: false
  });

	var contentWayPoint = function() {
		var i = 0;
		$('.ftco-animate').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .ftco-animate.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn ftco-animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft ftco-animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight ftco-animated');
							} else {
								el.addClass('fadeInUp ftco-animated');
							}
							el.removeClass('item-animate');
						},  k * 50, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '95%' } );
	};
	contentWayPoint();

	// Smoother date picker for booking form (past dates disabled – booking from today only)
	var today = new Date();
	today.setHours(0, 0, 0, 0);

	function formatDateForServer(d) {
	  var m = ('0' + (d.getMonth() + 1)).slice(-2);
	  var day = ('0' + d.getDate()).slice(-2);
	  return d.getFullYear() + '-' + m + '-' + day;
	}

	function parseDisplayDate(str) {
	  if (!str || str.length < 8) return null;
	  var parts = str.split('/');
	  if (parts.length !== 3) return null;
	  var m = parseInt(parts[0], 10), d = parseInt(parts[1], 10), y = parseInt(parts[2], 10);
	  if (isNaN(m) || isNaN(d) || isNaN(y) || m < 1 || m > 12 || d < 1 || d > 31) return null;
	  return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
	}

	$('.appointment_date-check-in').datepicker({
	  format: 'mm/dd/yyyy',
	  autoclose: true,
	  startDate: today,
	  endDate: '+2y',
	  todayHighlight: true,
	  orientation: 'bottom auto',
	  todayBtn: 'linked',
	  clearBtn: true,
	  assumeNearbyYear: 10,
	  zIndexOffset: 1050
	}).on('changeDate', function(e) {
	  if (e.date) {
	    $('#check_in').val(formatDateForServer(e.date));
	    $('.appointment_date-check-out').datepicker('setStartDate', e.date);
	    var checkOut = $('.appointment_date-check-out').datepicker('getDate');
	    if (checkOut && checkOut <= e.date) {
	      $('.appointment_date-check-out').datepicker('setDate', null);
	      $('#check_out').val('');
	    }
	  }
	}).on('change', function() {
	  var v = $(this).val();
	  if (v) { var d = parseDisplayDate(v); if (d) $('#check_in').val(d); }
	});

	$('.appointment_date-check-out').datepicker({
	  format: 'mm/dd/yyyy',
	  autoclose: true,
	  startDate: today,
	  endDate: '+2y',
	  todayHighlight: true,
	  orientation: 'bottom auto',
	  todayBtn: 'linked',
	  clearBtn: true,
	  assumeNearbyYear: 10,
	  zIndexOffset: 1050
	}).on('changeDate', function(e) {
	  if (e.date) {
	    $('#check_out').val(formatDateForServer(e.date));
	  }
	}).on('change', function() {
	  var v = $(this).val();
	  if (v) { var d = parseDisplayDate(v); if (d) $('#check_out').val(d); }
	});

	// Before submit: always sync display dates to hidden inputs so server receives Y-m-d
	$('form.appointment-form').on('submit', function() {
	  var $form = $(this);
	  if (!$form.find('.appointment_date-check-in').length) return; // not the booking form
	  var displayIn = $form.find('.appointment_date-check-in').val();
	  var displayOut = $form.find('.appointment_date-check-out').val();
	  if (displayIn) {
	    var parsedIn = parseDisplayDate(displayIn.trim());
	    if (parsedIn) $form.find('#check_in').val(parsedIn);
	  }
	  if (displayOut) {
	    var parsedOut = parseDisplayDate(displayOut.trim());
	    if (parsedOut) $form.find('#check_out').val(parsedOut);
	  }
	});

	$('.appointment_time').timepicker();



})(jQuery);

