// Google Maps initialization script
// This file is kept for future use if you want to enable Google Maps
// Currently using OpenStreetMap embed (no API key required)

var google;

function init() {
    // Check if map element exists
    var mapElement = document.getElementById('map');
    if (!mapElement) {
        return; // Map element not found, exit
    }

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        // Show fallback message or use OpenStreetMap
        if (!mapElement.querySelector('iframe')) {
            mapElement.innerHTML = '<div style="width: 100%;"><iframe width="100%" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=104.9%2C11.55%2C104.95%2C11.56&layer=mapnik&marker=11.5564,104.9282" style="border: 1px solid #ddd; border-radius: 4px; display: block;"></iframe><div style="padding: 10px; text-align: center; background: #f8f9fa; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px;"><small style="color: #666;"><a href="https://www.openstreetmap.org/?mlat=11.5564&mlon=104.9282#map=13/11.5564/104.9282" target="_blank" style="color: #007bff; text-decoration: none;">View Larger Map</a> - Phnom Penh, Cambodia</small></div></div>';
        }
        return;
    }

    try {
        // Phnom Penh, Cambodia coordinates
        var myLatlng = new google.maps.LatLng(11.5564, 104.9282);
        
        var mapOptions = {
            zoom: 13,
            center: myLatlng,
            scrollwheel: false,
            styles: [
                {
                    "featureType": "administrative.country",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "visibility": "simplified"
                        },
                        {
                            "hue": "#ff0000"
                        }
                    ]
                }
            ]
        };

        // Create the Google Map
        var map = new google.maps.Map(mapElement, mapOptions);
        
        // Add marker for Phnom Penh
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: 'Phnom Penh, Cambodia',
            icon: 'images/loc.png'
        });

        // Add info window
        var infoWindow = new google.maps.InfoWindow({
            content: '<div style="padding: 10px;"><strong>Phnom Penh, Cambodia</strong><br>Our Hotel Location</div>'
        });

        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        });

    } catch (error) {
        // Handle any errors gracefully - show OpenStreetMap instead
        console.error('Google Maps Error:', error);
        if (mapElement && !mapElement.querySelector('iframe')) {
            mapElement.innerHTML = '<div style="width: 100%;"><iframe width="100%" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=104.9%2C11.55%2C104.95%2C11.56&layer=mapnik&marker=11.5564,104.9282" style="border: 1px solid #ddd; border-radius: 4px; display: block;"></iframe><div style="padding: 10px; text-align: center; background: #f8f9fa; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px;"><small style="color: #666;"><a href="https://www.openstreetmap.org/?mlat=11.5564&mlon=104.9282#map=13/11.5564/104.9282" target="_blank" style="color: #007bff; text-decoration: none;">View Larger Map</a> - Phnom Penh, Cambodia</small></div></div>';
        }
    }
}

// Only initialize if map element exists and Google Maps API is available
// Otherwise, the static map from footer.php will be used
if (document.getElementById('map') && typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
    google.maps.event.addDomListener(window, 'load', init);
}
