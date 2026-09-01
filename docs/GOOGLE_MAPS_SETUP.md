# 🗺️ Google Maps Setup Guide

## Current Status

The Google Maps on the contact page is currently set up with a placeholder API key. The map will show a fallback message if the API key is invalid.

## Option 1: Get Your Own Google Maps API Key (Recommended)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable Maps JavaScript API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
5. **Update the API Key**:
   - Open `includes/footer.php`
   - Find this line:
     ```html
     <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&sensor=false&callback=initMap" async defer></script>
     ```
   - Replace `YOUR_API_KEY_HERE` with your actual API key

## Option 2: Use Free Alternative (OpenStreetMap)

If you don't want to use Google Maps, you can use OpenStreetMap instead:

1. Replace the map div in `contact.php` with:
   ```html
   <iframe width="100%" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" 
   src="https://www.openstreetmap.org/export/embed.html?bbox=104.9%2C11.55%2C104.95%2C11.56&layer=mapnik&marker=11.5564,104.9282" 
   style="border: 1px solid black"></iframe>
   ```

## Option 3: Remove Map Completely

If you don't need a map:

1. In `contact.php`, replace the map div with a static image or remove it
2. Remove the Google Maps scripts from `includes/footer.php`

## Current Location

The map is configured for **Phnom Penh, Cambodia**:
- Latitude: 11.5564
- Longitude: 104.9282

To change the location, edit `js/google-map.js` and update the coordinates.

## Troubleshooting

### Map shows "Map temporarily unavailable"
- The Google Maps API key is invalid or expired
- Get a new API key (see Option 1)
- Or use OpenStreetMap (see Option 2)

### Map doesn't load at all
- Check browser console for errors
- Verify API key is correct
- Make sure Maps JavaScript API is enabled in Google Cloud Console

### Map loads but shows wrong location
- Update coordinates in `js/google-map.js`
- Current: Phnom Penh, Cambodia (11.5564, 104.9282)

---

**Note**: Google Maps API requires billing to be enabled (though they provide $200 free credit per month, which is usually enough for small websites).
