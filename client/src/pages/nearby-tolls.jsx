import React, { useState, useEffect } from 'react';
import { useLocation as useNavigation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { getNearbyTollPlazas, getUserNotifications } from '@/lib/api';

import { formatCurrency } from '@/lib/utils';
import useGeolocation from '@/hooks/useLocation';
import UserNavigation from '@/components/UserNavigation';
import MapComponent from '@/components/MapComponent';
import { getCurrentUser, logout } from '@/lib/auth';
import { useDebounce } from 'use-debounce';



function calculateArrivalTime(distanceKm) {
  const averageSpeed = 50; // Assume average speed of 50 km/h
  const time = (distanceKm / averageSpeed) * 60; // Time in minutes
  return `${Math.round(time)} min`;
}

const NearbyTolls = () => {
  const [_, setLocation] = useNavigation();
  const { toast } = useToast();
  const [tollPlazas, setTollPlazas] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingTolls, setLoadingTolls] = useState(true);
  const [showOnlyNearby, setShowOnlyNearby] = useState(true);
  const [radius, setRadius] = useState(50);
  const [debouncedRadius] = useDebounce(radius, 500);
  const [isRadiusChanging, setIsRadiusChanging] = useState(false);
  


  const { location: userLocation, refreshLocation } = useGeolocation({ enableHighAccuracy: true });

  // Single optimized useEffect for data fetching
  useEffect(() => {
    if (userLocation) {
      fetchNearbyTolls();
    }
  }, [userLocation]);
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
    if (userLocation && !isRadiusChanging) {
      fetchNearbyTolls();
    }
  }, [debouncedRadius, isRadiusChanging]);

  const fetchNearbyTolls = async () => {
    if (!userLocation) {
      toast({
        title: 'Location Error',
        description: 'Please enable location services.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingTolls(true);

    try {
      const params = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };

      // Only add radius parameter when in "nearby" mode
      if (showOnlyNearby) {
        params.radius = radius;
      }

      const data = await getNearbyTollPlazas(params);
      setTollPlazas(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: 'Unable to load toll plazas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTolls(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const handleRadiusChange = (value) => {
    setRadius(value);
    setIsRadiusChanging(true);

    // Reset the `isRadiusChanging` state after a short timeout to avoid continuous updates
    setTimeout(() => {
      setIsRadiusChanging(false);
    }, 500); // Set a small delay to indicate the update has finished
  };

  // Display all tolls when not in nearby mode, filter when in nearby mode
  const displayedTolls = showOnlyNearby
    ? tollPlazas.filter((toll) => toll?.distance && toll.distance <= radius)
    : tollPlazas;

  return (
    <section className="min-h-screen bg-background text-foreground">
     <UserNavigation notifications={notifications} onLogout={handleLogout} />

      <div className="max-w-5xl mx-auto p-4 pb-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Nearby Toll Plazas</h1>
            <p className="text-muted-foreground">See tolls based on your location</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              refreshLocation();
              fetchNearbyTolls();
            }}
            disabled={loadingTolls}
          >
            <FontAwesomeIcon icon="sync" className="mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold">Map View</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowOnlyNearby((prev) => !prev)}
                  disabled={loadingTolls}
                >
                  {showOnlyNearby ? 'Show All Tolls' : 'Show Only Nearby'}
                  {loadingTolls && <FontAwesomeIcon icon="spinner" spin className="ml-2" />}
                </Button>
              </div>
            </div>
            <MapComponent
              userLocation={userLocation}
              tollPlazas={displayedTolls}
              onRouteError={(message) =>
                toast({
                  title: 'Route Error',
                  description: message,
                  variant: 'destructive',
                })
              }
            />
          </CardContent>
        </Card>

        {showOnlyNearby && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">
                  Search Radius: {radius} km
                  {isRadiusChanging && <span className="ml-2 text-xs text-muted-foreground">(updating...)</span>}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {displayedTolls.length} {displayedTolls.length === 1 ? 'toll' : 'tolls'} found
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Search radius"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRadiusChange(Math.max(10, radius - 10))}
                  disabled={radius <= 10}
                >
                  <FontAwesomeIcon icon="minus" className="mr-2" />
                  Decrease
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRadiusChange(Math.min(100, radius + 10))}
                  disabled={radius >= 100}
                >
                  <FontAwesomeIcon icon="plus" className="mr-2" />
                  Increase
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{showOnlyNearby ? 'Toll Plazas Nearby' : 'All Toll Plazas'}</h2>

          {loadingTolls ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedTolls.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {displayedTolls.map((toll) => (
                <Card key={toll._id || toll.id || `${toll.latitude}-${toll.longitude}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold">{toll.name}</h3>
                        <p className="text-sm text-muted-foreground">{toll.highwayName}</p>
                        {toll.distance && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Distance: {toll.distance.toFixed(2)} km | ETA: {calculateArrivalTime(toll.distance)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-primary font-semibold">{formatCurrency(toll.tollFee)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (userLocation) {
                            const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${toll.latitude},${toll.longitude}&travelmode=driving`;
                            window.open(gmapsUrl, '_blank');
                          }
                        }}
                      >
                        <FontAwesomeIcon icon="location-arrow" className="mr-2" />
                        Navigate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-10">
                <FontAwesomeIcon icon="road" className="text-muted-foreground text-4xl mb-4" />
                <h3 className="text-lg font-semibold">No toll plazas found</h3>
                <p className="text-sm text-muted-foreground">
                  {showOnlyNearby
                    ? 'Try increasing the radius or move to another location.'
                    : 'No toll plazas available in the system.'}
                </p>
                {showOnlyNearby && (
                  <Button className="mt-4" onClick={() => handleRadiusChange(radius + 10)}>
                    Increase Search Radius
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default NearbyTolls;
