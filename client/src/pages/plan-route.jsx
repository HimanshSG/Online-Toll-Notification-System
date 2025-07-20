import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTollPlazas, getUserNotifications } from '@/lib/api';
import { formatCurrency, getTollsOnRoute } from '@/lib/utils';
import UserNavigation from '@/components/UserNavigation';
import { getCurrentUser, logout } from '@/lib/auth';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// ... [unchanged imports remain the same]

const PlanRoute = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [tollPlazas, setTollPlazas] = useState([]);
  const [selectedTolls, setSelectedTolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [notifications, setNotifications] = useState([]);

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [78.9629, 20.5937],
      zoom: 4
    });

    map.current.addControl(new mapboxgl.NavigationControl());
    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current || !routeGeoJson) return;

    if (map.current.getSource('route')) {
      map.current.getSource('route').setData(routeGeoJson);
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJson
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.75
        }
      });
    }

    const coordinates = routeGeoJson.features[0].geometry.coordinates;
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 12
    });

    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    selectedTolls.forEach(toll => {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([toll.longitude, toll.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-bold">${toll.name}</h3>
            <p class="text-sm">${toll.roadName}</p>
            <p class="font-semibold text-primary">${formatCurrency(toll.tollFee)}</p>
          </div>
        `))
        .addTo(map.current);
    });
  }, [routeGeoJson, selectedTolls]);

  useEffect(() => {
    const fetchTollPlazas = async () => {
      setLoading(true);
      try {
        const data = await getTollPlazas();
        setTollPlazas(data);
      } catch (error) {
        console.error('Error fetching toll plazas:', error);
        toast({
          title: 'Error',
          description: 'Failed to load toll plaza data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTollPlazas();
  }, []);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await getUserNotifications();
        setNotifications(notifs);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, []);
  

  useEffect(() => {
    const cost = selectedTolls.reduce((total, toll) => total + parseFloat(toll.tollFee), 0);
    setTotalCost(cost);
  }, [selectedTolls]);

  const fetchSuggestions = async (query, isStart) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=IN&autocomplete=true`
      );
      const data = await res.json();
      if (res.ok) {
        const suggestions = data.features.map(feature => feature.place_name);
        isStart ? setStartSuggestions(suggestions) : setEndSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      isStart ? setStartSuggestions([]) : setEndSuggestions([]);
    }
  };

  const debounceFetchSuggestions = (query, isStart) => {
    const timer = setTimeout(() => {
      if (query) fetchSuggestions(query, isStart);
    }, 300);
    return () => clearTimeout(timer);
  };

  useEffect(() => debounceFetchSuggestions(startPoint, true), [startPoint]);
  useEffect(() => debounceFetchSuggestions(endPoint, false), [endPoint]);

  const fetchRouteAndTolls = async () => {
    if (!startPoint || !endPoint) return;

    setRouteLoading(true);
    try {
      const geocode = async (place) => {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${mapboxgl.accessToken}`);
        const data = await res.json();
        if (!res.ok || !data.features.length) throw new Error('Location not found');
        return data.features[0].center;
      };

      const [startCoords, endCoords] = await Promise.all([geocode(startPoint), geocode(endPoint)]);

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.routes.length) throw new Error('Route not found');

      const routeGeoJson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: data.routes[0].geometry.coordinates
        }
      };

      setRouteGeoJson({
        type: 'FeatureCollection',
        features: [routeGeoJson]
      });

      const filteredTolls = getTollsOnRoute(tollPlazas, data.routes[0].geometry.coordinates, searchRadius);
      setSelectedTolls(filteredTolls);

    } catch (error) {
      toast({
        title: 'Route Error',
        description: error.message,
        variant: 'destructive',
      });
      setSelectedTolls([]);
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (startPoint && endPoint && tollPlazas.length > 0) {
      const timer = setTimeout(fetchRouteAndTolls, 1000);
      return () => clearTimeout(timer);
    }
  }, [startPoint, endPoint, tollPlazas, searchRadius]);

  // ✅ Updated createRoute function
  const createRoute = () => {
    if (!startPoint || !endPoint) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both start and end points for your route.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedTolls.length === 0) {
      toast({
        title: 'No Toll Plazas Found',
        description: 'No tolls found along the route. You may have selected locations too close together.',
        variant: 'destructive',
      });
      return;
    }

    const newRoute = {
      route: `${startPoint} to ${endPoint}`,
      tollDetails: selectedTolls,
      totalCost,
      createdAt: new Date().toISOString(),
    };

    const existingRoutes = JSON.parse(localStorage.getItem('history')) || [];
    const updatedRoutes = [...existingRoutes, newRoute];
    localStorage.setItem('history', JSON.stringify(updatedRoutes));

    toast({
      title: 'Route Planned',
      description: `Your route from ${startPoint} to ${endPoint} with a total toll cost of ${formatCurrency(totalCost)} has been saved.`,
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <section className="min-h-screen bg-gray-100 dark:bg-[#0B1120] transition-colors">
      <UserNavigation notifications={notifications} onLogout={handleLogout} />


      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Plan Your Route</h1>
          <p className="text-gray-500 dark:text-gray-400">Plan ahead and estimate your toll costs</p>
        </div>

        <Card className="mb-6 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 relative">
                  <Label htmlFor="startPoint" className="dark:text-gray-300">Starting Point</Label>
                  <Input 
                    id="startPoint" 
                    className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white" 
                    placeholder="Enter starting location (e.g., Delhi)"
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                    onBlur={() => setTimeout(() => setStartSuggestions([]), 200)}
                  />
                  {startSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1F2937] rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                      {startSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                          onClick={() => {
                            setStartPoint(suggestion);
                            setStartSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="endPoint" className="dark:text-gray-300">Destination</Label>
                  <Input 
                    id="endPoint" 
                    className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white" 
                    placeholder="Enter destination (e.g., Mumbai)"
                    value={endPoint}
                    onChange={(e) => setEndPoint(e.target.value)}
                    onBlur={() => setTimeout(() => setEndSuggestions([]), 200)}
                  />
                  {endSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1F2937] rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                      {endSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                          onClick={() => {
                            setEndPoint(suggestion);
                            setEndSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="searchRadius" className="dark:text-gray-300">
                    Search Radius: {searchRadius}km
                  </Label>
                  <Input
                    id="searchRadius"
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="dark:bg-[#1F2937] dark:border-gray-700"
                  />
                </div>
              </div>

              <div 
                ref={mapContainer} 
                className="h-96 w-full rounded-md mt-4 relative border border-gray-200 dark:border-gray-700"
              >
                {routeLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Toll Plazas on Route</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : selectedTolls.length > 0 ? (
              <div className="space-y-3">
                {selectedTolls.map((toll, index) => (
                  <div 
                    key={toll._id} 
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-2">
                    {/* <FontAwesomeIcon icon={faDollarSign} className="text-xl" /> */}
                      <span className="text-sm">{toll.name}</span>
                    </div>
                    <span className="font-medium text-neutral-800 dark:text-white">{formatCurrency(toll.tollFee)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>No toll plazas found along the route.</div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">Total Toll Cost</h3>
              <span className="text-xl font-bold text-neutral-800 dark:text-white">{formatCurrency(totalCost)}</span>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-blue-500 text-white" 
          onClick={createRoute}
          disabled={routeLoading || !startPoint || !endPoint || selectedTolls.length === 0}
        >
          Plan Route
        </Button>
      </div>
    </section>
  );
};

export default PlanRoute;
