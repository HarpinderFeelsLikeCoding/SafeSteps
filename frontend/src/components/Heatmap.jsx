import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export default function Heatmap({ accidents }) {
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [-74.0060, 40.7128],
      zoom: 12
    });

    map.on('load', () => {
      map.addSource('accidents', {
        type: 'geojson',
        data: convertToGeoJSON(accidents)
      });

      map.addLayer({
        id: 'accidents-heat',
        type: 'heatmap',
        source: 'accidents',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'risk'], 0, 0, 1, 1],
          'heatmap-intensity': 0.8,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.5, 'rgba(255, 165, 0, 1)',
            1, 'rgba(255, 0, 0, 1)'
          ]
        }
      });
    });
  }, [accidents]);

  return <div id="map" style={{ width: '100%', height: '500px' }} />;
}