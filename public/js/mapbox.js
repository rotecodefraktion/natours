export const displayMap = (locations, apiKey) => {
  const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
  console.log('locations', locations);
  console.log('API Key', apiKey);
  mapboxgl.accessToken = apiKey;
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rotecodefraktion/cljdzr4ul003g01pahp9gekb5',
    scrollZoom: false,
    //interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds(); //bounds is a class

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    //console.log('loc', loc);
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    bounds.extend(loc.coordinates);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
