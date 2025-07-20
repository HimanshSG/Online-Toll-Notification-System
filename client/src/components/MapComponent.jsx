import React, { useState, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl';
import { Card } from '@/components/ui/card';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapComponent = ({ userLocation, tollPlazas = [], onRouteError }) => {
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const mapRef = useRef();

  const handleMarkerClick = async (toll) => {
    if (!userLocation) {
      onRouteError?.('User location not available');
      return;
    }

    setIsRouting(true);
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude},${userLocation.latitude};${toll.longitude},${toll.latitude}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        setRouteGeoJSON({
          type: 'Feature',
          geometry: data.routes[0].geometry,
          properties: {
            distance: data.routes[0].distance,
            duration: data.routes[0].duration
          }
        });
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Directions error:', error);
      onRouteError?.('Could not calculate route to this toll plaza');
    } finally {
      setIsRouting(false);
    }
  };

  // Generate a stable key for each toll plaza
  const getTollKey = (toll) => {
    if (toll.id) return `toll-${toll.id}`;
    if (toll._id) return `toll-${toll._id}`;
    // Fallback to coordinates if no ID exists
    return `toll-${toll.latitude.toFixed(4)}-${toll.longitude.toFixed(4)}`;
  };

  if (!userLocation) {
    return (
      <Card className="overflow-hidden">
        <div className="h-[300px] bg-gray-100 flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-gray-500 text-2xl" />
          <p className="ml-2 text-gray-500">Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          zoom: 10
        }}
        style={{ width: '100%', height: 300 }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={mapboxgl.accessToken}
      >
        {/* Controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          showAccuracyCircle={false}
          auto
        />

        {/* User Marker (original simple version) */}
        <Marker
          longitude={userLocation.longitude}
          latitude={userLocation.latitude}
          color="blue"
        />

        {/* Toll Plazas */}
        {tollPlazas.map(toll => (
          <Marker
            key={getTollKey(toll)}
            longitude={toll.longitude}
            latitude={toll.latitude}
            color="red"
            onClick={() => handleMarkerClick(toll)}
          />
        ))}

        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': '#0EA5E9',
                'line-width': 5
              }}
            />
          </Source>
        )}
      </Map>
    </Card>
  );
};

export default MapComponent;