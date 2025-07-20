import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatCurrency, calculateArrivalTime } from '@/lib/utils';

const TollCard = ({ toll, distance, highlighted = false, compact = false }) => {
  if (!toll) return null;
  
  // Format ETA based on distance
  const eta = calculateArrivalTime(distance);
  
  // Check if toll is very near (within 2km)
  const isVeryNear = distance <= 2;
  
  if (compact) {
    // Compact version for the upcoming tolls list
    return (
      <Card className={`overflow-hidden border ${highlighted ? 'border-primary' : ''}`}>
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-medium text-sm text-neutral-dark">{toll.name}</h3>
              <p className="text-xs text-gray-500">{toll.roadName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-dark">{formatCurrency(toll.tollFee)}</p>
              <div className="flex items-center text-xs text-gray-500">
                <FontAwesomeIcon icon="map-marker-alt" className="mr-1 text-primary" />
                <span>{distance.toFixed(1)} km</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Full version for the nearest toll
  return (
    <Card className={`overflow-hidden border ${highlighted ? 'border-primary shadow-md' : ''}`}>
      <CardContent className={`p-4 ${isVeryNear ? 'bg-red-50' : ''}`}>
        <div className="flex items-start">
          <div className={`rounded-full p-3 ${isVeryNear ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-primary'} mr-3`}>
            <FontAwesomeIcon icon="road" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{toll.name}</h3>
                  {isVeryNear && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                      Approaching
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{toll.roadName}</p>
              </div>
              <div className="mt-2 sm:mt-0 sm:text-right">
                <p className="text-lg font-semibold text-neutral-dark">{formatCurrency(toll.tollFee)}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1 sm:justify-end">
                  <FontAwesomeIcon icon="map-marker-alt" className="mr-1 text-primary" />
                  <span>{distance.toFixed(1)} km away</span>
                  <span className="mx-1">•</span>
                  <span>ETA: {eta}</span>
                </div>
              </div>
            </div>
            
            {isVeryNear && (
              <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                <FontAwesomeIcon icon="exclamation-circle" className="mr-1" />
                You are approaching this toll plaza. Please ensure your FASTag has sufficient balance.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TollCard;